"use client";

import type { AporteSegunIngreso, PeriodoQuincena } from "@/types/finanzas";
import {
  aporteCubiertoEnPeriodo,
  calcularMontoAporteSugerido,
  diaPagoAporteEnQuincena,
  etiquetaPeriodoAporte,
} from "@/lib/aporte-ingreso";
import { diasHastaCuota } from "@/lib/prestamos";
import { formatearMoneda } from "@/lib/quincenas";
import { confirmarAccion } from "@/lib/confirmar";
import type { Transaccion } from "@/types/finanzas";

export function TarjetaAporteIngreso({
  aporte,
  transacciones,
  periodoQuincena,
  onRegistrarPago,
}: {
  aporte: AporteSegunIngreso;
  transacciones: Transaccion[];
  periodoQuincena: PeriodoQuincena;
  onRegistrarPago?: () => void;
}) {
  const { monto, baseIngresos, rango } = calcularMontoAporteSugerido(
    transacciones,
    aporte,
    periodoQuincena
  );
  const pagado = aporteCubiertoEnPeriodo(transacciones, aporte, periodoQuincena);
  const diaPago = diaPagoAporteEnQuincena(aporte, periodoQuincena.quincena);
  const dias = diasHastaCuota(diaPago);

  return (
    <div className="rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{aporte.nombre}</h3>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              {aporte.porcentaje}% ingresos
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                aporte.tipoPresupuesto === "esencial"
                  ? "bg-accent/10 text-accent"
                  : "bg-muted/20 text-muted"
              }`}
            >
              {aporte.tipoPresupuesto === "esencial" ? "Esencial" : "Flexible"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Día {diaPago} (Q{periodoQuincena.quincena}) · {aporte.moneda} · según{" "}
            {etiquetaPeriodoAporte(aporte.periodo)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Base: {formatearMoneda(baseIngresos, aporte.moneda)} en {rango.etiqueta}
            {baseIngresos === 0 && " · aún sin ingresos registrados"}
          </p>
        </div>

        {onRegistrarPago && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (pagado) {
                  const ok = confirmarAccion(
                    `Ya hay un pago registrado para "${aporte.nombre}" en este periodo. ¿Registrar otro?`
                  );
                  if (!ok) return;
                }
                onRegistrarPago();
              }}
              className={`rounded-lg px-2 py-1 text-xs font-medium ${
                pagado
                  ? "text-muted hover:text-foreground"
                  : "bg-accent/10 text-accent hover:bg-accent/20"
              }`}
            >
              {pagado ? "Registrar otro pago" : "Registrar pago"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-gasto">
            {formatearMoneda(monto, aporte.moneda)}
          </p>
          {pagado && (
            <p className="mt-0.5 text-xs font-medium text-ingreso">
              Pagado en este periodo
            </p>
          )}
        </div>
        <p className="text-xs text-muted">
          Pago en{" "}
          <span className="font-semibold text-foreground">
            {dias === 0 ? "hoy" : `${dias} día${dias !== 1 ? "s" : ""}`}
          </span>
        </p>
      </div>
    </div>
  );
}
