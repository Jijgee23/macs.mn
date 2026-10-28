"use server";

import type { FormErrorCode } from "@/content/common";
import { postInquiry } from "@/lib/docs-api";

type Field = "name" | "email" | "phone" | "topic" | "message";

export type ContactFormState = {
  ok: boolean;
  error?: FormErrorCode;
  errors?: Partial<Record<Field, FormErrorCode[]>>;
  values?: Record<Field, string>;
};

/** Forwards the contact form to the docs site, which validates, stores and emails it. */
export async function submitContact(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("website")) {
    return { ok: true };
  }

  const text = (key: string) => String(formData.get(key) ?? "");
  const values = {
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    topic: text("topic"),
    message: text("message"),
  };

  const res = await postInquiry("contact", { ...values, lang: text("lang") });
  return res.ok ? { ok: true } : { ok: false, error: res.error, errors: res.errors, values };
}
