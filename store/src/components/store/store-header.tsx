"use client";

import Link from "next/link";
import { useCart } from "./cart";

export function StoreHeader() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-[var(--paper)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-serif text-lg font-bold tracking-tight text-[var(--obsidian)]">
          AXOLOTS <span className="text-xs font-normal uppercase tracking-widest text-[var(--adobe-dark)]">Tienda</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[var(--obsidian)]">
          <Link href="/tienda" className="hover:text-[var(--adobe)]">
            Catálogo
          </Link>
          <Link href="/tienda/carrito" className="flex items-center gap-1.5 hover:text-[var(--adobe)]">
            Carrito
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--adobe)] px-1.5 text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
