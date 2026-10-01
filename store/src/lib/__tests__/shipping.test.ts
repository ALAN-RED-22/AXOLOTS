import { describe, expect, it } from "vitest";
import { calculateShippingCents } from "@/lib/shipping";

describe("calculateShippingCents", () => {
  it("recoger en el local siempre es gratis, sin importar el peso", () => {
    expect(calculateShippingCents("pickup", 50_000)).toBe(0);
  });

  it("envío nacional ligero (<=500g) usa la tarifa más baja", () => {
    expect(calculateShippingCents("national", 500)).toBe(12000);
  });

  it("envío nacional mediano (<=2000g) usa la tarifa intermedia", () => {
    expect(calculateShippingCents("national", 1999)).toBe(18000);
  });

  it("envío nacional pesado (>2000g) usa la tarifa más alta", () => {
    expect(calculateShippingCents("national", 5000)).toBe(25000);
  });
});
