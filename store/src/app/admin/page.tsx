import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { products } from "@/db/schema";
import { formatMXN } from "@/lib/money";

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  active: "Activo",
  archived: "Archivado",
};

export default async function AdminProductsPage() {
  const db = await getDb();
  const rows = await db.query.products.findMany({
    orderBy: [asc(products.category), asc(products.nameEs)],
    with: { variants: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-[var(--obsidian)]">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-md bg-[var(--adobe)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Nuevo producto
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-stone-500">Todavía no hay productos. Crea el primero arriba.</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-stone-300 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Categoría</th>
                <th className="px-4 py-2">Precio</th>
                <th className="px-4 py-2">Stock</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const stock = p.variants.reduce((acc, v) => acc + v.onHand, 0);
                return (
                  <tr key={p.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-4 py-2">
                      <Link href={`/admin/productos/${p.id}`} className="font-medium text-[var(--adobe-dark)] hover:underline">
                        {p.nameEs}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-stone-600">{p.category}</td>
                    <td className="px-4 py-2">{formatMXN(p.priceCents)}</td>
                    <td className="px-4 py-2">{stock}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{STATUS_LABEL[p.status]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
