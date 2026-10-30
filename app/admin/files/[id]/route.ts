import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Support-request attachment download, admins only. Always served as a download with
 * the visitor's file name, never rendered inline, since the content is untrusted.
 */
export async function GET(_request: Request, { params }: RouteContext<"/admin/files/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[a-z0-9]{20,32}$/.test(id)) return new Response("Not found", { status: 404 });

  const file = await db.supportAttachment.findUnique({ where: { id }, select: { name: true, data: true } });
  if (!file) return new Response("Not found", { status: 404 });

  const ascii = file.name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(file.data.length),
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
