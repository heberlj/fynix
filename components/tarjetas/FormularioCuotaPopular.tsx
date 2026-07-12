"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { TarjetaCredito, TipoTasaInteres } from "@/types/finanzas";
import { fechaHoy } from "@/lib/fechas";
import {
  calcularCuotaConInteres,
  disponibleLimiteCuotasPopular,
} from "@/lib/cuotas-popular";
import { formatearMoneda } from "@/lib/quincenas";
import {
  formatearNumeroTarjeta,
  numeroCuotasDesdeEntrada,
  validarNumeroCuotas,
} from "@/lib/tarjetas";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface FormularioCuotaPopularProps {
  tarjeta: TarjetaCredito;
  onExito?: () => void;
  onCancelar?: () => void;
}

export function FormularioCuotaPopular({
  tarjeta,
  onExito,
  onCancelar,
}: FormularioCuotaPopularProps) {
  const { agregarCuotaPopular, cuotasPopular } = useFinanzas();

  const [descripcion, setDescripcion] = useState("");
  const [numeroReferencia, setNumeroReferencia] = useState("");
  const [montoCompra, setMontoCompra] = useState("");
  const [tasaInteres, setTasaInteres] = useState("");
  const [tipoTasa, setTipoTasa] = useState<TipoTasaInteres>("anual");
  const [montoCuota, setMontoCuota] = useState("");
  const [cuotasTotales, setCuotasTotales] = useState("");
  const [cuotasPagadas, setCuotasPagadas] = useState("0");
  const [fechaInicio, setFechaInicio] = useState(fechaHoy());
  const [moneda, setMoneda] = useState(tarjeta.moneda);
  const [cuotaManual, setCuotaManual] = useState(false);
  const [error, setError] = useState("");

  const compraNum = parseFloat(montoCompra) || 0;
  const tasaNum = parseFloat(tasaInteres) || 0;
  const cuotasNum = parseInt(cuotasTotales, 10) || 0;
  const limiteDisponible = useMemo(
    () => disponibleLimiteCuotasPopular(tarjeta, cuotasPopular),
    [tarjeta, cuotasPopular]
  );

  const vistaPrevia = useMemo(() => {
    if (compraNum <= 0 || cuotasNum <= 0) return null;
    const cuotaCalc = cuotaManual
      ? parseFloat(montoCuota) || 0
      : calcularCuotaConInteres(compraNum, tasaNum, cuotasNum, tipoTasa);
    const total = Math.round(cuotaCalc * cuotasNum * 100) / 100;
    const intereses = Math.max(0, Math.round((total - compraNum) * 100) / 100);
    return { cuota: cuotaCalc, total, intereses };
  }, [compraNum, cuotasNum, tasaNum, tipoTasa, cuotaManual, montoCuota]);

  useEffect(() => {
    if (cuotaManual) return;
    if (compraNum > 0 && cuotasNum > 0) {
      setMontoCuota(
        String(calcularCuotaConInteres(compraNum, tasaNum, cuotasNum, tipoTasa))
      );
    }
  }, [montoCompra, tasaInteres, cuotasTotales, tipoTasa, cuotaManual, compraNum, cuotasNum, tasaNum]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cuotaNum = parseFloat(montoCuota);
    const cuotasTotalNum = parseInt(cuotasTotales, 10);
    const cuotasPagadasNum = parseInt(cuotasPagadas, 10) || 0;

    if (!descripcion.trim()) {
      setError("La descripción es obligatoria");
      return;
    }
    if (!validarNumeroCuotas(numeroReferencia)) {
      setError("Ingresa el número de referencia del plan (16 dígitos)");
      return;
    }
    if (!montoCompra || isNaN(compraNum) || compraNum <= 0) {
      setError("Ingresa un monto de compra válido");
      return;
    }
    if (compraNum > limiteDisponible) {
      setError(
        `Supera el límite disponible (${formatearMoneda(limiteDisponible, tarjeta.moneda)})`
      );
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

    agregarCuotaPopular({
      tarjetaId: tarjeta.id,
      descripcion: descripcion.trim(),
      ...numeroCuotasDesdeEntrada(numeroReferencia),
      montoCompra: compraNum,
      montoTotal: Math.round(cuotaNum * cuotasTotalNum * 100) / 100,
      montoCuota: cuotaNum,
      tasaInteres: tasaNum,
      tipoTasa,
      cuotasTotales: cuotasTotalNum,
      cuotasPagadas: cuotasPagadasNum,
      moneda,
      fechaInicio,
    });

    onExito?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-accent/30 bg-accent/5 p-4"
    >
      <h4 className="text-sm font-semibold text-foreground">
        Registrar compra en cuotas
      </h4>
      <p className="mt-1 text-xs text-muted">
        Límite disponible:{" "}
        <span className="font-semibold text-foreground">
          {formatearMoneda(limiteDisponible, tarjeta.moneda)}
        </span>
        {" · "}
        Pago el día {tarjeta.diaPago} de cada mes
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Descripción</span>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Televisor, viaje, laptop..."
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">
            Número de referencia (16 dígitos)
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={numeroReferencia}
            onChange={(e) =>
              setNumeroReferencia(formatearNumeroTarjeta(e.target.value))
            }
            placeholder="0000 0000 0000 0000"
            maxLength={19}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Monto de compra</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={montoCompra}
            onChange={(e) => setMontoCompra(e.target.value)}
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
          <span className="text-sm font-medium text-foreground">Tasa de interés (%)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tasaInteres}
            onChange={(e) => setTasaInteres(e.target.value)}
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
          <span className="text-sm font-medium text-foreground">Meses / cuotas</span>
          <input
            type="number"
            min={1}
            value={cuotasTotales}
            onChange={(e) => setCuotasTotales(e.target.value)}
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
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Cuotas ya pagadas</span>
          <input
            type="number"
            min={0}
            value={cuotasPagadas}
            onChange={(e) => setCuotasPagadas(e.target.value)}
            className={inputClass}
          />
          <span className="text-xs text-muted">
            Si ya pagaste algunas cuotas antes de registrar el plan
          </span>
        </label>
      </div>

      {vistaPrevia && vistaPrevia.cuota > 0 && (
        <div className="mt-3 rounded-lg bg-background px-3 py-2 text-xs text-muted">
          Cuota estimada:{" "}
          <span className="font-semibold text-foreground">
            {formatearMoneda(vistaPrevia.cuota, moneda)}
          </span>
          {" · "}
          Intereses:{" "}
          <span className="font-semibold text-gasto">
            {formatearMoneda(vistaPrevia.intereses, moneda)}
          </span>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-gasto">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Guardar plan
        </button>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
