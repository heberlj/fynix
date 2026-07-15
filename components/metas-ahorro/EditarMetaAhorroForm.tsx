"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { MetaAhorro } from "@/types/finanzas";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface EditarMetaAhorroFormProps {
  meta: MetaAhorro;
  onCancelar: () => void;
}

export function EditarMetaAhorroForm({ meta, onCancelar }: EditarMetaAhorroFormProps) {
  const { actualizarMetaAhorro } = useFinanzas();

  const [nombre, setNombre] = useState(meta.nombre);
  const [montoObjetivo, setMontoObjetivo] = useState(String(meta.montoObjetivo));
  const [montoActual, setMontoActual] = useState(String(meta.montoActual));
  const [moneda, setMoneda] = useState(meta.moneda);
  const [fechaLimite, setFechaLimite] = useState(meta.fechaLimite ?? "");
  const [notas, setNotas] = useState(meta.notas ?? "");
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

    actualizarMetaAhorro(meta.id, {
      nombre: nombre.trim(),
      montoObjetivo: objetivo,
      montoActual: actual,
      moneda,
      fechaLimite: fechaLimite || undefined,
      notas: notas.trim() || undefined,
    });
    onCancelar();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-lg border border-border bg-background p-4"
    >
      <h4 className="text-sm font-semibold text-foreground">Editar meta</h4>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-foreground">Nombre</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">Moneda</span>
          <SelectorMoneda value={moneda} onChange={setMoneda} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">Monto objetivo</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={montoObjetivo}
            onChange={(e) => setMontoObjetivo(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">Ahorrado</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={montoActual}
            onChange={(e) => setMontoActual(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground">Fecha límite</span>
          <input
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-foreground">Notas</span>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className={inputClass}
          />
        </label>
      </div>

      {error && <p className="mt-2 text-sm text-gasto">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-surface-hover"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
