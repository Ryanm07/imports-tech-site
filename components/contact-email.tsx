"use client";

import { useState } from "react";

export function ContactEmail({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">(
    "idle",
  );

  async function copyEmail() {
    setStatus("copying");
    try {
      await navigator.clipboard.writeText(email);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="contact-email">
      <a href={`mailto:${email}`} className="contact-email-address">
        {email}
      </a>
      <div className="contact-email-actions">
        <a className="button primary" href={`mailto:${email}`}>
          Escrever um e-mail
        </a>
        <button
          className="button secondary"
          type="button"
          onClick={copyEmail}
          disabled={status === "copying"}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <rect x="8" y="8" width="12" height="13" rx="2" />
            <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
          </svg>
          {status === "copying"
            ? "Copiando…"
            : status === "copied"
              ? "Copiar novamente"
              : "Copiar e-mail"}
        </button>
      </div>
      <p className="copy-feedback" aria-live="polite" role="status">
        {status === "copied"
          ? "E-mail copiado."
          : status === "error"
            ? "Não foi possível copiar. Selecione o endereço acima e copie manualmente."
            : ""}
      </p>
    </div>
  );
}
