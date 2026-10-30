import "server-only";
import nodemailer from "nodemailer";
import type { ContactMessage, QuoteRequest, SupportRequest, SupportStatus } from "@prisma/client";
import type { ContactTopic, QuoteProductId, SupportType, SupportUrgency } from "@/content/common";
import { loadAllContent } from "@/lib/content";
import { isLocale, type Locale } from "@/lib/locale";
import { renderHtml, renderText, type MailModel } from "@/lib/mail-template";

/**
 * One email per request: from SMTP_FROM (no_reply@infosystems.mn) to NOTIFY_TO
 * (contact@infosystems.mn), with the visitor in CC when they left an email address —
 * that copy is their "we received it" confirmation, so the text addresses them.
 * Support requests CC every address the customer listed, and later status updates go
 * straight to those addresses.
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
    supportType: (id: string) => t.supportPage.form.types[id as SupportType] ?? id,
    urgency: (id: string) => t.supportPage.form.urgencies[id as SupportUrgency] ?? id,
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
    supportKind: "Хэрэглэгчийн хүсэлт",
    supportIntro: (hours: string) =>
      `Сайн байна уу, таны хүсэлтийг бүртгэж авлаа. Манай мэргэжилтэн ажлын цагаар (${hours}) шалгаж, явцын талаар энэ хаягуудаар мэдэгдэнэ.`,
    type: "Хүсэлтийн төрөл",
    urgency: "Яаралтай эсэх",
    emails: "Хариу авах имэйл",
    files: "Хавсралт",
    requestNo: "Хүсэлтийн дугаар",
    statusTitle: (status: string) => `Таны хүсэлтийн төлөв: ${status}`,
    statusIntro: (status: string) => `Таны илгээсэн хүсэлтийн төлөв «${status}» болж өөрчлөгдлөө.`,
    statusReply: "Тайлбар",
    yourRequest: "Таны хүсэлт",
    statuses: {
      NEW: "Шинэ",
      RECEIVED: "Хүлээн авсан",
      IN_PROGRESS: "Хийгдэж байна",
      RESOLVED: "Шийдвэрлэсэн",
      REJECTED: "Татгалзсан",
    } satisfies Record<SupportStatus, string>,
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
    supportKind: "Customer request",
    supportIntro: (hours: string) =>
      `Hello, we've logged your request. Our specialist will review it during business hours (${hours}) and keep these addresses posted on its progress.`,
    type: "Request type",
    urgency: "Urgency",
    emails: "Updates to",
    files: "Attachments",
    requestNo: "Request no.",
    statusTitle: (status: string) => `Your request is now: ${status}`,
    statusIntro: (status: string) => `The status of your request has changed to “${status}”.`,
    statusReply: "Details",
    yourRequest: "Your request",
    statuses: {
      NEW: "New",
      RECEIVED: "Received",
      IN_PROGRESS: "In progress",
      RESOLVED: "Resolved",
      REJECTED: "Declined",
    } satisfies Record<SupportStatus, string>,
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

type Recipients = { to?: string[]; visitors: string[] };

/**
 * Never throws — the request is already saved and listed in /admin. Goes to NOTIFY_TO
 * with the visitors in CC, or only to `to` when given (status updates).
 */
async function send(id: string, subject: string, model: MailModel, { to, visitors }: Recipients) {
  const mailer = transport();
  const team = process.env.NOTIFY_TO;
  if (!mailer || !team) {
    console.warn(`[notify] SMTP not configured; skipped email for ${id}`);
    return;
  }
  const cc = visitors.length ? visitors : undefined;
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: to ?? team,
      cc: to ? undefined : cc,
      replyTo: to ? team : cc,
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
  await send(`quote ${quote.id}`, `${c.quoteKind}${who ? ` — ${who}` : ""} · MACS ERP`, model, { visitors: quote.email ? [quote.email] : [] });
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
  await send(`contact ${message.id}`, `${label.topic(message.topic)}${who ? ` — ${who}` : ""} · MACS ERP`, model, { visitors: message.email ? [message.email] : [] });
}

const shortId = (id: string) => id.slice(-8).toUpperCase();

function supportFields(req: SupportRequest, c: (typeof mailCopy)[Locale], label: Awaited<ReturnType<typeof inquiryLabels>>) {
  return [
    { label: c.requestNo, value: shortId(req.id) },
    { label: c.company, value: req.company },
    { label: c.name, value: req.name },
    { label: c.phone, value: req.phone },
    { label: c.emails, value: req.emails.join(", ") },
    { label: c.type, value: label.supportType(req.type) },
    { label: c.urgency, value: label.urgency(req.urgency) },
  ];
}

export async function notifySupportReceived(req: SupportRequest & { attachments: { name: string }[] }) {
  const locale = localeOf(req.locale);
  const c = mailCopy[locale];
  const label = await inquiryLabels(locale);
  const model: MailModel = {
    ...baseModel(locale, `${c.supportKind} · ${label.supportType(req.type)}`, label),
    intro: c.supportIntro(label.company.hours),
    fields: [...supportFields(req, c, label), { label: c.files, value: req.attachments.map((a) => a.name).join(", ") }],
    message: { label: c.message, value: req.message },
  };
  const subject = `${label.supportType(req.type)} [${label.urgency(req.urgency)}] — ${req.company} · #${shortId(req.id)}`;
  await send(`support ${req.id}`, subject, model, { visitors: req.emails });
}

/** Sent to the customer's addresses when an admin changes the status. */
export async function notifySupportStatus(req: SupportRequest) {
  const locale = localeOf(req.locale);
  const c = mailCopy[locale];
  const label = await inquiryLabels(locale);
  const status = c.statuses[req.status];
  const model: MailModel = {
    ...baseModel(locale, `${c.supportKind} #${shortId(req.id)}`, label),
    title: c.statusTitle(status),
    intro: c.statusIntro(status),
    sectionTitle: c.yourRequest,
    fields: supportFields(req, c, label),
    // The admin's explanation when there is one, otherwise the original request.
    message: req.reply ? { label: c.statusReply, value: req.reply } : { label: c.message, value: req.message },
  };
  await send(`support status ${req.id}`, `${c.statusTitle(status)} · #${shortId(req.id)} · MACS ERP`, model, {
    to: req.emails,
    visitors: [],
  });
}
