import Stripe from "stripe";
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  NormalizedPaymentEvent,
  ParsedWebhook,
  PaymentProvider,
} from "./provider";

/** Stripe exige mínimo 30 min para `expires_at` de un Checkout Session (no acepta menos). */
export const STRIPE_MIN_SESSION_MINUTES = 30;

export class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;
  private readonly client: Stripe;
  private readonly webhookSecret: string;

  constructor(secretKey: string, webhookSecret: string) {
    // httpClient basado en fetch: el SDK de Stripe por defecto usa el módulo
    // `http`/`https` de Node, que no existe en el runtime de Cloudflare Workers.
    this.client = new Stripe(secretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });
    this.webhookSecret = webhookSecret;
  }

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = input.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "mxn",
        unit_amount: item.unitPriceCents,
        product_data: { name: item.name },
      },
    }));

    if (input.shippingCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "mxn",
          unit_amount: input.shippingCents,
          product_data: { name: "Envío / Shipping" },
        },
      });
    }

    const expiresAtSec = Math.floor(input.expiresAt.getTime() / 1000);
    const minAllowed = Math.floor(Date.now() / 1000) + STRIPE_MIN_SESSION_MINUTES * 60;

    const session = await this.client.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: input.email,
      client_reference_id: input.orderId,
      metadata: { orderId: input.orderId, orderNumber: String(input.orderNumber) },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      expires_at: Math.max(expiresAtSec, minAllowed),
    });

    if (!session.url) {
      throw new Error("Stripe no devolvió una URL de checkout");
    }
    return { url: session.url, providerRef: session.id };
  }

  async parseWebhook(rawBody: string, signatureHeader: string | null): Promise<ParsedWebhook> {
    if (!signatureHeader) {
      throw new Error("Falta el header stripe-signature");
    }
    // Verificación async con WebCrypto (SubtleCrypto): el runtime de Workers no
    // tiene el módulo `crypto` síncrono de Node que usa `constructEvent`.
    const event = await this.client.webhooks.constructEventAsync(
      rawBody,
      signatureHeader,
      this.webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );

    return { eventId: event.id, type: event.type, event: normalizeEvent(event) };
  }
}

function normalizeEvent(event: Stripe.Event): NormalizedPaymentEvent {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.client_reference_id ?? session.metadata?.orderId;
      if (!orderId) return { kind: "ignored" };
      return { kind: "checkout_completed", orderId };
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.client_reference_id ?? session.metadata?.orderId;
      if (!orderId) return { kind: "ignored" };
      return { kind: "checkout_expired", orderId };
    }
    default:
      return { kind: "ignored" };
  }
}
