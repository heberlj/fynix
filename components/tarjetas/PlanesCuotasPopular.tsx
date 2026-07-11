"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { CuotaPopular, TarjetaCredito } from "@/types/finanzas";
import { formatearFecha } from "@/lib/fechas";
import {
  cuotaPopularCompletada,
  cuotasRestantesCuota,
  diaPagoCuota,
  etiquetaTasaCuota,
  interesesPendientesCuota,
  progresoCuotaPopular,
  quincenaDeCuotaPopular,
  saldoPendienteCuota,
  totalInteresesCuota,
} from "@/lib/cuotas-popular";
import { diasHastaCuota } from "@/lib/prestamos";
import { formatearMoneda } from "@/lib/quincenas";
import {
  codificarOrigen,
  decodificarOrigen,
  origenPorDefectoPago,
} from "@/lib/transacciones";
import { EditarCuotaPopularForm } from "@/components/tarjetas/EditarCuotaPopularForm";
import { SelectorOrigenFondo } from "@/components/ui/SelectorOrigenFondo";

interface PlanesCuotasPopularProps {
  tarjetaId: string;
  cuotas: CuotaPopular[];
  tarjeta: TarjetaCredito;
}

function BarraProgreso({ cuota }: { cuota: CuotaPopular }) {
  const porcentaje = progresoCuotaPopular(cuota);
  const completado = cuotaPopularCompletada(cuota);

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted">
        <span>
          {cuota.cuotasPagadas} de {cuota.cuotasTotales} cuotas pagadas
        </span>
        <span>{porcentaje.toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background">
        <div
          className={`h-full rounded-full transition-all ${completado ? "bg-ingreso" : "bg-accent"}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

export function PlanesCuotasPopular({
  tarjetaId,
  cuotas,
  tarjeta,
}: PlanesCuotasPopularProps) {
  const {
    configuracion,
    tarjetas,
    cuentas,
    eliminarCuotaPopular,
    registrarCuotaPopularPagada,
  } = useFinanzas();
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const origenPorDefecto = useMemo(
    () => codificarOrigen(origenPorDefectoPago(cuentas, tarjeta.moneda)),
    [cuentas, tarjeta.moneda]
  );

  const [origenPago, setOrigenPago] = useState(origenPorDefecto);

  const planes = cuotas.filter((c) => c.tarjetaId === tarjetaId);

  if (planes.length === 0) {
    return (
      <p className="mt-4 text-xs text-muted">
        Sin compras en Cuotas Popular. Regístralas al crear un gasto con esta
        tarjeta.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Planes Cuotas Popular
        </p>
        <div className="min-w-[200px] flex-1 sm:max-w-xs">
          <SelectorOrigenFondo
            value={origenPago}
            onChange={setOrigenPago}
            tipo="gasto"
            soloLiquido
          />
        </div>
      </div>
      <p className="text-xs text-muted">
        Al marcar una cuota pagada se registra el gasto en transacciones
      </p>
      {planes.map((cuota) => {
        const completado = cuotaPopularCompletada(cuota);
        const restantes = cuotasRestantesCuota(cuota);
        const pendiente = saldoPendienteCuota(cuota);
        const diaPago = diaPagoCuota(cuota, tarjetas);
        const dias = diasHastaCuota(diaPago);
        const quincena = quincenaDeCuotaPopular(cuota, tarjetas, configuracion);
        const estaEditando = editandoId === cuota.id;

        return (
          <div
            key={cuota.id}
            className="rounded-lg border border-border bg-background p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {cuota.descripcion}
                  </p>
                  {completado && (
                    <span className="rounded-full bg-ingreso/10 px-2 py-0.5 text-xs font-medium text-ingreso">
                      Pagado
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  Inicio: {formatearFecha(cuota.fechaInicio)} ·{" "}
                  {etiquetaTasaCuota(cuota)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditandoId(estaEditando ? null : cuota.id)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                >
                  {estaEditando ? "Cerrar" : "Editar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editandoId === cuota.id) setEditandoId(null);
                    eliminarCuotaPopular(cuota.id);
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-gasto/10 hover:text-gasto"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {!estaEditando && (
              <>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div>
                    <p className="text-muted">Compra</p>
                    <p className="font-semibold text-foreground">
                      {formatearMoneda(cuota.montoCompra, cuota.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">Cuota</p>
                    <p className="font-semibold text-gasto">
                      {formatearMoneda(cuota.montoCuota, cuota.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">Pendiente</p>
                    <p className="font-semibold text-foreground">
                      {formatearMoneda(pendiente, cuota.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">Intereses</p>
                    <p className="font-semibold text-gasto">
                      {formatearMoneda(totalInteresesCuota(cuota), cuota.moneda)}
                    </p>
                  </div>
                </div>

                <BarraProgreso cuota={cuota} />

                {!completado && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2">
                    <p className="text-xs text-muted">
                      Próxima en{" "}
                      <span className="font-semibold text-foreground">
                        {dias === 0 ? "hoy" : `${dias} día${dias !== 1 ? "s" : ""}`}
                      </span>
                      {" · "}
                      {quincena} · {restantes} restante
                      {restantes !== 1 ? "s" : ""}
                      {" · "}
                      Intereses pend.:{" "}
                      {formatearMoneda(interesesPendientesCuota(cuota), cuota.moneda)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const origen = decodificarOrigen(origenPago);
                        if (!origen) return;
                        registrarCuotaPopularPagada(cuota.id, origen);
                      }}
                      className="rounded-lg bg-ingreso px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      Cuota pagada
                    </button>
                  </div>
                )}
              </>
            )}

            {estaEditando && (
              <EditarCuotaPopularForm
                cuota={cuota}
                bloquearTarjeta
                onCancelar={() => setEditandoId(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
