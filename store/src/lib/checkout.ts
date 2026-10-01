import { eq, inArray } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { orderItems, orders, productVariants } from "@/db/schema";
import { releaseReservation, reserveStock } from "@/lib/inventory";
import { getVariantAvailability } from "@/lib/catalog";
import type { PaymentProvider } from "@/lib/payments/provider";
import { STRIPE_MIN_SESSION_MINUTES } from "@/lib/payments/stripe";
import { calculateShippingCents } from "@/lib/shipping";
import type { CheckoutRequest } from "@/lib/schemas";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; status: 404 | 409 | 422; error: string; variantId?: string };

const RESERVATION_MINUTES = STRIPE_MIN_SESSION_MINUTES;

/**
 * Orquesta la creación de un pedido + checkout. Nunca confía en precios ni
 * disponibilidad que venga del cliente: todo se vuelve a leer de la base de
 * datos aquí. Ver `src/lib/inventory.ts` para por qué la reserva de stock usa
 * compensación manual en vez de una transacción (el driver HTTP de Neon no
 * soporta transacciones interactivas).
 */
export async function createCheckout(
  db: Db,
  provider: PaymentProvider,
  siteUrl: string,
  input: CheckoutRequest,
): Promise<CheckoutResult> {
  const variantIds = input.items.map((i) => i.variantId);
  const variants = await db.query.productVariants.findMany({
    where: inArray(productVariants.id, variantIds),
    with: { product: true },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  // Valida que todas las variantes existan y pertenezcan a un producto activo
  // ANTES de reservar nada.
  for (const item of input.items) {
    const variant = byId.get(item.variantId);
    if (!variant || variant.product.status !== "active") {
      return { ok: false, status: 404, error: "Producto no disponible", variantId: item.variantId };
    }
  }

  // Disponibilidad en vivo (descuenta reservas activas de otros carritos en curso).
  for (const item of input.items) {
    const available = await getVariantAvailability(db, item.variantId);
    if (available < item.quantity) {
      return { ok: false, status: 409, error: "Sin stock suficiente", variantId: item.variantId };
    }
  }

  const lineItems = input.items.map((item) => {
    const variant = byId.get(item.variantId)!;
    const unitPriceCents = variant.priceCents ?? variant.product.priceCents;
    const name = input.locale === "en" ? variant.product.nameEn : variant.product.nameEs;
    return {
      variantId: item.variantId,
      sku: variant.sku,
      name: variant.labelEs === "Único" ? name : `${name} — ${variant.labelEs}`,
      quantity: item.quantity,
      unitPriceCents,
      weightG: variant.product.weightG,
    };
  });

  const subtotalCents = lineItems.reduce((acc, li) => acc + li.unitPriceCents * li.quantity, 0);
  const totalWeightG = lineItems.reduce((acc, li) => acc + li.weightG * li.quantity, 0);
  const shippingCents = calculateShippingCents(input.shippingMethod, totalWeightG);
  const totalCents = subtotalCents + shippingCents;

  const orderId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000);

  const [order] = await db
    .insert(orders)
    .values({
      id: orderId,
      email: input.email,
      phone: input.phone,
      locale: input.locale,
      subtotalCents,
      shippingCents,
      totalCents,
      shippingMethod: input.shippingMethod,
      shippingAddress: input.shippingAddress ?? null,
    })
    .returning({ id: orders.id, number: orders.number });

  await db.insert(orderItems).values(
    lineItems.map((li) => ({
      orderId,
      variantId: li.variantId,
      name: li.name,
      sku: li.sku,
      unitPriceCents: li.unitPriceCents,
      quantity: li.quantity,
    })),
  );

  // Reserva de stock ítem por ítem (cada una es su propia sentencia atómica,
  // ver reserveStock). Si alguna falla, se liberan las que ya se lograron y se
  // cancela el pedido — no queda stock fantasma reservado.
  const reservedSoFar: string[] = [];
  for (const li of lineItems) {
    const reserved = await reserveStock(db, {
      variantId: li.variantId,
      orderId,
      quantity: li.quantity,
      expiresAt,
    });
    if (!reserved) {
      await releaseReservation(db, orderId);
      await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
      return { ok: false, status: 409, error: "Sin stock suficiente", variantId: li.variantId };
    }
    reservedSoFar.push(li.variantId);
  }

  try {
    const session = await provider.createCheckoutSession({
      orderId,
      orderNumber: order.number,
      email: input.email,
      items: lineItems.map((li) => ({
        name: li.name,
        quantity: li.quantity,
        unitPriceCents: li.unitPriceCents,
      })),
      shippingCents,
      expiresAt,
      successUrl: `${siteUrl}/tienda/exito?order=${order.number}`,
      cancelUrl: `${siteUrl}/tienda/carrito?cancelado=1`,
    });

    await db
      .update(orders)
      .set({ paymentProvider: provider.name, paymentRef: session.providerRef })
      .where(eq(orders.id, orderId));

    return { ok: true, url: session.url };
  } catch (err) {
    // El proveedor de pago falló después de reservar stock: liberar y cancelar,
    // igual que en el caso de sin-stock, para no dejar reservas colgadas.
    await releaseReservation(db, orderId);
    await db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, orderId));
    throw err;
  }
}
