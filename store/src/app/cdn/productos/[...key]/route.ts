import { getProductImagesBucket, PRODUCT_IMAGE_PREFIX } from "@/lib/r2";

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const bucket = await getProductImagesBucket();
  const object = await bucket.get(`${PRODUCT_IMAGE_PREFIX}/${key.join("/")}`);
  if (!object) {
    return new Response("No encontrado", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  // Inmutable: cada subida genera un nombre de archivo nuevo (uuid), nunca se
  // sobrescribe uno existente — seguro cachear "para siempre".
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
}
