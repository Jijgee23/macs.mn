import "server-only";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { loadAllContent } from "@/lib/content";
import { notifyNewContact, notifyNewContract, notifyNewQuote, notifySupportReceived } from "@/lib/mail";
import { verifyRecaptcha } from "@/lib/recaptcha";
import {
  contactTopics,
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
  products: z.array(z.string().trim().max(120)).max(30).catch([]),
});

const regNoText = z.string().trim().min(1, code("required")).transform((v) => v.replace(/\s+/g, "").toUpperCase());
/** Organization register: 7 digits. */
const orgRegNo = regNoText.refine((v) => /^\d{7}$/.test(v), code("invalidRegNo"));
/** Individual register: 2 letters + 8 digits (e.g. УБ12345678). */
const personRegNo = regNoText.refine((v) => /^\p{L}{2}\d{8}$/u.test(v), code("invalidRegNo"));
const userCount = z
  .string()
  .trim()
  .min(1, code("required"))
  .refine((v) => /^\d{1,6}$/.test(v) && Number(v) >= 1, code("invalidNumber"))
  .transform(Number);

const requiredPhone = z.string().trim().min(1, code("required")).refine(isPhone, code("invalidPhone"));

const contractCommon = {
  address: requiredText(300),
  phone: requiredPhone,
  email,
  products: z.array(z.string().trim().max(120)).max(30).catch([]),
  userCount,
  message: optionalText(2000),
};

const orgContractSchema = z.object({
  regNo: orgRegNo,
  orgName: requiredText(200),
  approverLastName: requiredText(80),
  approverFirstName: requiredText(80),
  approverPosition: requiredText(120),
  approverPhone: requiredPhone,
  repLastName: requiredText(80),
  repFirstName: requiredText(80),
  repPosition: requiredText(120),
  repPhone: requiredPhone,
  ...contractCommon,
});

const personContractSchema = z.object({
  regNo: personRegNo,
  personLastName: requiredText(80),
  personFirstName: requiredText(80),
  ...contractCommon,
});

/** An individual signs for themselves: stored like an organization whose name, approver and representative are that person. */
const personAsContract = ({ personLastName: last, personFirstName: first, ...rest }: z.infer<typeof personContractSchema>) => ({
  ...rest,
  applicantType: "PERSON",
  orgName: `${last} ${first}`,
  approverLastName: last,
  approverFirstName: first,
  approverPosition: "",
  approverPhone: rest.phone,
  repLastName: last,
  repFirstName: first,
  repPosition: "",
  repPhone: rest.phone,
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
    // Only products the site actually lists are accepted.
    const { content } = await loadAllContent();
    const allowed = new Set([...content[locale].products.items.filter((p) => !p.hidden).map((p) => p.name)]);
    parsed.data.products = [...new Set(parsed.data.products)].filter((p) => allowed.has(p));

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

export async function createContract(input: unknown, locale: Locale, captchaToken: string): Promise<InquiryResult> {
  const ip = await clientIp();
  if (!(await verifyRecaptcha(captchaToken, ip))) return { ok: false, error: "captcha" };

  const isPerson = (input as { type?: unknown } | null)?.type === "PERSON";
  const result = isPerson ? personContractSchema.safeParse(input) : orgContractSchema.safeParse(input);
  if (!result.success) return invalid(result.error);
  const parsed = {
    data: isPerson
      ? personAsContract(result.data as z.infer<typeof personContractSchema>)
      : { ...(result.data as z.infer<typeof orgContractSchema>), applicantType: "ORG" },
  };

  try {
    // Only products the site actually lists are accepted, and at least one must be chosen.
    const { content } = await loadAllContent();
    const allowed = new Set(content[locale].products.items.filter((p) => !p.hidden).map((p) => p.name));
    const products = [...new Set(parsed.data.products)].filter((p) => allowed.has(p));
    if (products.length === 0) return { ok: false, errors: { products: ["required"] } };

    if (ip && (await db.contractRequest.count({ where: { ip, createdAt: { gte: since() } } })) >= RATE_LIMIT_MAX) {
      return { ok: false, error: "rateLimited" };
    }
    const record = await db.contractRequest.create({ data: { ...parsed.data, products, locale, ip } });
    after(() => notifyNewContract(record));
    return { ok: true };
  } catch (err) {
    console.error("[inquiry] failed to save contract request", err);
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
