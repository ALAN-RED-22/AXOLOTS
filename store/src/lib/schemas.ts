import { z } from "zod";
import { implementedShippingMethods } from "@/lib/shipping";

export const shippingAddressSchema = z.object({
  name: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(160),
  line2: z.string().trim().max(160).optional(),
  colonia: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, "Código postal inválido"),
  reference: z.string().trim().max(200).optional(),
});

export const checkoutItemSchema = z.object({
  variantId: z.string().uuid(),
  // límite alto arbitrario, solo para frenar payloads absurdos, no una regla de negocio
  quantity: z.number().int().positive().max(20),
});

export const checkoutRequestSchema = z
  .object({
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(7).max(20),
    locale: z.enum(["es", "en"]).default("es"),
    shippingMethod: z.enum(implementedShippingMethods),
    shippingAddress: shippingAddressSchema.optional(),
    items: z.array(checkoutItemSchema).min(1).max(50),
  })
  .refine((d) => d.shippingMethod !== "national" || d.shippingAddress, {
    message: "shippingAddress es requerido para envío nacional",
    path: ["shippingAddress"],
  });

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
