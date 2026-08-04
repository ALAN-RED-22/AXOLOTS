# CLAUDE.md

Contexto de proyecto para Claude Code. Léelo antes de asumir nada del repo — esta sección de pendientes es la fuente de verdad de qué falta; actualízala cada vez que se resuelva o surja un punto nuevo, en vez de repetir el análisis completo del sitio.

## Qué es esto

Landing page de una sola página (`index.html`) para AXOLOTS, negocio turístico en San Martín de las Pirámides / Teotihuacán: vuelos en globo con grabación por dron, exhibición viva de axolotes, taller y venta de artesanías. Sitio estático: HTML/CSS/JS plano, sin framework, sin build, sin backend.

## Estructura

- `index.html` — todo el marcado, bilingüe vía atributos `data-en` (el texto en español vive directo en el nodo; `assets/js/i18n.js` guarda ese texto como `data-es` al cargar y alterna con `data-en` al hacer switch de idioma).
- `assets/css/style.css` — únicos estilos del sitio. Tokens de color en `:root` (paleta obsidiana/adobe/jade/blush, tema "Teotihuacán").
- `assets/js/` — 4 módulos IIFE independientes, sin dependencias entre sí: `menu.js` (hamburguesa móvil), `i18n.js` (ES/EN), `timeline.js` (reveal on scroll de la sección "Cómo se vive un día aquí"), `pricing-axolotl.js` (animación de ajolotes nadando hacia los precios en `#dron`).
- `assets/img/`, `assets/video/` — media del sitio (ver pendientes de optimización abajo).
- Breakpoints usados en el CSS: 520 / 640 / 700 / 819-820 / 860 / 900 / 1020px — mantener consistencia si se agregan nuevos.

## Ramas

- `pruebas`: rama de trabajo/QA — es donde se hace el desarrollo activo.
- `main`: producción. No mergear a `main` sin pasar por el checklist de "antes de producción" abajo.

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
- [ ] **Tienda**: por ahora se recomendó negociar por WhatsApp (ya integrado: botón flotante + enlaces `wa.me/525527735718`), no construir e-commerce hasta validar volumen de ventas.
- [x] **Diseño del hero**: los globos decorativos (`globo4.gif`) se agrandaron (antes 38-56px, ahora 46-132px con tamaños variados para dar profundidad), se movió su posicionamiento de `style` inline a clases CSS (`.balloon.b1-b4` en `style.css`), y se agregó un 4º globo + `drop-shadow` + variante para móvil (`b2` se oculta bajo 640px para no saturar).
- [x] **Jerarquía de paquetes en `#dron`**: confirmado con el usuario que es intencional que solo el Paquete Axolots ($1999) incluya video de dron (upsell). Se agregó badge "Incluye video dron" en esa fila y una línea aclaratoria en la intro de la sección, para que no se sienta como promesa incumplida al llegar a precios desde el CTA del hero.

## Audit UX/UI (resuelto en esta ronda)
- [x] Contraste de `.pricing`: fondo pasó de `rgba(28,24,21,0.28)` (dependía del gradiente de atrás, caía a ~2.3:1 en la parte clara) a `rgba(20,17,15,0.92)` — ahora ~8:1+ independientemente de dónde caiga sobre el gradiente.
- [x] Nombres/descripciones de paquetes en `data-en` no coincidían con el texto en español (parecían productos distintos al cambiar de idioma) — alineados como traducciones reales del mismo contenido.
- [x] Nav apretado entre 820-900px + íconos sociales saturando la barra fija en móvil — `.social-links` dentro de `nav` ahora se oculta bajo 900px (sigue visible siempre en el footer; WhatsApp además cubierto por el botón flotante).

### Pendiente (no tocado en esta ronda, ver conversación para detalle)
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
