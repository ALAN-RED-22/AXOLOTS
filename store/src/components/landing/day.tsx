"use client";

import { useEffect, useRef } from "react";
import { T } from "./lang";

const steps = [
  { time: "05:30", es: "Despega tu globo sobre el Valle de Teotihuacán", en: "Your balloon takes off over the Teotihuacán Valley", descEs: "Tu vuelo comienza antes del amanecer, con vista completa a las pirámides desde el aire.", descEn: "Your flight begins before sunrise, with a full view of the pyramids from above." },
  { time: "07:00", es: "Recorres la Zona Arqueológica", en: "You explore the Archaeological Zone", descEs: "La Pirámide del Sol y la Calzada de los Muertos, a pie y con calma.", descEn: "The Pyramid of the Sun and the Avenue of the Dead, on foot and at your own pace." },
  { time: "08:30", es: "Descansas en nuestro mirador", en: "You rest at our lookout", descEs: "A unos metros de la zona, con vista directa y sombra para hacer una pausa.", descEn: "Just steps from the site, with a direct view and shade to take a break." },
  { time: "08:45", es: "Conoces a nuestros axolotes", en: "You meet our axolotls", descEs: "Una exhibición viva de esta especie nativa, en peligro crítico de extinción.", descEn: "A live exhibit of this native species, critically endangered." },
  { time: "09:15", es: "Eliges tu pieza de artesanía", en: "You choose your handmade piece", descEs: "Obsidiana, barro y textil, trabajados por manos locales, en el mismo taller.", descEn: "Obsidian, clay, and textiles, crafted by local hands, in the same workshop." },
  { time: "10:00", es: "Recibes el video de tu vuelo", en: "You receive your flight video", descEs: "Grabado por dron durante tu globo, editado y entregado el mismo día.", descEn: "Filmed by drone during your balloon ride, edited and delivered the same day." },
];

export function Day() {
  const listRef = useRef<HTMLUListElement>(null);

  // reveal on scroll
  useEffect(() => {
    const items = listRef.current?.querySelectorAll(".step");
    if (!items) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("show");
        });
      },
      { threshold: 0.3 },
    );
    items.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="day" id="dia">
      <div className="wrap">
        <p className="eyebrow">
          <T es="Cómo se vive un día aquí" en="What a day here looks like" />
        </p>
        <h2>
          <T
            es="Tu recorrido, paso a paso, desde el amanecer hasta el video en tu teléfono"
            en="Your day, step by step, from sunrise to the video on your phone"
          />
        </h2>
        <ul className="steps" ref={listRef}>
          {steps.map((s, i) => (
            <li className="step" key={s.time}>
              <div className="step-dot">{String(i + 1).padStart(2, "0")}</div>
              <div className="step-body">
                <time>{s.time}</time>
                <h3>
                  <T es={s.es} en={s.en} />
                </h3>
                <p>
                  <T es={s.descEs} en={s.descEn} />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
