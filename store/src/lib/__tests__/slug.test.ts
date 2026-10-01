import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("quita acentos y pasa a minúsculas", () => {
    expect(slugify("Obsidiana Tallada")).toBe("obsidiana-tallada");
  });

  it("maneja ñ y acentos juntos", () => {
    expect(slugify("Peña Cañón Árbol")).toBe("pena-canon-arbol");
  });

  it("colapsa separadores repetidos y recorta guiones en los extremos", () => {
    expect(slugify("  --Taza!!  de  Barro--  ")).toBe("taza-de-barro");
  });
});
