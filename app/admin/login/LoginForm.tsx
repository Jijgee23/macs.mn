"use client";

import { useActionState, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { login, type LoginState } from "../actions";
import { adminInput } from "@/components/admin/styles";

const iconInput = `${adminInput} py-2.5 pl-10`;

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, {} as LoginState);
  // Controlled so these survive React's form reset after a failed attempt.
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // After a failed attempt, put the cursor back in the (now empty) password field.
  useEffect(() => {
    if (state.error) passwordRef.current?.focus();
  }, [state]);

  const trackCapsLock = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState("CapsLock"));

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-brand-line bg-brand-soft px-3 py-2.5 text-sm text-brand"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label htmlFor="login-email" className="block text-sm font-medium">
          Имэйл
        </label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="username"
            inputMode="email"
            spellCheck={false}
            placeholder="name@macs.mn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={state.error ? true : undefined}
            className={iconInput}
          />
        </div>
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium">
          Нууц үг
        </label>
        <div className="relative mt-1.5">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            ref={passwordRef}
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            onKeyDown={trackCapsLock}
            onKeyUp={trackCapsLock}
            onBlur={() => setCapsLock(false)}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={capsLock ? "login-capslock" : undefined}
            className={`${iconInput} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Нууц үгийг нуух" : "Нууц үгийг харуулах"}
            aria-pressed={showPassword}
            aria-controls="login-password"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-muted transition-colors hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
        {capsLock && (
          <p id="login-capslock" className="mt-1.5 text-xs text-brand" role="status">
            Caps Lock асаалттай байна
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
        <input
          type="checkbox"
          name="remember"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="size-4 accent-[#b91c1c]"
        />
        Намайг 30 хоног сана
        <span className="text-xs text-muted">(хувийн компьютер дээр)</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="group flex w-full items-center justify-center gap-2 rounded-full bg-cta px-6 py-2.5 font-semibold text-white transition-colors hover:bg-cta-hover disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Шалгаж байна…
          </>
        ) : (
          <>
            Нэвтрэх
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}
