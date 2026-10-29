import "server-only";
import nodemailer from "nodemailer";
import type { ContactMessage, QuoteRequest } from "@prisma/client";
import type { ContactTopic, QuoteProductId } from "@/content/common";
import { loadAllContent } from "@/lib/content";

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

/** Mongolian labels for product / topic ids, as edited in /admin/content. */
export async function inquiryLabels() {
  const { content } = await loadAllContent();
  return {
    product: (id: string) => content.mn.quote.form.products[id as QuoteProductId] ?? id,
    topic: (id: string) => content.mn.contactPage.form.topics[id as ContactTopic] ?? id,
  };
}

const languageLine = (locale: string) => `Хэл: ${locale === "en" ? "Англи — англиар хариулна уу" : "Монгол"}`;
const subjectPrefix = (locale: string) => (locale === "en" ? "[EN] " : "");
const adminUrl = (path: string) => `${process.env.SITE_URL ?? "https://macs.mn"}${path}`;

/** Emails the team. Never throws — the record is already saved. */
async function notify(id: string, subject: string, lines: string[], replyTo: string) {
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
      replyTo,
      subject,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.error(`[notify] failed to email ${id}`, err);
  }
}

export async function notifyNewQuote(quote: QuoteRequest) {
  const label = await inquiryLabels();
  return notify(
    `quote ${quote.id}`,
    `${subjectPrefix(quote.locale)}Үнийн саналын хүсэлт — ${quote.company ?? quote.name ?? quote.email}`,
    [
      `Нэр: ${quote.name ?? "—"}`,
      `Байгууллага: ${quote.company ?? "—"}`,
      `Имэйл: ${quote.email}`,
      `Утас: ${quote.phone}`,
      `Бүтээгдэхүүн: ${quote.products.length ? quote.products.map(label.product).join(", ") : "—"}`,
      languageLine(quote.locale),
      "",
      quote.message ?? "",
      "",
      `Админ: ${adminUrl("/admin/requests")}`,
    ],
    quote.email,
  );
}

export async function notifyNewContact(message: ContactMessage) {
  const label = await inquiryLabels();
  return notify(
    `contact ${message.id}`,
    `${subjectPrefix(message.locale)}${label.topic(message.topic)} — ${message.name ?? message.email}`,
    [
      `Нэр: ${message.name ?? "—"}`,
      `Имэйл: ${message.email}`,
      `Утас: ${message.phone ?? "—"}`,
      `Сэдэв: ${label.topic(message.topic)}`,
      languageLine(message.locale),
      "",
      message.message,
      "",
      `Админ: ${adminUrl("/admin/messages")}`,
    ],
    message.email,
  );
}
