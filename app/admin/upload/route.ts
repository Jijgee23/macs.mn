import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 1600;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const DOC_MAX_BYTES = 15 * 1024 * 1024;
const OOXML = "application/vnd.openxmlformats-officedocument";
/** Brochure documents by extension: served mime and the magic bytes a genuine file starts with. */
const DOCS: Record<string, { mime: string; magic: number[] }> = {
  pdf: { mime: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  ppt: { mime: "application/vnd.ms-powerpoint", magic: [0xd0, 0xcf, 0x11, 0xe0] },
  pptx: { mime: `${OOXML}.presentationml.presentation`, magic: [0x50, 0x4b, 0x03, 0x04] },
  doc: { mime: "application/msword", magic: [0xd0, 0xcf, 0x11, 0xe0] },
  docx: { mime: `${OOXML}.wordprocessingml.document`, magic: [0x50, 0x4b, 0x03, 0x04] },
  xls: { mime: "application/vnd.ms-excel", magic: [0xd0, 0xcf, 0x11, 0xe0] },
  xlsx: { mime: `${OOXML}.spreadsheetml.sheet`, magic: [0x50, 0x4b, 0x03, 0x04] },
};

/** Stores a document as-is (after checking extension, size and signature). */
async function saveDocument(file: File, email: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const kind = DOCS[ext];
  if (!kind) return NextResponse.json({ error: "PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX файл оруулна уу" }, { status: 400 });
  if (file.size > DOC_MAX_BYTES) return NextResponse.json({ error: "Файл 15MB-аас ихгүй байна" }, { status: 400 });
  const data = Buffer.from(await file.arrayBuffer());
  if (!kind.magic.every((b, i) => data[i] === b)) {
    return NextResponse.json({ error: "Файл эвдэрсэн эсвэл төрөл нь таарахгүй байна" }, { status: 400 });
  }
  const name = file.name.replace(/[\\/\r\n"]/g, "_").slice(-150);
  const media = await db.media.create({
    data: { mime: kind.mime, data, width: 0, height: 0, size: data.length, name, createdBy: email },
    select: { id: true },
  });
  return NextResponse.json({ url: `/media/${media.id}`, id: media.id, name });
}

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
  if (form?.get("kind") === "document") return saveDocument(file, admin.email);
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
