"use server";

import type { FormErrorCode } from "@/content/common";
import { createContract } from "@/lib/inquiries";
import { defaultLocale, isLocale } from "@/lib/locale";
import { contractFields, type ContractField } from "./copy";

export type ContractFormState = {
  ok: boolean;
  /** Error codes, translated by the form (Server Actions can't read the locale root param). */
  error?: FormErrorCode;
  errors?: Partial<Record<ContractField | "products", FormErrorCode[]>>;
  /** Echoed back so the form keeps what the visitor typed after React resets it. */
  values?: Record<ContractField, string> & { products: string[] };
};

/** Validates and stores the contract request, then emails the team and the visitor (lib/inquiries.ts). */
export async function submitContract(_prev: ContractFormState, formData: FormData): Promise<ContractFormState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("website")) return { ok: true };

  const text = (key: string) => String(formData.get(key) ?? "");
  const values = {
    ...(Object.fromEntries(contractFields.map((f) => [f, text(f)])) as Record<ContractField, string>),
    products: formData.getAll("products").map(String),
  };

  const lang = text("lang");
  const res = await createContract(values, isLocale(lang) ? lang : defaultLocale, text("g-recaptcha-response"));
  return res.ok ? { ok: true } : { ok: false, error: res.error, errors: res.errors as ContractFormState["errors"], values };
}
