"use client";

import { useActionState } from "react";
import { login, type FormState } from "../actions";
import { adminInput } from "@/components/admin/styles";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, {} as FormState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">
        Имэйл
        <input name="email" type="email" required autoComplete="username" className={`mt-1.5 ${adminInput}`} />
      </label>
      <label className="block text-sm font-medium">
        Нууц үг
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={`mt-1.5 ${adminInput}`}
        />
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
