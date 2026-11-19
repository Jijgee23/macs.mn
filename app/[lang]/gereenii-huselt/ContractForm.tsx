"use client";

import { useActionState, useState } from "react";
import { Building2, User } from "lucide-react";
import { submitContract, type ContractFormState } from "./actions";
import type { ContractCopy, ContractField } from "./copy";
import type { FormErrorCode } from "@/content/common";
import { FieldError, FormSuccess, Honeypot, inputClass } from "@/components/FormParts";
import { Recaptcha } from "@/components/Recaptcha";
import type { Locale } from "@/lib/locale";

const initialState: ContractFormState = { ok: false };

type Kind = "ORG" | "PERSON";

type Props = {
  locale: Locale;
  t: ContractCopy;
  errors: Record<FormErrorCode, string>;
  recaptchaSiteKey: string | null;
  /** Names of the products listed on the site (managed in the admin). */
  productNames: string[];
};

export function ContractForm({ locale, t, errors, recaptchaSiteKey, productNames }: Props) {
  const [state, formAction, pending] = useActionState(submitContract, initialState);
  const [kind, setKind] = useState<Kind>(state.values?.type === "PERSON" ? "PERSON" : "ORG");

  if (state.ok) {
    return <FormSuccess title={t.successTitle} body={t.successBody} />;
  }

  const e = state.errors ?? {};
  const v = state.values;
  const person = kind === "PERSON";

  /** One labelled text input; every field of this form is required except the message. */
  const field = (
    name: ContractField,
    label: string,
    extra: { type?: string; autoComplete?: string; hint?: string; placeholder?: string; inputMode?: "numeric" | "tel" } = {},
  ) => (
    <label className="block text-sm font-medium">
      {label} <span className="text-brand">*</span>
      <input
        name={name}
        defaultValue={v?.[name]}
        type={extra.type ?? "text"}
        required
        autoComplete={extra.autoComplete}
        inputMode={extra.inputMode}
        placeholder={extra.placeholder}
        className={inputClass}
        aria-invalid={!!e[name]}
        aria-describedby={e[name] ? `${name}-error` : undefined}
      />
      {extra.hint && !e[name] && <span className="mt-1 block text-xs font-normal text-muted">{extra.hint}</span>}
      <FieldError id={`${name}-error`} codes={e[name]} messages={errors} />
    </label>
  );

  /**
   * A form section. Sections of the other applicant type stay mounted (so typed text survives
   * switching back) but are hidden and disabled, which keeps them out of the submission.
   */
  const section = (title: string, children: React.ReactNode, opts: { first?: boolean; off?: boolean } = {}) => (
    <fieldset
      className={opts.first ? "" : "mt-8 border-t border-line pt-6"}
      hidden={opts.off}
      disabled={opts.off}
    >
      <legend className="mb-4 text-base font-bold">{title}</legend>
      {children}
    </fieldset>
  );

  const kinds: { id: Kind; label: string; Icon: typeof User }[] = [
    { id: "ORG", label: t.typeOrg, Icon: Building2 },
    { id: "PERSON", label: t.typePerson, Icon: User },
  ];

  return (
    <form action={formAction} className="rounded-3xl border border-line bg-surface p-6 shadow-pop sm:p-8" noValidate>
      <input type="hidden" name="lang" value={locale} />

      <fieldset>
        <legend className="mb-3 text-base font-bold">{t.whoTitle}</legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t.whoTitle}>
          {kinds.map(({ id, label, Icon }) => (
            <label
              key={id}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-3.5 py-3 text-sm font-semibold transition-colors hover:border-line-strong has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand"
            >
              <input
                type="radio"
                name="type"
                value={id}
                checked={kind === id}
                onChange={() => setKind(id)}
                className="sr-only"
              />
              <Icon className="size-4" aria-hidden />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {section(
        t.org,
        <div className="grid gap-5 sm:grid-cols-2">
          {field("regNo", t.regNo, { inputMode: "numeric", hint: t.regNoHintOrg })}
          {field("orgName", t.orgName, { autoComplete: "organization" })}
        </div>,
        { off: person },
      )}

      {section(
        t.person,
        <div className="grid gap-5 sm:grid-cols-3">
          {field("regNo", t.regNo, { hint: t.regNoHintPerson })}
          {field("personLastName", t.lastName, { autoComplete: "family-name" })}
          {field("personFirstName", t.firstName, { autoComplete: "given-name" })}
        </div>,
        { off: !person },
      )}

      {section(
        t.approver,
        <div className="grid gap-5 sm:grid-cols-2">
          {field("approverLastName", t.lastName)}
          {field("approverFirstName", t.firstName)}
          {field("approverPosition", t.position)}
          {field("approverPhone", t.phone, { type: "tel", autoComplete: "off", inputMode: "tel", placeholder: t.phonePlaceholder })}
        </div>,
        { off: person },
      )}

      {section(
        t.representative,
        <div className="grid gap-5 sm:grid-cols-2">
          {field("repLastName", t.lastName)}
          {field("repFirstName", t.firstName)}
          {field("repPosition", t.position)}
          {field("repPhone", t.phone, { type: "tel", autoComplete: "off", inputMode: "tel", placeholder: t.phonePlaceholder })}
        </div>,
        { off: person },
      )}

      {section(
        person ? t.contactPerson : t.contact,
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("address", t.address, { autoComplete: "street-address" })}</div>
          {field("phone", t.phone, { type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: t.phonePlaceholder })}
          {field("email", t.email, { type: "email", autoComplete: "email" })}
        </div>,
      )}

      {section(
        t.program,
        <>
          <p className="text-sm font-medium">
            {t.products} <span className="text-brand">*</span>
          </p>
          <p className="text-xs text-muted">{t.productsHint}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2" aria-describedby={e.products ? "products-error" : undefined}>
            {productNames.map((name) => (
              <label
                key={name}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3.5 py-2.5 text-sm transition-colors hover:border-line-strong has-checked:border-brand has-checked:bg-brand-soft"
              >
                <input
                  type="checkbox"
                  name="products"
                  value={name}
                  defaultChecked={v?.products.includes(name)}
                  className="size-4 accent-[#b91c1c]"
                />
                {name}
              </label>
            ))}
          </div>
          <FieldError id="products-error" codes={e.products} messages={errors} />

          <div className="mt-5 sm:max-w-xs">{field("userCount", t.userCount, { type: "number", inputMode: "numeric" })}</div>

          <label className="mt-5 block text-sm font-medium">
            {t.message}
            <textarea
              name="message"
              defaultValue={v?.message}
              rows={3}
              placeholder={t.messagePlaceholder}
              className={inputClass}
              aria-invalid={!!e.message}
            />
            <FieldError id="message-error" codes={e.message} messages={errors} />
          </label>
        </>,
      )}

      <Honeypot />
      {recaptchaSiteKey && <Recaptcha siteKey={recaptchaSiteKey} lang={locale} resetKey={state} />}

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
