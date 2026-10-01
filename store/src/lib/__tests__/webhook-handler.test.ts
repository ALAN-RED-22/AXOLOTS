import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "@/lib/webhook-handler";

/**
 * Regresión de un bug real encontrado reenviando un evento de Stripe dos veces
 * contra Neon: Drizzle envuelve el error de Postgres en un `DrizzleQueryError`
 * cuyo `.code` es `undefined`; el `23505` real vive en `.cause.code`. Sin este
 * fix, un webhook duplicado devolvía 500 en vez de 200 (ver webhook-handler.ts).
 */
describe("isUniqueViolation", () => {
  it("reconoce el código en el nivel superior del error", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("reconoce el código envuelto en .cause (la forma real que lanza Drizzle)", () => {
    const outer = new Error("Failed query: insert into ...");
    (outer as unknown as { cause: unknown }).cause = { code: "23505" };
    expect(isUniqueViolation(outer)).toBe(true);
  });

  it("reconoce el código envuelto varios niveles de .cause", () => {
    const err = { cause: { cause: { code: "23505" } } };
    expect(isUniqueViolation(err)).toBe(true);
  });

  it("no confunde otro código de error de Postgres con una violación de unicidad", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false); // foreign_key_violation
  });

  it("no revienta con errores sin forma (null, string, undefined)", () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation("algo salió mal")).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
  });
});
