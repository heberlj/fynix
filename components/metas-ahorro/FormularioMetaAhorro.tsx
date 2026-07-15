"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function FormularioMetaAhorro({
  onExito,
  enModal = false,
}: { onExito?: () => void; enModal?: boolean } = {}) {
  const { agregarMetaAhorro, configuracion } = useFinanzas();

  const [nombre, setNombre] = useState("");
  const [montoObjetivo, setMontoObjetivo] = useState("");
  const [montoActual, setMontoActual] = useState("0");
  const [moneda, setMoneda] = useState(configuracion.moneda);
  const [fechaLimite, setFechaLimite] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const objetivo = parseFloat(montoObjetivo);
    const actual = parseFloat(montoActual) || 0;

    if (!nombre.trim()) {
      setError("Ingresa un nombre para la meta");
      return;
    }
    if (!montoObjetivo || isNaN(objetivo) || objetivo <= 0) {
      setError("Ingresa un monto objetivo válido");
      return;
    }
    if (actual < 0) {
      setError("El monto actual no puede ser negativo");
      return;
    }

    agregarMetaAhorro({
      nombre: nombre.trim(),
      montoObjetivo: objetivo,
      montoActual: actual,
      moneda,
      fechaLimite: fechaLimite || undefined,
      notas: notas.trim() || undefined,
    });

    setNombre("");
    setMontoObjetivo("");
    setMontoActual("0");
    setFechaLimite("");
    setNotas("");
    onExito?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        enModal
          ? ""
          : "rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
      }
    >
      {!enModal && (
        <h2 className="text-base font-semibold text-foreground">
          Nueva meta de ahorro
        </h2>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Nombre</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Fondo de emergencia, viaje, carro..."
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Moneda</span>
          <SelectorMoneda value={moneda} onChange={setMoneda} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Monto objetivo</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={montoObjetivo}
            onChange={(e) => setMontoObjetivo(e.target.value)}
            placeholder="50000"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Ya ahorrado</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={montoActual}
            onChange={(e) => setMontoActual(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Fecha límite (opcional)
          </span>
          <input
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Notas (opcional)</span>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Detalles o recordatorios..."
            className={inputClass}
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-gasto">{error}</p>}

      <button
        type="submit"
        className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Crear meta
      </button>
    </form>
  );
}
