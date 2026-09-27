import { T } from "./lang";
import { SocialLinks } from "./social-links";

const links = [
  { href: "#taller", es: "Artesanías", en: "Crafts" },
  { href: "#axolotes", es: "Axolotes", en: "Axolotls" },
  { href: "#dron", es: "Dron", en: "Drone" },
  { href: "#ubicacion", es: "Ubicación", en: "Location" },
];

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="logo">
            <span className="logo-text">
              AXOLOTS <span>Teotihuacán</span>
            </span>
          </div>
          <div className="foot-right">
            <div className="foot-links">
              {links.map((l) => (
                <a key={l.href} href={l.href}>
                  <T es={l.es} en={l.en} />
                </a>
              ))}
            </div>
            <SocialLinks />
          </div>
        </div>
        <p className="fine">
          <T
            es="No lucramos con los ajolotes. Nuestra labor se centra en su preservación y educación ambiental, exhibiendo únicamente un número limitado de ejemplares en óptimas condiciones de bienestar, salud e higiene. Contamos con los permisos municipales correspondientes."
            en="We do not profit from the axolotls. Our work focuses on their preservation and environmental education, exhibiting only a limited number of specimens in optimal conditions of welfare, health, and hygiene. We hold the corresponding municipal permits."
          />
        </p>
      </div>
    </footer>
  );
}
