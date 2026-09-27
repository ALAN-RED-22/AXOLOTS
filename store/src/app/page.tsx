import "./landing.css";
import { Axolotes } from "@/components/landing/axolotes";
import { Day } from "@/components/landing/day";
import { Dron } from "@/components/landing/dron";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { WhatsAppIcon } from "@/components/landing/icons";
import { LangProvider } from "@/components/landing/lang";
import { WHATSAPP_URL } from "@/components/landing/site";
import { Taller } from "@/components/landing/taller";
import { Ubicacion } from "@/components/landing/ubicacion";

export default function Home() {
  return (
    <LangProvider>
      <Header />
      <Hero />
      <Day />
      <Axolotes />
      <Taller />
      <Dron />
      <Ubicacion />
      <Footer />
      <a className="whatsapp-float" href={WHATSAPP_URL} aria-label="WhatsApp" target="_blank" rel="noopener">
        <WhatsAppIcon />
      </a>
    </LangProvider>
  );
}
