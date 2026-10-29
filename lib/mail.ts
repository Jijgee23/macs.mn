import "server-only";
import nodemailer from "nodemailer";
import type { ContactMessage, QuoteRequest } from "@prisma/client";
import type { ContactTopic, QuoteProductId } from "@/content/common";
import { loadAllContent } from "@/lib/content";
import { isLocale, type Locale } from "@/lib/locale";

/**
 * One email per request: from SMTP_FROM (no_reply@infosystems.mn) to NOTIFY_TO
 * (contact@infosystems.mn), with the visitor in CC when they left an email address —
 * that copy is their "we received it" confirmation, so the text addresses them.
 */

function transport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

/** Product / topic labels as edited in /admin/content, in the given language. */
export async function inquiryLabels(locale: Locale = "mn") {
  const { content, contact } = await loadAllContent();
  const t = content[locale];
  return {
    company: t.company,
    contact,
    product: (id: string) => t.quote.form.products[id as QuoteProductId] ?? id,
    topic: (id: string) => t.contactPage.form.topics[id as ContactTopic] ?? id,
  };
}

const copy = {
  mn: {
    quoteSubject: "Үнийн саналын хүсэлт",
    received: (hours: string) =>
      `Сайн байна уу,\n\nТаны хүсэлтийг хүлээн авлаа. Манай мэргэжилтэн ажлын цагаар (${hours}) тантай удахгүй холбогдоно.`,
    yours: "Таны илгээсэн мэдээлэл:",
    name: "Нэр",
    company: "Байгууллага",
    email: "Имэйл",
    phone: "Утас",
    products: "Сонирхож буй систем",
    topic: "Сэдэв",
    message: "Мессеж",
    regards: "Хүндэтгэсэн,",
    noReply: "Энэ мэйл автоматаар илгээгдсэн тул хариу бичих шаардлагагүй.",
  },
  en: {
    quoteSubject: "Price quote request",
    received: (hours: string) =>
      `Hello,\n\nWe have received your request. Our specialist will contact you soon during business hours (${hours}).`,
    yours: "Your submission:",
    name: "Name",
    company: "Organization",
    email: "Email",
    phone: "Phone",
    products: "Systems of interest",
    topic: "Topic",
    message: "Message",
    regards: "Best regards,",
    noReply: "This is an automated message sent from a no-reply address.",
  },
} as const;

const localeOf = (l: string): Locale => (isLocale(l) ? l : "mn");
const line = (label: string, value: string | null | undefined) => `${label}: ${value?.trim() || "—"}`;

function signoff(c: (typeof copy)[Locale], label: Awaited<ReturnType<typeof inquiryLabels>>) {
  const phone = label.contact.phones[0]?.number;
  return [c.regards, label.company.name, [phone, label.contact.email, "macs.mn"].filter(Boolean).join(" · ")].join("\n");
}

/** Never throws — the request is already saved and listed in /admin. */
async function send(id: string, subject: string, text: string, visitorEmail: string | null) {
  const mailer = transport();
  const to = process.env.NOTIFY_TO;
  if (!mailer || !to) {
    console.warn(`[notify] SMTP not configured; skipped email for ${id}`);
    return;
  }
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      cc: visitorEmail ?? undefined,
      replyTo: visitorEmail ?? undefined,
      subject,
      text,
    });
  } catch (err) {
    console.error(`[notify] failed to email ${id}`, err);
  }
}

export async function notifyNewQuote(quote: QuoteRequest) {
  const locale = localeOf(quote.locale);
  const c = copy[locale];
  const label = await inquiryLabels(locale);
  const text = [
    c.received(label.company.hours),
    "",
    c.yours,
    line(c.name, quote.name),
    line(c.company, quote.company),
    line(c.email, quote.email),
    line(c.phone, quote.phone),
    line(c.products, quote.products.map(label.product).join(", ")),
    line(c.message, quote.message),
    "",
    signoff(c, label),
    "",
    c.noReply,
  ].join("\n");
  const who = quote.company ?? quote.name ?? quote.email ?? quote.phone;
  await send(`quote ${quote.id}`, `${c.quoteSubject}${who ? ` — ${who}` : ""} · MACS ERP`, text, quote.email);
}

export async function notifyNewContact(message: ContactMessage) {
  const locale = localeOf(message.locale);
  const c = copy[locale];
  const label = await inquiryLabels(locale);
  const text = [
    c.received(label.company.hours),
    "",
    c.yours,
    line(c.name, message.name),
    line(c.email, message.email),
    line(c.phone, message.phone),
    line(c.topic, label.topic(message.topic)),
    line(c.message, message.message),
    "",
    signoff(c, label),
    "",
    c.noReply,
  ].join("\n");
  const who = message.name ?? message.email ?? message.phone;
  await send(`contact ${message.id}`, `${label.topic(message.topic)}${who ? ` — ${who}` : ""} · MACS ERP`, text, message.email);
}
