/**
 * Las Route Handlers de Next (a diferencia de los Server Actions) no traen
 * protección CSRF incorporada. `/api/checkout` es de escritura (crea pedidos y
 * reservas de stock) y no tiene autenticación — sin esto, cualquier sitio
 * podría mandarle POSTs desde el navegador de un visitante (no podría leer la
 * respuesta por CORS, pero sí lograr el efecto secundario: reservar stock,
 * crear pedidos basura). Se exige que `Origin` coincida con el sitio.
 */
export function isSameOrigin(req: Request, siteUrl: string): boolean {
  const origin = req.headers.get("origin");
  // Sin header Origin (algunos clientes same-origin legítimos no lo mandan en
  // GET, pero los navegadores SIEMPRE lo mandan en POST cross-origin y same-origin
  // fetch): si falta, se rechaza — más estricto que permisivo.
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(siteUrl).origin;
  } catch {
    return false;
  }
}
