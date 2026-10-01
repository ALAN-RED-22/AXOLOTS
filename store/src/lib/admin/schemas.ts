import { z } from "zod";

// Debe calzar exactamente con los enums de src/db/schema.ts.
export const categorySchema = z.enum([
  "obsidiana",
  "textil",
  "cuero",
  "minerales",
  "recuerdos",
  "ropa",
  "sombreros",
]);
export const productKindSchema = z.enum(["standard", "unique"]);
export const productStatusSchema = z.enum(["draft", "active", "archived"]);

// Los formularios HTML siempre mandan strings — este schema convierte y valida
// en un solo paso. Los precios se escriben en pesos (ej. "199.00") y se
// guardan en centavos; nunca se manejan como float en ningún otro lugar.
export const productFormSchema = z.object({
  nameEs: z.string().trim().min(1, "falta el nombre en español").max(200),
  nameEn: z.string().trim().min(1, "falta el nombre en inglés").max(200),
  descriptionEs: z.string().trim().max(2000).default(""),
  descriptionEn: z.string().trim().max(2000).default(""),
  origin: z.string().trim().max(200).optional(),
  category: categorySchema,
  kind: productKindSchema,
  priceMxn: z.coerce.number().positive("el precio debe ser mayor a 0"),
  weightG: z.coerce.number().int().positive(),
  lengthMm: z.coerce.number().int().positive(),
  widthMm: z.coerce.number().int().positive(),
  heightMm: z.coerce.number().int().positive(),
  fragile: z.coerce.boolean().default(false),
  // stock inicial de la variante única que se crea junto con el producto
  initialStock: z.coerce.number().int().nonnegative(),
});

export const productUpdateSchema = productFormSchema.omit({ initialStock: true }).extend({
  status: productStatusSchema,
});

export const variantFormSchema = z.object({
  labelEs: z.string().trim().min(1).max(100),
  labelEn: z.string().trim().min(1).max(100),
  sku: z.string().trim().min(1).max(100),
  // vacío = usa el precio del producto (ver product_variants.price_cents: null)
  priceMxn: z
    .union([z.literal(""), z.coerce.number().positive()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  onHand: z.coerce.number().int().nonnegative(),
});
