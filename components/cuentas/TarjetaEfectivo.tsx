"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { formatearMoneda } from "@/lib/quincenas";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function TarjetaEfectivo() {
  const { efectivo, configuracion, actualizarEfectivo } = useFinanzas();
  const [editando, setEditando] = useState(false);
  const [monto, setMonto] = useState(String(efectivo));
  const [error, setError] = useState("");

  function iniciarEdicion() {
    setMonto(String(efectivo));
    setError("");
    setEditando(true);
  }

  function guardar() {
    const num = parseFloat(monto);
    if (isNaN(num) || num < 0) {
      setError("Ingresa un monto válido");
      return;
    }
    actualizarEfectivo(Math.round(num * 100) / 100);
    setEditando(false);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Efectivo en mano</h3>
          <p className="mt-1 text-xs text-muted">
            Dinero físico que tienes disponible ({configuracion.moneda})
          </p>
        </div>
        {!editando && (
          <button
            type="button"
            onClick={iniciarEdicion}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
          >
            Ajustar
          </button>
        )}
      </div>

      {!editando ? (
        <p className="mt-4 text-2xl font-bold text-ingreso">
          {formatearMoneda(efectivo, configuracion.moneda)}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <input
            type="number"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className={inputClass}
            autoFocus
          />
          {error && <p className="text-sm text-gasto">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={guardar}
              className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-muted">
        Se actualiza al registrar gastos o ingresos pagados en efectivo
      </p>
    </div>
  );
}
