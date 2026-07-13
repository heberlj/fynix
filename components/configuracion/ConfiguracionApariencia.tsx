"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { TemaApp } from "@/types/finanzas";
import { PanelConfiguracion } from "@/components/configuracion/PanelConfiguracion";
import { SelectorTema } from "@/components/ui/SelectorTema";
import { aplicarTema } from "@/lib/tema";

export function ConfiguracionApariencia() {
  const { configuracion, actualizarConfiguracion } = useFinanzas();
  const [tema, setTema] = useState<TemaApp>(configuracion.tema ?? "claro");

  function handleTemaChange(nuevoTema: TemaApp) {
    setTema(nuevoTema);
    aplicarTema(nuevoTema);
    actualizarConfiguracion({ tema: nuevoTema });
  }

  return (
    <PanelConfiguracion
      titulo="Apariencia"
      descripcion="Personaliza cómo se ve Fynix en tu dispositivo"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">Tema</p>
          <p className="mt-0.5 text-xs text-muted">
            Elige entre modo claro, oscuro o seguir la preferencia de tu sistema
          </p>
          <div className="mt-3 max-w-md">
            <SelectorTema value={tema} onChange={handleTemaChange} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              { tema: "claro" as const, fondo: "bg-white", texto: "text-slate-900" },
              { tema: "oscuro" as const, fondo: "bg-slate-900", texto: "text-white" },
              { tema: "sistema" as const, fondo: "bg-gradient-to-r from-white to-slate-900", texto: "text-foreground" },
            ] as const
          ).map((vista) => (
            <button
              key={vista.tema}
              type="button"
              onClick={() => handleTemaChange(vista.tema)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                tema === vista.tema
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-border hover:border-accent/40"
              }`}
            >
              <div
                className={`h-16 rounded-lg border border-black/10 ${vista.fondo}`}
              />
              <p className={`mt-2 text-xs font-medium capitalize ${vista.texto}`}>
                {vista.tema === "sistema" ? "Sistema" : vista.tema}
              </p>
            </button>
          ))}
        </div>
      </div>
    </PanelConfiguracion>
  );
}
