"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh, revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, hashPassword, requireAdmin, safeNext, startSession, verifyPassword } from "@/lib/auth";
import { CONTENT_TAG } from "@/lib/content";
import { contactInfoSchema, sectionSchemas, type SectionKey } from "@/content/schema";
import { fieldLabels } from "@/content/admin-labels";

/* ---------- Session ---------- */

export type FormState = { ok?: boolean; error?: string };
export type LoginState = { error?: string };

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;

/**
 * Failed logins per IP+email, kept in memory: enough to slow down password guessing
 * on a single server, and resets on restart.
 */
const loginFailures = new Map<string, number[]>();

function recentFailures(key: string) {
  const cutoff = Date.now() - LOGIN_WINDOW_MS;
  const times = (loginFailures.get(key) ?? []).filter((t) => t > cutoff);
  if (times.length) loginFailures.set(key, times);
  else loginFailures.delete(key);
  return times;
}

/** Compared against when the email is unknown, so both cases take the same time. */
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword("not-a-real-password"));

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Имэйл болон нууц үгээ оруулна уу" };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${ip}|${email}`;
  const failures = recentFailures(key);
  if (failures.length >= LOGIN_MAX_FAILURES) {
    const minutes = Math.ceil((failures[0] + LOGIN_WINDOW_MS - Date.now()) / 60000);
    return { error: `Олон удаа буруу оролдлоо. ${minutes} минутын дараа дахин оролдоно уу` };
  }

  const user = await db.adminUser.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid) {
    failures.push(Date.now());
    loginFailures.set(key, failures);
    const left = LOGIN_MAX_FAILURES - failures.length;
    return {
      error:
        left > 0 && left <= 2
          ? `Имэйл эсвэл нууц үг буруу байна. ${left} оролдлого үлдлээ`
          : "Имэйл эсвэл нууц үг буруу байна",
    };
  }

  loginFailures.delete(key);
  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSession(user, formData.get("remember") === "on");

  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/admin/login");
}

/* ---------- Content ---------- */

export type SaveResult = { ok: boolean; errors?: string[]; savedAt?: string };

const LOCALE_LABEL: Record<string, string> = { mn: "MN", en: "EN", all: "" };

function issuePaths(locale: string, error: z.ZodError) {
  return error.issues.map((i) =>
    [LOCALE_LABEL[locale], ...i.path.map((p) => (typeof p === "number" ? `#${p + 1}` : (fieldLabels[String(p)] ?? String(p))))]
      .filter(Boolean)
      .join(" › ") + `: ${i.message}`,
  );
}

/** First place where the MN and EN trees differ in shape (list lengths / keys), if any. */
function shapeMismatch(a: unknown, b: unknown, path: string[] = []): string | null {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return [...path, "мөрийн тоо"].join(" › ");
    for (let i = 0; i < a.length; i++) {
      const m = shapeMismatch(a[i], b[i], [...path, `#${i + 1}`]);
      if (m) return m;
    }
  } else if (a && b && typeof a === "object" && typeof b === "object") {
    for (const k of Object.keys(a)) {
      const m = shapeMismatch((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], [...path, k]);
      if (m) return m;
    }
  }
  return null;
}

/**
 * Saves one content section. `payload` is JSON: { mn, en } for translated sections,
 * { all } for the language-independent "contact" section.
 */
export async function saveSection(key: string, payload: string): Promise<SaveResult> {
  const admin = await requireAdmin();

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(payload);
  } catch {
    return { ok: false, errors: ["Өгөгдөл уншигдсангүй"] };
  }

  const rows: { locale: string; data: unknown }[] = [];
  const errors: string[] = [];

  if (key === "contact") {
    const parsed = contactInfoSchema.safeParse(data.all);
    if (parsed.success) rows.push({ locale: "all", data: parsed.data });
    else errors.push(...issuePaths("all", parsed.error));
  } else if (key in sectionSchemas) {
    const schema = sectionSchemas[key as SectionKey];
    for (const locale of ["mn", "en"]) {
      const parsed = schema.safeParse(data[locale]);
      if (parsed.success) rows.push({ locale, data: parsed.data });
      else errors.push(...issuePaths(locale, parsed.error));
    }
    const mismatch = errors.length === 0 ? shapeMismatch(data.mn, data.en) : null;
    if (mismatch) errors.push(`MN ба EN ялгаатай: ${mismatch}`);
  } else {
    return { ok: false, errors: ["Ийм хэсэг байхгүй"] };
  }

  if (errors.length) return { ok: false, errors };

  await db.$transaction(
    rows.map((r) =>
      db.contentSection.upsert({
        where: { key_locale: { key, locale: r.locale } },
        create: { key, locale: r.locale, data: r.data as object, updatedBy: admin.email },
        update: { data: r.data as object, updatedBy: admin.email },
      }),
    ),
  );
  updateTag(CONTENT_TAG);
  return { ok: true, savedAt: new Date().toISOString() };
}

/* ---------- Requests ---------- */

const updateSchema = z.object({
  kind: z.enum(["quote", "contact"]),
  id: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "CLOSED"]),
  note: z
    .string()
    .trim()
    .max(2000)
    .transform((v) => v || null),
});

/** Updates status/note on a quote request or a contact message. */
export async function updateRequest(formData: FormData) {
  await requireAdmin();

  const parsed = updateSchema.safeParse({
    kind: formData.get("kind"),
    id: formData.get("id"),
    status: formData.get("status"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return;

  const { kind, id, ...data } = parsed.data;
  if (kind === "quote") {
    await db.quoteRequest.update({ where: { id }, data });
    revalidatePath("/admin/requests");
  } else {
    await db.contactMessage.update({ where: { id }, data });
    revalidatePath("/admin/messages");
  }
  revalidatePath("/admin");
}

/* ---------- Admin users ---------- */

const password = z.string().min(8, "Нууц үг дор хаяж 8 тэмдэгт байна").max(200);

const newAdminSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Имэйл буруу байна")),
  name: z
    .string()
    .trim()
    .max(120)
    .transform((v) => v || null),
  password,
});

export async function createAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = newAdminSchema.safeParse({
    email: formData.get("email") ?? "",
    name: formData.get("name") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { email, name } = parsed.data;
  if (await db.adminUser.findUnique({ where: { email } })) {
    return { error: "Энэ имэйлтэй админ аль хэдийн бүртгэлтэй" };
  }
  await db.adminUser.create({ data: { email, name, passwordHash: await hashPassword(parsed.data.password) } });
  refresh();
  return { ok: true };
}

export async function deleteAdmin(id: string) {
  const me = await requireAdmin();
  if (id === me.id) return;
  if ((await db.adminUser.count()) <= 1) return;
  await db.adminUser.delete({ where: { id } });
  revalidatePath("/admin/users");
}

export async function setAdminPassword(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = password.safeParse(formData.get("password") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.adminUser.update({ where: { id }, data: { passwordHash: await hashPassword(parsed.data) } });
  return { ok: true };
}

export async function changeOwnPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: me.id } });

  if (!(await verifyPassword(String(formData.get("current") ?? ""), user.passwordHash))) {
    return { error: "Одоогийн нууц үг буруу байна" };
  }
  const parsed = password.safeParse(formData.get("password") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data !== formData.get("confirm")) return { error: "Шинэ нууц үг таарахгүй байна" };

  await db.adminUser.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(parsed.data) } });
  return { ok: true };
}
