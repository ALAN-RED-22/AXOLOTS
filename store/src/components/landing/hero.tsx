import Image from "next/image";
import { T } from "./lang";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-sky">
        {["b1", "b2", "b3", "b4"].map((b) => (
          <Image key={b} className={`balloon ${b}`} src="/assets/img/globo4.gif" alt="" width={800} height={600} unoptimized />
        ))}
      </div>

      <div className="hero-grid">
        <div className="hero-content">
          <p className="eyebrow">
            <T es="A pasos de la Zona Arqueológica" en="Steps from the Archaeological Zone" />
          </p>
          <h1>
            <T
              es="Amanece con vista a las pirámides. Camina entre pirámides. Llévate Teotihuacán contigo."
              en="Wake up with a view of the pyramids. Walk among pyramids. Take Teotihuacán with you."
            />
          </h1>
          <p>
            <T
              es="Taller de artesanía hecha a mano, un mirador con exhibición viva de axolotes, y grabación por dron de tu vuelo en globo aerostático, editada y lista antes de que te vayas."
              en="A workshop of handmade crafts, a lookout with a live axolotl exhibit, and drone footage of your hot air balloon flight, edited and ready before you leave."
            />
          </p>
          <div className="cta-row">
            <a href="#dron" className="btn btn-primary">
              <T es="Reservar grabación de vuelo" en="Book your drone recording" />
            </a>
            <a href="#taller" className="btn btn-secondary">
              <T es="Conocer el santuario estilo Teocalpan" en="Discover our Teocalpan-style sanctuary" />
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <video src="/assets/video/recorridocuatris.mp4" preload="metadata" autoPlay muted loop playsInline />
        </div>
      </div>

      <div className="talud" aria-hidden="true">
        <svg viewBox="0 0 400 70" preserveAspectRatio="none" width="100%" height="70">
          <polygon points="0,70 400,70 400,50 340,50 340,32 280,32 280,14 240,14 240,0 200,0 200,14 160,14 160,32 100,32 100,50 40,50 40,70" fill="#1C1815" />
        </svg>
      </div>
    </section>
  );
}
