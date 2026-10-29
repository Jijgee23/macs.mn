import "server-only";
import nodemailer from "nodemailer";
import type { ContactMessage, QuoteRequest } from "@prisma/client";
import type { ContactTopic, QuoteProductId } from "@/content/common";
import { loadAllContent } from "@/lib/content";
import { isLocale, type Locale } from "@/lib/locale";
import { renderHtml, renderText, type MailModel } from "@/lib/mail-template";

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

export const mailCopy = {
  mn: {
    quoteKind: "Үнийн саналын хүсэлт",
    contactKind: "Санал хүсэлт",
    title: "Таны хүсэлтийг хүлээн авлаа",
    intro: (hours: string) =>
      `Сайн байна уу, MACS ERP-д хандсанд баярлалаа. Манай мэргэжилтэн ажлын цагаар (${hours}) тантай удахгүй холбогдоно.`,
    yours: "Таны илгээсэн мэдээлэл",
    name: "Нэр",
    company: "Байгууллага",
    email: "Имэйл",
    phone: "Утас",
    products: "Сонирхож буй систем",
    topic: "Сэдэв",
    message: "Мессеж",
    regards: "Хүндэтгэсэн,",
    noReply: "Энэ мэйл автоматаар илгээгдсэн. Асуух зүйл байвал дээрх утас эсвэл имэйлээр холбогдоно уу.",
  },
  en: {
    quoteKind: "Price quote request",
    contactKind: "Message",
    title: "We've received your request",
    intro: (hours: string) =>
      `Hello, thank you for contacting MACS ERP. Our specialist will get back to you soon during business hours (${hours}).`,
    yours: "Your submission",
    name: "Name",
    company: "Organization",
    email: "Email",
    phone: "Phone",
    products: "Systems of interest",
    topic: "Topic",
    message: "Message",
    regards: "Best regards,",
    noReply: "This is an automated message. For questions, please use the phone or email above.",
  },
} as const;

const localeOf = (l: string): Locale => (isLocale(l) ? l : "mn");
const siteUrl = () => (process.env.SITE_URL ?? "https://macs.mn").replace(/\/$/, "");

function baseModel(locale: Locale, kicker: string, label: Awaited<ReturnType<typeof inquiryLabels>>) {
  const c = mailCopy[locale];
  return {
    lang: locale,
    kicker,
    title: c.title,
    intro: c.intro(label.company.hours),
    sectionTitle: c.yours,
    regards: c.regards,
    company: label.company.name,
    contactLine: [label.contact.phones[0]?.number, label.contact.email].filter((v): v is string => !!v),
    siteUrl: siteUrl(),
    footnote: c.noReply,
  };
}

/** Never throws — the request is already saved and listed in /admin. */
async function send(id: string, subject: string, model: MailModel, visitorEmail: string | null) {
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
      text: renderText(model),
      html: renderHtml(model),
    });
  } catch (err) {
    console.error(`[notify] failed to email ${id}`, err);
  }
}

export async function notifyNewQuote(quote: QuoteRequest) {
  const locale = localeOf(quote.locale);
  const c = mailCopy[locale];
  const label = await inquiryLabels(locale);
  const model: MailModel = {
    ...baseModel(locale, c.quoteKind, label),
    fields: [
      { label: c.name, value: quote.name },
      { label: c.company, value: quote.company },
      { label: c.email, value: quote.email },
      { label: c.phone, value: quote.phone },
      { label: c.products, value: quote.products.map(label.product).join(", ") },
    ],
    message: { label: c.message, value: quote.message },
  };
  const who = quote.company ?? quote.name ?? quote.email ?? quote.phone;
  await send(`quote ${quote.id}`, `${c.quoteKind}${who ? ` — ${who}` : ""} · MACS ERP`, model, quote.email);
}

export async function notifyNewContact(message: ContactMessage) {
  const locale = localeOf(message.locale);
  const c = mailCopy[locale];
  const label = await inquiryLabels(locale);
  const model: MailModel = {
    ...baseModel(locale, label.topic(message.topic), label),
    fields: [
      { label: c.name, value: message.name },
      { label: c.email, value: message.email },
      { label: c.phone, value: message.phone },
      { label: c.topic, value: label.topic(message.topic) },
    ],
    message: { label: c.message, value: message.message },
  };
  const who = message.name ?? message.email ?? message.phone;
  await send(`contact ${message.id}`, `${label.topic(message.topic)}${who ? ` — ${who}` : ""} · MACS ERP`, model, message.email);
}
