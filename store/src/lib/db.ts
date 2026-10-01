import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getEnv } from "@/lib/env";
import * as schema from "@/db/schema";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Cliente de Drizzle sobre el driver HTTP de Neon (sin pool persistente:
 * cada request abre su propia conexión corta, que es el modelo correcto
 * para un Worker de Cloudflare — no hay proceso de larga vida que mantenga
 * un pool entre requests).
 */
export async function getDb(): Promise<Db> {
  const env = await getEnv();
  const sql = neon(env.DATABASE_URL);
  return drizzle(sql, { schema });
}
