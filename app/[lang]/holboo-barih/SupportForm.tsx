"use client";

import { useActionState, useState, type ChangeEvent, type FormEvent } from "react";
import { Paperclip } from "lucide-react";
import { submitSupport, type SupportFormState } from "./support-actions";
import {
  SUPPORT_MAX_BYTES,
  SUPPORT_MAX_FILES,
  supportFileExtensions,
  supportTypes,
  supportUrgencies,
  type FormErrorCode,
} from "@/content/common";
import { FieldError, FormSuccess, Honeypot, inputClass } from "@/components/FormParts";
import { Recaptcha } from "@/components/Recaptcha";
import type { SiteContent } from "@/content/schema";
import type { Locale } from "@/lib/locale";

const initialState: SupportFormState = { ok: false };

type Props = {
  locale: Locale;
  t: SiteContent["supportPage"]["form"];
  success: SiteContent["supportPage"]["success"];
  errors: Record<FormErrorCode, string>;
  recaptchaSiteKey: string | null;
};

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Same checks as lib/inquiries.ts, so the visitor learns before uploading. */
function checkFiles(files: File[]): FormErrorCode | null {
  if (files.length > SUPPORT_MAX_FILES) return "tooManyFiles";
  if (files.reduce((sum, f) => sum + f.size, 0) > SUPPORT_MAX_BYTES) return "filesTooLarge";
  const ok = supportFileExtensions as readonly string[];
  if (files.some((f) => !ok.includes(f.name.slice(f.name.lastIndexOf(".")).toLowerCase()))) return "fileType";
  return null;
}

export function SupportForm({ locale, t, success, errors, recaptchaSiteKey }: Props) {
  const [state, formAction, pending] = useActionState(submitSupport, initialState);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<FormErrorCode | null>(null);
  // React resets the form after each submit, which empties the file input; forget the list too.
  const [submitted, setSubmitted] = useState(state);
  if (submitted !== state) {
    setSubmitted(state);
    setFiles([]);
    setFileError(null);
  }

  if (state.ok) {
    return <FormSuccess {...success} />;
  }

  const e = state.errors ?? {};
  const v = state.values;
  const filesCodes = fileError ? [fileError] : e.files;

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(event.target.files ?? []);
    setFiles(chosen);
    setFileError(checkFiles(chosen));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (fileError) event.preventDefault();
  };

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      className="rounded-3xl border border-line bg-surface p-6 shadow-pop sm:p-8"
      noValidate
    >
      <input type="hidden" name="lang" value={locale} />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {t.company} <span className="text-brand">*</span>
          <input
            name="company"
            defaultValue={v?.company}
            required
            autoComplete="organization"
            className={inputClass}
            aria-invalid={!!e.company}
            aria-describedby={e.company ? "support-company-error" : undefined}
          />
          <FieldError id="support-company-error" codes={e.company} messages={errors} />
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
          <FieldError id="support-name-error" codes={e.name} messages={errors} />
        </label>
        <label className="block text-sm font-medium">
          {t.phone} <span className="text-brand">*</span>
          <input
            name="phone"
            defaultValue={v?.phone}
            type="tel"
            required
            autoComplete="tel"
            className={inputClass}
            aria-invalid={!!e.phone}
            aria-describedby={e.phone ? "support-phone-error" : undefined}
          />
          <FieldError id="support-phone-error" codes={e.phone} messages={errors} />
        </label>
        <label className="block text-sm font-medium">
          {t.emails} <span className="text-brand">*</span>
          <input
            name="emails"
            defaultValue={v?.emails}
            required
            autoComplete="email"
            inputMode="email"
            className={inputClass}
            aria-invalid={!!e.emails}
            aria-describedby={e.emails ? "support-emails-error" : "support-emails-hint"}
          />
          <span id="support-emails-hint" className="mt-1 block text-xs font-normal text-muted">
            {t.emailsHint}
          </span>
          <FieldError id="support-emails-error" codes={e.emails} messages={errors} />
        </label>
        <label className="block text-sm font-medium">
          {t.type}
          {/* key remounts the selects so their echoed defaults survive React's post-submit form reset. */}
          <select key={v?.type ?? "bug"} name="type" defaultValue={v?.type ?? "bug"} className={inputClass}>
            {supportTypes.map((type) => (
              <option key={type} value={type}>
                {t.types[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          {t.urgency}
          <select
            key={v?.urgency ?? "normal"}
            name="urgency"
            defaultValue={v?.urgency ?? "normal"}
            className={inputClass}
          >
            {supportUrgencies.map((urgency) => (
              <option key={urgency} value={urgency}>
                {t.urgencies[urgency]}
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
          aria-describedby={e.message ? "support-message-error" : undefined}
        />
        <FieldError id="support-message-error" codes={e.message} messages={errors} />
      </label>

      <div className="mt-5 text-sm font-medium">
        {t.files}
        <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line px-4 py-3 font-normal text-muted transition-colors hover:border-brand hover:text-ink has-[:focus-visible]:border-brand">
          <Paperclip className="size-4 shrink-0" aria-hidden />
          <span>{t.filesHint}</span>
          <input
            name="files"
            type="file"
            multiple
            accept={supportFileExtensions.join(",")}
            onChange={onFiles}
            className="sr-only"
            aria-invalid={!!filesCodes}
            aria-describedby={filesCodes ? "support-files-error" : undefined}
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs font-normal text-muted">
            {files.map((f) => (
              <li key={`${f.name}-${f.size}`} className="flex justify-between gap-3">
                <span className="truncate">{f.name}</span>
                <span className="shrink-0">{formatSize(f.size)}</span>
              </li>
            ))}
          </ul>
        )}
        <FieldError id="support-files-error" codes={filesCodes} messages={errors} />
      </div>

      <Honeypot />
      {recaptchaSiteKey && <Recaptcha siteKey={recaptchaSiteKey} lang={locale} resetKey={state} />}

      {state.error && (
        <p className="mt-5 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand" role="alert">
          {errors[state.error]}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !!fileError}
        className="mt-6 w-full rounded-full bg-cta px-6 py-3 font-semibold text-white transition-colors hover:bg-cta-hover disabled:opacity-60"
      >
        {pending ? t.submitting : t.submit}
      </button>
      <p className="mt-3 text-center text-xs text-muted">{t.privacy}</p>
    </form>
  );
}
