"use client";

import { useEffect, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { GastoFijo, TipoPresupuestoGasto } from "@/types/finanzas";
import {
  obtenerCategoriasGastosFijos,
  quincenaNumeroDeDia,
  tipoPresupuestoPorDefecto,
} from "@/lib/gastos-fijos";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface EditarGastoFijoFormProps {
  gasto: GastoFijo;
  onCancelar: () => void;
}

export function EditarGastoFijoForm({ gasto, onCancelar }: EditarGastoFijoFormProps) {
  const { actualizarGastoFijo, configuracion } = useFinanzas();
  const categorias = obtenerCategoriasGastosFijos(configuracion);

  const [nombre, setNombre] = useState(gasto.nombre);
  const [monto, setMonto] = useState(String(gasto.monto));
  const [categoria, setCategoria] = useState(gasto.categoria);
  const [diaPago, setDiaPago] = useState(String(gasto.diaPago));
  const [quincena, setQuincena] = useState<"1" | "2">(String(gasto.quincena) as "1" | "2");
  const [quincenaManual, setQuincenaManual] = useState(false);
  const [tipoPresupuesto, setTipoPresupuesto] = useState<TipoPresupuestoGasto>(
    gasto.tipoPresupuesto
  );
  const [tipoManual, setTipoManual] = useState(true);
  const [moneda, setMoneda] = useState(gasto.moneda);
  const [notas, setNotas] = useState(gasto.notas);
  const [activo, setActivo] = useState(gasto.activo);
  const [error, setError] = useState("");

  useEffect(() => {
    if (quincenaManual) return;
    const diaNum = parseInt(diaPago, 10);
    if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) return;
    const q = quincenaNumeroDeDia(diaNum);
    setQuincena(String(q) as "1" | "2");
  }, [diaPago, quincenaManual]);

  useEffect(() => {
    if (tipoManual) return;
    setTipoPresupuesto(tipoPresupuestoPorDefecto(categoria));
  }, [categoria, tipoManual]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const montoNum = parseFloat(monto);
    const diaNum = parseInt(diaPago, 10);

    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
      setError("El día de pago debe estar entre 1 y 31");
      return;
    }

    actualizarGastoFijo(gasto.id, {
      nombre: nombre.trim(),
      monto: montoNum,
      categoria,
      diaPago: diaNum,
      quincena: Number(quincena) as 1 | 2,
      moneda,
      notas: notas.trim(),
      activo,
      tipoPresupuesto,
    });

    onCancelar();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-border pt-6">
      <h4 className="text-sm font-semibold text-foreground">Editar gasto fijo</h4>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Nombre</span>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Monto mensual</span>
          <input type="number" min="0.01" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Moneda</span>
          <SelectorMoneda value={moneda} onChange={setMoneda} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Categoría</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass}>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Día de pago</span>
          <input type="number" min={1} max={31} value={diaPago} onChange={(e) => setDiaPago(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Quincena</span>
          <select
            value={quincena}
            onChange={(e) => {
              setQuincenaManual(true);
              setQuincena(e.target.value as "1" | "2");
            }}
            className={inputClass}
          >
            <option value="1">Q1</option>
            <option value="2">Q2</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Prioridad en presupuesto
          </span>
          <select
            value={tipoPresupuesto}
            onChange={(e) => {
              setTipoManual(true);
              setTipoPresupuesto(e.target.value as TipoPresupuestoGasto);
            }}
            className={inputClass}
          >
            <option value="esencial">Esencial — pagar primero</option>
            <option value="flexible">Flexible — se puede posponer</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Notas</span>
          <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)} className={inputClass} />
        </label>

        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-sm text-foreground">Activo (incluir en compromisos mensuales)</span>
        </label>
      </div>

      {error && <p className="text-sm text-gasto">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
