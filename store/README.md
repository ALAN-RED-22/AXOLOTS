# AXOLOTS — store

Next.js 16 (App Router) + TypeScript + Tailwind, desplegado en Cloudflare Workers
vía `@opennextjs/cloudflare`. Sirve `https://axolotsmx.com`: la landing portada
desde la raíz del repo (`/`) y la tienda de artesanías (`/tienda`).

Ver `CLAUDE.md` en la raíz del repo para el contexto de negocio completo
(decisiones, fases, pendientes). Este README es solo la referencia técnica de
esta app.

## Desarrollo local

```bash
npm install
cp .dev.vars.example .dev.vars   # y llenar con valores reales (ver abajo)
npm run dev
```

`next dev` usa `initOpenNextCloudflareForDev()` (en `next.config.ts`) para que
`.dev.vars` se comporte como los bindings reales de Cloudflare en producción.

### Variables de entorno requeridas

Ver `.dev.vars.example` para la lista completa con comentarios. En producción
se configuran en Cloudflare, nunca en el repo:

```bash
# secretos (nunca en wrangler.jsonc)
npx wrangler secret put DATABASE_URL
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET

# vars no sensibles: ya están en wrangler.jsonc (SITE_URL, USD_MXN_RATE)
```

### Llaves de Stripe para probar el checkout

1. Modo test en el dashboard de Stripe → Developers → API keys → copiar la
   `sk_test_...` a `STRIPE_SECRET_KEY`.
2. Para recibir webhooks en local: `stripe listen --forward-to
   localhost:3000/api/webhooks/stripe` — imprime un `whsec_...` temporal,
   copiarlo a `STRIPE_WEBHOOK_SECRET`.
3. Tarjetas de prueba: `4242 4242 4242 4242`, cualquier fecha futura y CVC.

Sin llaves reales, el catálogo (`/tienda`) funciona igual (no depende de
Stripe) pero crear un checkout (`/api/checkout`) falla con un 500 claro.

**El `whsec_...` de `stripe listen` es SOLO para local.** Es un secreto
temporal, propio de esa sesión de reenvío a `localhost` — no sirve para
nada que le llegue a producción. Para que Stripe le mande webhooks de
verdad a `axolotsmx.com`, hace falta un endpoint registrado aparte:

```bash
stripe webhook_endpoints create \
  --url "https://axolotsmx.com/api/webhooks/stripe" \
  --enabled-events "checkout.session.completed" \
  --enabled-events "checkout.session.expired"
```

Esto imprime un `secret` (`whsec_...`) — ese es el que va como
`STRIPE_WEBHOOK_SECRET` en producción (`wrangler secret put`), nunca el de
`stripe listen`. Ya se hizo esto una vez en modo test (2026-10-01,
`we_1ULbBDAnA3FqyOMawMLIx4zS`) — verificado con `stripe trigger` real
llegando a producción y procesándose en `payment_events`. **Cuando se pase a
llaves LIVE, hay que repetir este paso completo** (el modo test y el modo
live tienen webhooks y secretos totalmente separados en Stripe, uno no
sirve para el otro).

### Secretos de producción (ya configurados, 2026-10-01)

```bash
npx wrangler secret list   # confirma cuáles están puestos, sin mostrar valores
```

`DATABASE_URL`, `STRIPE_SECRET_KEY` (modo test) y `STRIPE_WEBHOOK_SECRET`
(del endpoint real de arriba, no de `stripe listen`) ya están puestos como
secrets del Worker — nunca estuvieron antes del primer deploy con el código
de la tienda, lo que dejó `/tienda` caída (500) hasta que se corrigió.

### Panel de administración (`/admin`)

En desarrollo (`NEXTJS_ENV=development` en `.dev.vars`) no hace falta nada
especial: `/admin` usa directamente el primer correo de `ADMIN_EMAILS` como si
fuera quien entró, sin pedir login — por eso `ADMIN_EMAILS` es obligatorio
incluso en local (poné tu propio correo).

En producción hace falta configurar **Cloudflare Access** una sola vez — son
pasos de dashboard, no hay forma de automatizarlos por API sin un token de
cuenta:

1. **Zero Trust > Access > Applications > Add an application > Self-hosted.**
2. Dominio: `axolotsmx.com`, ruta: `/admin*`. **Agregar también
   `www.axolotsmx.com` como segundo "public hostname" en la misma
   aplicación** (mismo path) — Access evalúa por hostname exacto, y
   `www.axolotsmx.com` resuelve al mismo Worker pero es un hostname distinto
   (confirmado: sin este segundo hostname, entrar por `www.` pasa de largo
   sin pedir login).
3. Política: "Allow" solo para los correos que deban administrar el catálogo
   (hoy en `wrangler.jsonc` → `ADMIN_EMAILS` tiene los 3 correos autorizados;
   si se agrega un admin nuevo, hay que ponerlo en los DOS lugares — la
   política de Access y `ADMIN_EMAILS` — o la segunda verificación propia en
   `admin-auth.ts` lo va a rechazar aunque Access lo deje pasar).
