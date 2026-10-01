import { createProduct } from "@/app/admin/actions";
import { ProductFields } from "@/components/admin/product-fields";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-bold text-[var(--obsidian)]">Nuevo producto</h1>
      <form action={createProduct} className="flex flex-col gap-4">
        <ProductFields />
        <label className="flex flex-col gap-1 text-sm">
          <span>Stock inicial (piezas disponibles)</span>
          <input
            name="initialStock"
            type="number"
            min="0"
            required
            defaultValue={0}
            className="w-32 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <p className="text-xs text-stone-500">
          Se crea en borrador y con una sola variante (&quot;Único&quot;). Si el producto necesita tallas u otras
          presentaciones, se agregan después desde la pantalla de edición.
        </p>
        <button
          type="submit"
          className="w-fit rounded-md bg-[var(--adobe)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Crear producto
        </button>
      </form>
    </div>
  );
}
