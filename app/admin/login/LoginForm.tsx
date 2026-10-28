"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base outline-none focus:border-brand";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, {} as LoginState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">
        Имэйл
        <input name="email" type="email" required autoComplete="username" className={inputClass} />
      </label>
      <label className="block text-sm font-medium">
        Нууц үг
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      {state.error && (
        <p className="text-sm text-brand" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-cta px-6 py-2.5 font-semibold text-white hover:bg-cta-hover disabled:opacity-60"
      >
        {pending ? "Шалгаж байна…" : "Нэвтрэх"}
      </button>
    </form>
  );
}
