"use client";

import { useEffect, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  obtenerCategoriasGastosFijos,
  quincenaNumeroDeDia,
  tipoPresupuestoPorDefecto,
} from "@/lib/gastos-fijos";
import type { TipoPresupuestoGasto } from "@/types/finanzas";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function FormularioGastoFijo({ onExito }: { onExito?: () => void } = {}) {
  const { agregarGastoFijo, configuracion } = useFinanzas();
  const categorias = obtenerCategoriasGastosFijos(configuracion);

  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState<string>(categorias[0] ?? "Otros");
  const [diaPago, setDiaPago] = useState("1");
  const [quincena, setQuincena] = useState<"1" | "2">("1");
  const [quincenaManual, setQuincenaManual] = useState(false);
  const [tipoPresupuesto, setTipoPresupuesto] = useState<TipoPresupuestoGasto>(
    tipoPresupuestoPorDefecto(categorias[0] ?? "Otros")
  );
  const [tipoManual, setTipoManual] = useState(false);
  const [moneda, setMoneda] = useState(configuracion.moneda);
  const [notas, setNotas] = useState("");
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

    agregarGastoFijo({
      nombre: nombre.trim(),
      monto: montoNum,
      categoria,
      diaPago: diaNum,
      quincena: Number(quincena) as 1 | 2,
      moneda,
      activo: true,
      notas: notas.trim(),
      tipoPresupuesto,
    });

    setNombre("");
    setMonto("");
    setCategoria(categorias[0] ?? "Otros");
    setDiaPago("1");
    setQuincena("1");
    setQuincenaManual(false);
    setTipoPresupuesto(tipoPresupuestoPorDefecto(categorias[0] ?? "Otros"));
    setTipoManual(false);
    setNotas("");
    onExito?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
    >
      <h2 className="text-base font-semibold text-foreground">Nuevo gasto fijo</h2>
      <p className="mt-1 text-xs text-muted">
        Asigna cada gasto a la quincena en la que lo pagas o presupuestas
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Nombre</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Alquiler, Netflix, Internet..."
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Monto mensual</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Moneda</span>
          <SelectorMoneda value={moneda} onChange={setMoneda} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Categoría</span>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={inputClass}
          >
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Día de pago</span>
          <input
            type="number"
            min={1}
            max={31}
            value={diaPago}
            onChange={(e) => setDiaPago(e.target.value)}
            className={inputClass}
          />
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
            <option value="1">Q1 (días 1–15)</option>
            <option value="2">Q2 (días 16–fin de mes)</option>
          </select>
          <span className="text-xs text-muted">
            Se sugiere según el día de pago. Puedes cambiarla manualmente.
          </span>
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
          <span className="text-xs text-muted">
            Se sugiere según la categoría. Puedes cambiarla manualmente.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Notas (opcional)</span>
          <input
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Detalles adicionales..."
            className={inputClass}
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-gasto">{error}</p>}

      <button
        type="submit"
        className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Agregar gasto fijo
      </button>
    </form>
  );
}
