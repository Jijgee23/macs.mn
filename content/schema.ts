import { z } from "zod";
import { contactTopics, formErrorCodes, moduleKeys, phoneKinds, quoteProductIds } from "./common";

/**
 * Shape of all editable site content. Each top-level key is one row per locale in
 * the ContentSection table; content/mn.ts and content/en.ts are the seed and the
 * fallback when the database is empty or unreachable. Used to validate both DB reads
 * and admin saves.
 */

const text = z.string().trim().min(1, "Хоосон байж болохгүй");
const item = z.object({ title: text, body: text });
const fixedKeys = <K extends readonly [string, ...string[]], V extends z.ZodType>(keys: K, value: V) =>
  z.record(z.enum(keys), value);

export const sectionSchemas = {
  meta: z.object({
    title: text,
    description: text,
    ogLocale: text,
    quoteTitle: text,
    quoteDescription: text,
    contactTitle: text,
    contactDescription: text,
  }),
  nav: z.object({
    home: text,
    products: text,
    modules: text,
    why: text,
    implementation: text,
    contact: text,
    news: text,
    docs: text,
    quote: text,
    menu: text,
    mainNav: text,
    mobileNav: text,
    theme: text,
    language: text,
  }),
  company: z.object({
    name: text,
    address: text,
    hours: text,
    phoneKinds: fixedKeys(phoneKinds, text),
  }),
  hero: z.object({
    badge: text,
    titleStart: text,
    titleAccent: text,
    lead: text,
    primary: text,
    secondary: text,
  }),
  stats: z.array(z.object({ value: text, label: text })).min(1),
  mockup: z.object({
    sidebar: z.array(text).min(1),
    kpis: z.array(z.object({ label: text, value: text })).min(1),
    chartTitle: text,
    rows: z.array(z.object({ name: text, amount: text })).min(1),
  }),
  products: z.object({
    eyebrow: text,
    title: text,
    intro: text,
    items: z.array(z.object({ name: text, purpose: text, highlight: text })).min(1),
    alsoLabel: text,
    others: z.array(text),
  }),
  modules: z.object({
    eyebrow: text,
    title: text,
    intro: text,
    docsLink: text,
    items: fixedKeys(moduleKeys, z.object({ title: text, summary: text, features: z.array(text).min(1) })),
  }),
  integrations: z.object({
    eyebrow: text,
    title: text,
    intro: text,
    items: z.array(z.object({ name: text, body: text })).min(1),
  }),
  why: z.object({ eyebrow: text, title: text, items: z.array(item).min(1) }),
  implementation: z.object({ eyebrow: text, title: text, intro: text, steps: z.array(item).min(1) }),
  trust: z.object({
    partnersTitle: text,
    partnersIntro: text,
    partners: z.array(text),
    membershipsTitle: text,
    memberships: z.array(text),
  }),
  cta: z.object({ title: text, body: text, button: text, secondary: text }),
  news: z.object({
    eyebrow: text,
    title: text,
    intro: text,
    all: text,
    newsLabel: text,
    tipLabel: text,
    empty: text,
    readMore: text,
    latestTitle: text,
    latestAll: text,
    share: text,
    copyLink: text,
    copied: text,
    back: text,
    onlyInMongolian: text,
  }),
  footer: z.object({
    /** "{year}" is replaced with the founding year. */
    tagline: text,
    contactTitle: text,
    linksTitle: text,
    docs: text,
    licence: text,
  }),
  formErrors: fixedKeys(formErrorCodes, text),
  quote: z.object({
    eyebrow: text,
    title: text,
    intro: text,
    steps: z.array(text).min(1),
    directTitle: text,
    success: z.object({ title: text, body: text }),
    form: z.object({
      email: text,
      phone: text,
      phonePlaceholder: text,
      contactHint: text,
      name: text,
      company: text,
      productsLegend: text,
      products: fixedKeys(quoteProductIds, text),
      message: text,
      messagePlaceholder: text,
      submit: text,
      submitting: text,
      privacy: text,
    }),
  }),
  contactPage: z.object({
    eyebrow: text,
    title: text,
    intro: text,
    quoteHint: text,
    quoteLink: text,
    addressTitle: text,
    phonesTitle: text,
    emailTitle: text,
    hoursTitle: text,
    success: z.object({ title: text, body: text }),
    form: z.object({
      name: text,
      email: text,
      phone: text,
      contactHint: text,
      topic: text,
      topics: fixedKeys(contactTopics, text),
      message: text,
      messagePlaceholder: text,
      submit: text,
      submitting: text,
      privacy: text,
    }),
  }),
};

export type SectionKey = keyof typeof sectionSchemas;
export const sectionKeys = Object.keys(sectionSchemas) as SectionKey[];

export const siteContentSchema = z.object(sectionSchemas);
export type SiteContent = z.infer<typeof siteContentSchema>;

/** Language-independent contact details (ContentSection key "contact", locale "all"). */
export const contactInfoSchema = z.object({
  email: z.string().trim().pipe(z.email("Имэйл буруу байна")),
  web: z.string().trim().pipe(z.url("Хаяг буруу байна")),
  founded: z.coerce.number().int().min(1900).max(2100),
  phones: z
    .array(z.object({ number: text, kind: z.enum(phoneKinds) }))
    .min(1),
});

export type ContactInfo = z.infer<typeof contactInfoSchema>;
