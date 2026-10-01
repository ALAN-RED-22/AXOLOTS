import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { orders } from "@/db/schema";
import { getPaymentProvider } from "@/lib/payments";
import { checkoutRequestSchema } from "@/lib/schemas";
import { createCheckout } from "@/lib/checkout";
import { isSameOrigin } from "@/lib/same-origin";

// Nota: no se declara `export const runtime = "edge"` — @opennextjs/cloudflare
// ejecuta el runtime Node de Next dentro del Worker vía `nodejs_compat`
// (ver wrangler.jsonc), no el Edge Runtime nativo de Next.

// Freno simple contra abuso sin tabla nueva: máximo N pedidos "pending"
// recientes por email. Protección seria de bots/DoS a nivel de borde debe
// configurarse aparte como regla de Cloudflare (WAF/Rate Limiting), fuera del
// alcance de este código — ver README de store/.
const MAX_RECENT_PENDING_PER_EMAIL = 5;
const RECENT_WINDOW_MS = 10 * 60_000;

export async function POST(req: Request) {
  const env = await getEnv();

  if (!isSameOrigin(req, env.SITE_URL)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  if (json === null) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const db = await getDb();

  const recentPending = await db.$count(
    orders,
    and(
      eq(orders.email, parsed.data.email),
      eq(orders.status, "pending"),
      gt(orders.createdAt, new Date(Date.now() - RECENT_WINDOW_MS)),
    ),
  );
  if (recentPending >= MAX_RECENT_PENDING_PER_EMAIL) {
    return NextResponse.json(
      { error: "Demasiados pedidos pendientes recientes, intenta de nuevo en unos minutos" },
      { status: 429 },
    );
  }

  const provider = await getPaymentProvider();

  try {
    const result = await createCheckout(db, provider, env.SITE_URL, parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, variantId: result.variantId }, { status: result.status });
    }
    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("checkout_failed", err);
    return NextResponse.json({ error: "No se pudo crear el checkout" }, { status: 500 });
  }
}
