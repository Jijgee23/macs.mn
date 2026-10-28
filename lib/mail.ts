import "server-only";
import nodemailer from "nodemailer";
import type { ContactMessage, QuoteRequest } from "@prisma/client";
import { mn } from "@/content/mn";
import type { ContactTopic, QuoteProductId } from "@/content/common";

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

export function productLabel(id: string) {
  return mn.quote.form.products[id as QuoteProductId] ?? id;
}

export function topicLabel(id: string) {
  return mn.contactPage.form.topics[id as ContactTopic] ?? id;
}

const languageLine = (locale: string) => `Хэл: ${locale === "en" ? "Англи — англиар хариулна уу" : "Монгол"}`;
const subjectPrefix = (locale: string) => (locale === "en" ? "[EN] " : "");

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

export function notifyNewQuote(quote: QuoteRequest) {
  return notify(
    `quote ${quote.id}`,
    `${subjectPrefix(quote.locale)}Үнийн саналын хүсэлт — ${quote.company ?? quote.name ?? quote.email}`,
    [
      `Нэр: ${quote.name ?? "—"}`,
      `Байгууллага: ${quote.company ?? "—"}`,
      `Имэйл: ${quote.email}`,
      `Утас: ${quote.phone}`,
      `Бүтээгдэхүүн: ${quote.products.length ? quote.products.map(productLabel).join(", ") : "—"}`,
      languageLine(quote.locale),
      "",
      quote.message ?? "",
      "",
      `Админ: ${process.env.SITE_URL ?? ""}/admin`,
    ],
    quote.email,
  );
}

export function notifyNewContact(message: ContactMessage) {
  return notify(
    `contact ${message.id}`,
    `${subjectPrefix(message.locale)}${topicLabel(message.topic)} — ${message.name ?? message.email}`,
    [
      `Нэр: ${message.name ?? "—"}`,
      `Имэйл: ${message.email}`,
      `Утас: ${message.phone ?? "—"}`,
      `Сэдэв: ${topicLabel(message.topic)}`,
      languageLine(message.locale),
      "",
      message.message,
      "",
      `Админ: ${process.env.SITE_URL ?? ""}/admin/messages`,
    ],
    message.email,
  );
}
