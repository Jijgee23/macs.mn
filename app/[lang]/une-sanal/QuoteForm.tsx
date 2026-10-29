"use client";

import { useActionState } from "react";
import { submitQuote, type QuoteFormState } from "./actions";
import { quoteProductIds, type FormErrorCode } from "@/content/common";
import { FieldError, FormSuccess, Honeypot, inputClass } from "@/components/FormParts";
import type { SiteContent } from "@/content/schema";
import type { Locale } from "@/lib/locale";

const initialState: QuoteFormState = { ok: false };

type Props = {
  locale: Locale;
  t: SiteContent["quote"]["form"];
  success: SiteContent["quote"]["success"];
  errors: Record<FormErrorCode, string>;
};

export function QuoteForm({ locale, t, success, errors }: Props) {
  const [state, formAction, pending] = useActionState(submitQuote, initialState);

  if (state.ok) {
    return <FormSuccess {...success} />;
  }

  const e = state.errors ?? {};
  const v = state.values;

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-line bg-surface p-6 shadow-pop sm:p-8"
      noValidate
    >
      <input type="hidden" name="lang" value={locale} />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t.email} <span className="text-brand">*</span>
          <input
            name="email"
            defaultValue={v?.email}
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            aria-invalid={!!e.email}
            aria-describedby={e.email ? "email-error" : undefined}
          />
          <FieldError id="email-error" codes={e.email} messages={errors} />
        </label>
        <label className="block text-sm font-medium">
          {t.phone} <span className="text-brand">*</span>
          <input
            name="phone"
            defaultValue={v?.phone}
            type="tel"
            required
            autoComplete="tel"
            placeholder={t.phonePlaceholder}
            className={inputClass}
            aria-invalid={!!e.phone}
            aria-describedby={e.phone ? "phone-error" : undefined}
          />
          <FieldError id="phone-error" codes={e.phone} messages={errors} />
        </label>
        <label className="block text-sm font-medium">
          {t.name}
          <input
            name="name"
            defaultValue={v?.name}
            autoComplete="name"
            className={inputClass}
            aria-invalid={!!e.name}
          />
          <FieldError id="name-error" codes={e.name} messages={errors} />
        </label>
        <label className="block text-sm font-medium">
          {t.company}
          <input
            name="company"
            defaultValue={v?.company}
            autoComplete="organization"
            className={inputClass}
            aria-invalid={!!e.company}
          />
          <FieldError id="company-error" codes={e.company} messages={errors} />
        </label>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium">{t.productsLegend}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {quoteProductIds.map((id) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3.5 py-2.5 text-sm transition-colors hover:border-line-strong has-checked:border-brand has-checked:bg-brand-soft"
            >
              <input
                type="checkbox"
                name="products"
                value={id}
                defaultChecked={v?.products.includes(id)}
                className="size-4 accent-[#b91c1c]"
              />
              {t.products[id]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-6 block text-sm font-medium">
        {t.message}
        <textarea
          name="message"
          defaultValue={v?.message}
          rows={4}
          placeholder={t.messagePlaceholder}
          className={inputClass}
          aria-invalid={!!e.message}
        />
        <FieldError id="message-error" codes={e.message} messages={errors} />
      </label>

      <Honeypot />

      {state.error && (
        <p className="mt-5 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand" role="alert">
          {errors[state.error]}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-cta px-6 py-3 font-semibold text-white transition-colors hover:bg-cta-hover disabled:opacity-60"
      >
        {pending ? t.submitting : t.submit}
      </button>
      <p className="mt-3 text-center text-xs text-muted">{t.privacy}</p>
    </form>
  );
}
