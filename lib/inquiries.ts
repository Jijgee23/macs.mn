import "server-only";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyNewContact, notifyNewQuote } from "@/lib/mail";
import { contactTopics, quoteProductIds, type FormErrorCode } from "@/content/common";
import type { Locale } from "@/lib/locale";

/** Validation, rate limiting and storage for the quote and contact forms. */

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
const email = z.string().trim().toLowerCase().pipe(z.email(code("invalidEmail")));

const isPhone = (v: string) => {
  const digits = v.replace(/\D/g, "").length;
  return /^[+\d][\d\s-]*$/.test(v) && digits >= 8 && digits <= 15;
};
const phone = z.string().trim().refine(isPhone, code("invalidPhone"));
const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || isPhone(v), code("invalidPhone"))
  .transform((v) => v || null);

const quoteSchema = z.object({
  email,
  phone,
  name: optionalText(120),
  company: optionalText(200),
  message: optionalText(2000),
  products: z.array(z.enum(quoteProductIds)).max(quoteProductIds.length).catch([]),
});

const contactSchema = z.object({
  name: optionalText(120),
  email,
  phone: optionalPhone,
  topic: z.enum(contactTopics).catch("general"),
  message: requiredText(4000),
});

/** Client IP as set by nginx (which overwrites any client-supplied X-Forwarded-For). */
async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

const since = () => new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

function invalid(error: z.ZodError): InquiryResult {
  return { ok: false, errors: z.flattenError(error).fieldErrors as InquiryResult["errors"] };
}

export async function createQuote(input: unknown, locale: Locale): Promise<InquiryResult> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const ip = await clientIp();
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

export async function createContact(input: unknown, locale: Locale): Promise<InquiryResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const ip = await clientIp();
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
