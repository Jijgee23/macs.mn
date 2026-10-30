"use server";

import type { FormErrorCode } from "@/content/common";
import { createSupport } from "@/lib/inquiries";
import { defaultLocale, isLocale } from "@/lib/locale";

type Field = "company" | "name" | "phone" | "emails" | "type" | "urgency" | "message";

export type SupportFormState = {
  ok: boolean;
  error?: FormErrorCode;
  errors?: Partial<Record<Field | "files", FormErrorCode[]>>;
  values?: Record<Field, string>;
};

/** Validates and stores a customer request with its files, then emails everyone listed (lib/inquiries.ts). */
export async function submitSupport(_prev: SupportFormState, formData: FormData): Promise<SupportFormState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("website")) {
    return { ok: true };
  }

  const text = (key: string) => String(formData.get(key) ?? "");
  const values = {
    company: text("company"),
    name: text("name"),
    phone: text("phone"),
    emails: text("emails"),
    type: text("type"),
    urgency: text("urgency"),
    message: text("message"),
  };
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  const lang = text("lang");
  const res = await createSupport(values, files, isLocale(lang) ? lang : defaultLocale, text("g-recaptcha-response"));
  return res.ok ? { ok: true } : { ok: false, error: res.error, errors: res.errors, values };
}
