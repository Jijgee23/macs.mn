/**
 * Ids and constants the code depends on. Editable text lives in the database
 * (see content/schema.ts); content/mn.ts, content/en.ts and `defaultContactInfo`
 * below are the seed and fallback.
 */
import type { ContactInfo } from "./schema";

export const DOCS_URL = "https://docs.macs.mn";

export const phoneKinds = ["main", "extra", "mobile"] as const;

export type PhoneKind = (typeof phoneKinds)[number];

export const defaultContactInfo: ContactInfo = {
  email: "contact@infosystems.mn",
  web: "https://www.infosystems.mn",
  founded: 1998,
  phones: [
    { number: "+976 7012 6399", kind: "main" },
    { number: "+976 7011 6399", kind: "extra" },
    { number: "+976 9191 6549", kind: "mobile" },
    { number: "+976 9919 6549", kind: "mobile" },
  ],
};

export const telHref = (number: string) => `tel:${number.replace(/[^\d+]/g, "")}`;

export const moduleKeys = [
  "setup",
  "inventory",
  "pos",
  "receivables",
  "payroll",
  "assets",
  "cash",
  "ledger",
  "reports",
  "integrations",
  "projects",
  "tools",
] as const;

export type ModuleKey = (typeof moduleKeys)[number];

/** Section id on the user manual site (docs.macs.mn/<docsId>) for each module. */
export const moduleDocsIds: Record<ModuleKey, string> = {
  setup: "co-setup",
  inventory: "inv-intro",
  pos: "pos-intro",
  receivables: "ar-intro",
  payroll: "pay-intro",
  assets: "fa-intro",
  cash: "cash-intro",
  ledger: "gl-intro",
  reports: "rpt-bal",
  integrations: "int-ebarimt",
  projects: "proj-intro",
  tools: "tools-inv",
};

/** Ids stored in QuoteRequest.products; labels come from the content. */
export const quoteProductIds = [
  "macs-erp",
  "macsxe4",
  "macs-pos",
  "restaurant-pos",
  "pharmacy-pos",
  "hr-payroll",
  "other",
] as const;

export type QuoteProductId = (typeof quoteProductIds)[number];

/** Ids stored in ContactMessage.topic; labels come from the content. */
export const contactTopics = ["general", "feedback", "support", "partnership", "other"] as const;

export type ContactTopic = (typeof contactTopics)[number];

/**
 * Validation codes returned by the form Server Actions and translated by the forms;
 * "unavailable" means the request couldn't be saved.
 */
export const formErrorCodes = [
  "required",
  "invalidEmail",
  "invalidPhone",
  "tooLong",
  "rateLimited",
  "captcha",
  "unavailable",
] as const;

export type FormErrorCode = (typeof formErrorCodes)[number];
