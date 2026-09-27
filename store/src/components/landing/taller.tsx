import { T } from "./lang";

const crafts = [
  { es: "Obsidiana tallada", en: "Carved Obsidian", descEs: "Espejos, puntas y figuras pulidas a mano a partir de piedra volcánica local.", descEn: "Mirrors, points, and figures hand-polished from local volcanic stone." },
  { es: "Textil de telar de cintura", en: "Backstrap Loom Textiles", descEs: "Fajas y tapetes tejidos con la técnica prehispánica de telar de cintura.", descEn: "Sashes and rugs woven using the pre-Hispanic backstrap loom technique." },
  { es: "Barro y cerámica", en: "Clay & Ceramics", descEs: "Piezas de barro cocido, decoradas a mano con motivos del valle.", descEn: "Fired clay pieces, hand-decorated with motifs from the valley." },
  { es: "Joyería en piedra volcánica", en: "Volcanic Stone Jewelry", descEs: "Aretes y collares en obsidiana, jade local y plata.", descEn: "Earrings and necklaces in obsidian, local jade, and silver." },
];

export function Taller() {
  return (
    <section className="taller" id="taller">
      <div className="wrap">
        <div className="taller-head">
          <p className="eyebrow">
            <T es="Taller y artesanías" en="Workshop & Crafts" />
          </p>
          <h2>
            <T
              es="Obsidiana, barro y telar, tal como se trabajan en el valle"
              en="Obsidian, Clay, and Weaving, Just as They're Made in the Valley"
            />
          </h2>
          <p>
            <T
              es="Cada pieza sale del mismo taller donde se hace: sin intermediarios, con las técnicas que se usan en la región desde hace generaciones."
              en="Every piece comes straight from the workshop where it's made — no middlemen, using techniques that have been practiced in the region for generations."
            />
          </p>
        </div>
        <div className="craft-grid">
          {crafts.map((c, i) => (
            <div className="craft-card" key={c.en}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <h3>
                <T es={c.es} en={c.en} />
              </h3>
              <p>
                <T es={c.descEs} en={c.descEn} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
