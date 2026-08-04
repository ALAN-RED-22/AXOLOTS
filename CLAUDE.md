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
