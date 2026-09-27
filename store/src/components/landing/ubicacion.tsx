import { T } from "./lang";
import { WHATSAPP_URL } from "./site";

const MAP_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d558.3719966909579!2d-98.84111751134111!3d19.701377856353453!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1eb006f91bbff%3A0x9d18523aae0554da!2sSan%20mart%C3%ADn%20de%20las%20pir%C3%A1mides!5e0!3m2!1ses-419!2smx!4v1785082818864!5m2!1ses-419!2smx";

export function Ubicacion() {
  return (
    <section className="ubica" id="ubicacion">
      <div className="wrap ubica-grid">
        <div>
          <p className="eyebrow">
            <T es="Cómo llegar" en="How to Get Here" />
          </p>
          <h2>
            <T
              es="A unos metros de la Zona Arqueológica de Teotihuacán"
              en="Steps from the Teotihuacán Archaeological Zone"
            />
          </h2>
          <p>
            <T
              es="Fácil de encontrar al salir de la zona, con mirador propio y estacionamiento."
              en="Easy to find right outside the site, with our own lookout and parking."
            />
          </p>
          <div className="infolist">
            <div>
              <span>
                <T es="Dirección" en="Address" />
              </span>
              <span>Bernal Díaz del Castillo, 55850 San Martín de las Pirámides, Méx.</span>
            </div>
            <div>
              <span>
                <T es="Horario" en="Hours" />
              </span>
              <span>
                <T es="10am-4pm Todos los días" en="10am-4pm Every day" />
              </span>
            </div>
            <div>
              <span>
                <T es="Teléfono / WhatsApp" en="Phone / WhatsApp" />
              </span>
              <span>
                <a href="tel:+525527735718">+52 55 2773 5718</a> ·{" "}
                <a href={WHATSAPP_URL} target="_blank" rel="noopener">
                  WhatsApp
                </a>
              </span>
            </div>
            <div>
              <span>
                <T es="Reservas" en="Reservations" />
              </span>
              <span>
                <T es="Confirma y paga por WhatsApp" en="Confirm and pay via WhatsApp" />
              </span>
            </div>
          </div>
        </div>
        <div className="map-box">
          <iframe
            src={MAP_SRC}
            title="Mapa: AXOLOTS en San Martín de las Pirámides"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
