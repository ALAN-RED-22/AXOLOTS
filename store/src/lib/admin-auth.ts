import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { getEnv, type Env } from "@/lib/env";

export type AdminUser = { email: string };

export class AdminAuthError extends Error {}

/** Mínimo para no acoplar esto a `next/headers` ni a un `Request` concreto. */
export type HeaderReader = { get(name: string): string | null };

/** `createRemoteJWKSet` (producción) y `createLocalJWKSet` (tests) resuelven
 * a `CryptoKey` — este alias evita repetir el genérico en todo el archivo. */
type JWKSLike = JWTVerifyGetKey<CryptoKey>;

const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";

let jwksCache: { teamDomain: string; jwks: JWKSLike } | null = null;

function getJWKS(teamDomain: string): JWKSLike {
  if (jwksCache?.teamDomain === teamDomain) return jwksCache.jwks;
  const jwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
  jwksCache = { teamDomain, jwks };
  return jwks;
}

/**
 * Verifica que quien hace la petición es un admin autorizado.
 *
 * En producción: Cloudflare Access ya bloqueó la petición en el borde antes de
 * que llegara aquí (ver store/README.md para configurar la aplicación de
 * Access) — esto es una SEGUNDA verificación, no la primera línea de defensa.
 * Se valida el JWT que Access agrega (`Cf-Access-Jwt-Assertion`) contra las
 * llaves públicas de tu equipo de Zero Trust, y el correo del token se
 * compara contra `ADMIN_EMAILS`. Si alguna vez la política de Access se
 * desconfigura (p. ej. alguien la borra sin querer), esto sigue frenando.
 *
 * En desarrollo (`NEXTJS_ENV=development`): no hay Cloudflare Access corriendo
 * sobre `localhost`, así que se salta la verificación de JWT y se usa
 * directamente el primer correo de `ADMIN_EMAILS` como si fuera quien entró.
 *
 * Recibe `env` ya resuelto (en vez de llamar a `getEnv()` internamente) para
 * poder probarse sin el runtime de Cloudflare — ver `__tests__/admin-auth.test.ts`.
 * `jwks`, si se pasa, reemplaza al JWKS remoto real (los tests inyectan uno
 * local construido con `createLocalJWKSet` + una llave de prueba).
 */
export async function verifyAdmin(
  env: Pick<Env, "NEXTJS_ENV" | "ADMIN_EMAILS" | "CF_ACCESS_TEAM_DOMAIN" | "CF_ACCESS_AUD">,
  headers: HeaderReader,
  jwks?: JWKSLike,
): Promise<AdminUser> {
  const allowed = env.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (env.NEXTJS_ENV === "development") {
    const email = allowed[0];
    if (!email) throw new AdminAuthError("ADMIN_EMAILS está vacío");
    return { email };
  }

  if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) {
    throw new AdminAuthError("Cloudflare Access no está configurado (faltan CF_ACCESS_TEAM_DOMAIN/CF_ACCESS_AUD)");
  }

  const token = headers.get(ACCESS_JWT_HEADER);
  if (!token) {
    throw new AdminAuthError("Falta el header de Cloudflare Access — ¿se está accediendo sin pasar por Access?");
  }

  const resolvedJwks = jwks ?? getJWKS(env.CF_ACCESS_TEAM_DOMAIN);
  const { payload } = await jwtVerify(token, resolvedJwks, { audience: env.CF_ACCESS_AUD });

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
  if (!email) {
    throw new AdminAuthError("El token de Access no trae un correo");
  }
  if (!allowed.includes(email)) {
    throw new AdminAuthError(`${email} no está en ADMIN_EMAILS`);
  }

  return { email };
}

/** Atajo para usar en layouts/Server Actions: resuelve `env` desde Cloudflare. */
export async function requireAdmin(headers: HeaderReader): Promise<AdminUser> {
  const env = await getEnv();
  return verifyAdmin(env, headers);
}
