// Todos los montos se manejan en centavos (enteros) en todo el sistema — nunca
// floats de dinero. Estas son las únicas funciones que los convierten a texto.

export function formatMXN(cents: number): string {
  const hasFraction = cents % 100 !== 0;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Conversión aproximada a USD, solo para mostrar al turista extranjero junto
 * al precio real en MXN — decidido 2026-09-28: nunca se cobra en USD, es
 * puramente informativo. `rate` son MXN por 1 USD.
 */
export function formatUSDApprox(cents: number, rate: number): string {
  const usd = cents / 100 / rate;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(usd);
}

export function sumCents(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
