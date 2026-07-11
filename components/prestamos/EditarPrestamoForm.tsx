"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { Prestamo, TipoTasaInteres } from "@/types/finanzas";
import { calcularCuotaConInteres } from "@/lib/prestamos";
import { formatearMoneda } from "@/lib/quincenas";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface EditarPrestamoFormProps {
  prestamo: Prestamo;
  onCancelar: () => void;
}

export function EditarPrestamoForm({ prestamo, onCancelar }: EditarPrestamoFormProps) {
  const { actualizarPrestamo } = useFinanzas();

  const [entidad, setEntidad] = useState(prestamo.entidad);
  const [descripcion, setDescripcion] = useState(prestamo.descripcion);
  const [montoPrestado, setMontoPrestado] = useState(String(prestamo.montoPrestado));
  const [tasaInteres, setTasaInteres] = useState(String(prestamo.tasaInteres));
  const [tipoTasa, setTipoTasa] = useState<TipoTasaInteres>(prestamo.tipoTasa);
  const [montoCuota, setMontoCuota] = useState(String(prestamo.montoCuota));
  const [cuotasTotales, setCuotasTotales] = useState(String(prestamo.cuotasTotales));
  const [cuotasPagadas, setCuotasPagadas] = useState(String(prestamo.cuotasPagadas));
  const [diaPago, setDiaPago] = useState(String(prestamo.diaPago));
  const [fechaInicio, setFechaInicio] = useState(prestamo.fechaInicio);
  const [moneda, setMoneda] = useState(prestamo.moneda);
  const [cuotaManual, setCuotaManual] = useState(false);
  const [error, setError] = useState("");

  const prestadoNum = parseFloat(montoPrestado) || 0;
  const tasaNum = parseFloat(tasaInteres) || 0;
  const cuotasNum = parseInt(cuotasTotales, 10) || 0;

  const vistaPrevia = useMemo(() => {
    if (prestadoNum <= 0 || cuotasNum <= 0) return null;
    const cuota = cuotaManual
      ? parseFloat(montoCuota) || 0
      : calcularCuotaConInteres(prestadoNum, tasaNum, cuotasNum, tipoTasa);
    const total = Math.round(cuota * cuotasNum * 100) / 100;
    const intereses = Math.max(0, Math.round((total - prestadoNum) * 100) / 100);
    return { cuota, total, intereses };
  }, [prestadoNum, cuotasNum, tasaNum, tipoTasa, cuotaManual, montoCuota]);

  useEffect(() => {
    if (cuotaManual) return;
    if (prestadoNum > 0 && cuotasNum > 0) {
      setMontoCuota(
        String(calcularCuotaConInteres(prestadoNum, tasaNum, cuotasNum, tipoTasa))
      );
    }
  }, [montoPrestado, tasaInteres, cuotasTotales, tipoTasa, cuotaManual, prestadoNum, cuotasNum, tasaNum]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cuotaNum = parseFloat(montoCuota);
    const cuotasTotalNum = parseInt(cuotasTotales, 10);
    const cuotasPagadasNum = parseInt(cuotasPagadas, 10) || 0;

    if (!entidad.trim()) {
      setError("La entidad es obligatoria");
      return;
    }
    if (!montoPrestado || isNaN(prestadoNum) || prestadoNum <= 0) {
      setError("Ingresa un monto prestado válido");
      return;
    }
    if (tasaNum < 0) {
      setError("La tasa de interés no puede ser negativa");
      return;
    }
    if (!cuotasTotales || isNaN(cuotasTotalNum) || cuotasTotalNum <= 0) {
      setError("Ingresa el número de cuotas");
      return;
    }
    if (!montoCuota || isNaN(cuotaNum) || cuotaNum <= 0) {
      setError("Ingresa un monto de cuota válido");
      return;
    }
    if (cuotasPagadasNum < 0 || cuotasPagadasNum > cuotasTotalNum) {
      setError("Las cuotas pagadas no pueden superar el total");
      return;
    }

    actualizarPrestamo(prestamo.id, {
      entidad: entidad.trim(),
      descripcion: descripcion.trim(),
      montoPrestado: prestadoNum,
      montoTotal: Math.round(cuotaNum * cuotasTotalNum * 100) / 100,
      montoCuota: cuotaNum,
      tasaInteres: tasaNum,
      tipoTasa,
      diaPago: Math.min(31, Math.max(1, Number(diaPago))),
      cuotasTotales: cuotasTotalNum,
      cuotasPagadas: cuotasPagadasNum,
      moneda,
      fechaInicio,
    });

    onCancelar();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-border pt-6">
      <h4 className="text-sm font-semibold text-foreground">Editar préstamo</h4>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Entidad</span>
          <input type="text" value={entidad} onChange={(e) => setEntidad(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Descripción</span>
          <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Moneda</span>
          <SelectorMoneda value={moneda} onChange={setMoneda} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Fecha de inicio</span>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Monto prestado</span>
          <input type="number" min="0.01" step="0.01" value={montoPrestado} onChange={(e) => setMontoPrestado(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Tasa de interés (%)</span>
          <input type="number" min="0" step="0.01" value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Tipo de tasa</span>
          <select value={tipoTasa} onChange={(e) => setTipoTasa(e.target.value as TipoTasaInteres)} className={inputClass}>
            <option value="anual">Anual</option>
            <option value="mensual">Mensual</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Cuotas totales</span>
          <input type="number" min={1} value={cuotasTotales} onChange={(e) => setCuotasTotales(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Monto por cuota</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={montoCuota}
            onChange={(e) => {
              setCuotaManual(true);
              setMontoCuota(e.target.value);
            }}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Cuotas pagadas</span>
          <input type="number" min={0} value={cuotasPagadas} onChange={(e) => setCuotasPagadas(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Día de pago</span>
          <input type="number" min={1} max={31} value={diaPago} onChange={(e) => setDiaPago(e.target.value)} className={inputClass} />
        </label>
      </div>

      {vistaPrevia && vistaPrevia.cuota > 0 && (
        <div className="rounded-lg bg-accent/5 px-4 py-3 text-xs text-muted">
          <p>
            Intereses totales:{" "}
            <span className="font-semibold text-gasto">
              {formatearMoneda(vistaPrevia.intereses, moneda)}
            </span>
          </p>
        </div>
      )}

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
