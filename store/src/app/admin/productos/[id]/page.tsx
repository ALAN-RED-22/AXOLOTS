import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { products } from "@/db/schema";
import { resizedImageUrl } from "@/lib/r2";
import { ProductFields } from "@/components/admin/product-fields";
import { StatusSelect } from "@/components/admin/status-select";
import {
  createVariant,
  deleteImage,
  deleteVariant,
  moveImage,
  setProductStatus,
  updateProduct,
  updateVariant,
  uploadImage,
} from "@/app/admin/actions";

const ERROR_MESSAGES: Record<string, string> = {
  "variante-con-pedidos": "No se puede borrar: esta variante ya tiene pedidos asociados. Archívala o pon su stock en 0 en vez de borrarla.",
  "sin-archivo": "No se recibió ningún archivo.",
};

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ guardado?: string; error?: string }>;
}) {
  const { id } = await params;
  const { guardado, error } = await searchParams;
  const db = await getDb();
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { variants: true, images: { orderBy: (img, { asc }) => [asc(img.position)] } },
  });
  if (!product) notFound();

  const updateProductWithId = updateProduct.bind(null, product.id);
  const createVariantWithId = createVariant.bind(null, product.id);
  const uploadImageWithId = uploadImage.bind(null, product.id);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-[var(--obsidian)]">{product.nameEs}</h1>
          <StatusSelect defaultValue={product.status} onChangeAction={setProductStatus.bind(null, product.id)} />

        </div>

        {guardado && <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Guardado.</p>}
        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? error}
          </p>
        )}

        <form action={updateProductWithId} className="flex flex-col gap-4">
          <ProductFields
            defaults={{
              ...product,
              priceMxn: product.priceCents / 100,
              origin: product.origin,
            }}
          />
          <button
            type="submit"
            className="w-fit rounded-md bg-[var(--adobe)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Guardar cambios
          </button>
        </form>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-[var(--obsidian)]">Variantes y stock</h2>
        <div className="flex flex-col gap-3">
          {product.variants.map((v) => (
            <form
              key={v.id}
              action={updateVariant.bind(null, product.id, v.id)}
              className="grid grid-cols-2 gap-2 rounded-md border border-stone-200 bg-white p-3 sm:grid-cols-5 sm:items-end"
            >
              <label className="flex flex-col gap-1 text-xs">
                <span>Nombre (ES)</span>
                <input name="labelEs" defaultValue={v.labelEs} required className="rounded border border-stone-300 px-2 py-1 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span>Nombre (EN)</span>
                <input name="labelEn" defaultValue={v.labelEn} required className="rounded border border-stone-300 px-2 py-1 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span>SKU</span>
                <input name="sku" defaultValue={v.sku} required className="rounded border border-stone-300 px-2 py-1 text-sm" />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span>Precio propio (vacío = usa el del producto)</span>
                <input
                  name="priceMxn"
                  type="number"
                  step="0.01"
                  min="0.01"
                  defaultValue={v.priceCents ? v.priceCents / 100 : ""}
                  className="rounded border border-stone-300 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span>Stock</span>
                <input
                  name="onHand"
                  type="number"
                  min="0"
                  defaultValue={v.onHand}
                  required
                  className="rounded border border-stone-300 px-2 py-1 text-sm"
                />
              </label>
              <div className="col-span-2 flex gap-2 sm:col-span-5">
                <button type="submit" className="rounded bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white">
                  Guardar
                </button>
                <button
                  type="submit"
                  formAction={deleteVariant.bind(null, product.id, v.id)}
                  className="rounded border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600"
                >
                  Borrar
                </button>
              </div>
            </form>
          ))}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--adobe-dark)]">+ Agregar variante</summary>
          <form action={createVariantWithId} className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-stone-200 bg-white p-3 sm:grid-cols-5 sm:items-end">
            <label className="flex flex-col gap-1 text-xs">
              <span>Nombre (ES)</span>
              <input name="labelEs" required placeholder="Chica / Mediana / Grande" className="rounded border border-stone-300 px-2 py-1 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span>Nombre (EN)</span>
              <input name="labelEn" required placeholder="Small / Medium / Large" className="rounded border border-stone-300 px-2 py-1 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span>SKU</span>
              <input name="sku" required className="rounded border border-stone-300 px-2 py-1 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span>Precio propio (opcional)</span>
              <input name="priceMxn" type="number" step="0.01" min="0.01" className="rounded border border-stone-300 px-2 py-1 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span>Stock</span>
              <input name="onHand" type="number" min="0" required defaultValue={0} className="rounded border border-stone-300 px-2 py-1 text-sm" />
            </label>
            <button type="submit" className="col-span-2 w-fit rounded bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white sm:col-span-5">
              Agregar
            </button>
          </form>
        </details>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-[var(--obsidian)]">Fotos</h2>
        <div className="mb-4 flex flex-wrap gap-4">
          {product.images.map((img, i) => (
            <div key={img.id} className="flex flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- pasa por el redimensionado de Cloudflare, no por next/image */}
              <img
                src={resizedImageUrl(img.url, { width: 160 })}
                alt={img.altEs || product.nameEs}
                className="h-32 w-32 rounded-md border border-stone-200 object-cover"
              />
              <div className="flex gap-1">
                <form action={moveImage.bind(null, product.id, img.id, "up")}>
                  <button type="submit" disabled={i === 0} className="text-xs disabled:opacity-30">
                    ↑
                  </button>
                </form>
                <form action={moveImage.bind(null, product.id, img.id, "down")}>
                  <button type="submit" disabled={i === product.images.length - 1} className="text-xs disabled:opacity-30">
                    ↓
                  </button>
                </form>
                <form action={deleteImage.bind(null, product.id, img.id)}>
                  <button type="submit" className="text-xs text-red-600">
                    Borrar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
        <form action={uploadImageWithId} className="flex items-center gap-3">
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
          <button type="submit" className="rounded bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white">
            Subir foto
          </button>
        </form>
      </section>
    </div>
  );
}
