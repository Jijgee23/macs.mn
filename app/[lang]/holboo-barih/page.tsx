import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { telHref } from "@/content/common";
import { recaptchaSiteKey } from "@/lib/recaptcha";
import { getContent, getContentFor } from "@/lib/content";
import { isLocale, localeHref } from "@/lib/locale";

export async function generateMetadata({ params }: PageProps<"/[lang]/holboo-barih">): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "mn";
  const t = await getContentFor(locale);
  return {
    title: t.meta.contactTitle,
    description: t.meta.contactDescription,
    alternates: {
      canonical: localeHref(locale, "/holboo-barih"),
      languages: { mn: "/holboo-barih", en: "/en/holboo-barih" },
    },
  };
}

export default async function ContactPage() {
  const { locale, t, contact } = await getContent();
  const p = t.contactPage;

  return (
    <div className="relative">
      <div aria-hidden className="bg-dots absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container-wide relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_1.35fr]">
        <div>
          <p className="text-sm font-semibold text-brand">{p.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] text-balance sm:text-5xl">{p.title}</h1>
          <p className="mt-5 text-lg text-muted text-pretty">{p.intro}</p>

          <dl className="mt-10 grid gap-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 font-semibold">
                <Phone className="size-4 text-brand" aria-hidden />
                {p.phonesTitle}
              </dt>
              <dd className="mt-2 space-y-1">
                {contact.phones.map((ph) => (
                  <p key={ph.number}>
                    <a href={telHref(ph.number)} className="hover:text-brand">
                      {ph.number}
                    </a>{" "}
                    <span className="text-muted">· {t.company.phoneKinds[ph.kind]}</span>
                  </p>
                ))}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 font-semibold">
                <Mail className="size-4 text-brand" aria-hidden />
                {p.emailTitle}
              </dt>
              <dd className="mt-2">
                <a href={`mailto:${contact.email}`} className="hover:text-brand">
                  {contact.email}
                </a>
              </dd>
              <dt className="mt-6 flex items-center gap-2 font-semibold">
                <Clock className="size-4 text-brand" aria-hidden />
                {p.hoursTitle}
              </dt>
              <dd className="mt-2 text-muted">{t.company.hours}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="flex items-center gap-2 font-semibold">
                <MapPin className="size-4 text-brand" aria-hidden />
                {p.addressTitle}
              </dt>
              <dd className="mt-2 text-muted">{t.company.address}</dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-soft px-5 py-4 text-sm">
            <span className="text-muted">{p.quoteHint}</span>
            <Link
              href={localeHref(locale, "/une-sanal")}
              className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
            >
              {p.quoteLink}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
        <ContactForm locale={locale} t={p.form} success={p.success} errors={t.formErrors} recaptchaSiteKey={recaptchaSiteKey()} />
      </div>
    </div>
  );
}
