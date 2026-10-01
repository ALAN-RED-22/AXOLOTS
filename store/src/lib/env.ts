import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";

// Única puerta de entrada a secretos/variables de entorno de la app.
// En Cloudflare Workers no existe `process.env` poblado en runtime: los bindings
// (secrets + vars) llegan por `getCloudflareContext().env`. `initOpenNextCloudflareForDev()`
// (llamado en next.config.ts) hace que esto también funcione con `next dev` leyendo `.dev.vars`.

const envSchema = z.object({
  // "development" en local (`next dev`), "production" en el Worker desplegado.
  // Determina si /admin exige el JWT de Cloudflare Access o lo salta en local.
  NEXTJS_ENV: z.string().default("production"),
  DATABASE_URL: z.string().min(1, "falta DATABASE_URL"),
  STRIPE_SECRET_KEY: z.string().min(1, "falta STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "falta STRIPE_WEBHOOK_SECRET"),
  // URL pública del sitio, para construir success_url/cancel_url del checkout.
  SITE_URL: z.string().url().default("https://axolotsmx.com"),
  // Conversión MXN->USD solo para el precio "aprox." que se muestra al turista.
  // Es una var (no secret) para poder actualizarla sin redeploy vía `wrangler`.
  USD_MXN_RATE: z.coerce.number().positive().default(18.5),

  // --- /admin ---
  // Lista separada por comas de correos autorizados a administrar el catálogo.
  // Es una segunda verificación propia, independiente de la política de acceso
  // de Cloudflare Access (ver store/README.md) — defensa en profundidad: si
  // alguna vez la política de Access se desconfigura mal, esto sigue frenando.
  ADMIN_EMAILS: z.string().min(1, "falta ADMIN_EMAILS"),
  // Dominio del equipo de Cloudflare Zero Trust (algo como "tu-equipo.cloudflareaccess.com"),
  // usado para obtener las llaves públicas con las que se verifica el JWT de Access.
  // "AUD" (Application Audience) identifica la aplicación de Access específica —
  // se obtiene del dashboard al crearla, no es secreto pero si no coincide el
  // token se rechaza. Ambos vacíos = sin Access configurado todavía (ver
  // NEXTJS_ENV === "development" en admin-auth.ts para el bypass de desarrollo).
  CF_ACCESS_TEAM_DOMAIN: z.string().default(""),
  CF_ACCESS_AUD: z.string().default(""),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Lee y valida las variables de entorno requeridas. Falla rápido y con un mensaje
 * claro si falta alguna — mejor un 500 explícito en logs que un error críptico
 * más abajo (p. ej. Stripe rechazando una llave vacía).
 */
export async function getEnv(): Promise<Env> {
  if (cached) return cached;
  const { env } = await getCloudflareContext({ async: true });
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Configuración de entorno inválida/incompleta: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}
