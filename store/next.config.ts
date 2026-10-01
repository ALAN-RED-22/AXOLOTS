import type { NextConfig } from "next";

// Cabeceras de seguridad aplicadas a todo el sitio. Cloudflare ya agrega HSTS
// en el borde para el dominio custom, pero declararlo aquí también deja el
// comportamiento correcto si algún día se sirve desde otro lado.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      // Default de Next es 1MB — muy poco para una foto de celular (ver
      // src/lib/r2.ts, que ya valida su propio tope de 8MB más abajo).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
