"use client";

import { useState } from "react";
import { PanelConfiguracion } from "@/components/configuracion/PanelConfiguracion";
import { RespaldoDatos } from "@/components/configuracion/RespaldoDatos";
import { Logo } from "@/components/ui/Logo";
import { TutorialGuia } from "@/components/tutorial/TutorialGuia";

const VERSION = "0.1.0";

export function ConfiguracionAcercaDe() {
  const [mostrarGuia, setMostrarGuia] = useState(false);

  return (
    <div className="space-y-6">
      <PanelConfiguracion
        titulo="Acerca de Fynix"
        descripcion="Tu gestor de finanzas personales"
      >
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
          <Logo variante="compacto" className="h-16 w-16" />
          <div className="mt-4 sm:mt-0 sm:ml-5">
            <p className="text-lg font-semibold text-foreground">Fynix</p>
            <p className="mt-1 text-sm text-muted">Tu dinero, tu futuro</p>
            <p className="mt-2 text-xs text-muted">Versión {VERSION}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm text-muted">
          <p>
            Fynix te ayuda a organizar ingresos, gastos, tarjetas, préstamos y
            compromisos por quincena, pensado para quienes cobran dos veces al mes.
          </p>
          <p>
            Desarrollado con enfoque en claridad, privacidad y control de tus
            datos financieros.
          </p>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-background px-4 py-3 text-xs text-muted">
          <p className="font-medium text-foreground">Aviso</p>
          <p className="mt-1">
            Fynix es una herramienta de organización personal. No constituye
            asesoría financiera, fiscal ni legal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMostrarGuia(true)}
          className="mt-5 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover sm:w-auto"
        >
          Ver guía de inicio
        </button>

        <p className="mt-5 text-center text-xs text-muted sm:text-left">
          © 2026 Fynix. Todos los derechos reservados.
        </p>
      </PanelConfiguracion>

      <div data-ayuda="respaldo">
        <RespaldoDatos />
      </div>

      <TutorialGuia abierto={mostrarGuia} onCerrar={() => setMostrarGuia(false)} />
    </div>
  );
}
