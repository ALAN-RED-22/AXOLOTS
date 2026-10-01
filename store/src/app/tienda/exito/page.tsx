import Link from "next/link";
import { ClearCartOnMount } from "@/components/store/clear-cart-on-mount";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="mx-auto max-w-md text-center">
      <ClearCartOnMount />
      <h1 className="mb-2 font-serif text-2xl font-bold text-[var(--obsidian)]">¡Gracias por tu compra!</h1>
      {order && <p className="mb-4 text-sm text-stone-500">Pedido #{order}</p>}
      <p className="mb-6 text-sm text-stone-600">
        Te enviamos la confirmación por correo. Si necesitas factura, escríbenos por WhatsApp con tu número de
        pedido.
      </p>
      <Link href="/tienda" className="font-semibold text-[var(--adobe)] hover:underline">
        Seguir viendo artesanías
      </Link>
    </div>
  );
}
