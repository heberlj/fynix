"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { Prestamo } from "@/types/finanzas";
import { formatearFecha } from "@/lib/fechas";
import {
  cuotasRestantes,
  diasHastaCuota,
  etiquetaTasa,
  interesesPendientes,
  prestamoCompletado,
  progresoPrestamo,
  quincenaDePago,
  saldoPendiente,
  totalIntereses,
} from "@/lib/prestamos";
import { formatearMoneda } from "@/lib/quincenas";
import { EditarPrestamoForm } from "@/components/prestamos/EditarPrestamoForm";

interface ListaPrestamosProps {
  prestamos: Prestamo[];
}

function BarraProgreso({ prestamo }: { prestamo: Prestamo }) {
  const porcentaje = progresoPrestamo(prestamo);
  const completado = prestamoCompletado(prestamo);

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-muted">
        <span>
          {prestamo.cuotasPagadas} de {prestamo.cuotasTotales} cuotas pagadas
        </span>
        <span>{porcentaje.toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-background">
        <div
          className={`h-full rounded-full transition-all ${completado ? "bg-ingreso" : "bg-accent"}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

export function ListaPrestamos({ prestamos }: ListaPrestamosProps) {
  const { configuracion, eliminarPrestamo, registrarCuotaPrestamo } = useFinanzas();
  const [editandoId, setEditandoId] = useState<string | null>(null);

  if (prestamos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
        <p className="text-sm text-muted">No tienes préstamos registrados</p>
        <p className="mt-1 text-xs text-muted">
          Usa el botón &quot;Nuevo préstamo&quot; para registrar el primero
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {prestamos.map((prestamo) => {
        const completado = prestamoCompletado(prestamo);
        const restantes = cuotasRestantes(prestamo);
        const pendiente = saldoPendiente(prestamo);
        const dias = diasHastaCuota(prestamo.diaPago);
        const quincena = quincenaDePago(prestamo.diaPago, configuracion);
        const estaEditando = editandoId === prestamo.id;

        return (
          <div
            key={prestamo.id}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {prestamo.entidad}
                  </h3>
                  {completado && (
                    <span className="rounded-full bg-ingreso/10 px-2 py-0.5 text-xs font-medium text-ingreso">
                      Pagado
                    </span>
                  )}
                </div>
                {prestamo.descripcion && (
                  <p className="mt-0.5 text-sm text-muted">{prestamo.descripcion}</p>
                )}
                <p className="mt-1 text-xs text-muted">
                  Inicio: {formatearFecha(prestamo.fechaInicio)} · {prestamo.moneda}
                  {" · "}
                  {etiquetaTasa(prestamo)}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditandoId(estaEditando ? null : prestamo.id)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                >
                  {estaEditando ? "Cerrar" : "Editar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editandoId === prestamo.id) setEditandoId(null);
                    eliminarPrestamo(prestamo.id);
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-gasto/10 hover:text-gasto"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {!estaEditando && (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
                  <div>
                    <p className="text-xs text-muted">Monto prestado</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatearMoneda(prestamo.montoPrestado, prestamo.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Intereses totales</p>
                    <p className="text-sm font-semibold text-gasto">
                      {formatearMoneda(totalIntereses(prestamo), prestamo.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Cuota mensual</p>
                    <p className="text-sm font-semibold text-gasto">
                      {formatearMoneda(prestamo.montoCuota, prestamo.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Saldo pendiente</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatearMoneda(pendiente, prestamo.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Intereses pend.</p>
                    <p className="text-sm font-semibold text-gasto">
                      {formatearMoneda(interesesPendientes(prestamo), prestamo.moneda)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Día de pago</p>
                    <p className="text-sm font-semibold text-foreground">
                      Día {prestamo.diaPago}
                    </p>
                  </div>
                </div>

                <BarraProgreso prestamo={prestamo} />

                {!completado && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-background px-4 py-3">
                    <div className="text-xs text-muted">
                      <p>
                        Próxima cuota en{" "}
                        <span className="font-semibold text-foreground">
                          {dias === 0 ? "hoy" : `${dias} día${dias !== 1 ? "s" : ""}`}
                        </span>
                        {" · "}
                        {formatearMoneda(prestamo.montoCuota, prestamo.moneda)}
                      </p>
                      <p className="mt-0.5">
                        Cae en{" "}
                        <span className="font-semibold text-accent">{quincena}</span>
                        {" · "}
                        {restantes} cuota{restantes !== 1 ? "s" : ""} restante
                        {restantes !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => registrarCuotaPrestamo(prestamo.id)}
                      className="rounded-lg bg-ingreso px-3 py-2 text-xs font-medium text-white transition-colors hover:opacity-90"
                    >
                      Registrar cuota pagada
                    </button>
                  </div>
                )}
              </>
            )}

            {estaEditando && (
              <EditarPrestamoForm
                prestamo={prestamo}
                onCancelar={() => setEditandoId(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
