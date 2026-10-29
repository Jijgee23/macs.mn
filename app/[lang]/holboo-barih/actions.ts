"use server";

import type { FormErrorCode } from "@/content/common";
import { createContact } from "@/lib/inquiries";
import { defaultLocale, isLocale } from "@/lib/locale";

type Field = "name" | "email" | "phone" | "topic" | "message";

export type ContactFormState = {
  ok: boolean;
  error?: FormErrorCode;
  errors?: Partial<Record<Field, FormErrorCode[]>>;
  values?: Record<Field, string>;
};

/** Validates and stores the contact form, then emails the team (lib/inquiries.ts). */
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

  const lang = text("lang");
  const res = await createContact(values, isLocale(lang) ? lang : defaultLocale);
  return res.ok ? { ok: true } : { ok: false, error: res.error, errors: res.errors, values };
}
