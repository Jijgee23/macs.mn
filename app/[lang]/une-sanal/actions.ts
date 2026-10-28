"use server";

import type { FormErrorCode } from "@/content/common";
import { postInquiry } from "@/lib/docs-api";

type Field = "email" | "phone" | "name" | "company" | "message";

export type QuoteFormState = {
  ok: boolean;
  /** Error codes, translated by the form (Server Actions can't read the locale root param). */
  error?: FormErrorCode;
  errors?: Partial<Record<Field, FormErrorCode[]>>;
  /** Echoed back so the form keeps what the visitor typed after React resets it. */
  values?: Record<Field, string> & { products: string[] };
};

/** Forwards the quote form to the docs site, which validates, stores and emails it. */
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

  const res = await postInquiry("quote", { ...values, lang: text("lang") });
  return res.ok ? { ok: true } : { ok: false, error: res.error, errors: res.errors, values };
}
