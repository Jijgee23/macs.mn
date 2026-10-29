"use client";

import { useActionState } from "react";
import { changeOwnPassword, type FormState } from "../../actions";
import { adminButton, adminCard, adminInput } from "@/components/admin/styles";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPassword, {} as FormState);
  return (
    <form action={action} className={`${adminCard} space-y-3`}>
      <h2 className="font-semibold">Нууц үг солих</h2>
      <label className="block text-sm font-medium">
        Одоогийн нууц үг
        <input name="current" type="password" required autoComplete="current-password" className={`mt-1 ${adminInput}`} />
      </label>
      <label className="block text-sm font-medium">
        Шинэ нууц үг <span className="font-normal text-muted">(8+ тэмдэгт)</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={`mt-1 ${adminInput}`} />
      </label>
      <label className="block text-sm font-medium">
        Шинэ нууц үг дахин
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={`mt-1 ${adminInput}`} />
      </label>
      {state.error && <p className="text-sm text-brand" role="alert">{state.error}</p>}
      {state.ok && <p className="text-sm text-ok" role="status">Нууц үг солигдлоо</p>}
      <button disabled={pending} className={adminButton}>
        {pending ? "Хадгалж байна…" : "Солих"}
      </button>
    </form>
  );
}
