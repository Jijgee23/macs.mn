"use server";

import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyNewQuote } from "@/lib/mail";
import { quoteProductIds, type FormErrorCode } from "@/content/common";
import { defaultLocale, isLocale } from "@/lib/locale";
import {
  emailField,
  fieldErrors,
  getClientIp,
  optionalText,
  phoneField,
  RATE_LIMIT_MAX,
  rateLimitSince,
} from "@/lib/forms";

type Field = "email" | "phone" | "name" | "company" | "message";

export type QuoteFormState = {
  ok: boolean;
  /** Error codes, translated by the form (Server Actions can't read the locale root param). */
  error?: FormErrorCode;
  errors?: Partial<Record<Field, FormErrorCode[]>>;
  /** Echoed back so the form keeps what the visitor typed after React resets it. */
  values?: Record<Field, string> & { products: string[] };
};

const schema = z.object({
  email: emailField,
  phone: phoneField,
  name: optionalText(120),
  company: optionalText(200),
  message: optionalText(2000),
  products: z.array(z.enum(quoteProductIds)).max(quoteProductIds.length),
});

export async function submitQuote(_prev: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("website")) {
    return { ok: true };
  }

  const text = (key: string) => String(formData.get(key) ?? "");
  const lang = text("lang");
  const locale = isLocale(lang) ? lang : defaultLocale;
  const values = {
    email: text("email"),
    phone: text("phone"),
    name: text("name"),
    company: text("company"),
    message: text("message"),
    products: formData.getAll("products").map(String),
  };

  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors<Field>(parsed.error), values };
  }

  const ip = await getClientIp();

  if (ip) {
    const recent = await db.quoteRequest.count({ where: { ip, createdAt: { gte: rateLimitSince() } } });
    if (recent >= RATE_LIMIT_MAX) {
      return { ok: false, error: "rateLimited", values };
    }
  }

  const quote = await db.quoteRequest.create({ data: { ...parsed.data, locale, ip } });

  after(() => notifyNewQuote(quote));

  return { ok: true };
}
