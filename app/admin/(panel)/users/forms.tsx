"use client";

import { useActionState, useTransition } from "react";
import { createAdmin, deleteAdmin, setAdminPassword, type FormState } from "../../actions";
import { adminButton, adminCard, adminInput } from "@/components/admin/styles";

function Status({ state, ok }: { state: FormState; ok: string }) {
  if (state.error) return <p className="text-sm text-brand" role="alert">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-ok" role="status">{ok}</p>;
  return null;
}

export function AddAdminForm() {
  const [state, action, pending] = useActionState(createAdmin, {} as FormState);
  return (
    <form action={action} className={`${adminCard} h-fit space-y-3`}>
      <h2 className="font-semibold">Админ нэмэх</h2>
      <label className="block text-sm font-medium">
        Имэйл
        <input name="email" type="email" required autoComplete="off" className={`mt-1 ${adminInput}`} />
      </label>
      <label className="block text-sm font-medium">
        Нэр <span className="font-normal text-muted">(заавал биш)</span>
        <input name="name" autoComplete="off" className={`mt-1 ${adminInput}`} />
      </label>
      <label className="block text-sm font-medium">
        Түр нууц үг <span className="font-normal text-muted">(8+ тэмдэгт)</span>
        <input name="password" type="text" required minLength={8} autoComplete="new-password" className={`mt-1 ${adminInput}`} />
      </label>
      <p className="text-xs text-muted">Шинэ админ нэвтэрсний дараа «Миний бүртгэл» хэсгээс нууц үгээ солино.</p>
      <Status state={state} ok="Админ нэмэгдлээ" />
      <button disabled={pending} className={adminButton}>
        {pending ? "Нэмж байна…" : "Нэмэх"}
      </button>
    </form>
  );
}

export function SetPasswordForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(setAdminPassword.bind(null, id), {} as FormState);
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-muted hover:text-ink">Нууц үг шинэчлэх</summary>
      <form action={action} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          name="password"
          type="text"
          required
          minLength={8}
          placeholder="Шинэ нууц үг (8+)"
          autoComplete="new-password"
          className={`${adminInput} sm:max-w-xs`}
        />
        <button disabled={pending} className={adminButton}>
          Хадгалах
        </button>
        <Status state={state} ok="Нууц үг шинэчлэгдлээ" />
      </form>
    </details>
  );
}

export function DeleteAdminButton({ id, email }: { id: string; email: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`${email} админыг устгах уу?`)) start(() => deleteAdmin(id));
      }}
      className="text-sm text-brand hover:underline disabled:opacity-50"
    >
      Устгах
    </button>
  );
}
