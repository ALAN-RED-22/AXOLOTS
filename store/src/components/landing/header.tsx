"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { T, useLang } from "./lang";
import { SocialLinks } from "./social-links";

const links = [
  { href: "#taller", es: "Tienda", en: "Shop" },
  { href: "#axolotes", es: "Axolotes", en: "Axolotls" },
  { href: "#dron", es: "Vuelos en dron", en: "Drone Flights" },
  { href: "#ubicacion", es: "Ubicación", en: "Location" },
];

export function Header() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);

  // si la ventana crece a tamaño de escritorio, cerrar el menú móvil
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 820) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header>
      <nav>
        <div className="logo">
          <Image src="/assets/img/logo.png" alt="Logo AXOLOTS" className="logo-img" width={1264} height={843} unoptimized priority />
          <div className="logo-text">
            AXOLOTS{" "}
            <span>
              <T es="Zona Arqueológica de Teotihuacán" en="Teotihuacán Archaeological Zone" />
            </span>
          </div>
        </div>
        <div className={`navlinks${open ? " open" : ""}`}>
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              <T es={l.es} en={l.en} />
            </a>
          ))}
        </div>
        <SocialLinks />
        <div className="lang-switch">
          {(["es", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              className={`lang-btn${lang === code ? " active" : ""}`}
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`menu-toggle${open ? " open" : ""}`}
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg className="icon-burger" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <svg className="icon-close" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>
      </nav>
    </header>
  );
}
