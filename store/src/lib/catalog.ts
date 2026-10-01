import { and, asc, eq, isNull, lte, or, sql } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { productImages, productVariants, products } from "@/db/schema";

const isVisible = and(
  eq(products.status, "active"),
  or(isNull(products.dropAt), lte(products.dropAt, new Date())),
);

export type CatalogProduct = Awaited<ReturnType<typeof listActiveProducts>>[number];

/** Catálogo público: productos activos y, si son "drop" de temporada, ya liberados. */
export async function listActiveProducts(db: Db) {
  const rows = await db.query.products.findMany({
    where: isVisible,
    orderBy: [asc(products.category), asc(products.createdAt)],
    with: {
      images: { orderBy: [asc(productImages.position)], limit: 1 },
      variants: true,
    },
  });
  return rows.map((p) => ({ ...p, availability: summarizeAvailability(p.variants) }));
}

export async function getProductBySlug(db: Db, slug: string) {
  const row = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), isVisible),
    with: {
      images: { orderBy: [asc(productImages.position)] },
      variants: true,
    },
  });
  if (!row) return null;
  return { ...row, availability: summarizeAvailability(row.variants) };
}

/** Disponible por variante = on_hand - reservas activas no vencidas. Consulta en vivo, no cacheada. */
export async function getVariantAvailability(db: Db, variantId: string): Promise<number> {
  const result = await db.execute<{ available: number }>(sql`
    SELECT
      v.on_hand - COALESCE((
        SELECT SUM(r.quantity) FROM stock_reservations r
        WHERE r.variant_id = v.id AND r.status = 'active' AND r.expires_at > now()
      ), 0) AS available
    FROM product_variants v
    WHERE v.id = ${variantId}::uuid
  `);
  const row = result.rows[0];
  return row ? Number(row.available) : 0;
}

function summarizeAvailability(variants: (typeof productVariants.$inferSelect)[]) {
  // Nota: esto refleja `on_hand` sin descontar reservas activas — es la vista de
  // catálogo (listados/tarjetas), donde una lectura "pesimista por segundo" no vale
  // el costo de una subquery por variante. El número exacto y en vivo (con reservas
  // descontadas) se recalcula siempre en `getVariantAvailability`, que es la que
  // manda al agregar al carrito o crear el checkout — ahí sí importa que sea exacto.
  const totalOnHand = variants.reduce((acc, v) => acc + v.onHand, 0);
  return {
    inStock: totalOnHand > 0,
    lowStock: totalOnHand > 0 && totalOnHand <= 3,
    totalOnHand,
  };
}
