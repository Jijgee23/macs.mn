import type { FormErrorCode } from "@/content/common";

export const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base outline-none transition-shadow placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/10 aria-invalid:border-brand";

type FieldErrorProps = { id: string; codes?: FormErrorCode[]; messages: Record<FormErrorCode, string> };

export function FieldError({ id, codes, messages }: FieldErrorProps) {
  if (!codes?.length) return null;
  return (
    <p id={id} className="mt-1 text-sm text-brand">
      {messages[codes[0]]}
    </p>
  );
}

/** Hidden from people, tempting for bots; the Server Actions drop submissions that fill it. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
      <label>
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function FormSuccess({ title, body }: { title: string; body: string }) {
  return (
    <div className="self-start rounded-3xl border border-line bg-ok-soft p-8 shadow-card sm:p-10" role="status">
      <h2 className="text-2xl font-bold text-ok">{title}</h2>
      <p className="mt-3 text-muted">{body}</p>
    </div>
  );
}
