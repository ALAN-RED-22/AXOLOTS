import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { StripeProvider } from "@/lib/payments/stripe";

// No se hace ninguna llamada de red en estas pruebas: la verificación de firma
// de webhook es puro cómputo local (HMAC) y `Stripe.webhooks.generateTestHeaderStringAsync`
// genera una firma válida para un payload+secreto dados, también sin red.
const WEBHOOK_SECRET = "whsec_test_secret";

function buildSessionEvent(type: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `evt_${crypto.randomUUID()}`,
    object: "event",
    type,
    data: {
      object: {
        id: "cs_test_123",
        object: "checkout.session",
        client_reference_id: "11111111-1111-1111-1111-111111111111",
        metadata: {},
        ...overrides,
      },
    },
  };
}

async function sign(payloadObj: unknown) {
  const payload = JSON.stringify(payloadObj);
  const header = await Stripe.webhooks.generateTestHeaderStringAsync({
    payload,
    secret: WEBHOOK_SECRET,
  });
  return { payload, header };
}

describe("StripeProvider.parseWebhook", () => {
  const provider = new StripeProvider("sk_test_dummy", WEBHOOK_SECRET);

  it("rechaza un payload sin header de firma", async () => {
    await expect(provider.parseWebhook("{}", null)).rejects.toThrow();
  });

  it("rechaza una firma inválida (posible payload falsificado)", async () => {
    await expect(
      provider.parseWebhook(JSON.stringify(buildSessionEvent("checkout.session.completed")), "t=1,v1=firma-falsa"),
    ).rejects.toThrow();
  });

  it("rechaza un payload modificado después de firmarlo (la firma ya no corresponde a los bytes)", async () => {
    const { payload, header } = await sign(buildSessionEvent("checkout.session.completed"));
    const tampered = payload.replace("cs_test_123", "cs_test_456");
    await expect(provider.parseWebhook(tampered, header)).rejects.toThrow();
  });

  it("acepta checkout.session.completed firmado correctamente y lo normaliza", async () => {
    const { payload, header } = await sign(buildSessionEvent("checkout.session.completed"));
    const result = await provider.parseWebhook(payload, header);
    expect(result.event).toEqual({
      kind: "checkout_completed",
      orderId: "11111111-1111-1111-1111-111111111111",
    });
  });

  it("acepta checkout.session.expired firmado correctamente y lo normaliza", async () => {
    const { payload, header } = await sign(buildSessionEvent("checkout.session.expired"));
    const result = await provider.parseWebhook(payload, header);
    expect(result.event).toEqual({
      kind: "checkout_expired",
      orderId: "11111111-1111-1111-1111-111111111111",
    });
  });

  it("ignora tipos de evento que no le importan a la app, sin lanzar", async () => {
    const { payload, header } = await sign(buildSessionEvent("payment_intent.created"));
    const result = await provider.parseWebhook(payload, header);
    expect(result.event).toEqual({ kind: "ignored" });
  });

  it("ignora checkout.session.completed sin client_reference_id ni metadata.orderId (no sabría a qué pedido aplicarlo)", async () => {
    const { payload, header } = await sign(
      buildSessionEvent("checkout.session.completed", { client_reference_id: null, metadata: {} }),
    );
    const result = await provider.parseWebhook(payload, header);
    expect(result.event).toEqual({ kind: "ignored" });
  });

  it("usa metadata.orderId como respaldo si falta client_reference_id", async () => {
    const { payload, header } = await sign(
      buildSessionEvent("checkout.session.completed", {
        client_reference_id: null,
        metadata: { orderId: "22222222-2222-2222-2222-222222222222" },
      }),
    );
    const result = await provider.parseWebhook(payload, header);
    expect(result.event).toEqual({
      kind: "checkout_completed",
      orderId: "22222222-2222-2222-2222-222222222222",
    });
  });
});
