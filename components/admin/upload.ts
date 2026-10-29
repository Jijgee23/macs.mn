/**
 * Browser-side image upload for the admin. Shrinks the image to ≤1600px WebP first so
 * the request stays well under nginx's default 1MB body limit; the server
 * (app/admin/upload/route.ts) re-encodes it again.
 */

const MAX_SIDE = 1600;

async function shrink(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  return blob && blob.size < file.size ? blob : file;
}

export async function uploadImage(file: File): Promise<{ url: string; id: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Зөвхөн зураг оруулна уу");
  const blob = await shrink(file);
  const body = new FormData();
  body.append("file", blob, file.name.replace(/\.\w+$/, "") + (blob.type === "image/webp" ? ".webp" : ""));
  const res = await fetch("/admin/upload", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; id?: string; error?: string };
  if (!res.ok || !data.url || !data.id) {
    throw new Error(data.error ?? (res.status === 413 ? "Зураг хэт том байна" : "Upload амжилтгүй"));
  }
  return { url: data.url, id: data.id };
}
