import "server-only";

/**
 * Google reCAPTCHA v2 ("I'm not a robot"). Keys come from google.com/recaptcha/admin;
 * without RECAPTCHA_SECRET_KEY the check is skipped (local development).
 */

export const recaptchaSiteKey = () => process.env.RECAPTCHA_SITE_KEY || null;

export async function verifyRecaptcha(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) console.warn("[recaptcha] rejected", data["error-codes"]);
    return data.success === true;
  } catch (err) {
    // Google unreachable: don't lose real requests; honeypot and rate limit still apply.
    console.error("[recaptcha] verification failed, allowing request", err);
    return true;
  }
}
