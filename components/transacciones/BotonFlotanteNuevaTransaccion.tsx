"use client";

import Link from "next/link";

export function BotonFlotanteNuevaTransaccion() {
  return (
    <Link
      href="/transacciones?nueva=1"
      className="fixed bottom-6 right-4 z-30 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-accent-hover sm:bottom-8 sm:right-6"
      aria-label="Nueva transacción"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span>Nueva transacción</span>
    </Link>
  );
}
