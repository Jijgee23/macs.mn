import "server-only";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyNewContact, notifyNewQuote, notifySupportReceived } from "@/lib/mail";
import { verifyRecaptcha } from "@/lib/recaptcha";
import {
  contactTopics,
  quoteProductIds,
  SUPPORT_MAX_BYTES,
  SUPPORT_MAX_EMAILS,
  SUPPORT_MAX_FILES,
  supportFileExtensions,
  supportTypes,
  supportUrgencies,
  type FormErrorCode,
} from "@/content/common";
import type { Locale } from "@/lib/locale";

/**
 * Spam checks (reCAPTCHA, then per-IP rate limit; the honeypot is checked in the
 * actions), validation and storage for the quote and contact forms. Quote requests
 * need an email (the quote is sent there); everything else, and the whole contact
 * form apart from the message, is optional. Support requests (existing customers) need
 * the organization, a phone, at least one email and the message, and may carry files.
 */

export type InquiryResult = {
  ok: boolean;
  error?: FormErrorCode;
  errors?: Partial<Record<string, FormErrorCode[]>>;
};

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

const code = (c: FormErrorCode) => c;

const optionalText = (max: number) =>
  z.string().trim().max(max, code("tooLong")).transform((v) => v || null);
const requiredText = (max: number) => z.string().trim().min(1, code("required")).max(max, code("tooLong"));
const email = z.string().trim().toLowerCase().min(1, code("required")).pipe(z.email(code("invalidEmail")));
const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === "" || z.email().safeParse(v).success, code("invalidEmail"))
  .transform((v) => v || null);

const isPhone = (v: string) => {
  const digits = v.replace(/\D/g, "").length;
  return /^[+\d][\d\s-]*$/.test(v) && digits >= 8 && digits <= 15;
};
const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || isPhone(v), code("invalidPhone"))
  .transform((v) => v || null);

const quoteSchema = z.object({
  email,
  phone: optionalPhone,
  name: optionalText(120),
  company: optionalText(200),
  message: optionalText(2000),
  products: z.array(z.enum(quoteProductIds)).max(quoteProductIds.length).catch([]),
});

const contactSchema = z.object({
  name: optionalText(120),
  email: optionalEmail,
  phone: optionalPhone,
  topic: z.enum(contactTopics).catch("general"),
  message: requiredText(4000),
});

/** "a@x.mn, b@y.mn" (commas, semicolons, spaces or new lines) → unique lowercase addresses. */
const emailList = z
  .string()
  .transform((v) => [...new Set(v.toLowerCase().split(/[\s,;]+/).filter(Boolean))])
  .pipe(
    z
      .array(z.email(code("invalidEmail")))
      .min(1, code("required"))
      .max(SUPPORT_MAX_EMAILS, code("tooManyEmails")),
  );

const supportSchema = z.object({
  company: requiredText(200),
  name: optionalText(120),
  phone: z.string().trim().min(1, code("required")).refine(isPhone, code("invalidPhone")),
  emails: emailList,
  type: z.enum(supportTypes).catch("other"),
  urgency: z.enum(supportUrgencies).catch("normal"),
  message: requiredText(4000),
});

const extensionOf = (name: string) => name.slice(name.lastIndexOf(".")).toLowerCase();

/** Drops empty inputs (no file chosen) and checks count, total size and extension. */
function checkFiles(files: File[]): { files: File[] } | { error: FormErrorCode } {
  const chosen = files.filter((f) => f.size > 0 && f.name);
  if (chosen.length > SUPPORT_MAX_FILES) return { error: "tooManyFiles" };
  if (chosen.reduce((sum, f) => sum + f.size, 0) > SUPPORT_MAX_BYTES) return { error: "filesTooLarge" };
  if (chosen.some((f) => !(supportFileExtensions as readonly string[]).includes(extensionOf(f.name)))) {
    return { error: "fileType" };
  }
  return { files: chosen };
}

/** Client IP as set by nginx (which overwrites any client-supplied X-Forwarded-For). */
async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

const since = () => new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

function invalid(error: z.ZodError): InquiryResult {
  return { ok: false, errors: z.flattenError(error).fieldErrors as InquiryResult["errors"] };
}

export async function createQuote(input: unknown, locale: Locale, captchaToken: string): Promise<InquiryResult> {
  const ip = await clientIp();
  if (!(await verifyRecaptcha(captchaToken, ip))) return { ok: false, error: "captcha" };

  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    if (ip && (await db.quoteRequest.count({ where: { ip, createdAt: { gte: since() } } })) >= RATE_LIMIT_MAX) {
      return { ok: false, error: "rateLimited" };
    }
    const record = await db.quoteRequest.create({ data: { ...parsed.data, locale, ip } });
    after(() => notifyNewQuote(record));
    return { ok: true };
  } catch (err) {
    console.error("[inquiry] failed to save quote request", err);
    return { ok: false, error: "unavailable" };
  }
}

export async function createContact(input: unknown, locale: Locale, captchaToken: string): Promise<InquiryResult> {
  const ip = await clientIp();
  if (!(await verifyRecaptcha(captchaToken, ip))) return { ok: false, error: "captcha" };

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    if (ip && (await db.contactMessage.count({ where: { ip, createdAt: { gte: since() } } })) >= RATE_LIMIT_MAX) {
      return { ok: false, error: "rateLimited" };
    }
    const record = await db.contactMessage.create({ data: { ...parsed.data, locale, ip } });
    after(() => notifyNewContact(record));
    return { ok: true };
  } catch (err) {
    console.error("[inquiry] failed to save contact message", err);
    return { ok: false, error: "unavailable" };
  }
}

export async function createSupport(
  input: unknown,
  files: File[],
  locale: Locale,
  captchaToken: string,
): Promise<InquiryResult> {
  const ip = await clientIp();
  if (!(await verifyRecaptcha(captchaToken, ip))) return { ok: false, error: "captcha" };

  const parsed = supportSchema.safeParse(input);
  const checked = checkFiles(files);
  if (!parsed.success || "error" in checked) {
    const errors = parsed.success ? {} : invalid(parsed.error).errors;
    return { ok: false, errors: { ...errors, ...("error" in checked && { files: [checked.error] }) } };
  }

  try {
    if (ip && (await db.supportRequest.count({ where: { ip, createdAt: { gte: since() } } })) >= RATE_LIMIT_MAX) {
      return { ok: false, error: "rateLimited" };
    }
    const attachments = await Promise.all(
      checked.files.map(async (f) => ({
        name: f.name.slice(0, 200),
        mime: f.type || "application/octet-stream",
        size: f.size,
        data: Buffer.from(await f.arrayBuffer()),
      })),
    );
    const record = await db.supportRequest.create({
      data: { ...parsed.data, locale, ip, attachments: { create: attachments } },
      include: { attachments: { select: { name: true } } },
    });
    after(() => notifySupportReceived(record));
    return { ok: true };
  } catch (err) {
    console.error("[inquiry] failed to save support request", err);
    return { ok: false, error: "unavailable" };
  }
}
