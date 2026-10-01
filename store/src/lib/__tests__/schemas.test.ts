import { describe, expect, it } from "vitest";
import { checkoutRequestSchema } from "@/lib/schemas";

const baseItem = { variantId: "123e4567-e89b-12d3-a456-426614174000", quantity: 1 };

describe("checkoutRequestSchema", () => {
  it("acepta un pedido válido con recoger en el local", () => {
    const result = checkoutRequestSchema.safeParse({
      email: "cliente@example.com",
      phone: "+525512345678",
      shippingMethod: "pickup",
      items: [baseItem],
    });
    expect(result.success).toBe(true);
  });

  it("rechaza envío nacional sin dirección", () => {
    const result = checkoutRequestSchema.safeParse({
      email: "cliente@example.com",
      phone: "+525512345678",
      shippingMethod: "national",
      items: [baseItem],
    });
    expect(result.success).toBe(false);
  });

  it("acepta envío nacional con dirección completa", () => {
    const result = checkoutRequestSchema.safeParse({
      email: "cliente@example.com",
      phone: "+525512345678",
      shippingMethod: "national",
      shippingAddress: {
        name: "Ana Pérez",
        line1: "Calle 1 #23",
        colonia: "Centro",
        city: "San Martín de las Pirámides",
        state: "México",
        postalCode: "55850",
      },
      items: [baseItem],
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un correo con formato inválido", () => {
    const result = checkoutRequestSchema.safeParse({
      email: "no-es-un-correo",
      phone: "+525512345678",
      shippingMethod: "pickup",
      items: [baseItem],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un variantId que no es uuid (posible intento de inyección/manipulación)", () => {
    const result = checkoutRequestSchema.safeParse({
      email: "cliente@example.com",
      phone: "+525512345678",
      shippingMethod: "pickup",
      items: [{ variantId: "'; DROP TABLE products; --", quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza cantidades no positivas", () => {
    const result = checkoutRequestSchema.safeParse({
      email: "cliente@example.com",
      phone: "+525512345678",
      shippingMethod: "pickup",
      items: [{ variantId: baseItem.variantId, quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un carrito vacío", () => {
    const result = checkoutRequestSchema.safeParse({
      email: "cliente@example.com",
      phone: "+525512345678",
      shippingMethod: "pickup",
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un código postal con letras", () => {
    const result = checkoutRequestSchema.safeParse({
      email: "cliente@example.com",
      phone: "+525512345678",
      shippingMethod: "national",
      shippingAddress: {
        name: "Ana Pérez",
        line1: "Calle 1 #23",
        colonia: "Centro",
        city: "San Martín de las Pirámides",
        state: "México",
        postalCode: "ABCDE",
      },
      items: [baseItem],
    });
    expect(result.success).toBe(false);
  });
});
