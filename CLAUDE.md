# CLAUDE.md

Contexto de proyecto para Claude Code. Léelo antes de asumir nada del repo — esta sección de pendientes es la fuente de verdad de qué falta; actualízala cada vez que se resuelva o surja un punto nuevo, en vez de repetir el análisis completo del sitio.

## Estado actual (actualizar en cada sesión)

- **Última actualización:** 2026-09-30.
- **`main`:** PR #6 mergeada (docs). Branch protection activa; Alan ya trabaja desde `pruebas`.
- **`pruebas`:** Fase 2 completa (catálogo + carrito + checkout Stripe) **y** panel de administración (`/admin`) con CRUD de productos/variantes/fotos — ver "Fase 2" más abajo. El incidente de `DATABASE_URL` corrompido en `store/.dev.vars` ya se resolvió (el usuario lo volvió a copiar desde Neon). Todo probado end-to-end contra Stripe y Neon reales (CI en verde en cada push). **Pendiente antes de que `/admin` funcione en producción**: configurar Cloudflare Access y habilitar R2 en la cuenta — son pasos de dashboard, ver `store/README.md`.
- **Branch protection en `main`:** activada por el usuario.

## Qué es esto

Landing page de una sola página (`index.html`) para AXOLOTS, negocio turístico en San Martín de las Pirámides / Teotihuacán: vuelos en globo con grabación por dron, exhibición viva de axolotes, taller y venta de artesanías. Sitio estático: HTML/CSS/JS plano, sin framework, sin build, sin backend.

## Estructura

- `index.html` — todo el marcado, bilingüe vía atributos `data-en` (el texto en español vive directo en el nodo; `assets/js/i18n.js` guarda ese texto como `data-es` al cargar y alterna con `data-en` al hacer switch de idioma).
- `assets/css/style.css` — únicos estilos del sitio. Tokens de color en `:root` (paleta obsidiana/adobe/jade/blush, tema "Teotihuacán").
- `assets/js/` — 5 módulos IIFE independientes, sin dependencias entre sí: `menu.js` (hamburguesa móvil), `i18n.js` (ES/EN), `timeline.js` (reveal on scroll de la sección "Cómo se vive un día aquí"), `pricing-axolotl.js` (animación de ajolotes nadando hacia los precios en `#dron`), `shop-carousel.js` (carrusel 3D "coverflow" de la sección `#taller`, agregado por Alan — controla `.coverflow-track`/`.coverflow-card`/`.ctrl-btn.prev`/`.next`).
- `assets/img/`, `assets/video/` — media del sitio (ver pendientes de optimización abajo). Incluye `barro.jpg`, `joyeria.jpg`, `obsidianatallada.jpg`, `textil.jpg` (fotos reales del carrusel de artesanías).
- `store/` — app Next.js con la landing portada a React + la futura tienda (ver "Arquitectura de la tienda" abajo). Independiente del `index.html`/`style.css` de la raíz: tiene su propia copia de estilos (`store/src/app/landing.css`) y de media (`store/public/assets/`).
- Breakpoints usados en el CSS: 520 / 640 / 700 / 819-820 / 860 / 900 / 1020px — mantener consistencia si se agregan nuevos.

## Ramas

- `pruebas`: rama de trabajo/QA — es donde se hace el desarrollo activo.
- `main`: producción. No mergear a `main` sin pasar por el checklist de "antes de producción" abajo.

## Incidente: reescritura de `style.css` en `main` (resuelto 2026-09-27)

Alan (`ALAN-RED-22`) pusheó una serie de commits directo a `main` (sin pasar por `pruebas`) que agregaron el carrusel 3D "coverflow" de la sección de artesanías y reescribieron `assets/css/style.css` casi por completo. Esa reescritura **borró sin querer** las reglas de `.pricing`/`.price-row` (precios en `#dron`), `.ubica`/`.infolist` (ficha de ubicación), `.map-box`, el `footer` completo y el color del ícono de WhatsApp flotante — el HTML seguía usando esas clases, pero se quedaron sin estilo en `main`. También se perdió la animación `@keyframes axo-swim` y la regla `prefers-reduced-motion`.

