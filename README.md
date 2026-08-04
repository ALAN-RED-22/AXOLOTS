# AXOLOTS — Teotihuacán

Landing page de una sola página para un negocio turístico en San Martín de las Pirámides (Teotihuacán, México): vuelos en globo aerostático con grabación por dron, exhibición viva de axolotes, y taller/tienda de artesanías.

Sitio estático puro — sin backend, sin build step, sin dependencias de npm.

## Estructura

```
index.html          Marcado de la página (una sola sección por bloque de negocio)
assets/
  css/style.css      Todos los estilos
  js/
    menu.js           Menú hamburguesa en móvil
    i18n.js            Switch ES/EN (usa atributos data-en en el HTML)
    timeline.js         Animación de aparición del timeline "Cómo se vive un día aquí"
    pricing-axolotl.js   Animación de los ajolotes nadando hacia los precios (sección #dron)
  img/                Fotos, logo, GIF decorativo
  video/               Video del hero y video de fondo de la sección de axolotes
favicon.svg
robots.txt
```

## Desarrollo local

No requiere instalación. Sirve la carpeta con cualquier servidor estático, por ejemplo:

```bash
python -m http.server 8000
# abrir http://localhost:8000
```

## Ramas

- `pruebas` — rama de trabajo/QA (donde se hacen los cambios).
- `main` — producción.

## Estado del proyecto / pendientes

Ver [CLAUDE.md](CLAUDE.md), sección "Pendientes" — es la fuente de verdad de qué falta antes de salir a producción.
