"use client";

import { useEffect, useMemo } from "react";
import type { TipoTasaInteres } from "@/types/finanzas";
import { calcularCuotaConInteres } from "@/lib/cuotas-popular";
import { formatearMoneda } from "@/lib/quincenas";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export interface ValoresCuotasPopular {
  tasaInteres: string;
  tipoTasa: TipoTasaInteres;
  cuotasTotales: string;
  montoCuota: string;
  cuotaManual: boolean;
}

interface CamposCuotasPopularProps {
  montoCompra: number;
  moneda: string;
  valores: ValoresCuotasPopular;
  onChange: (valores: ValoresCuotasPopular) => void;
  diaPago?: number;
}

export function CamposCuotasPopular({
  montoCompra,
  moneda,
  valores,
  onChange,
  diaPago,
}: CamposCuotasPopularProps) {
  const { tasaInteres, tipoTasa, cuotasTotales, montoCuota, cuotaManual } =
    valores;

  const tasaNum = parseFloat(tasaInteres) || 0;
  const cuotasNum = parseInt(cuotasTotales, 10) || 0;

  const vistaPrevia = useMemo(() => {
    if (montoCompra <= 0 || cuotasNum <= 0) return null;
    const cuota = cuotaManual
      ? parseFloat(montoCuota) || 0
      : calcularCuotaConInteres(montoCompra, tasaNum, cuotasNum, tipoTasa);
    const total = Math.round(cuota * cuotasNum * 100) / 100;
    const intereses = Math.max(0, Math.round((total - montoCompra) * 100) / 100);
    return { cuota, total, intereses };
  }, [montoCompra, cuotasNum, tasaNum, tipoTasa, cuotaManual, montoCuota]);

  useEffect(() => {
    if (cuotaManual) return;
    if (montoCompra > 0 && cuotasNum > 0) {
      onChange({
        ...valores,
        montoCuota: String(
          calcularCuotaConInteres(montoCompra, tasaNum, cuotasNum, tipoTasa)
        ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montoCompra, tasaInteres, cuotasTotales, tipoTasa, cuotaManual]);

  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 sm:col-span-2">
      <p className="text-sm font-medium text-foreground">Plan Cuotas Popular</p>
      <p className="mt-1 text-xs text-muted">
        El monto de la compra se financiará en cuotas. No afecta la deuda
        rotativa de la tarjeta.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Tasa de interés (%)
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tasaInteres}
            onChange={(e) =>
              onChange({ ...valores, tasaInteres: e.target.value, cuotaManual: false })
            }
            placeholder="0 = sin interés"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Tipo de tasa</span>
          <select
            value={tipoTasa}
            onChange={(e) =>
              onChange({
                ...valores,
                tipoTasa: e.target.value as TipoTasaInteres,
                cuotaManual: false,
              })
            }
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
            onChange={(e) =>
              onChange({ ...valores, cuotasTotales: e.target.value, cuotaManual: false })
            }
            placeholder="12"
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
            onChange={(e) =>
              onChange({
                ...valores,
                montoCuota: e.target.value,
                cuotaManual: true,
              })
            }
            placeholder="0.00"
            className={inputClass}
          />
        </label>
      </div>

      {diaPago && (
        <p className="mt-3 text-xs text-muted">
          Pago mensual el día {diaPago} de cada mes
        </p>
      )}

      {vistaPrevia && vistaPrevia.cuota > 0 && (
        <div className="mt-4 rounded-lg bg-background px-4 py-3 text-xs text-muted">
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
    </div>
  );
}