Al abrir la PR de `pruebas` → `main` esto generó un conflicto real de merge (no solo de formato). Se resolvió conservando el carrusel y los fixes de header de Alan tal cual, y reinsertando las reglas perdidas con los mismos valores que tenían antes. Quedó documentado en el merge commit `21e4626`. **Validado con Alan (2026-09-27)** que de ahora en más también trabaja desde `pruebas`.

Si vuelve a pasar: antes de abrir/mergear una PR, comparar `git diff origin/main origin/pruebas -- assets/css/style.css` y si hay reescrituras grandes, verificar con `comm` que ninguna clase usada en el HTML se quedó sin regla en el CSS (ver el método usado en esa sesión: extraer clases de `index.html` vs. selectores de `style.css`).

## Pendientes (actualizar aquí, no releer todo el sitio cada vez)

### Bloqueantes antes de producción
- [ ] **Instagram**: no existe la cuenta todavía. Hay 2 placeholders `href="#"` marcados con `<!-- TODO -->` en `index.html` (nav y footer) — reemplazar por la URL real en cuanto exista la cuenta.
- [ ] **Dominio y hosting**: sin elegir. Recomendado: Vercel/Netlify/Cloudflare Pages (deploy automático por rama, HTTPS gratis). `pruebas` → preview, `main` → producción.
- [ ] **og:image / og:url**: hoy son rutas relativas (`assets/img/ax.png`) — Instagram/WhatsApp/Facebook necesitan URL absoluta para generar la vista previa al compartir el link. Convertir a absolutas en cuanto haya dominio (comentario ya dejado en el `<head>` de `index.html`).
- [x] **CLABE bancaria** retirada de `#ubicacion` (commit dedicado, ver PR de seguridad). El texto ahora dirige a "Confirma y paga por WhatsApp" en vez de mostrar datos bancarios en texto plano.

### Optimización de media (repo pesa 83MB en `.git` por esto)
- [ ] `assets/video/trailer.mp4` (2.8MB) no está referenciado en ningún lado del HTML — decidir si se borra o se usa.
- [ ] Comprimir video/imágenes antes de producción — pipeline sugerido (no ejecutado, faltan herramientas en este entorno):
  ```bash
  ffmpeg -i recorridocuatris.mp4 -vcodec libx264 -crf 28 -preset slow -an -movflags +faststart recorridocuatris.web.mp4
  ffmpeg -i globo4.gif -c:v libvpx-vp9 -b:v 0 -crf 30 globo4.webm   # 2.7MB -> muchísimo menos
  cwebp -q 80 ax.png -o ax.webp
  cwebp -q 80 ubicacion.png -o ubicacion.webp
  ```
- [ ] Migrar binarios pesados a Git LFS o a almacenamiento externo (Vercel Blob / Cloudflare R2 / Cloudinary) en vez de versionarlos en Git tal cual.

### Decisiones de negocio (no implementar sin confirmar)
- [x] **Tienda**: confirmado por el usuario (2026-09-26) que SÍ se construye e-commerce de artesanías (obsidiana, textil, cuero, minerales, recuerdos: llavero/pin/taza/imán, ropa típica, sombrero de mariachi). WhatsApp se conserva como canal de apoyo. Ver "Arquitectura de la tienda" abajo.

