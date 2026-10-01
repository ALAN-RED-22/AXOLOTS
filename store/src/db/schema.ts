import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Todos los importes se guardan en centavos de MXN (enteros, nunca decimales).

export const categoryEnum = pgEnum("category", [
  "obsidiana",
  "textil",
  "cuero",
  "minerales",
  "recuerdos", // llavero, pin, taza, imán
  "ropa",
  "sombreros",
]);

// standard = repetible con inventario chico; unique = pieza única de un "drop"
export const productKindEnum = pgEnum("product_kind", ["standard", "unique"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending", // creado, esperando pago
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);
export const paymentProviderEnum = pgEnum("payment_provider", ["stripe", "mercadopago"]);
export const shippingMethodEnum = pgEnum("shipping_method", ["national", "pickup", "local"]);
export const reservationStatusEnum = pgEnum("reservation_status", [
  "active",
  "converted", // el pago se confirmó, el stock se descontó
  "released", // expiró o se canceló
]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    category: categoryEnum("category").notNull(),
    kind: productKindEnum("kind").notNull().default("standard"),
    status: productStatusEnum("status").notNull().default("draft"),
    nameEs: text("name_es").notNull(),
    nameEn: text("name_en").notNull(),
    descriptionEs: text("description_es").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    origin: text("origin"), // artesano o taller
    priceCents: integer("price_cents").notNull(),
    // Para el cálculo de envío por peso volumétrico
    weightG: integer("weight_g").notNull(),
    lengthMm: integer("length_mm").notNull(),
    widthMm: integer("width_mm").notNull(),
    heightMm: integer("height_mm").notNull(),
    fragile: boolean("fragile").notNull().default(false),
    // Solo para kind = 'unique': fecha en que se publica el drop
    dropAt: timestamp("drop_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("products_price_positive", sql`${t.priceCents} > 0`),
    index("products_catalog_idx").on(t.status, t.category),
  ],
);

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altEs: text("alt_es").notNull().default(""),
  altEn: text("alt_en").notNull().default(""),
  position: integer("position").notNull().default(0),
});

// Un producto sin tallas tiene una sola variante. La ropa y el sombrero, una por talla.
// El stock vive aquí: es lo que se vende y se agota.
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    labelEs: text("label_es").notNull().default("Único"),
    labelEn: text("label_en").notNull().default("One size"),
    priceCents: integer("price_cents"), // null = usa el precio del producto
    onHand: integer("on_hand").notNull().default(0), // piezas físicas disponibles
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("variants_on_hand_nonnegative", sql`${t.onHand} >= 0`),
    index("variants_product_idx").on(t.productId),
  ],
);

// Reserva temporal (~15 min) mientras el cliente paga. Stock disponible =
// on_hand - SUM(quantity) de reservas activas no vencidas.
export const stockReservations = pgTable(
  "stock_reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    status: reservationStatusEnum("status").notNull().default("active"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("reservations_quantity_positive", sql`${t.quantity} > 0`),
    index("reservations_active_idx").on(t.variantId, t.status, t.expiresAt),
  ],
);

export type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string;
  colonia: string;
  city: string;
  state: string;
  postalCode: string;
  reference?: string;
};

// Datos para facturar, solo si el cliente pidió CFDI (se emite a mano al inicio)
export type InvoiceRequest = {
  rfc: string;
  legalName: string;
  taxRegime: string;
  postalCode: string;
  cfdiUse: string;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Número legible para el cliente (AX-1001). Se asigna con una secuencia en la migración.
    number: integer("number").notNull().generatedAlwaysAsIdentity({ startWith: 1001 }),
    status: orderStatusEnum("status").notNull().default("pending"),
    email: text("email").notNull(),
    phone: text("phone").notNull(), // WhatsApp para avisos de envío
    locale: text("locale").notNull().default("es"),

    paymentProvider: paymentProviderEnum("payment_provider"),
    paymentRef: text("payment_ref"), // id de sesión/pago en el proveedor
    paidAt: timestamp("paid_at", { withTimezone: true }),

    subtotalCents: integer("subtotal_cents").notNull(),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),

    shippingMethod: shippingMethodEnum("shipping_method").notNull(),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(), // null si pickup
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),

    invoiceRequest: jsonb("invoice_request").$type<InvoiceRequest>(),
    utm: jsonb("utm").$type<Record<string, string>>(), // atribución de anuncios en redes

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.number),
    uniqueIndex("orders_payment_ref_idx").on(t.paymentProvider, t.paymentRef),
    index("orders_status_idx").on(t.status, t.createdAt),
    check("orders_total_matches", sql`${t.totalCents} = ${t.subtotalCents} + ${t.shippingCents}`),
  ],
);

// Snapshot de nombre y precio al momento de comprar (el catálogo puede cambiar después)
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => productVariants.id),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  quantity: integer("quantity").notNull(),
});

// Bitácora de webhooks. La unicidad (provider, event_id) hace idempotente el procesamiento:
// si Stripe o Mercado Pago reenvían el mismo evento, el insert falla y no se procesa dos veces.
export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: paymentProviderEnum("provider").notNull(),
    eventId: text("event_id").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("payment_events_dedupe_idx").on(t.provider, t.eventId)],
);

// "Avísame cuando haya" para productos agotados
export const backInStockRequests = pgTable(
  "back_in_stock_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    locale: text("locale").notNull().default("es"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("back_in_stock_dedupe_idx").on(t.variantId, t.email)],
);

// Tarifa fija de entrega local por código postal
export const localDeliveryZones = pgTable("local_delivery_zones", {
  postalCode: text("postal_code").primaryKey(),
  feeCents: integer("fee_cents").notNull(),
  active: boolean("active").notNull().default(true),
});

// Relaciones (solo metadata de Drizzle para `db.query.*.findMany({ with: ... })`;
// no generan cambios de esquema en la base de datos, no requieren migración).
export const productsRelations = relations(products, ({ many }) => ({
  images: many(productImages),
  variants: many(productVariants),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  reservations: many(stockReservations),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  reservations: many(stockReservations),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(productVariants, { fields: [orderItems.variantId], references: [productVariants.id] }),
}));

export const stockReservationsRelations = relations(stockReservations, ({ one }) => ({
  order: one(orders, { fields: [stockReservations.orderId], references: [orders.id] }),
  variant: one(productVariants, { fields: [stockReservations.variantId], references: [productVariants.id] }),
}));