4. Al guardar, el dashboard muestra el **Application Audience (AUD) Tag** —
   copiarlo a `CF_ACCESS_AUD` en `wrangler.jsonc`.
5. `CF_ACCESS_TEAM_DOMAIN` es el dominio de tu equipo de Zero Trust (algo como
   `tu-equipo.cloudflareaccess.com`, visible en Zero Trust > Settings >
   Custom Pages, o en la URL del dashboard de Zero Trust).
6. Redesplegar (`npm run deploy`) para que el Worker lea los nuevos `vars`.
7. **Identity Provider: "One-Time PIN" (código al correo)** — es el único que
   hace falta, no requiere configurar nada externo. Seleccionarlo tanto a
   nivel de cuenta (Zero Trust > Settings > Authentication) como dentro de la
   aplicación misma (pestaña "Identity providers" al editarla) — son ajustes
   separados. **Si el código no llega a ningún correo** (se probó con Gmail y
   Hotmail, ninguno lo recibió, con la política ya asociada y OTP como único
   método): quitar "One-Time PIN" de los Identity Providers de la aplicación y
   volver a activarlo. Pasó una vez (2026-10-01) y un simple toggle off/on lo
   destrabó — no hay una causa raíz confirmada más allá de eso, pero es rápido
   de probar antes de sospechar de política/DNS/spam.

Por qué Access y no una tabla de usuarios propia: son 1-2 personas de
confianza administrando, no clientes — Cloudflare ya resuelve "quién puede
entrar" gratis (hasta 50 usuarios) sin que la app tenga que guardar ni
verificar contraseñas. La verificación del JWT de Access en
`src/lib/admin-auth.ts` es una segunda capa (defensa en profundidad): si la
política de Access se desconfigura por accidente, esto sigue frenando.

### R2 (fotos de producto)

El bucket (`axolots-product-images`, ver `wrangler.jsonc`) necesita que **R2
esté habilitado en la cuenta de Cloudflare** — es un clic único en el
dashboard (Cloudflare aún no lo tenía habilitado al escribir esto: `wrangler
r2 bucket list` devuelve "Please enable R2 through the Cloudflare Dashboard").
Pasos:

1. Dashboard de Cloudflare > R2 > aceptar/activar (plan gratis: 10GB
   almacenamiento, sin cargo por salida de datos).
2. `npx wrangler r2 bucket create axolots-product-images`.
3. (Opcional, para que las fotos se vean optimizadas en producción) Dashboard
   > el dominio > Speed > Optimization > activar **Image Resizing** — sin
   esto, las fotos se sirven igual pero sin redimensionar/convertir a webp
   automáticamente (`src/lib/r2.ts` cae a servirlas tal cual si no está
   activado; en `next dev` local SIEMPRE se sirven sin redimensionar, porque
   `/cdn-cgi/image/...` lo resuelve el borde de Cloudflare, no existe en
   local — confirmado con un 404 real al probarlo).

En local, R2 se emula automáticamente (vía `initOpenNextCloudflareForDev()`,
sin necesidad de bucket real ni cuenta con R2 habilitado) — las fotos que
subas en desarrollo viven solo en tu máquina, no en la nube.

## Comandos

```bash
npm run dev            # servidor de desarrollo
npm run lint           # eslint
npx tsc --noEmit        # typecheck
npm test                # vitest (unit tests, sin red ni DB real)
npm run build            # build de producción de Next
npm run deploy           # build + deploy a Cloudflare (producción real)
```

`npm run deploy` apunta al worker `axolots-store`, que sirve `axolotsmx.com` y
`www.axolotsmx.com` — no hay entorno de preview separado todavía, usar con
cuidado. NO llamar `opennextjs-cloudflare deploy` solo (sube el build viejo).

## Arquitectura de la tienda

- **Datos**: Neon Postgres vía Drizzle (`src/db/schema.ts`). El driver HTTP de
  Neon (`drizzle-orm/neon-http`) **no soporta transacciones interactivas** —
  por eso la reserva de stock (`src/lib/inventory.ts`) usa una sola sentencia
  atómica `INSERT ... SELECT ... WHERE` en vez de BEGIN/COMMIT, y el checkout
  (`src/lib/checkout.ts`) usa compensación manual (liberar + cancelar) si algo
  falla a mitad de camino, en vez de un rollback de transacción.
- **Pagos**: abstracción `PaymentProvider` (`src/lib/payments/provider.ts`) —
  hoy solo `StripeProvider`. El resto de la app nunca importa el SDK de Stripe
  directamente, para poder agregar Mercado Pago después sin tocar lógica de
  negocio. Ningún dato de tarjeta pasa por este servidor (Stripe Checkout
  alojado).
- **Idempotencia de webhooks**: `payment_events` tiene un índice único
  `(provider, event_id)`. El handler (`src/lib/webhook-handler.ts`) inserta el
  evento ANTES de aplicar cualquier efecto; un reintento del mismo evento
  choca con el índice único y se ignora sin reprocesar.
