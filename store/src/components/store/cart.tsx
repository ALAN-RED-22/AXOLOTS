"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = {
  variantId: string;
  productSlug: string;
  name: string;
  label: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl?: string;
};

type CartContextValue = {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clear: () => void;
  subtotalCents: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "axolots.cart.v1";

/**
 * El carrito vive en localStorage del navegador — es una conveniencia por
 * visitante, no la fuente de verdad del precio. El precio/stock real se
 * vuelve a leer de la base de datos en `/api/checkout` antes de cobrar nada;
 * si alguien manipula el carrito en el navegador no logra nada, solo ve un
 * error o un total distinto al intentar pagar.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Hidratación única desde localStorage: `window` no existe durante el SSR,
    // por eso esto tiene que vivir en un efecto (no en un lazy initializer de
    // useState) y solo corre una vez al montar en el cliente.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ver comentario arriba
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // localStorage puede fallar (modo privado, cuotas) — el carrito arranca vacío.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // idem — no es crítico si no se puede persistir.
    }
  }, [lines, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const addLine: CartContextValue["addLine"] = (line, quantity = 1) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.variantId === line.variantId);
        if (existing) {
          return prev.map((l) =>
            l.variantId === line.variantId ? { ...l, quantity: l.quantity + quantity } : l,
          );
        }
        return [...prev, { ...line, quantity }];
      });
    };
    const setQuantity: CartContextValue["setQuantity"] = (variantId, quantity) => {
      setLines((prev) =>
        quantity <= 0
          ? prev.filter((l) => l.variantId !== variantId)
          : prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
      );
    };
    const removeLine: CartContextValue["removeLine"] = (variantId) => {
      setLines((prev) => prev.filter((l) => l.variantId !== variantId));
    };
    const clear = () => setLines([]);
    const subtotalCents = lines.reduce((acc, l) => acc + l.unitPriceCents * l.quantity, 0);
    const count = lines.reduce((acc, l) => acc + l.quantity, 0);
    return { lines, addLine, setQuantity, removeLine, clear, subtotalCents, count };
  }, [lines]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
