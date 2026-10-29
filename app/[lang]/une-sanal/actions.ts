"use server";

import type { FormErrorCode } from "@/content/common";
import { createQuote } from "@/lib/inquiries";
import { defaultLocale, isLocale } from "@/lib/locale";

type Field = "email" | "phone" | "name" | "company" | "message";

export type QuoteFormState = {
  ok: boolean;
  /** Error codes, translated by the form (Server Actions can't read the locale root param). */
  error?: FormErrorCode;
  errors?: Partial<Record<Field, FormErrorCode[]>>;
  /** Echoed back so the form keeps what the visitor typed after React resets it. */
  values?: Record<Field, string> & { products: string[] };
};

/** Validates and stores the quote form, then emails the team (lib/inquiries.ts). */
export async function submitQuote(_prev: QuoteFormState, formData: FormData): Promise<QuoteFormState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("website")) {
    return { ok: true };
  }

  const text = (key: string) => String(formData.get(key) ?? "");
  const values = {
    email: text("email"),
    phone: text("phone"),
    name: text("name"),
    company: text("company"),
    message: text("message"),
    products: formData.getAll("products").map(String),
  };

  const lang = text("lang");
  const res = await createQuote(values, isLocale(lang) ? lang : defaultLocale, text("g-recaptcha-response"));
  return res.ok ? { ok: true } : { ok: false, error: res.error, errors: res.errors, values };
}
