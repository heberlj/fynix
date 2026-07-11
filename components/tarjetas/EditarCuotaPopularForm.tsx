"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { CuotaPopular, TipoTasaInteres } from "@/types/finanzas";
import { calcularCuotaConInteres } from "@/lib/cuotas-popular";
import { formatearMoneda } from "@/lib/quincenas";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface EditarCuotaPopularFormProps {
  cuota: CuotaPopular;
  onCancelar: () => void;
  bloquearTarjeta?: boolean;
}

export function EditarCuotaPopularForm({
  cuota,
  onCancelar,
  bloquearTarjeta = false,
}: EditarCuotaPopularFormProps) {
  const { actualizarCuotaPopular, tarjetas } = useFinanzas();

  const [tarjetaId, setTarjetaId] = useState(cuota.tarjetaId);
  const [descripcion, setDescripcion] = useState(cuota.descripcion);
  const [montoCompra, setMontoCompra] = useState(String(cuota.montoCompra));
  const [tasaInteres, setTasaInteres] = useState(String(cuota.tasaInteres));
  const [tipoTasa, setTipoTasa] = useState<TipoTasaInteres>(cuota.tipoTasa);
  const [montoCuota, setMontoCuota] = useState(String(cuota.montoCuota));
  const [cuotasTotales, setCuotasTotales] = useState(String(cuota.cuotasTotales));
  const [cuotasPagadas, setCuotasPagadas] = useState(String(cuota.cuotasPagadas));
  const [fechaInicio, setFechaInicio] = useState(cuota.fechaInicio);
  const [moneda, setMoneda] = useState(cuota.moneda);
  const [cuotaManual, setCuotaManual] = useState(false);
  const [error, setError] = useState("");

  const compraNum = parseFloat(montoCompra) || 0;
  const tasaNum = parseFloat(tasaInteres) || 0;
  const cuotasNum = parseInt(cuotasTotales, 10) || 0;
  const tarjetaSeleccionada = tarjetas.find((t) => t.id === tarjetaId);

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

    if (!tarjetaId) {
      setError("Selecciona la tarjeta asociada");
      return;
    }
    if (!descripcion.trim()) {
      setError("La descripción es obligatoria");
      return;
    }
    if (!montoCompra || isNaN(compraNum) || compraNum <= 0) {
      setError("Ingresa un monto de compra válido");
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

    actualizarCuotaPopular(cuota.id, {
      tarjetaId,
      descripcion: descripcion.trim(),
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

    onCancelar();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-border pt-4">
      <h4 className="text-sm font-semibold text-foreground">Editar plan</h4>

      <div className="grid gap-4 sm:grid-cols-2">
        {!bloquearTarjeta && (
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Tarjeta</span>
            <select
              value={tarjetaId}
              onChange={(e) => setTarjetaId(e.target.value)}
              className={inputClass}
            >
              {tarjetas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.banco} · {t.nombreTarjeta} ·••• {t.ultimosCuatro}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Descripción</span>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
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
          <span className="text-sm font-medium text-foreground">Cuotas totales</span>
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
          <span className="text-sm font-medium text-foreground">Cuotas pagadas</span>
          <input
            type="number"
            min={0}
            value={cuotasPagadas}
            onChange={(e) => setCuotasPagadas(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {tarjetaSeleccionada && (
        <p className="text-xs text-muted">
          Pago el día {tarjetaSeleccionada.diaPago} de cada mes
        </p>
      )}

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
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
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
