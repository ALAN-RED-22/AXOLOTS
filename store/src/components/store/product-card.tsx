import Link from "next/link";
import { formatMXN, formatUSDApprox } from "@/lib/money";

export type ProductCardData = {
  slug: string;
  nameEs: string;
  priceCents: number;
  imageUrl?: string;
  inStock: boolean;
  lowStock: boolean;
  totalOnHand: number;
  usdRate: number;
};

export function ProductCard(p: ProductCardData) {
  return (
    <Link
      href={`/tienda/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition hover:border-[var(--adobe)] hover:shadow-md"
    >
      <div className="aspect-[4/5] w-full overflow-hidden bg-stone-100">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- fotos de producto vienen de un dominio externo (Blob/Cloudinary) a definir
          <img
            src={p.imageUrl}
            alt={p.nameEs}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">Sin foto</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-sm font-semibold text-[var(--obsidian)]">{p.nameEs}</h3>
        <p className="text-base font-bold text-[var(--adobe-dark)]">
          {formatMXN(p.priceCents)}{" "}
          <span className="text-xs font-normal text-stone-400">≈ {formatUSDApprox(p.priceCents, p.usdRate)}</span>
        </p>
        {!p.inStock ? (
          <span className="text-xs font-medium text-stone-400">Agotado</span>
        ) : p.lowStock ? (
          <span className="text-xs font-medium text-[var(--adobe)]">Quedan {p.totalOnHand}</span>
        ) : null}
      </div>
    </Link>
  );
}
