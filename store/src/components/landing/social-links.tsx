import { InstagramIcon, WhatsAppIcon } from "./icons";
import { WHATSAPP_URL } from "./site";

export function SocialLinks() {
  return (
    <div className="social-links">
      {/* TODO: reemplazar "#" por la URL real de Instagram cuando exista la cuenta */}
      <a className="social-link" href="#" aria-label="Instagram" target="_blank" rel="noopener">
        <InstagramIcon />
      </a>
      <a className="social-link" href={WHATSAPP_URL} aria-label="WhatsApp" target="_blank" rel="noopener">
        <WhatsAppIcon />
      </a>
    </div>
  );
}
