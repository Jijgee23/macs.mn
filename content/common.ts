/** Language-independent site data. Translated text lives in content/mn.ts and content/en.ts. */

export const DOCS_URL = "https://docs.macs.mn";

export const contact = {
  email: "contact@infosystems.mn",
  web: "https://www.infosystems.mn",
  founded: 1998,
  phones: [
    { number: "+976 7012 6399", kind: "main" },
    { number: "+976 7011 6399", kind: "extra" },
    { number: "+976 9191 6549", kind: "mobile" },
    { number: "+976 9919 6549", kind: "mobile" },
  ] as const,
};

export type PhoneKind = (typeof contact.phones)[number]["kind"];

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

/** Ids sent to the docs API (must match QUOTE_PRODUCTS there); labels come from the locale content. */
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

/** Contact form topics (must match CONTACT_TOPICS in the docs API). */
export const contactTopics = ["general", "feedback", "support", "partnership", "other"] as const;

export type ContactTopic = (typeof contactTopics)[number];

/**
 * Error codes returned by the docs site API (macs_documents/lib/inquiries.ts) and
 * translated by the forms; "unavailable" means the API couldn't be reached.
 */
export const formErrorCodes = ["required", "invalidEmail", "invalidPhone", "tooLong", "rateLimited", "unavailable"] as const;

export type FormErrorCode = (typeof formErrorCodes)[number];
