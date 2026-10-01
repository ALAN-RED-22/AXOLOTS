import { z } from "zod";

// "local" (entrega por código postal) es Fase 3 — todavía no implementado aquí.
export const implementedShippingMethods = ["national", "pickup"] as const;
export const shippingMethodSchema = z.enum(implementedShippingMethods);
export type ImplementedShippingMethod = z.infer<typeof shippingMethodSchema>;

/**
 * Tarifa nacional PLACEHOLDER por rangos de peso total del pedido — hasta que
 * se integre un agregador de paquetería (Skydropx/Envía.com, Fase 3). Ajustar
 * aquí en cuanto haya tarifas reales; no hay envío gratis por monto todavía
 * (el umbral queda pendiente de definir, ver CLAUDE.md).
 */
export function calculateNationalShippingCents(totalWeightG: number): number {
  if (totalWeightG <= 500) return 12000;
  if (totalWeightG <= 2000) return 18000;
  return 25000;
}

export function calculateShippingCents(method: ImplementedShippingMethod, totalWeightG: number): number {
  if (method === "pickup") return 0;
  return calculateNationalShippingCents(totalWeightG);
}
