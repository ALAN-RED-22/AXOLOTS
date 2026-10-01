import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { handleStripeWebhook } from "@/lib/webhook-handler";

// Importante: el body se lee como texto CRUDO (`req.text()`), nunca con
// `req.json()` — Stripe firma los bytes exactos del payload, y re-serializar
// un JSON ya parseado puede no coincidir byte a byte con lo firmado.
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  const db = await getDb();
  const provider = await getPaymentProvider();

  const outcome = await handleStripeWebhook(db, provider, rawBody, signature);
  return NextResponse.json({ received: outcome.status === 200 }, { status: outcome.status });
}
