import { sql } from "drizzle-orm";
import type { Db } from "@/lib/db";

/**
 * El driver HTTP de Neon (`drizzle-orm/neon-http`) no soporta transacciones
 * interactivas (BEGIN/COMMIT de varios round-trips) — cada llamada es una sola
 * sentencia. Por eso la reserva de stock se resuelve con UN SOLO `INSERT ...
 * SELECT ... WHERE` atómico: Postgres calcula la disponibilidad y decide si
 * insertar en la misma sentencia, sin ventana de carrera entre "leer stock" y
 * "reservar" aunque lleguen requests concurrentes para la misma variante.
 *
 * Disponible = on_hand - SUM(quantity) de reservas activas no vencidas.
 */
export async function reserveStock(
  db: Db,
  input: { variantId: string; orderId: string; quantity: number; expiresAt: Date },
): Promise<boolean> {
  const result = await db.execute(sql`
    INSERT INTO stock_reservations (variant_id, order_id, quantity, status, expires_at)
    SELECT ${input.variantId}::uuid, ${input.orderId}::uuid, ${input.quantity}, 'active', ${input.expiresAt.toISOString()}::timestamptz
    WHERE (
      SELECT on_hand FROM product_variants WHERE id = ${input.variantId}::uuid
    ) - COALESCE((
      SELECT SUM(quantity) FROM stock_reservations
      WHERE variant_id = ${input.variantId}::uuid AND status = 'active' AND expires_at > now()
    ), 0) >= ${input.quantity}
    RETURNING id
  `);
  return result.rows.length > 0;
}

/** Libera una reserva (expiró o el checkout se canceló) — no toca `on_hand`. */
export async function releaseReservation(db: Db, orderId: string): Promise<void> {
  await db.execute(sql`
    UPDATE stock_reservations
    SET status = 'released'
    WHERE order_id = ${orderId}::uuid AND status = 'active'
  `);
}

/**
 * Convierte la reserva en venta firme: descuenta `on_hand` de verdad y marca
 * la reserva como convertida. Se llama solo desde el webhook, después de que
 * el evento de pago pasó la deduplicación (ver `payment_events`). El `WHERE
 * status = 'active'` hace que reintentos del mismo webhook sean no-ops en vez
 * de descontar dos veces.
 */
export async function convertReservation(db: Db, orderId: string): Promise<void> {
  await db.execute(sql`
    WITH converted AS (
      UPDATE stock_reservations
      SET status = 'converted'
      WHERE order_id = ${orderId}::uuid AND status = 'active'
      RETURNING variant_id, quantity
    )
    UPDATE product_variants v
    SET on_hand = v.on_hand - converted.quantity
    FROM converted
    WHERE v.id = converted.variant_id
  `);
}
