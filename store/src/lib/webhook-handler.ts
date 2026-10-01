import { and, eq } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { orders, paymentEvents } from "@/db/schema";
import { convertReservation, releaseReservation } from "@/lib/inventory";
import type { PaymentProvider } from "@/lib/payments/provider";

const POSTGRES_UNIQUE_VIOLATION = "23505";

export type WebhookOutcome = { status: number; body: string };

/**
 * Handler de webhook de pago, independiente de Next/Workers (solo texto crudo
 * + header de firma entran, un {status, body} sale) para poder probarlo sin
 * levantar un servidor HTTP real.
 *
 * Idempotencia: `payment_events` tiene un índice único (provider, event_id).
 * Insertamos el evento ANTES de aplicar ningún efecto; si el insert choca por
 * duplicado, es un reintento de un evento ya procesado y se responde 200 sin
 * tocar nada más. El `WHERE status = 'pending'` en el UPDATE de la orden es una
 * segunda red de seguridad independiente contra el mismo problema.
 */
export async function handleStripeWebhook(
  db: Db,
  provider: PaymentProvider,
  rawBody: string,
  signatureHeader: string | null,
): Promise<WebhookOutcome> {
  let parsed;
  try {
    parsed = await provider.parseWebhook(rawBody, signatureHeader);
  } catch {
    return { status: 400, body: "firma inválida" };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = null;
  }

  try {
    await db.insert(paymentEvents).values({
      provider: provider.name,
      eventId: parsed.eventId,
      type: parsed.type,
      payload,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { status: 200, body: "evento duplicado, ya procesado" };
    }
    throw err;
  }

  switch (parsed.event.kind) {
    case "checkout_completed":
      await db
        .update(orders)
        .set({ status: "paid", paidAt: new Date() })
        .where(and(eq(orders.id, parsed.event.orderId), eq(orders.status, "pending")));
      await convertReservation(db, parsed.event.orderId);
      break;
    case "checkout_expired":
      await releaseReservation(db, parsed.event.orderId);
      await db
        .update(orders)
        .set({ status: "cancelled" })
        .where(and(eq(orders.id, parsed.event.orderId), eq(orders.status, "pending")));
      break;
    case "ignored":
      break;
  }

  await db
    .update(paymentEvents)
    .set({ processedAt: new Date() })
    .where(and(eq(paymentEvents.provider, provider.name), eq(paymentEvents.eventId, parsed.eventId)));

  return { status: 200, body: "ok" };
}

/**
 * Drizzle envuelve el error real de Postgres en un `DrizzleQueryError` cuyo
 * `.code` es `undefined` — el código real (`23505` para violación de unicidad)
 * vive en `.cause`. Confirmado con una prueba de extremo a extremo real contra
 * Neon (reenviando el mismo evento de Stripe dos veces): sin recorrer `.cause`,
 * un webhook duplicado devolvía 500 en vez de 200, porque el catch de más
 * abajo nunca reconocía el error como duplicado y lo relanzaba.
 */
export function isUniqueViolation(err: unknown): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current; depth++) {
    if (
      typeof current === "object" &&
      "code" in current &&
      (current as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    ) {
      return true;
    }
    current = typeof current === "object" && current !== null && "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }
  return false;
}
