"use client";

import { useState, type InputHTMLAttributes } from "react";

const inputClass =
  "w-full rounded-lg border border-border bg-background py-2.5 pl-3 pr-10 text-sm text-foreground outline-none focus:border-accent";

function IconoOjo({ visible }: { visible: boolean }) {
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4",
    "aria-hidden": true,
  };

  if (visible) {
    return (
      <svg {...props}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-4.1 5.2" />
      <path d="M6.1 6.1C3.5 8.1 2 12 2 12a18.5 18.5 0 0 0 6.9 5.9" />
    </svg>
  );
}

type CampoContrasenaProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  className?: string;
};

export function CampoContrasena({
  className = "",
  ...props
}: CampoContrasenaProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${inputClass} ${className}`.trim()}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        tabIndex={-1}
      >
        <IconoOjo visible={visible} />
      </button>
    </div>
  );
}
