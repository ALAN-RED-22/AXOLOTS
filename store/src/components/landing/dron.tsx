import { T } from "./lang";
import { Pricing } from "./pricing";

export function Dron() {
  return (
    <section className="dron" id="dron">
      <div className="wrap dron-grid">
        <div>
          <p className="eyebrow">
            <T es="Grabación por dron" en="Drone Recording" />
          </p>
          <h2>
            <T es="Tu vuelo en globo, visto desde arriba" en="Your Balloon Flight, Seen From Above" />
          </h2>
          <p>
            <T
              es="Volamos un dron durante tu ascenso en globo aerostático y grabamos el momento completo: el despegue, el valle y las pirámides desde el aire, y tu propia canastilla en vuelo."
              en="We fly a drone during your hot air balloon ascent and capture the full moment: takeoff, the valley, and the pyramids from the air — plus your own basket in flight."
            />
          </p>
          <p>
            <T es="Entrega el mismo día, antes de que salgas de la zona." en="Delivered the same day, before you leave the area." />
          </p>
          <p>
            <T
              es="La grabación por dron es exclusiva del Paquete Axolots — mira abajo."
              en="Drone footage is exclusive to the Axolots Package — see below."
            />
          </p>
        </div>
        <Pricing />
      </div>
    </section>
  );
}
