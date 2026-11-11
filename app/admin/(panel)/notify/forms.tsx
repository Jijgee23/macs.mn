"use client";

import { useActionState, useTransition } from "react";
import { addNotifyRecipient, deleteNotifyRecipient, type FormState } from "../../actions";
import { adminButton, adminCard, adminInput } from "@/components/admin/styles";

export function AddRecipientForm() {
  const [state, action, pending] = useActionState(addNotifyRecipient, {} as FormState);
  return (
    <form action={action} className={`${adminCard} h-fit space-y-3`}>
      <h2 className="font-semibold">Хаяг нэмэх</h2>
      <label className="block text-sm font-medium">
        Имэйл
        <input name="email" type="email" required autoComplete="off" className={`mt-1 ${adminInput}`} />
      </label>
      {state.error && <p className="text-sm text-brand" role="alert">{state.error}</p>}
      {state.ok && <p className="text-sm text-ok" role="status">Хаяг нэмэгдлээ</p>}
      <button disabled={pending} className={adminButton}>
        {pending ? "Нэмж байна…" : "Нэмэх"}
      </button>
    </form>
  );
}

export function DeleteRecipientButton({ id, email }: { id: string; email: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`${email} хаягийг мэдэгдлээс хасах уу?`)) start(() => deleteNotifyRecipient(id));
      }}
      className="text-sm text-brand hover:underline disabled:opacity-50"
    >
      Хасах
    </button>
  );
}
