import "server-only";
import { headers } from "next/headers";
import { formErrorCodes, type FormErrorCode } from "@/content/common";

/**
 * macs.mn has no database. Quote requests and contact messages are stored by the
 * docs site (macs_documents: app/api/site/*, lib/inquiries.ts), which also validates
 * them, emails the team and lists them in its admin.
 */

export type InquiryResponse = {
  ok: boolean;
  error?: FormErrorCode;
  errors?: Partial<Record<string, FormErrorCode[]>>;
};

const TIMEOUT_MS = 10_000;

const isCode = (v: unknown): v is FormErrorCode =>
  typeof v === "string" && (formErrorCodes as readonly string[]).includes(v);

/** Client IP as set by Caddy (which drops any client-supplied X-Forwarded-For). */
async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

export async function postInquiry(
  kind: "quote" | "contact",
  payload: Record<string, unknown>,
): Promise<InquiryResponse> {
  const base = process.env.DOCS_API_URL ?? "https://docs.macs.mn";
  const key = process.env.SITE_API_KEY;
  if (!key) {
    console.error("[inquiry] SITE_API_KEY is not set");
    return { ok: false, error: "unavailable" };
  }

  try {
    const res = await fetch(`${base}/api/site/${kind}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ ...payload, ip: await clientIp() }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    if (res.ok) return { ok: true };

    if (res.status === 400 || res.status === 429) {
      const body = (await res.json().catch(() => ({}))) as InquiryResponse;
      const errors = Object.fromEntries(
        Object.entries(body.errors ?? {}).map(([field, codes]) => [field, (codes ?? []).filter(isCode)]),
      );
      return { ok: false, error: isCode(body.error) ? body.error : undefined, errors };
    }

    console.error(`[inquiry] docs API responded ${res.status} for ${kind}`);
  } catch (err) {
    console.error(`[inquiry] docs API unreachable for ${kind}`, err);
  }
  return { ok: false, error: "unavailable" };
}
