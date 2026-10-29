"use client";

import { useActionState } from "react";
import { submitContact, type ContactFormState } from "./actions";
import { contactTopics, type FormErrorCode } from "@/content/common";
import { FieldError, FormSuccess, Honeypot, inputClass } from "@/components/FormParts";
import type { SiteContent } from "@/content/schema";
import type { Locale } from "@/lib/locale";

const initialState: ContactFormState = { ok: false };

type Props = {
  locale: Locale;
  t: SiteContent["contactPage"]["form"];
  success: SiteContent["contactPage"]["success"];
  errors: Record<FormErrorCode, string>;
};

export function ContactForm({ locale, t, success, errors }: Props) {
  const [state, formAction, pending] = useActionState(submitContact, initialState);

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
          {t.phone} <span className="font-normal text-muted">({t.phoneHint})</span>
          <input
            name="phone"
            defaultValue={v?.phone}
            type="tel"
            autoComplete="tel"
            className={inputClass}
            aria-invalid={!!e.phone}
            aria-describedby={e.phone ? "phone-error" : undefined}
          />
          <FieldError id="phone-error" codes={e.phone} messages={errors} />
        </label>
        <label className="block text-sm font-medium">
          {t.topic}
          {/* key remounts the select so its echoed default survives React's post-submit form reset. */}
          <select
            key={v?.topic ?? "general"}
            name="topic"
            defaultValue={v?.topic ?? "general"}
            className={inputClass}
          >
            {contactTopics.map((topic) => (
              <option key={topic} value={topic}>
                {t.topics[topic]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-5 block text-sm font-medium">
        {t.message} <span className="text-brand">*</span>
        <textarea
          name="message"
          defaultValue={v?.message}
          required
          rows={6}
          placeholder={t.messagePlaceholder}
          className={inputClass}
          aria-invalid={!!e.message}
          aria-describedby={e.message ? "message-error" : undefined}
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
