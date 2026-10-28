import type { ContactTopic, FormErrorCode, ModuleKey, PhoneKind, QuoteProductId } from "./common";

type Item = { title: string; body: string };

/** Every locale file must provide all of this — TypeScript flags a missing translation. */
export interface SiteContent {
  meta: {
    title: string;
    description: string;
    ogLocale: string;
    quoteTitle: string;
    quoteDescription: string;
    contactTitle: string;
    contactDescription: string;
  };
  nav: {
    home: string;
    products: string;
    modules: string;
    why: string;
    implementation: string;
    contact: string;
    docs: string;
    quote: string;
    menu: string;
    mainNav: string;
    mobileNav: string;
    theme: string;
    language: string;
  };
  company: {
    name: string;
    address: string;
    hours: string;
    phoneKinds: Record<PhoneKind, string>;
  };
  hero: {
    badge: string;
    titleStart: string;
    titleAccent: string;
    lead: string;
    primary: string;
    secondary: string;
  };
  stats: { value: string; label: string }[];
  mockup: {
    sidebar: string[];
    kpis: { label: string; value: string }[];
    chartTitle: string;
    rows: { name: string; amount: string }[];
  };
  products: {
    eyebrow: string;
    title: string;
    intro: string;
    items: { name: string; purpose: string; highlight: string }[];
    alsoLabel: string;
    others: string[];
  };
  modules: {
    eyebrow: string;
    title: string;
    intro: string;
    docsLink: string;
    items: Record<ModuleKey, { title: string; summary: string; features: string[] }>;
  };
  integrations: { eyebrow: string; title: string; intro: string; items: { name: string; body: string }[] };
  why: { eyebrow: string; title: string; items: Item[] };
  implementation: { eyebrow: string; title: string; intro: string; steps: Item[] };
  trust: {
    partnersTitle: string;
    partnersIntro: string;
    partners: string[];
    membershipsTitle: string;
    memberships: string[];
  };
  cta: { title: string; body: string; button: string; secondary: string };
  footer: { tagline: (year: number) => string; contactTitle: string; linksTitle: string; docs: string; licence: string };
  /** Shared by the quote and contact forms. */
  formErrors: Record<FormErrorCode, string>;
  quote: {
    eyebrow: string;
    title: string;
    intro: string;
    steps: string[];
    directTitle: string;
    success: { title: string; body: string };
    form: {
      email: string;
      phone: string;
      phonePlaceholder: string;
      name: string;
      company: string;
      productsLegend: string;
      products: Record<QuoteProductId, string>;
      message: string;
      messagePlaceholder: string;
      submit: string;
      submitting: string;
      privacy: string;
    };
  };
  contactPage: {
    eyebrow: string;
    title: string;
    intro: string;
    quoteHint: string;
    quoteLink: string;
    addressTitle: string;
    phonesTitle: string;
    emailTitle: string;
    hoursTitle: string;
    success: { title: string; body: string };
    form: {
      name: string;
      email: string;
      phone: string;
      phoneHint: string;
      topic: string;
      topics: Record<ContactTopic, string>;
      message: string;
      messagePlaceholder: string;
      submit: string;
      submitting: string;
      privacy: string;
    };
  };
}
