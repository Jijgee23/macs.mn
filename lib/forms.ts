import "server-only";
import { headers } from "next/headers";
import { z } from "zod";
import type { FormErrorCode } from "@/content/common";

/** Zod messages are FormErrorCode values; the forms translate them. */
const code = (c: FormErrorCode) => c;

export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const RATE_LIMIT_MAX = 3;

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, code("tooLong"))
    .transform((v) => v || null);

export const requiredText = (max: number) =>
  z.string().trim().min(1, code("required")).max(max, code("tooLong"));

export const emailField = z.string().trim().toLowerCase().pipe(z.email(code("invalidEmail")));

const isPhone = (v: string) => {
  const digits = v.replace(/\D/g, "").length;
  return /^[+\d][\d\s-]*$/.test(v) && digits >= 8 && digits <= 15;
};

export const phoneField = z.string().trim().refine(isPhone, code("invalidPhone"));

export const optionalPhoneField = z
  .string()
  .trim()
  .refine((v) => v === "" || isPhone(v), code("invalidPhone"))
  .transform((v) => v || null);

export function fieldErrors<F extends string>(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Partial<Record<F, FormErrorCode[]>>;
}

/** Client IP as set by Caddy (which drops any client-supplied X-Forwarded-For). */
export async function getClientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

export const rateLimitSince = () => new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
