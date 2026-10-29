"use client";

import { useEffect, useRef } from "react";

type Grecaptcha = {
  render: (el: HTMLElement, opts: { sitekey: string; theme: "light" | "dark" }) => number;
  reset: (id?: number) => void;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
    __onRecaptchaLoad?: () => void;
  }
}

const SCRIPT_ID = "recaptcha-api";

/**
 * reCAPTCHA v2 checkbox. Google's widget adds a hidden `g-recaptcha-response` field to
 * the surrounding form. `resetKey` changes after every submit so a used token is cleared.
 */
export function Recaptcha({ siteKey, lang, resetKey }: { siteKey: string; lang: string; resetKey: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);

  useEffect(() => {
    const render = () => {
      if (!box.current || widget.current !== null || !window.grecaptcha?.render) return;
      const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      widget.current = window.grecaptcha.render(box.current, { sitekey: siteKey, theme });
    };

    if (window.grecaptcha?.render) {
      render();
      return;
    }
    window.__onRecaptchaLoad = render;
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = `https://www.google.com/recaptcha/api.js?onload=__onRecaptchaLoad&render=explicit&hl=${lang}`;
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
  }, [siteKey, lang]);

  useEffect(() => {
    if (widget.current !== null) window.grecaptcha?.reset(widget.current);
  }, [resetKey]);

  return <div ref={box} className="mt-6 min-h-[78px]" />;
}
