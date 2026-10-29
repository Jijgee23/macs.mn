import Link from "next/link";
import { Logo } from "./Logo";
import { DOCS_URL, telHref } from "@/content/common";
import { formatTagline, getContent } from "@/lib/content";
import { localeHref } from "@/lib/locale";

export async function SiteFooter() {
  const { locale, t, contact } = await getContent();
  const mainPhone = contact.phones[0].number;

  return (
    <footer className="mt-auto border-t border-line">
      <div className="container-wide grid gap-10 py-14 text-sm md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo href={localeHref(locale, "/")} label={t.nav.home} />
          <p className="mt-4 max-w-xs text-muted">
            {t.company.name} — {formatTagline(t.footer.tagline, contact.founded)}
          </p>
        </div>
        <div className="space-y-2.5">
          <p className="font-semibold">{t.footer.contactTitle}</p>
          <p>
            <a href={telHref(mainPhone)} className="text-muted hover:text-ink">
              {mainPhone}
            </a>
          </p>
          <p>
            <a href={`mailto:${contact.email}`} className="text-muted hover:text-ink">
              {contact.email}
            </a>
          </p>
          <p className="text-muted">{t.company.hours}</p>
        </div>
        <div className="space-y-2.5">
          <p className="font-semibold">{t.footer.linksTitle}</p>
          <p>
            <Link href={localeHref(locale, "/une-sanal")} className="text-muted hover:text-ink">
              {t.nav.quote}
            </Link>
          </p>
          <p>
            <Link href={localeHref(locale, "/medee")} className="text-muted hover:text-ink">
              {t.nav.news}
            </Link>
          </p>
          <p>
            <Link href={localeHref(locale, "/holboo-barih")} className="text-muted hover:text-ink">
              {t.nav.contact}
            </Link>
          </p>
          <p>
            <a href={DOCS_URL} className="text-muted hover:text-ink">
              {t.footer.docs}
            </a>
          </p>
          <p>
            <a href={contact.web} className="text-muted hover:text-ink">
              infosystems.mn
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="container-wide py-5 text-xs text-muted">
          © {t.company.name}. {t.footer.licence}
        </p>
      </div>
    </footer>
  );
}
