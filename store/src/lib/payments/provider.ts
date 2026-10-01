/**
 * Abstracción de proveedor de pago: el resto de la app (checkout, webhook)
 * solo conoce esta interfaz, nunca el SDK de Stripe directamente. Permite
 * agregar Mercado Pago después (Fase 4) sin tocar la lógica de negocio.
 *
 * Principio de seguridad: ningún dato de tarjeta pasa nunca por este servidor.
 * Todo el cobro ocurre en la página alojada del proveedor (Stripe Checkout).
 */

export interface CheckoutLineItem {
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CreateCheckoutInput {
  orderId: string;
  orderNumber: number;
  email: string;
  items: CheckoutLineItem[];
  shippingCents: number;
  /** El proveedor debe expirar la sesión a más tardar en este momento. */
  expiresAt: Date;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResult {
  url: string;
  providerRef: string;
}

export type NormalizedPaymentEvent =
  | { kind: "checkout_completed"; orderId: string }
  | { kind: "checkout_expired"; orderId: string }
  | { kind: "ignored" };

export interface ParsedWebhook {
  /** Id único del evento en el proveedor — usado para deduplicar en `payment_events`. */
  eventId: string;
  type: string;
  event: NormalizedPaymentEvent;
}

export interface PaymentProvider {
  readonly name: "stripe" | "mercadopago";
  createCheckoutSession(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  /**
   * Verifica la firma del webhook y normaliza el evento. Debe lanzar si la
   * firma es inválida — nunca procesar un payload sin verificar.
   */
  parseWebhook(rawBody: string, signatureHeader: string | null): Promise<ParsedWebhook>;
}
