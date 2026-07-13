"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { TarjetaCredito } from "@/types/finanzas";
import { diasHastaPago, MARCA_ETIQUETA } from "@/lib/tarjetas";
import { tarjetaTieneCuotasPopular } from "@/lib/cuotas-popular";
import { confirmarEliminacion } from "@/lib/confirmar";
import { formatearMoneda } from "@/lib/quincenas";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { TarjetaVisual } from "@/components/tarjetas/TarjetaVisual";
import { EditarTarjetaForm } from "@/components/tarjetas/EditarTarjetaForm";
import { ResumenCuotasPopular } from "@/components/tarjetas/ResumenCuotasPopular";
import { ResumenFinanciamientoCuotas } from "@/components/tarjetas/ResumenFinanciamientoCuotas";
import { PlanesCuotasPopular } from "@/components/tarjetas/PlanesCuotasPopular";

interface ListaTarjetasProps {
  tarjetas: TarjetaCredito[];
  onAgregar?: () => void;
}

function BarraUso({ deuda, limite }: { deuda: number; limite: number }) {
  const porcentaje = limite > 0 ? Math.min(100, (deuda / limite) * 100) : 0;
  const color =
    porcentaje >= 80
      ? "bg-gasto"
      : porcentaje >= 50
        ? "bg-yellow-500"
        : "bg-ingreso";

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-muted">
        <span>Uso del crédito</span>
        <span>{porcentaje.toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

function AlertaPago({
  tarjeta,
  moneda,
}: {
  tarjeta: TarjetaCredito;
  moneda: string;
}) {
  if (tarjeta.deudaActual <= 0) return null;

  const dias = diasHastaPago(tarjeta.diaPago);
  const urgente = dias <= 5;

  return (
    <div
      className={`mt-3 rounded-lg px-3 py-2 text-xs ${
        urgente
          ? "bg-gasto/10 text-gasto"
          : "bg-yellow-500/10 text-yellow-800"
      }`}
    >
      {dias === 0
        ? `¡Pago hoy! Debes ${formatearMoneda(tarjeta.deudaActual, moneda)}`
        : `Pago en ${dias} día${dias !== 1 ? "s" : ""} (día ${tarjeta.diaPago})`}
    </div>
  );
}

export function ListaTarjetas({ tarjetas, onAgregar }: ListaTarjetasProps) {
  const { eliminarTarjeta, cuotasPopular } = useFinanzas();
  const [editandoId, setEditandoId] = useState<string | null>(null);

  if (tarjetas.length === 0) {
    return (
      <EstadoVacio
        titulo="No tienes tarjetas registradas"
        descripcion="Agrega tus tarjetas de crédito para ver deuda, límite y fechas de pago."
        accionEtiqueta="+ Nueva tarjeta"
        onAccion={onAgregar}
      />
    );
  }

  return (
    <div className="space-y-8">
      {tarjetas.map((tarjeta) => {
        const disponible = tarjeta.limite - tarjeta.deudaActual;
        const tieneCuotas = tarjetaTieneCuotasPopular(tarjeta);
        const estaEditando = editandoId === tarjeta.id;

        return (
          <div
            key={tarjeta.id}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              {!estaEditando && (
                <div className="order-1 flex justify-center lg:order-2 lg:justify-end">
                  <TarjetaVisual tarjeta={tarjeta} compacta />
                </div>
              )}

              <div className="order-2 lg:order-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground">
                      {tarjeta.banco} · {tarjeta.nombreTarjeta}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted">
                      {MARCA_ETIQUETA[tarjeta.marca]} · •••• {tarjeta.ultimosCuatro} · {tarjeta.moneda}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditandoId(estaEditando ? null : tarjeta.id)
                      }
                      className="rounded-lg px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                    >
                      {estaEditando ? "Cerrar" : "Editar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          !confirmarEliminacion(
                            `${tarjeta.banco} · ${tarjeta.nombreTarjeta}`,
                            "la tarjeta"
                          )
                        ) {
                          return;
                        }
                        if (editandoId === tarjeta.id) setEditandoId(null);
                        eliminarTarjeta(tarjeta.id);
                      }}
                      className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-gasto/10 hover:text-gasto"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {!estaEditando && (
                  <>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                      <div>
                        <p className="text-xs text-muted">Límite</p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatearMoneda(tarjeta.limite, tarjeta.moneda)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Deuda</p>
                        <p className="text-sm font-semibold text-gasto">
                          {formatearMoneda(tarjeta.deudaActual, tarjeta.moneda)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Disponible</p>
                        <p className="text-sm font-semibold text-ingreso">
                          {formatearMoneda(disponible, tarjeta.moneda)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Corte / Pago</p>
                        <p className="text-sm font-semibold text-foreground">
                          {tarjeta.diaCorte} / {tarjeta.diaPago}
                        </p>
                      </div>
                    </div>

                    <BarraUso deuda={tarjeta.deudaActual} limite={tarjeta.limite} />
                    <AlertaPago tarjeta={tarjeta} moneda={tarjeta.moneda} />

                    <ResumenFinanciamientoCuotas tarjeta={tarjeta} />

                    {tieneCuotas && (
                      <>
                        <ResumenCuotasPopular tarjeta={tarjeta} />
                        <PlanesCuotasPopular
                          tarjetaId={tarjeta.id}
                          cuotas={cuotasPopular}
                          tarjeta={tarjeta}
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {estaEditando && (
              <EditarTarjetaForm
                tarjeta={tarjeta}
                onCancelar={() => setEditandoId(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
