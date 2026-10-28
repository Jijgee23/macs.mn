"use server";

import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyNewContact } from "@/lib/mail";
import { contactTopics, type FormErrorCode } from "@/content/common";
import { defaultLocale, isLocale } from "@/lib/locale";
import {
  emailField,
  fieldErrors,
  getClientIp,
  optionalPhoneField,
  optionalText,
  RATE_LIMIT_MAX,
  rateLimitSince,
  requiredText,
} from "@/lib/forms";

type Field = "name" | "email" | "phone" | "topic" | "message";

export type ContactFormState = {
  ok: boolean;
  error?: FormErrorCode;
  errors?: Partial<Record<Field, FormErrorCode[]>>;
  values?: Record<Field, string>;
};

const schema = z.object({
  name: optionalText(120),
  email: emailField,
  phone: optionalPhoneField,
  topic: z.enum(contactTopics).catch("general"),
  message: requiredText(4000),
});

export async function submitContact(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("website")) {
    return { ok: true };
  }

  const text = (key: string) => String(formData.get(key) ?? "");
  const lang = text("lang");
  const locale = isLocale(lang) ? lang : defaultLocale;
  const values = {
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    topic: text("topic"),
    message: text("message"),
  };

  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors<Field>(parsed.error), values };
  }

  const ip = await getClientIp();

  if (ip) {
    const recent = await db.contactMessage.count({ where: { ip, createdAt: { gte: rateLimitSince() } } });
    if (recent >= RATE_LIMIT_MAX) {
      return { ok: false, error: "rateLimited", values };
    }
  }

  const message = await db.contactMessage.create({ data: { ...parsed.data, locale, ip } });

  after(() => notifyNewContact(message));

  return { ok: true };
}