- **Precio y stock siempre desde el servidor**: el carrito (`src/components/store/cart.tsx`)
  vive en `localStorage` del navegador por conveniencia, pero es una
  "sugerencia" — `/api/checkout` vuelve a leer precio y disponibilidad de la
  base de datos antes de cobrar nada. Manipular el carrito en devtools no
  logra nada.
- **CSRF en `/api/checkout`**: los Route Handlers de Next no tienen la
  protección CSRF que sí traen los Server Actions. Se exige que el header
  `Origin` coincida con `SITE_URL` (`src/lib/same-origin.ts`).
- **Expiración de la reserva de stock**: 30 minutos — es el **mínimo que
  Stripe permite** para `expires_at` de un Checkout Session (no acepta menos;
  los ~15 min mencionados en versiones anteriores de la documentación de
  negocio no son viables con Stripe Checkout).
- **Envío**: solo `pickup` (gratis) y `national` (tarifa placeholder por peso,
  `src/lib/shipping.ts` — pendiente integrar un agregador real como
  Skydropx/Envía.com, Fase 3). `local` (entrega por código postal) todavía no
  está implementado aunque el schema ya lo contempla.
- **Admin (`/admin`)**: CRUD de productos/variantes/fotos con Server Actions
  (`src/app/admin/actions.ts`). Protegido por Cloudflare Access en producción
  + una segunda verificación propia del JWT (`src/lib/admin-auth.ts`, ver
  sección de arriba). Fotos en R2 (`src/lib/r2.ts`), servidas por
  `src/app/cdn/productos/[...key]/route.ts` y redimensionadas on-the-fly por
  Cloudflare (gratis hasta 5,000 transformaciones/mes, sin el producto
  "Cloudflare Images" de pago). Borrar una variante con pedidos asociados
  falla por la FK de `order_items`/`stock_reservations` — se captura y se
  muestra un aviso en vez de un 500 crudo; usar "stock en 0" o archivar el
  producto en ese caso, no se puede borrar el historial.
  - **`experimental.serverActions.bodySizeLimit`** subido a 10MB en
    `next.config.ts` — el default de Next (1MB) rechazaba cualquier foto de
    celular real antes de que nuestra propia validación de 8MB en `r2.ts`
    llegara a correr (confirmado con una prueba real: una foto de 3.7MB daba
    413 "Body exceeded 1 MB limit").

## Seguridad y confiabilidad — qué está cubierto y qué falta

**Cubierto:**
- Cabeceras de seguridad globales (`next.config.ts`: nosniff, X-Frame-Options,
  Referrer-Policy, Permissions-Policy, HSTS).
- Validación de entrada con `zod` en `/api/checkout` (`src/lib/schemas.ts`).
- Verificación de firma de webhook con `stripe.webhooks.constructEventAsync` +
  `SubtleCryptoProvider` (compatible con el runtime de Workers).
- Freno simple contra abuso: máximo 5 pedidos "pending" recientes por correo
  en `/api/checkout` (sin tabla nueva, usa `orders` directo).
- `npm audit`: 0 vulnerabilidades en dependencias de producción. Quedan 4
  moderadas en `drizzle-kit` (esbuild de su dev server local, no se ejecuta en
  producción) — arreglarlas requiere bajar `drizzle-kit` a una versión mayor
  anterior; no vale la pena por ahora, ver `npm audit` para detalle.
- CI (`.github/workflows/store-ci.yml`): lint + typecheck + test + build +
  audit en cada push/PR que toque `store/`.
- Dependabot (`.github/dependabot.yml`) para `store/` y GitHub Actions.

**Pendiente / fuera de alcance de este código:**
- **Rate limiting real de bots/DoS a nivel de borde** — recomendado configurar
  una regla de Cloudflare WAF/Rate Limiting desde el dashboard (no se puede
  provisionar por API sin credenciales de cuenta).
- **Tests de integración contra una base de datos real** — los tests actuales
  (`npm test`) cubren lógica pura (precios, envío, validación, firma de
  webhook) sin tocar la DB. Falta un test de extremo a extremo del flujo
  reserva→pago→descuento de stock contra una rama de Neon dedicada a pruebas.
- **CSP (Content-Security-Policy)** — no se agregó todavía porque la landing
  usa un iframe de Google Maps + Google Fonts + video, y una CSP mal armada la
  rompe; hacerla bien requiere mapear todos los orígenes permitidos primero.
- Email transaccional de confirmación de pedido (Resend, Fase 3).
- [x] ~~Cloudflare Access y R2 sin configurar~~ — configurado y verificado en
  producción 2026-10-01: `/admin` protegido por Access (confirmado con un
  302 real al login), `/tienda` y el webhook de Stripe respondiendo 200/400
  correctamente contra la base y Stripe reales.
- Falta dar de alta productos reales (la tabla sigue vacía) y, cuando haya
  llaves LIVE de Stripe, repetir el registro del webhook en modo live (ver
  arriba) — el de hoy es modo test.
