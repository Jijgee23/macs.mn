import { db } from "@/lib/db";

/** Uploaded images. Ids never change content, so they cache forever. */
export async function GET(_request: Request, { params }: RouteContext<"/media/[id]">) {
  const { id } = await params;
  if (!/^[a-z0-9]{20,32}$/.test(id)) return new Response("Not found", { status: 404 });

  const media = await db.media.findUnique({ where: { id }, select: { data: true, mime: true, name: true } });
  if (!media) return new Response("Not found", { status: 404 });

  // Documents: PDFs open in the browser, the rest download under their original name.
  const disposition = media.name
    ? `${media.mime === "application/pdf" ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(media.name)}`
    : null;
  return new Response(new Uint8Array(media.data), {
    headers: {
      ...(disposition && { "Content-Disposition": disposition }),
      "Content-Type": media.mime,
      "Content-Length": String(media.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
