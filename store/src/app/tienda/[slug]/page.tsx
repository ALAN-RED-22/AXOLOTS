import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { getProductBySlug } from "@/lib/catalog";
import { formatMXN, formatUSDApprox } from "@/lib/money";
import { AddToCart } from "@/components/store/add-to-cart";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [db, env] = await Promise.all([getDb(), getEnv()]);
  const product = await getProductBySlug(db, slug);
  if (!product) notFound();

  const image = product.images[0]?.url;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-lg bg-stone-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.nameEs} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-stone-400">Sin foto</div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <h1 className="font-serif text-2xl font-bold text-[var(--obsidian)]">{product.nameEs}</h1>
        <p className="text-xl font-bold text-[var(--adobe-dark)]">
          {formatMXN(product.priceCents)}{" "}
          <span className="text-sm font-normal text-stone-400">
            ≈ {formatUSDApprox(product.priceCents, env.USD_MXN_RATE)}
          </span>
        </p>
        <p className="text-sm leading-relaxed text-stone-600">{product.descriptionEs}</p>
        {product.origin && <p className="text-xs text-stone-400">Origen: {product.origin}</p>}
        <AddToCart
          productSlug={product.slug}
          productName={product.nameEs}
          imageUrl={image}
          variants={product.variants.map((v) => ({
            id: v.id,
            labelEs: v.labelEs,
            priceCents: v.priceCents ?? product.priceCents,
            onHand: v.onHand,
          }))}
        />
      </div>
    </div>
  );
}
