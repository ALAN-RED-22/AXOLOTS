import { describe, expect, it } from "vitest";
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import { AdminAuthError, verifyAdmin } from "@/lib/admin-auth";

const ADMIN_EMAILS = "mauro@example.com, alan@example.com";

describe("verifyAdmin — modo desarrollo", () => {
  const devEnv = {
    NEXTJS_ENV: "development",
    ADMIN_EMAILS,
    CF_ACCESS_TEAM_DOMAIN: "",
    CF_ACCESS_AUD: "",
  };
  const headers = { get: () => null };

  it("no exige el JWT de Access y usa el primer correo de ADMIN_EMAILS", async () => {
    const admin = await verifyAdmin(devEnv, headers);
    expect(admin.email).toBe("mauro@example.com");
  });

  it("falla claramente si ADMIN_EMAILS está vacío", async () => {
    await expect(verifyAdmin({ ...devEnv, ADMIN_EMAILS: "" }, headers)).rejects.toThrow(AdminAuthError);
  });
});

describe("verifyAdmin — modo producción (verifica el JWT de Cloudflare Access de verdad)", () => {
  const prodEnv = {
    NEXTJS_ENV: "production",
    ADMIN_EMAILS,
    CF_ACCESS_TEAM_DOMAIN: "axolots.cloudflareaccess.com",
    CF_ACCESS_AUD: "aud-de-prueba",
  };

  async function setup() {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    jwk.alg = "RS256";
    jwk.kid = "test-key";
    const jwks = createLocalJWKSet({ keys: [jwk] });
    return { privateKey, jwks };
  }

  it("acepta un JWT válido de un correo que SÍ está en ADMIN_EMAILS", async () => {
    const { privateKey, jwks } = await setup();
    const token = await new SignJWT({ email: "alan@example.com" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setAudience(prodEnv.CF_ACCESS_AUD)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    const admin = await verifyAdmin(prodEnv, { get: () => token }, jwks);
    expect(admin.email).toBe("alan@example.com");
  });

  it("rechaza un JWT válido pero de un correo que NO está en ADMIN_EMAILS", async () => {
    const { privateKey, jwks } = await setup();
    const token = await new SignJWT({ email: "intruso@example.com" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setAudience(prodEnv.CF_ACCESS_AUD)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    await expect(verifyAdmin(prodEnv, { get: () => token }, jwks)).rejects.toThrow(AdminAuthError);
  });

  it("rechaza un JWT firmado con una llave distinta a la de Access (posible token falsificado)", async () => {
    const { jwks } = await setup();
    const { privateKey: otraLlave } = await generateKeyPair("RS256");
    const token = await new SignJWT({ email: "alan@example.com" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setAudience(prodEnv.CF_ACCESS_AUD)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(otraLlave); // firmado con otra llave privada, no la que está en `jwks`

    await expect(verifyAdmin(prodEnv, { get: () => token }, jwks)).rejects.toThrow();
  });

  it("rechaza un JWT con el 'aud' equivocado (de otra aplicación de Access)", async () => {
    const { privateKey, jwks } = await setup();
    const token = await new SignJWT({ email: "alan@example.com" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setAudience("aud-de-otra-app")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);

    await expect(verifyAdmin(prodEnv, { get: () => token }, jwks)).rejects.toThrow();
  });

  it("rechaza un JWT expirado", async () => {
    const { privateKey, jwks } = await setup();
    const token = await new SignJWT({ email: "alan@example.com" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setAudience(prodEnv.CF_ACCESS_AUD)
      .setIssuedAt()
      .setExpirationTime("-1s")
      .sign(privateKey);

    await expect(verifyAdmin(prodEnv, { get: () => token }, jwks)).rejects.toThrow();
  });

  it("rechaza cuando no hay header de Access en absoluto", async () => {
    const { jwks } = await setup();
    await expect(verifyAdmin(prodEnv, { get: () => null }, jwks)).rejects.toThrow(AdminAuthError);
  });

  it("rechaza si Cloudflare Access no está configurado (team domain o aud vacíos)", async () => {
    const { jwks } = await setup();
    await expect(
      verifyAdmin({ ...prodEnv, CF_ACCESS_AUD: "" }, { get: () => "cualquier-token" }, jwks),
    ).rejects.toThrow(AdminAuthError);
  });
});
