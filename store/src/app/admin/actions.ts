"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { getDb } from "@/lib/db";
import { productImages, productVariants, products } from "@/db/schema";
import { deleteProductImageByUrl, getProductImagesBucket, ImageUploadError, uploadProductImage } from "@/lib/r2";
import { slugify } from "@/lib/slug";
import {
  productFormSchema,
  productStatusSchema,
  productUpdateSchema,
  variantFormSchema,
} from "@/lib/admin/schemas";

/** Todas las acciones empiezan igual: el layout ya protege la PÁGINA, pero una
 * Server Action es su propio endpoint — hay que verificar aquí también. */
async function assertAdmin() {
  await requireAdmin(await headers());
}

async function uniqueSlug(base: string): Promise<string> {
  const db = await getDb();
  const root = slugify(base) || "producto";
  let candidate = root;
  let suffix = 2;
  // Volumen de catálogo esperado (artesanías hechas a mano, no miles de SKUs)
  // hace innecesaria una solución más sofisticada que probar en un loop corto.
  while (await db.query.products.findFirst({ where: eq(products.slug, candidate) })) {
    candidate = `${root}-${suffix++}`;
  }
  return candidate;
}

export async function createProduct(formData: FormData) {
  await assertAdmin();
  const parsed = productFormSchema.parse(Object.fromEntries(formData));
  const db = await getDb();

  const productId = crypto.randomUUID();
  const slug = await uniqueSlug(parsed.nameEs);

  await db.batch([
    db.insert(products).values({
      id: productId,
      slug,
      category: parsed.category,
      kind: parsed.kind,
      status: "draft",
      nameEs: parsed.nameEs,
      nameEn: parsed.nameEn,
      descriptionEs: parsed.descriptionEs,
      descriptionEn: parsed.descriptionEn,
      origin: parsed.origin || null,
      priceCents: Math.round(parsed.priceMxn * 100),
      weightG: parsed.weightG,
      lengthMm: parsed.lengthMm,
      widthMm: parsed.widthMm,
      heightMm: parsed.heightMm,
      fragile: parsed.fragile,
    }),
    db.insert(productVariants).values({
      productId,
      sku: slug.toUpperCase(),
      labelEs: "Único",
      labelEn: "One size",
      onHand: parsed.initialStock,
    }),
  ]);

  revalidatePath("/admin");
  redirect(`/admin/productos/${productId}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  await assertAdmin();
  const parsed = productUpdateSchema.parse(Object.fromEntries(formData));
  const db = await getDb();

  await db
    .update(products)
    .set({
      category: parsed.category,
      kind: parsed.kind,
      status: parsed.status,
      nameEs: parsed.nameEs,
      nameEn: parsed.nameEn,
      descriptionEs: parsed.descriptionEs,
      descriptionEn: parsed.descriptionEn,
      origin: parsed.origin || null,
      priceCents: Math.round(parsed.priceMxn * 100),
      weightG: parsed.weightG,
      lengthMm: parsed.lengthMm,
      widthMm: parsed.widthMm,
      heightMm: parsed.heightMm,
      fragile: parsed.fragile,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  revalidatePath("/admin");
  revalidatePath(`/admin/productos/${productId}`);
  redirect(`/admin/productos/${productId}?guardado=1`);
}

export async function createVariant(productId: string, formData: FormData) {
  await assertAdmin();
  const parsed = variantFormSchema.parse(Object.fromEntries(formData));
  const db = await getDb();

  await db.insert(productVariants).values({
    productId,
    sku: parsed.sku,
    labelEs: parsed.labelEs,
    labelEn: parsed.labelEn,
    priceCents: parsed.priceMxn === null ? null : Math.round(parsed.priceMxn * 100),
    onHand: parsed.onHand,
  });

  revalidatePath(`/admin/productos/${productId}`);
  redirect(`/admin/productos/${productId}`);
}

export async function updateVariant(productId: string, variantId: string, formData: FormData) {
  await assertAdmin();
  const parsed = variantFormSchema.parse(Object.fromEntries(formData));
  const db = await getDb();

  await db
    .update(productVariants)
    .set({
      sku: parsed.sku,
      labelEs: parsed.labelEs,
      labelEn: parsed.labelEn,
      priceCents: parsed.priceMxn === null ? null : Math.round(parsed.priceMxn * 100),
      onHand: parsed.onHand,
    })
    .where(eq(productVariants.id, variantId));

  revalidatePath(`/admin/productos/${productId}`);
  redirect(`/admin/productos/${productId}?guardado=1`);
}

const POSTGRES_FOREIGN_KEY_VIOLATION = "23503";

function isForeignKeyViolation(err: unknown): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 5 && current; depth++) {
    if (typeof current === "object" && "code" in current && (current as { code?: string }).code === POSTGRES_FOREIGN_KEY_VIOLATION) {
      return true;
    }
    current = typeof current === "object" && current !== null && "cause" in current ? (current as { cause?: unknown }).cause : undefined;
  }
  return false;
}

export async function deleteVariant(productId: string, variantId: string) {
  await assertAdmin();
  const db = await getDb();
  try {
    await db.delete(productVariants).where(eq(productVariants.id, variantId));
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      // Ya tiene pedidos (order_items/stock_reservations la referencian) — no se
      // puede borrar sin perder el historial. Redirigir con un aviso en vez de
      // dejar que la excepción cruda llegue a la pantalla.
      redirect(`/admin/productos/${productId}?error=variante-con-pedidos`);
    }
    throw err;
  }
  revalidatePath(`/admin/productos/${productId}`);
  redirect(`/admin/productos/${productId}`);
}

export async function uploadImage(productId: string, formData: FormData) {
  await assertAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/productos/${productId}?error=sin-archivo`);
  }

  const db = await getDb();
  const bucket = await getProductImagesBucket();

  let url: string;
  try {
    url = await uploadProductImage(bucket, productId, file);
  } catch (err) {
    if (err instanceof ImageUploadError) {
      redirect(`/admin/productos/${productId}?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  const existing = await db.query.productImages.findMany({ where: eq(productImages.productId, productId) });
  await db.insert(productImages).values({
    productId,
    url,
    position: existing.length,
  });

  revalidatePath(`/admin/productos/${productId}`);
  redirect(`/admin/productos/${productId}`);
}

export async function deleteImage(productId: string, imageId: string) {
  await assertAdmin();
  const db = await getDb();
  const image = await db.query.productImages.findFirst({ where: eq(productImages.id, imageId) });
  if (image) {
    const bucket = await getProductImagesBucket();
    await deleteProductImageByUrl(bucket, image.url);
    await db.delete(productImages).where(eq(productImages.id, imageId));
  }
  revalidatePath(`/admin/productos/${productId}`);
  redirect(`/admin/productos/${productId}`);
}

export async function moveImage(productId: string, imageId: string, direction: "up" | "down") {
  await assertAdmin();
  const db = await getDb();
  const images = await db.query.productImages.findMany({
    where: eq(productImages.productId, productId),
    orderBy: [asc(productImages.position)],
  });
  const index = images.findIndex((img) => img.id === imageId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= images.length) {
    redirect(`/admin/productos/${productId}`);
  }

  const a = images[index];
  const b = images[swapWith];
  await db.batch([
    db.update(productImages).set({ position: b.position }).where(eq(productImages.id, a.id)),
    db.update(productImages).set({ position: a.position }).where(eq(productImages.id, b.id)),
  ]);

  revalidatePath(`/admin/productos/${productId}`);
  redirect(`/admin/productos/${productId}`);
}

export async function setProductStatus(productId: string, status: unknown) {
  await assertAdmin();
  const parsedStatus = productStatusSchema.parse(status);
  const db = await getDb();
  await db.update(products).set({ status: parsedStatus, updatedAt: new Date() }).where(eq(products.id, productId));
  revalidatePath("/admin");
  revalidatePath(`/admin/productos/${productId}`);
}
