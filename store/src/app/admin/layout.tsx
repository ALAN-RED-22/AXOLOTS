import { headers } from "next/headers";
import Link from "next/link";
import { AdminAuthError, requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin — AXOLOTS", robots: "noindex, nofollow" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();

  let email: string;
  try {
    email = (await requireAdmin(h)).email;
  } catch (err) {
    const reason = err instanceof AdminAuthError ? err.message : "Error inesperado verificando el acceso";
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-100 px-4">
        <div className="max-w-sm rounded-md border border-stone-300 bg-white p-6 text-center">
          <h1 className="mb-2 text-lg font-bold text-red-700">Acceso no autorizado</h1>
          <p className="text-sm text-stone-600">{reason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-stone-100">
      <header className="border-b border-stone-300 bg-[var(--obsidian)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-sm text-[var(--paper)]">
          <Link href="/admin" className="font-serif font-bold">
            AXOLOTS <span className="font-normal text-[var(--blush)]">admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-stone-300">{email}</span>
            <Link href="/" className="hover:text-[var(--blush)]">
              Ver sitio
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
