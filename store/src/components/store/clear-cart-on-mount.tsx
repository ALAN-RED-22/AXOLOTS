"use client";

import { useEffect } from "react";
import { useCart } from "./cart";

/** Vacía el carrito del navegador al llegar a la página de éxito del pago. */
export function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // Solo al montar: `clear` es estable dentro de la vida del componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
