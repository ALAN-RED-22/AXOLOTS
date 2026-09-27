import { T } from "./lang";

const facts = [
  { labelEs: "Nombre científico", labelEn: "Scientific name", es: "Ambystoma mexicanum", en: "Ambystoma mexicanum" },
  { labelEs: "Estado de conservación", labelEn: "Conservation status", es: "En peligro crítico", en: "Critically endangered" },
  { labelEs: "Su particularidad", labelEn: "What makes it unique", es: "Regenera extremidades completas", en: "Regenerates entire limbs" },
  { labelEs: "Origen", labelEn: "Origin", es: "Lagos de Xochimilco, CDMX", en: "Xochimilco Lakes, Mexico City" },
];

export function Axolotes() {
  return (
    <section className="axo" id="axolotes">
      <video className="axo-bg-video" src="/assets/video/videoquesonlosajolotes.mp4" preload="metadata" autoPlay muted loop playsInline />
      <div className="axo-overlay" />

      <div className="wrap axo-grid">
        <div>
          <p className="eyebrow">
            <T es="Exhibición viva" en="Live Exhibit" />
          </p>
          <h2>
            <T es="Ajolotes, no monstruos de acuario" en="Axolotls, Not Aquarium Monsters" />
          </h2>
          <p>
            <T
              es="Nuestro mirador alberga una exhibición dedicada al ajolote, especie originaria de los canales de Xochimilco y hoy en peligro crítico. Aquí se puede observar de cerca, entender su biología y por qué su conservación importa, sin flash y sin golpear el cristal."
              en="Our lookout hosts an exhibit dedicated to the axolotl, a species native to the canals of Xochimilco and now critically endangered. Here you can observe them up close, learn about their biology, and understand why their conservation matters — no flash photography, no tapping the glass."
            />
          </p>
          <div className="facts">
            {facts.map((f) => (
              <div key={f.labelEn}>
                <span>
                  <T es={f.labelEs} en={f.labelEn} />
                </span>
                <strong>
                  <T es={f.es} en={f.en} />
                </strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
