import type { Metadata, Viewport } from "next";
import { Fraunces, Karla, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const title = "AXOLOTS — Taller, Axolotes y Vuelos en Dron en Teotihuacán";

export const metadata: Metadata = {
  metadataBase: new URL("https://axolotsmx.com"),
  title,
  description:
    "Taller de artesanía hecha a mano, mirador con exhibición viva de axolotes y grabación por dron de tu vuelo en globo aerostático, a pasos de la Zona Arqueológica de Teotihuacán.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "AXOLOTS Teotihuacán",
    title,
    description:
      "Taller de artesanía hecha a mano, mirador con exhibición viva de axolotes y grabación por dron de tu vuelo en globo aerostático.",
    images: ["/assets/img/ax.png"],
  },
  twitter: { card: "summary_large_image", images: ["/assets/img/ax.png"] },
};

export const viewport: Viewport = {
  themeColor: "#1C1815",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${karla.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
