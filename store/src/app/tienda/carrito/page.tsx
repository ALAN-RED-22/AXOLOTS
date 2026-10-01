"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/store/cart";
import { formatMXN } from "@/lib/money";

export default function CartPage() {
  const { lines, setQuantity, removeLine, subtotalCents } = useCart();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"pickup" | "national">("pickup");
  const [address, setAddress] = useState({
    name: "",
    line1: "",
    colonia: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (lines.length === 0) {
    return (
      <div className="text-center">
        <p className="mb-4 text-sm text-stone-500">Tu carrito está vacío.</p>
        <Link href="/tienda" className="font-semibold text-[var(--adobe)] hover:underline">
          Ver catálogo
        </Link>
      </div>
    );
  }

  async function handleCheckout() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          shippingMethod,
          shippingAddress: shippingMethod === "national" ? address : undefined,
          items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "No se pudo iniciar el pago, intenta de nuevo.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("No se pudo conectar. Revisa tu conexión e intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col gap-4">
        <h1 className="font-serif text-2xl font-bold text-[var(--obsidian)]">Carrito</h1>
        {lines.map((l) => (
          <div key={l.variantId} className="flex items-center gap-3 rounded-md border border-stone-200 p-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--obsidian)]">{l.name}</p>
              {l.label !== "Único" && <p className="text-xs text-stone-500">{l.label}</p>}
              <p className="text-sm text-[var(--adobe-dark)]">{formatMXN(l.unitPriceCents)}</p>
            </div>
            <input
              type="number"
              min={1}
              max={20}
              value={l.quantity}
              onChange={(e) => setQuantity(l.variantId, Number(e.target.value))}
              className="w-16 rounded-md border border-stone-300 px-2 py-1 text-center"
            />
            <button
              type="button"
              onClick={() => removeLine(l.variantId)}
              className="text-xs text-stone-400 hover:text-red-500"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-md border border-stone-200 p-4">
        <p className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-semibold">{formatMXN(subtotalCents)}</span>
        </p>
        <p className="text-xs text-stone-400">El envío se calcula en el siguiente paso.</p>

        <label className="flex flex-col gap-1 text-sm">
          <span>Correo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>WhatsApp</span>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+52 55 ..."
            className="rounded-md border border-stone-300 px-3 py-2"
          />
        </label>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 font-medium text-[var(--obsidian)]">Entrega</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="shipping"
              checked={shippingMethod === "pickup"}
              onChange={() => setShippingMethod("pickup")}
            />
            Recoger en el local (gratis)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="shipping"
              checked={shippingMethod === "national"}
              onChange={() => setShippingMethod("national")}
            />
            Envío nacional por paquetería
          </label>
        </fieldset>

        {shippingMethod === "national" && (
          <div className="flex flex-col gap-2">
            {(
              [
                ["name", "Nombre completo"],
                ["line1", "Calle y número"],
                ["colonia", "Colonia"],
                ["city", "Ciudad"],
                ["state", "Estado"],
                ["postalCode", "Código postal"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex flex-col gap-1 text-sm">
                <span>{label}</span>
                <input
                  required
                  value={address[key]}
                  onChange={(e) => setAddress((a) => ({ ...a, [key]: e.target.value }))}
                  className="rounded-md border border-stone-300 px-3 py-2"
                />
              </label>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={submitting || !email || !phone}
          onClick={handleCheckout}
          className="rounded-md bg-[var(--adobe)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Redirigiendo a pago…" : "Pagar con tarjeta"}
        </button>
        <p className="text-center text-xs text-stone-400">
          ¿Necesitas factura? Contáctanos por WhatsApp después de tu compra.
        </p>
      </div>
    </div>
  );
}
