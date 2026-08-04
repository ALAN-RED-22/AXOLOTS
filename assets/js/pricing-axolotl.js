(function () {
  const pricing = document.querySelector('#dron .pricing');
  if (!pricing) return;

  const rows = pricing.querySelectorAll('.price-row');
  const axolotls = [
    document.getElementById('axolotl-amanecer'),
    document.getElementById('axolotl-completo'),
    document.getElementById('axolotl-grupo')
  ];

  // Cada ajolote tiene su propia "inercia": así no llegan ni se van
  // exactamente sincronizados, se ve más natural.
  const speeds = [0.07, 0.09, 0.11];
  const state = axolotls.map(() => 0); // progreso suavizado actual de cada ajolote

  let targets = []; // posición final (junto al precio) de cada ajolote, relativa a .pricing

  // Mide dónde está cada "$ XXX MXN" dentro de .pricing.
  // Solo se recalcula al cargar y al cambiar tamaño de ventana,
  // porque la posición RELATIVA dentro de .pricing no cambia con el scroll.
  function measureTargets() {
    const pricingRect = pricing.getBoundingClientRect();
    const finalScale = 0.42;

    targets = Array.from(rows).map((row, i) => {
      const amountEl = row.querySelector('.amount');
      const amountRect = amountEl.getBoundingClientRect();

      // el ajolote cambia de tamaño según el CSS activo (78px en escritorio,
      // 54px en móvil) — usamos su tamaño real para centrarlo bien
      const axolotl = axolotls[i];
      const size = axolotl ? axolotl.offsetWidth : 78;
      const halfFinal = (size * finalScale) / 2;

      return {
        x: amountRect.left - pricingRect.left - halfFinal - 4,
        y: amountRect.top - pricingRect.top + amountRect.height / 2 - halfFinal,
        scale: finalScale
      };
    });
  }

  // Progreso 0→1→0: 1 cuando .pricing está centrado en la pantalla,
  // baja conforme .pricing se aleja del centro (ya sea por arriba o por abajo).
  function targetProgress() {
    const rect = pricing.getBoundingClientRect();
    const sectionCenter = rect.top + rect.height / 2;
    const viewportCenter = window.innerHeight / 2;
    const distance = Math.abs(sectionCenter - viewportCenter);
    const threshold = window.innerHeight * 0.95;
    return Math.max(0, 1 - distance / threshold);
  }

  function frame() {
    const tGoal = targetProgress();

    axolotls.forEach((axolotl, i) => {
      if (!axolotl) return;
      const target = targets[i];
      if (!target) return;

      // suaviza el movimiento en vez de saltar directo al valor de scroll
      state[i] += (tGoal - state[i]) * speeds[i];
      const t = state[i];

      const startX = -150;      // fuera de la vista, a la izquierda de .pricing
      const startY = target.y;  // mismo alto que su fila: el viaje es horizontal
      const startScale = 1;

      const x = startX + (target.x - startX) * t;
      const y = startY + (target.y - startY) * t;
      const scale = startScale + (target.scale - startScale) * t;

      axolotl.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      axolotl.style.opacity = Math.min(1, t * 3.5);
    });

    requestAnimationFrame(frame);
  }

  window.addEventListener('load', measureTargets);
  window.addEventListener('resize', measureTargets);
  measureTargets();
  requestAnimationFrame(frame);
})();