## Arquitectura de la tienda (decidida 2026-09-26, pendiente de implementar)
- **Principio**: nunca tocar datos de tarjeta. Pagos con checkout alojado (Stripe Checkout como primario: tarjeta, MSI, OXXO, SPEI; Mercado Pago Checkout Pro como opcional). Cumplimiento PCI SAQ A. El webhook del proveedor es la fuente de verdad del pago (idempotente).
- **Decisiones del usuario (2026-09-26)**: hosting en Cloudflare (Pages/Workers, vía OpenNext); pagos con Stripe Y Mercado Pago desde el inicio (detrás de una interfaz `PaymentProvider`); productos repetibles con inventario chico (~3 piezas por diseño, se agotan y se repone) + sección de "piezas únicas" por temporada (drops); facturación: persona física, SIN CFDI automático al inicio (ver pendiente fiscal abajo).
- **Pendiente fiscal (bloqueante para cobrar)**: la constancia del usuario solo registra "Servicio de entrega de alimentos preparados por plataformas" (10%) + sueldos; falta dar de alta la actividad de venta de artesanías y confirmar régimen con contador ANTES de abrir cuentas Stripe/MP a su RFC.
- **Facturación (decidido 2026-09-28)**: NO se automatiza CFDI al inicio ni se agenda como fase próxima. Quien necesite factura contacta por WhatsApp y se factura manualmente aparte. El checkout solo entrega recibo/confirmación de compra, sin flujo de facturación integrado.
- **USD (decidido 2026-09-28)**: los precios en dólares son solo demostrativos para el turista extranjero (conversión aproximada mostrada junto al precio en MXN) — el cobro real siempre es en MXN vía Stripe/MP. No implica agregar USD como moneda de cobro ni lógica de tipo de cambio en el checkout.
- **Stack**: Next.js (App Router) + TypeScript + Tailwind en Cloudflare (Pages/Workers con `@opennextjs/cloudflare`; alternativa de respaldo: Vercel Pro). Landing actual migra a `/`, tienda en `/tienda`. i18n ES/EN (turistas). Moneda MXN.
- **Inventario**: un solo modelo de producto con `type = standard | unique`, `stock`, `drop_date` opcional; badge "quedan N", "agotado + avísame" (lista de espera por correo); reserva de stock **30 min** en checkout (corregido 2026-09-30 — Stripe no acepta `expires_at` de un Checkout Session menor a 30 min; los "~15 min" originales no eran viables).
- **Progreso (2026-09-27, mergeado a `main` vía PR #5)**: app Next.js 16 en `store/` (la landing estática en la raíz sigue intacta y es lo que sirve GitHub Pages). **Repo de trabajo movido fuera de OneDrive a `C:devAXOLOTS`** (OneDrive bloqueaba `.open-next`/`node_modules`; no volver a trabajar en la copia de OneDrive). Adaptador `@opennextjs/cloudflare` (`wrangler.jsonc`, worker `axolots-store`, cuenta Cloudflare sysium6566@gmail.com). **Desplegado en producción con dominio propio: https://axolotsmx.com y www** (custom domains vía `wrangler.jsonc`) sirviendo ya la landing portada a Next (`npm run deploy` desde `store/` reemplazó la página "muy pronto"; NO llamar `opennextjs-cloudflare deploy` solo, sube el build viejo). Modelo de datos en `store/src/db/schema.ts` (Drizzle), migración `0000_init` YA aplicada en Neon (9 tablas); `DATABASE_URL` vive en `store/.dev.vars` (gitignored). Pendiente: rotar contraseña de Neon (se expuso en el chat), configurar cache de OpenNext (R2), decidir si `store/` reemplaza definitivamente la landing de la raíz, migrar dominio de GitHub Pages cuando la tienda esté lista.
- **Landing portada a Next**: `store/src/app/page.tsx` + `store/src/components/landing/*` (i18n por contexto React `<T es en/>` en vez de `data-en`; menú, reveal de timeline y animación de ajolotes como hooks/efectos). Estilos en `store/src/app/landing.css` (copia de `assets/css/style.css` desde antes del incidente con el carrusel de Alan — **no incluye el carrusel "coverflow" ni sus fotos**, sigue con las 4 tarjetas de artesanía originales; fuentes vía `next/font`; ojo: tiene selectores de elemento `header/nav/footer` globales, acotarlos al montar `/tienda`). Media en `store/public/assets/`. `metadataBase` = https://axolotsmx.com (resuelve og:image absoluta).
- **Datos**: catálogo Y stock en Neon Postgres (Drizzle) — se decidió no usar Sanity al inicio para evitar sincronizar stock entre dos sistemas; altas de producto vía el panel `/admin` (ver Fase 2 abajo). Sanity queda como opción futura solo para contenido editorial. Piezas únicas (obsidiana, minerales) = stock 1 con reserva temporal en checkout. Variantes para ropa/sombrero (talla). Imágenes en Cloudflare R2 (ver Fase 2 — reemplaza la mención anterior a Vercel Blob/Cloudinary, obsoleta desde que se decidió Cloudflare como hosting).
- **Servicios**: correo transaccional con Resend; guías y tarifas de envío vía agregador (Skydropx o Envía.com); feed de catálogo para Instagram/Facebook Shopping; Meta Pixel + Conversions API + GA4; aviso de privacidad (LFPDPPP).
- **Entornos**: `pruebas` → preview + llaves Stripe test; `main` → producción + llaves live. Secretos solo en variables de entorno de Vercel, nunca en el repo.
- **Envíos**: 3 métodos en checkout — nacional por paquetería (tarifa por peso/zona vía agregador, envío gratis sobre un monto por definir), recoger en el local (gratis), entrega local por código postal (tarifa fija). Empaque reforzado y seguro de envío para obsidiana/minerales/tazas.
- **Fases**: 1) dominio+hosting+Instagram (bloqueantes de arriba); 2) catálogo + carrito + checkout Stripe con envío nacional y recoger (**en progreso, ver abajo**); 3) guías automáticas, correos, feed Meta, entrega local; 4) MSI/Mercado Pago, inglés/USD (solo display demostrativo, ver decisión de facturación arriba — CFDI queda fuera de alcance, es manual por WhatsApp).

