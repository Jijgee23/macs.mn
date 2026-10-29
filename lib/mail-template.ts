/**
 * Notification email layout, rendered both as plain text and as email-client-safe HTML
 * (tables + inline styles, PNG logo — Gmail and Outlook ignore <style> blocks and SVG).
 * Pure: no server-only imports, so scripts can render a preview.
 */

export type MailModel = {
  lang: "mn" | "en";
  /** Small label above the title, e.g. the request type */
  kicker: string;
  title: string;
  intro: string;
  sectionTitle: string;
  fields: { label: string; value: string | null | undefined }[];
  message?: { label: string; value: string | null | undefined };
  regards: string;
  company: string;
  contactLine: string[];
  siteUrl: string;
  footnote: string;
};

const BRAND = "#6E122F";
const INK = "#18181b";
const MUTED = "#71717a";
const LINE = "#ececef";
const SOFT = "#f7f7f8";
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const html = (s: string) => esc(s).replace(/\r?\n/g, "<br>");
const shown = (v: string | null | undefined) => v?.trim() || "—";

/** Only fields the visitor actually filled in. */
const filled = (m: MailModel) => m.fields.filter((f) => f.value?.trim());

export function renderText(m: MailModel) {
  return [
    m.title,
    "",
    m.intro,
    "",
    m.sectionTitle,
    ...filled(m).map((f) => `${f.label}: ${shown(f.value)}`),
    ...(m.message ? [`${m.message.label}: ${shown(m.message.value)}`] : []),
    "",
    m.regards,
    m.company,
    m.contactLine.join(" · "),
    "",
    m.footnote,
  ].join("\n");
}

export function renderHtml(m: MailModel) {
  const rows = filled(m)
    .map(
      (f, i) => `
        <tr>
          <td style="padding:10px 14px;${i ? `border-top:1px solid ${LINE};` : ""}color:${MUTED};font-size:13px;width:38%;vertical-align:top;">${esc(f.label)}</td>
          <td style="padding:10px 14px;${i ? `border-top:1px solid ${LINE};` : ""}color:${INK};font-size:14px;font-weight:600;vertical-align:top;">${html(shown(f.value))}</td>
        </tr>`,
    )
    .join("");

  const message = m.message?.value?.trim()
    ? `
      <tr><td style="padding:20px 32px 0;">
        <p style="margin:0 0 8px;color:${MUTED};font-size:13px;">${esc(m.message.label)}</p>
        <div style="background:${SOFT};border-left:3px solid ${BRAND};border-radius:6px;padding:14px 16px;color:${INK};font-size:14px;line-height:1.6;">${html(m.message.value)}</div>
      </td></tr>`
    : "";

  return `<!doctype html>
<html lang="${m.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(m.title)}</title>
</head>
<body style="margin:0;padding:0;background:${SOFT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(m.intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SOFT};font-family:${FONT};">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
      <tr><td style="height:4px;background:${BRAND};font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:middle;"><img src="${m.siteUrl}/email-logo.png" width="36" height="36" alt="MACS" style="display:block;border:0;border-radius:8px;"></td>
          <td style="vertical-align:middle;padding-left:10px;font-size:16px;font-weight:700;color:${INK};">MACS <span style="color:${MUTED};font-weight:600;">ERP</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px 32px 0;">
        <p style="margin:0 0 6px;color:${BRAND};font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${esc(m.kicker)}</p>
        <h1 style="margin:0;color:${INK};font-size:22px;line-height:1.3;font-weight:700;">${esc(m.title)}</h1>
        <p style="margin:12px 0 0;color:#3f3f46;font-size:15px;line-height:1.6;">${html(m.intro)}</p>
      </td></tr>
${
  rows
    ? `
      <tr><td style="padding:24px 32px 0;">
        <p style="margin:0 0 8px;color:${INK};font-size:14px;font-weight:700;">${esc(m.sectionTitle)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${LINE};border-radius:10px;border-collapse:separate;">${rows}
        </table>
      </td></tr>`
    : ""
}${message}
      <tr><td style="padding:28px 32px 28px;">
        <p style="margin:0;color:#3f3f46;font-size:14px;line-height:1.6;">${esc(m.regards)}<br><strong style="color:${INK};">${esc(m.company)}</strong></p>
      </td></tr>
      <tr><td style="padding:16px 32px;background:${SOFT};border-top:1px solid ${LINE};color:${MUTED};font-size:12px;line-height:1.6;">
        ${m.contactLine.map(esc).join(" &nbsp;·&nbsp; ")}<br>
        <a href="${m.siteUrl}" style="color:${BRAND};text-decoration:none;">${esc(m.siteUrl.replace(/^https?:\/\//, ""))}</a>
        <p style="margin:10px 0 0;color:#a1a1aa;font-size:11px;">${esc(m.footnote)}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
