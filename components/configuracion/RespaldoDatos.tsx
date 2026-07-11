"use client";

import { useRef, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { exportarDatos, importarDesdeArchivo } from "@/lib/exportar";

export function RespaldoDatos() {
  const { transacciones, tarjetas, prestamos, cuotasPopular, gastosFijos, cuentas, efectivo, configuracion, importarEstado } =
    useFinanzas();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  function handleExportar() {
    exportarDatos({ transacciones, tarjetas, prestamos, cuotasPopular, gastosFijos, cuentas, efectivo, configuracion });
    setMensaje({ tipo: "ok", texto: "Datos exportados correctamente" });
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
        Exporta o importa todos tus datos en formato JSON
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleExportar}
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
