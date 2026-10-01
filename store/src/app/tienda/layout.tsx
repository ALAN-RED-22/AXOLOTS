import { CartProvider } from "@/components/store/cart";
import { StoreHeader } from "@/components/store/store-header";

export const metadata = {
  title: "Tienda — AXOLOTS",
  description: "Artesanías de obsidiana, textil, barro y joyería de Teotihuacán.",
};

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-dvh bg-[var(--paper)]">
        <StoreHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </div>
    </CartProvider>
  );
}
