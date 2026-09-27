"use client";

import { useEffect, useRef } from "react";
import { T, useLang } from "./lang";

const packages = [
  {
    nameEs: "Paquete Axolots",
    nameEn: "Axolots Package",
    badgeEs: "Incluye video dron",
    badgeEn: "Includes drone video",
    descEs: "Videos con dron, visita a cuevas, guía certificado dentro de Teotihuacan, taller del cacao, visita al teoalpan de Axolots, degustación de chocolate y licores",
    descEn: "Drone video, cave visit, certified guide inside Teotihuacán, cacao workshop, visit to the Axolots teoalpan, chocolate and liqueur tasting",
    amount: "$ 1999 MXN",
  },
  {
    nameEs: "Paquete Plus",
    nameEn: "Plus Package",
    descEs: "Guía certificado dentro de Teotihuacan, taller del cacao, visita al teoalpan de Axolots, degustación de chocolate y licores",
    descEn: "Certified guide inside Teotihuacán, cacao workshop, visit to the Axolots teoalpan, chocolate and liqueur tasting",
    amount: "$ 1199 MXN",
  },
  {
    nameEs: "Paquete Visitante",
    nameEn: "Visitor Package",
    descEs: "Taller del cacao, visita al teoalpan de Axolots, degustación de chocolate y licores",
    descEn: "Cacao workshop, visit to the Axolots teoalpan, chocolate and liqueur tasting",
    amount: "$ 599 MXN",
  },
];

// un ajolote por fila de precio: color del cuerpo y de los rasgos de la cara
const swimmers = [
  { className: "dorado", face: "#1C1815" },
  { className: "rosa", face: "#1C1815" },
  { className: "negro", face: "var(--blush)" },
];

function AxolotlSvg({ face }: { face: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 40 Q -6 30 2 20 Q 10 32 20 36 Z" fill="currentColor" opacity=".85" />
      <ellipse cx="55" cy="42" rx="38" ry="20" fill="currentColor" />
      <ellipse cx="95" cy="38" rx="20" ry="16" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".8">
        <path d="M84 26 Q 74 18 68 10" />
        <path d="M88 24 Q 80 14 76 4" />
        <path d="M93 23 Q 88 12 86 2" />
      </g>
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".8">
        <path d="M106 26 Q 116 18 122 10" />
        <path d="M102 24 Q 110 14 114 4" />
      </g>
      <path d="M46 58 Q 40 66 32 66" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M68 58 Q 72 66 80 66" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="102" cy="35" r="2.5" fill={face} />
      <path d="M96 46 Q 101 49 106 46" stroke={face} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Cada ajolote tiene su propia "inercia": así no llegan ni se van
// exactamente sincronizados, se ve más natural.
const SPEEDS = [0.07, 0.09, 0.11];
const FINAL_SCALE = 0.42;

export function Pricing() {
  const { lang } = useLang();
  const pricingRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const axolotlRefs = useRef<(HTMLDivElement | null)[]>([]);
  const targetsRef = useRef<{ x: number; y: number; scale: number }[]>([]);

  // Mide dónde está cada "$ XXX MXN" dentro de .pricing. La posición RELATIVA
  // no cambia con el scroll: solo se recalcula al montar, al cambiar el tamaño
  // de ventana y al cambiar de idioma (las descripciones cambian la altura de las filas).
  useEffect(() => {
    const measure = () => {
      const pricing = pricingRef.current;
      if (!pricing) return;
      const pricingRect = pricing.getBoundingClientRect();
      targetsRef.current = rowRefs.current.map((row, i) => {
        const amountRect = row!.querySelector(".amount")!.getBoundingClientRect();
        // el ajolote cambia de tamaño según el CSS activo (78px escritorio, 54px móvil)
        const size = axolotlRefs.current[i]?.offsetWidth ?? 78;
        const halfFinal = (size * FINAL_SCALE) / 2;
        return {
          x: amountRect.left - pricingRect.left - halfFinal - 4,
          y: amountRect.top - pricingRect.top + amountRect.height / 2 - halfFinal,
          scale: FINAL_SCALE,
        };
      });
    };
    measure();
    window.addEventListener("load", measure);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("load", measure);
      window.removeEventListener("resize", measure);
    };
  }, [lang]);

  useEffect(() => {
    const state = SPEEDS.map(() => 0); // progreso suavizado actual de cada ajolote
    let raf = 0;

    // Progreso 0→1→0: 1 cuando .pricing está centrado en la pantalla,
    // baja conforme se aleja del centro (por arriba o por abajo).
    const targetProgress = () => {
      const rect = pricingRef.current!.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
      return Math.max(0, 1 - distance / (window.innerHeight * 0.95));
    };

    const frame = () => {
      const goal = targetProgress();
      axolotlRefs.current.forEach((el, i) => {
        const target = targetsRef.current[i];
        if (!el || !target) return;

        // suaviza el movimiento en vez de saltar directo al valor de scroll
        state[i] += (goal - state[i]) * SPEEDS[i];
        const t = state[i];

        const startX = -150; // fuera de la vista, a la izquierda de .pricing
        const x = startX + (target.x - startX) * t;
        const scale = 1 + (target.scale - 1) * t;

        el.style.transform = `translate(${x}px, ${target.y}px) scale(${scale})`;
        el.style.opacity = String(Math.min(1, t * 3.5));
      });
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="pricing" ref={pricingRef}>
      {swimmers.map((s, i) => (
        <div
          key={s.className}
          className={`axolotl ${s.className}`}
          ref={(el) => {
            axolotlRefs.current[i] = el;
          }}
        >
          <AxolotlSvg face={s.face} />
        </div>
      ))}

      {packages.map((p, i) => (
        <div
          className="price-row"
          key={p.nameEn}
          ref={(el) => {
            rowRefs.current[i] = el;
          }}
        >
          <div>
            <span className="name">
              <T es={p.nameEs} en={p.nameEn} />
            </span>
            {p.badgeEs && p.badgeEn && (
              <span className="badge">
                <T es={p.badgeEs} en={p.badgeEn} />
              </span>
            )}
            <span className="desc">
              <T es={p.descEs} en={p.descEn} />
            </span>
          </div>
          <div className="amount">{p.amount}</div>
        </div>
      ))}
    </div>
  );
}