### Fase 2: catálogo + carrito + checkout Stripe + panel de admin (2026-09-30, en `pruebas`)
Código en `store/src/lib/` (`env.ts`, `db.ts`, `catalog.ts`, `inventory.ts`, `shipping.ts`, `schemas.ts`, `checkout.ts`, `webhook-handler.ts`, `same-origin.ts`, `payments/`, `admin-auth.ts`, `r2.ts`, `slug.ts`) + rutas `store/src/app/api/{checkout,webhooks/stripe}/route.ts` + `store/src/app/cdn/productos/[...key]/route.ts` + páginas públicas `store/src/app/tienda/*` + panel `store/src/app/admin/*`. Detalle técnico completo (por qué no hay transacciones, por qué 30 min, Cloudflare Access/R2 paso a paso, qué cubre la seguridad y qué no) en **`store/README.md`** — no duplicar aquí, leer ese archivo antes de tocar esta parte.
- **Decisiones de diseño clave**: el driver HTTP de Neon no soporta transacciones interactivas → reserva de stock vía un único `INSERT...SELECT...WHERE` atómico (`store/src/lib/inventory.ts`) + compensación manual (liberar/cancelar) si algo falla a mitad del checkout, en vez de rollback. `PaymentProvider` es una interfaz (`store/src/lib/payments/provider.ts`) con `StripeProvider` como única implementación hoy — así Mercado Pago (Fase 4) entra sin tocar lógica de negocio. Precio y stock del carrito SIEMPRE se recalculan server-side en `/api/checkout`, nunca se confía en lo que mande el cliente.
- **`/tienda` no reutiliza `landing.css`**: usa Tailwind + variables de marca replicadas en `store/src/app/globals.css` — resuelve de paso el pendiente de "acotar selectores globales de `header/nav/footer` antes de montar `/tienda`".
- **Panel de admin (`/admin`)**: CRUD de productos/variantes/fotos vía Server Actions. **No hay tabla de usuarios ni cuentas de cliente** (decidido con el usuario 2026-09-30) — el checkout sigue siendo 100% guest (email/teléfono directo en `orders`, sin login). Para administrar (1-2 personas de confianza, no clientes) se usa **Cloudflare Access** en el borde (gratis hasta 50 usuarios, política por correo, sin tabla de admins propia) + una segunda verificación del JWT en `store/src/lib/admin-auth.ts` como defensa en profundidad. En desarrollo (`NEXTJS_ENV=development`) se salta Access y usa el primer correo de `ADMIN_EMAILS` directo.
- **Fotos de producto: R2**, no Cloudflare Images ni Vercel Blob (la mención anterior a "Vercel Blob/Cloudinary" en este archivo quedó obsoleta desde que se decidió Cloudflare como hosting). Servidas por `store/src/app/cdn/productos/[...key]/route.ts`, redimensionadas on-the-fly por Cloudflare (`/cdn-cgi/image/...`, gratis hasta 5,000 transformaciones/mes).
- **Verificado en esta sesión, contra servicios reales (no solo unit tests)**: Stripe real vía `stripe` CLI (`stripe trigger`/`stripe events resend`) contra el webhook — encontró y arregló un bug real de idempotencia (ver abajo). Chrome headless real contra el panel de admin — creó un producto, subió una foto a R2 (emulado en local), confirmó en Neon que el registro quedó bien, y encontró y arregló dos bugs reales más (ver abajo). Los productos/fotos de prueba creados así ya se borraron de la base real. `npm test` (45 tests), `npx tsc --noEmit`, `npx eslint src`, `npm run build`, `npm audit` (0 vulnerabilidades nuevas) — todo en verde en CI.
- **Bugs reales encontrados y arreglados con estas pruebas (no los hubiera encontrado solo con unit tests)**:
  1. Reenviar el mismo evento de Stripe devolvía 500 en vez de 200 — Drizzle envuelve el error de Postgres en `.cause`, la detección de "evento duplicado" solo miraba el nivel superior (`webhook-handler.ts`).
  2. Subir una foto de celular real (3.7MB) daba 413 "Body exceeded 1 MB limit" — el default de Next para Server Actions es 1MB; subido a 10MB en `next.config.ts`.
  3. Las miniaturas del panel de admin se veían rotas en local — `/cdn-cgi/image/...` solo existe en el borde de Cloudflare real, no en `next dev`; `resizedImageUrl()` ahora sirve la foto sin redimensionar fuera de producción.
