import { afterEach, describe, expect, it, vi } from "vitest";
import { resizedImageUrl } from "@/lib/r2";

/**
 * Regresión de un bug real encontrado en una prueba end-to-end con Chrome
 * headless: `/cdn-cgi/image/...` lo resuelve el borde de Cloudflare, no existe
 * en `next dev` local (404 confirmado) — sin este fix, toda foto de producto
 * se veía rota mientras se administra el catálogo en local.
 */
describe("resizedImageUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("en producción, envuelve la URL con el proxy de redimensionado de Cloudflare", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(resizedImageUrl("/cdn/productos/a/b.jpg", { width: 160 })).toBe(
      "/cdn-cgi/image/width=160,quality=80,format=auto/cdn/productos/a/b.jpg",
    );
  });

  it("fuera de producción, devuelve la URL tal cual (/cdn-cgi/image/ no existe en next dev)", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(resizedImageUrl("/cdn/productos/a/b.jpg", { width: 160 })).toBe("/cdn/productos/a/b.jpg");
  });
});
