import { describe, expect, it } from "vitest";
import { formatMXN, formatUSDApprox, sumCents } from "@/lib/money";

describe("formatMXN", () => {
  it("formatea centavos a pesos sin decimales cuando es un monto entero", () => {
    expect(formatMXN(199900)).toBe("$1,999");
  });

  it("muestra centavos cuando el monto no es entero", () => {
    expect(formatMXN(199950)).toBe("$1,999.50");
  });

  it("nunca trabaja con floats de dinero: 1 centavo sigue siendo 1 centavo", () => {
    expect(formatMXN(1)).toBe("$0.01");
  });
});

describe("formatUSDApprox", () => {
  it("es una conversión aproximada, nunca el monto real de cobro", () => {
    // 1999 MXN a una tasa de 20 => ~$99.95 USD
    expect(formatUSDApprox(199900, 20)).toBe("$99.95");
  });
});

describe("sumCents", () => {
  it("suma una lista de centavos", () => {
    expect(sumCents([100, 250, 1])).toBe(351);
  });

  it("devuelve 0 para una lista vacía", () => {
    expect(sumCents([])).toBe(0);
  });
});
