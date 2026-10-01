import { getCloudflareContext } from "@opennextjs/cloudflare";

export const PRODUCT_IMAGE_PREFIX = "productos";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB — generoso para una foto de celular ya comprimida
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ImageUploadError extends Error {}

export async function getProductImagesBucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.PRODUCT_IMAGES) {
    throw new Error("Falta el binding R2 PRODUCT_IMAGES — ver wrangler.jsonc y store/README.md");
  }
  return env.PRODUCT_IMAGES;
}

function extensionFor(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

/**
 * Sube una foto de producto a R2 y devuelve la ruta (relativa) con la que se
 * sirve después — ver `src/app/cdn/productos/[...key]/route.ts`. Valida tipo
 * y tamaño ANTES de subir: es la única entrada de archivos binarios al
 * sistema, aunque solo la usen 1-2 admins de confianza, vale la pena no
 * confiar ciegamente en lo que mande el navegador.
 */
export async function uploadProductImage(
  bucket: R2Bucket,
  productId: string,
  file: File,
): Promise<string> {
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    throw new ImageUploadError(`Tipo de archivo no permitido: ${file.type || "desconocido"} (solo jpg/png/webp)`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageUploadError(`La foto pesa demasiado (${Math.round(file.size / 1024 / 1024)}MB, máx. 8MB)`);
  }

  const key = `${PRODUCT_IMAGE_PREFIX}/${productId}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return `/cdn/${key}`;
}

/** `url` es lo que se guardó en `product_images.url` (ej. "/cdn/productos/<id>/<uuid>.jpg"). */
export async function deleteProductImageByUrl(bucket: R2Bucket, url: string): Promise<void> {
  if (!url.startsWith("/cdn/")) return; // no es una imagen en R2 (p. ej. una URL externa vieja)
  await bucket.delete(url.slice("/cdn/".length));
}

/**
 * URL con redimensionado/optimización de Cloudflare (gratis hasta 5,000
 * transformaciones/mes, sin necesidad del producto "Cloudflare Images" de
 * pago) — requiere que "Image Resizing" esté activado para la zona en el
 * dashboard (Speed > Optimization), ver store/README.md.
 *
 * `/cdn-cgi/image/...` lo intercepta el borde de Cloudflare — no existe en
 * `next dev` local (confirmado: 404). En desarrollo se devuelve la imagen tal
 * cual, sin redimensionar, para que al menos se vea en vez de romperse.
 */
export function resizedImageUrl(url: string, opts: { width: number; quality?: number }): string {
  if (process.env.NODE_ENV !== "production") return url;
  const params = `width=${opts.width},quality=${opts.quality ?? 80},format=auto`;
  return `/cdn-cgi/image/${params}${url}`;
}