- **Pendiente antes de producción real**: (1) habilitar R2 en la cuenta de Cloudflare + crear el bucket (`wrangler r2 bucket list` hoy devuelve "Please enable R2 through the Cloudflare Dashboard"); (2) configurar la aplicación de Cloudflare Access para `/admin*`; (3) decidir y agregar el correo de cualquier otro admin (hoy `ADMIN_EMAILS` en `wrangler.jsonc` solo tiene el de la cuenta) tanto ahí como en la política de Access; (4) dar de alta productos reales (hoy la tabla está vacía); (5) llaves de Stripe LIVE cuando se vaya a cobrar de verdad (hoy todo probado en modo test).
- [x] **Diseño del hero**: los globos decorativos (`globo4.gif`) se agrandaron (antes 38-56px, ahora 46-132px con tamaños variados para dar profundidad), se movió su posicionamiento de `style` inline a clases CSS (`.balloon.b1-b4` en `style.css`), y se agregó un 4º globo + `drop-shadow` + variante para móvil (`b2` se oculta bajo 640px para no saturar).
- [x] **Jerarquía de paquetes en `#dron`**: confirmado con el usuario que es intencional que solo el Paquete Axolots ($1999) incluya video de dron (upsell). Se agregó badge "Incluye video dron" en esa fila y una línea aclaratoria en la intro de la sección, para que no se sienta como promesa incumplida al llegar a precios desde el CTA del hero.

## Audit UX/UI (resuelto en esta ronda)
- [x] Contraste de `.pricing`: fondo pasó de `rgba(28,24,21,0.28)` (dependía del gradiente de atrás, caía a ~2.3:1 en la parte clara) a `rgba(20,17,15,0.92)` — ahora ~8:1+ independientemente de dónde caiga sobre el gradiente.
- [x] Nombres/descripciones de paquetes en `data-en` no coincidían con el texto en español (parecían productos distintos al cambiar de idioma) — alineados como traducciones reales del mismo contenido.
- [x] Nav apretado entre 820-900px + íconos sociales saturando la barra fija en móvil — `.social-links` dentro de `nav` ahora se oculta bajo 900px (sigue visible siempre en el footer; WhatsApp además cubierto por el botón flotante).

