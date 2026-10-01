import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { listActiveProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/store/product-card";

export const dynamic = "force-dynamic"; // precio/stock siempre en vivo, no cachear esta página

export default async function TiendaPage() {
  const [db, env] = await Promise.all([getDb(), getEnv()]);
  const products = await listActiveProducts(db);

  if (products.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        Todavía no hay productos publicados. Vuelve pronto.
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-[var(--obsidian)]">Artesanías</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            slug={p.slug}
            nameEs={p.nameEs}
            priceCents={p.priceCents}
            imageUrl={p.images[0]?.url}
            inStock={p.availability.inStock}
            lowStock={p.availability.lowStock}
            totalOnHand={p.availability.totalOnHand}
            usdRate={env.USD_MXN_RATE}
          />
        ))}
      </div>
    </div>
  );
}
