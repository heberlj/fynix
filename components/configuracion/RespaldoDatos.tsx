"use client";

import { useRef, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { usePlanLimites } from "@/hooks/usePlanLimites";
import {
  exportarDatos,
  exportarReporteCsv,
  exportarTransaccionesCsv,
  importarDesdeArchivo,
} from "@/lib/exportar";
import { MENSAJE_EXPORTAR_CSV } from "@/lib/plan-limites";
import { AvisoLimitePro } from "@/components/suscripcion/AvisoLimitePro";

export function RespaldoDatos() {
  const {
    transacciones,
    tarjetas,
    prestamos,
    metasAhorro,
    cuotasPopular,
    gastosFijos,
    cuentas,
    efectivo,
    configuracion,
    importarEstado,
  } = useFinanzas();
  const { puedeExportarCsv } = usePlanLimites();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  const estado = {
    transacciones,
    tarjetas,
    prestamos,
    metasAhorro,
    cuotasPopular,
    gastosFijos,
    cuentas,
    efectivo,
    configuracion,
  };

  function handleExportarJson() {
    exportarDatos(estado);
    setMensaje({ tipo: "ok", texto: "Datos exportados en JSON" });
    setTimeout(() => setMensaje(null), 3000);
  }

  function handleExportarTransaccionesCsv() {
    exportarTransaccionesCsv(estado);
    setMensaje({ tipo: "ok", texto: "Transacciones exportadas en CSV" });
    setTimeout(() => setMensaje(null), 3000);
  }

  function handleExportarReporteCsv() {
    exportarReporteCsv(estado);
    setMensaje({ tipo: "ok", texto: "Reporte mensual exportado en CSV" });
    setTimeout(() => setMensaje(null), 3000);
  }

  async function handleImportar(archivo: File) {
    const resultado = await importarDesdeArchivo(archivo);
    if (!resultado.ok) {
      setMensaje({ tipo: "error", texto: resultado.error });
      return;
    }

    const confirmar = window.confirm(
      "¿Importar estos datos? Se reemplazará toda la información actual."
    );
    if (!confirmar) return;

    importarEstado(resultado.estado);
    setMensaje({ tipo: "ok", texto: "Datos importados correctamente" });
    setTimeout(() => setMensaje(null), 3000);
  }

  return (
    <div className="max-w-lg rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Respaldo de datos</h2>
      <p className="mt-1 text-xs text-muted">
        Exporta o importa tus datos. JSON disponible en todos los planes.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleExportarJson}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Exportar JSON
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          Importar JSON
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) handleImportar(archivo);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <h3 className="text-sm font-semibold text-foreground">
          Exportación avanzada
        </h3>
        <p className="mt-1 text-xs text-muted">
          CSV de transacciones, reporte mensual e importación desde tu banco.
        </p>

        {puedeExportarCsv ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportarTransaccionesCsv}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              Exportar transacciones (CSV)
            </button>
            <button
              type="button"
              onClick={handleExportarReporteCsv}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              Reporte mensual (CSV)
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <AvisoLimitePro mensaje={MENSAJE_EXPORTAR_CSV} />
          </div>
        )}
      </div>

      {mensaje && (
        <p
          className={`mt-3 text-sm ${
            mensaje.tipo === "ok" ? "text-ingreso" : "text-gasto"
          }`}
        >
          {mensaje.texto}
        </p>
      )}
    </div>
  );
}
