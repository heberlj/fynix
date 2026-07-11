"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { TipoTasaInteres } from "@/types/finanzas";
import { fechaHoy } from "@/lib/fechas";
import {
  calcularCuotaConInteres,
} from "@/lib/prestamos";
import { formatearMoneda } from "@/lib/quincenas";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function FormularioPrestamo({ onExito }: { onExito?: () => void } = {}) {
  const { agregarPrestamo, configuracion } = useFinanzas();

  const [entidad, setEntidad] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [montoPrestado, setMontoPrestado] = useState("");
  const [tasaInteres, setTasaInteres] = useState("");
  const [tipoTasa, setTipoTasa] = useState<TipoTasaInteres>("anual");
  const [montoCuota, setMontoCuota] = useState("");
  const [cuotasTotales, setCuotasTotales] = useState("");
  const [cuotasPagadas, setCuotasPagadas] = useState("0");
  const [diaPago, setDiaPago] = useState("15");
  const [fechaInicio, setFechaInicio] = useState(fechaHoy());
  const [moneda, setMoneda] = useState(configuracion.moneda);
  const [cuotaManual, setCuotaManual] = useState(false);
  const [error, setError] = useState("");

  const tasaNum = parseFloat(tasaInteres) || 0;
  const prestadoNum = parseFloat(montoPrestado) || 0;
  const cuotasNum = parseInt(cuotasTotales, 10) || 0;

  const vistaPrevia = useMemo(() => {
    if (prestadoNum <= 0 || cuotasNum <= 0) return null;
    const cuota = cuotaManual
      ? parseFloat(montoCuota) || 0
      : calcularCuotaConInteres(prestadoNum, tasaNum, cuotasNum, tipoTasa);
    const total = Math.round(cuota * cuotasNum * 100) / 100;
    const intereses = Math.max(0, Math.round((total - prestadoNum) * 100) / 100);
    return { cuota, total, intereses };
  }, [
    prestadoNum,
    cuotasNum,
    tasaNum,
    tipoTasa,
    cuotaManual,
    montoCuota,
  ]);

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

    const montoTotal = Math.round(cuotaNum * cuotasTotalNum * 100) / 100;

    agregarPrestamo({
      entidad: entidad.trim(),
      descripcion: descripcion.trim(),
      montoPrestado: prestadoNum,
      montoTotal,
      montoCuota: cuotaNum,
      tasaInteres: tasaNum,
      tipoTasa,
      diaPago: Math.min(31, Math.max(1, Number(diaPago))),
      cuotasTotales: cuotasTotalNum,
      cuotasPagadas: cuotasPagadasNum,
      moneda,
      fechaInicio,
    });

    setEntidad("");
    setDescripcion("");
    setMontoPrestado("");
    setTasaInteres("");
    setTipoTasa("anual");
    setMontoCuota("");
    setCuotasTotales("");
    setCuotasPagadas("0");
    setCuotaManual(false);
    setFechaInicio(fechaHoy());
    onExito?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
    >
      <h2 className="text-base font-semibold text-foreground">Nuevo préstamo</h2>
      <p className="mt-1 text-xs text-muted">
        Incluye tasa de interés para calcular la cuota automáticamente
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Entidad</span>
          <input
            type="text"
            value={entidad}
            onChange={(e) => setEntidad(e.target.value)}
            placeholder="Ej: Banco Popular, Cooperativa..."
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Descripción</span>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Préstamo personal, vehículo..."
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Moneda</span>
          <SelectorMoneda value={moneda} onChange={setMoneda} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Fecha de inicio</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Monto prestado</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={montoPrestado}
            onChange={(e) => setMontoPrestado(e.target.value)}
            placeholder="Capital recibido"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Tasa de interés (%)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tasaInteres}
            onChange={(e) => setTasaInteres(e.target.value)}
            placeholder="0 = sin interés"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Tipo de tasa</span>
          <select
            value={tipoTasa}
            onChange={(e) => setTipoTasa(e.target.value as TipoTasaInteres)}
            className={inputClass}
          >
            <option value="anual">Anual</option>
            <option value="mensual">Mensual</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Cuotas totales</span>
          <input
            type="number"
            min={1}
            step={1}
            value={cuotasTotales}
            onChange={(e) => setCuotasTotales(e.target.value)}
            placeholder="24"
            className={inputClass}
          />
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
            placeholder="0.00"
            className={inputClass}
          />
          <span className="text-xs text-muted">
            Se calcula con la tasa y el capital
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Cuotas ya pagadas</span>
          <input
            type="number"
            min={0}
            step={1}
            value={cuotasPagadas}
            onChange={(e) => setCuotasPagadas(e.target.value)}
            className={inputClass}
          />
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
      </div>

      {vistaPrevia && vistaPrevia.cuota > 0 && (
        <div className="mt-4 rounded-lg bg-accent/5 px-4 py-3 text-xs text-muted">
          <p>
            Cuota estimada:{" "}
            <span className="font-semibold text-foreground">
              {formatearMoneda(vistaPrevia.cuota, moneda)}
            </span>
          </p>
          <p className="mt-1">
            Total intereses:{" "}
            <span className="font-semibold text-gasto">
              {formatearMoneda(vistaPrevia.intereses, moneda)}
            </span>
            {" · "}
            Total a pagar:{" "}
            <span className="font-semibold text-foreground">
              {formatearMoneda(vistaPrevia.total, moneda)}
            </span>
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-gasto">{error}</p>}

      <button
        type="submit"
        className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Agregar préstamo
      </button>
    </form>
  );
}
