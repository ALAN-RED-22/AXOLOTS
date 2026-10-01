import { getEnv } from "@/lib/env";
import { StripeProvider } from "./stripe";
import type { PaymentProvider } from "./provider";

export async function getPaymentProvider(): Promise<PaymentProvider> {
  const env = await getEnv();
  return new StripeProvider(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET);
}

export type { PaymentProvider } from "./provider";
