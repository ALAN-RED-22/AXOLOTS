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
- Panel de administración para altas de producto (hoy es Drizzle Studio /
  scripts a mano).
