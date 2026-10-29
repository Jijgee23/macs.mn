import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 1600;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Admin image upload (multipart field "file"). The browser already shrinks images
 * (components/admin/upload.ts) to stay under nginx's 1MB body limit; here they are
 * re-encoded to WebP ≤1600px, which also strips EXIF/GPS data.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Файл олдсонгүй" }, { status: 400 });
  if (!TYPES.has(file.type)) return NextResponse.json({ error: "Зөвхөн JPG, PNG, WebP, GIF зураг" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Зураг 8MB-аас ихгүй байна" }, { status: 400 });

  try {
    const { data, info } = await sharp(Buffer.from(await file.arrayBuffer()), { animated: false })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    const media = await db.media.create({
      data: { mime: "image/webp", data, width: info.width, height: info.height, size: info.size, createdBy: admin.email },
      select: { id: true, width: true, height: true },
    });
    return NextResponse.json({ url: `/media/${media.id}`, id: media.id, width: media.width, height: media.height });
  } catch (err) {
    console.error("[upload] failed", err);
    return NextResponse.json({ error: "Зургийг уншиж чадсангүй" }, { status: 400 });
  }
}
