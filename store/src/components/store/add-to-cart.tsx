"use client";

import { useState } from "react";
import { useCart } from "./cart";

export type VariantOption = {
  id: string;
  labelEs: string;
  priceCents: number;
  onHand: number;
};

export function AddToCart({
  productSlug,
  productName,
  imageUrl,
  variants,
}: {
  productSlug: string;
  productName: string;
  imageUrl?: string;
  variants: VariantOption[];
}) {
  const { addLine } = useCart();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [added, setAdded] = useState(false);
  const selected = variants.find((v) => v.id === variantId);
  const hasStock = (selected?.onHand ?? 0) > 0;

  return (
    <div className="flex flex-col gap-3">
      {variants.length > 1 && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-[var(--obsidian)]">Presentación</span>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.onHand <= 0}>
                {v.labelEs} {v.onHand <= 0 ? "— agotado" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        disabled={!selected || !hasStock}
        onClick={() => {
          if (!selected) return;
          addLine({
            variantId: selected.id,
            productSlug,
            name: productName,
            label: selected.labelEs,
            unitPriceCents: selected.priceCents,
            imageUrl,
          });
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className="rounded-md bg-[var(--adobe)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {!hasStock ? "Agotado" : added ? "Agregado ✓" : "Agregar al carrito"}
      </button>
    </div>
  );
}
