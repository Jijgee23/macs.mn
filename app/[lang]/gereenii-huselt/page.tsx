import type { Metadata } from "next";
import { Clock, Mail, Phone } from "lucide-react";
import { ContractForm } from "./ContractForm";
import { contractCopy } from "./copy";
import { telHref } from "@/content/common";
import { recaptchaSiteKey } from "@/lib/recaptcha";
import { getContent } from "@/lib/content";
import { isLocale, localeHref } from "@/lib/locale";

export async function generateMetadata({ params }: PageProps<"/[lang]/gereenii-huselt">): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "mn";
  const c = contractCopy[locale];
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: {
      canonical: localeHref(locale, "/gereenii-huselt"),
      languages: { mn: "/gereenii-huselt", en: "/en/gereenii-huselt" },
    },
  };
}

export default async function ContractRequestPage() {
  const { locale, t, contact } = await getContent();
  const c = contractCopy[locale];
  const mainPhone = contact.phones[0].number;

  return (
    <div className="relative">
      <div aria-hidden className="bg-dots absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container-wide relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_1.5fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-semibold text-brand">{c.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] text-balance sm:text-5xl">{c.title}</h1>
          <p className="mt-5 text-lg text-muted text-pretty">{c.intro}</p>

          <ol className="mt-8 space-y-3">
            {c.steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-xs font-bold text-brand shadow-card">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>

          <div className="mt-10 space-y-3 border-t border-line pt-8 text-sm">
            <p className="font-semibold">{c.directTitle}</p>
            <p className="flex items-center gap-2.5">
              <Phone className="size-4 text-muted" aria-hidden />
              <a href={telHref(mainPhone)} className="hover:text-brand">
                {mainPhone}
              </a>
            </p>
            <p className="flex items-center gap-2.5">
              <Mail className="size-4 text-muted" aria-hidden />
              <a href={`mailto:${contact.email}`} className="hover:text-brand">
                {contact.email}
              </a>
            </p>
            <p className="flex items-center gap-2.5 text-muted">
              <Clock className="size-4" aria-hidden />
              {t.company.hours}
            </p>
          </div>
        </div>
        <ContractForm
          locale={locale}
          t={c}
          errors={t.formErrors}
          recaptchaSiteKey={recaptchaSiteKey()}
          productNames={t.products.items.filter((p) => !p.hidden).map((p) => p.name)}
        />
      </div>
    </div>
  );
}