### Pendiente (no tocado en esta ronda, ver conversación para detalle)
- [x] **Divergencia `index.html` (raíz) vs. `store/`**: la sección de artesanías no es igual en ambas — la raíz tiene el carrusel "coverflow" con fotos reales (obsidiana/textil/barro/joyería) que agregó Alan; `store/` sigue con las 4 tarjetas estáticas originales, sin fotos. **Decidido (2026-09-28): NO portar el carrusel decorativo a `store/`.** Cuando llegue la Fase 2 (catálogo + carrito), esa sección de `store/` se reemplaza directamente por el grid/carrusel de productos reales de Neon — construirlo una sola vez ya con datos reales en vez de portar algo que se va a tirar.
  - **Bug de encuadre detectado en el carrusel de la raíz** (aplica hoy, no es hipotético): las fotos son 4000×2252 (horizontales), pero `.coverflow-card` es 280×400px (vertical) con `background-size:cover` — se recorta casi todo el ancho de cada foto, queda solo una franja central. Ver guía de fotos más abajo antes de tomar más material para el catálogo.

### Guía de fotos de producto (para quien tome las fotos del catálogo)
Fotos actuales de referencia (`assets/img/{obsidianatallada,textil,barro,joyeria}.jpg`): 4000×2252px, 3–4.5MB cada una, horizontales, tomadas con celular. Para las próximas tomas:
- **Orientación:** vertical/retrato (no horizontal), para que coincida con el formato de tarjeta de producto. Si no se puede controlar la orientación al tomar la foto, dejar márgenes generosos alrededor de la pieza para poder recortar después sin cortarla.
- **Resolución de salida:** ~1200-1600px en el lado largo alcanza — no hace falta subir el archivo del celular a resolución completa (eso solo pesa más sin verse mejor en pantalla).
- **Fondo:** una misma superficie/luz para las 4 fotos de un mismo set, para que se vean como un conjunto coherente y no como fotos sueltas de momentos distintos. Algo neutro (madera clara, tela lisa, tono cálido que combine con la paleta obsidiana/adobe del sitio) funciona mejor que fondos con desorden.
- **Luz:** luz difusa (ventana con luz indirecta, o dos fuentes suaves), no flash directo del celular — la obsidiana es muy reflejante y el flash genera brillos duros que ocultan el tallado; la joyería necesita luz pareja para que se note el detalle a tamaño chico.
- **Encuadre del producto:** centrado, ocupando la mayor parte del cuadro sin llegar al borde, para que el recorte a vertical no corte la pieza.
- [ ] CTA secundario del hero ("Conocer el santuario estilo Teocalpan") apunta a `#taller` pero "Teocalpan"/"teoalpan" nunca se define en el sitio, y además se escribe distinto en el hero vs. en las descripciones de paquetes (Teocalpan vs teoalpan).
- [ ] `.hero` es `100dvh` fijo sin techo de altura para el `<h1>` (usa el tamaño default del navegador) — riesgo de que el contenido se corte en móviles de poca altura.
- [ ] Objetivos táctiles bajo 44×44px en `.social-link` (34px), `.menu-toggle` (38px) y `.lang-btn` (~32-36px).
- [ ] `prefers-reduced-motion` apaga animaciones CSS pero no pausa los `<video autoplay>` del hero y de `#axolotes`.
- [ ] Atributos duplicados en el `<iframe>` del mapa (`width`, `height`, `style`, `allowfullscreen`, `loading`, `referrerpolicy` cada uno aparece dos veces).
- [ ] Selector CSS frágil `.dron > .wrap > .dron-grid > div > p` (4 niveles de descendencia).
- [ ] `.lang-switch` sin `aria-pressed` en los botones ES/EN para lectores de pantalla.

## Notas de seguridad
- Sitio 100% estático, sin formularios ni backend → sin superficie de XSS/SQLi/CSRF clásica.
- Los enlaces de WhatsApp/Instagram son anchors estáticos en el HTML: solo cambian si alguien con acceso al repo los edita, o vía MITM si el sitio se sirve sin HTTPS. Mitigación: HTTPS obligatorio en el hosting elegido (automático en Vercel/Netlify/Cloudflare Pages), protección de la rama `main` (revisar antes de mergear).
- La CLABE en texto plano (mayor riesgo de fraude identificado en el audit inicial) ya se retiró — ver commit de seguridad y análisis en la PR correspondiente.

## Comandos útiles
```bash
# preview local
python -m http.server 8000

# ver qué referencias a media hay en el HTML (evitar rutas rotas tras mover archivos)
grep -n "assets/" index.html
```
