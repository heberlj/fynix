"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useSesionInactividad } from "@/hooks/useSesionInactividad";

export function ControlSesionInactividad() {
  const { sesion, cerrarSesion } = useAuth();
  const router = useRouter();

  const onExpirar = useCallback(() => {
    cerrarSesion();
    router.replace("/login?motivo=inactividad");
  }, [cerrarSesion, router]);

  const { mostrarAviso, segundosRestantes, extenderSesion } =
    useSesionInactividad({
      activo: Boolean(sesion),
      onExpirar,
    });

  if (!sesion || !mostrarAviso || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sesion-expiracion-titulo"
        aria-describedby="sesion-expiracion-descripcion"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl sm:rounded-xl"
      >
        <div className="border-b border-border px-5 py-4">
          <h2
            id="sesion-expiracion-titulo"
            className="text-base font-semibold text-foreground"
          >
            Sesión por expirar
          </h2>
        </div>
        <div className="space-y-4 px-5 py-5">
          <p
            id="sesion-expiracion-descripcion"
            className="text-sm leading-relaxed text-muted"
          >
            Por tu seguridad, cerraremos la sesión por inactividad en{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {segundosRestantes}s
            </span>
            .
          </p>
          <button
            type="button"
            onClick={extenderSesion}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Seguir en la sesión
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
