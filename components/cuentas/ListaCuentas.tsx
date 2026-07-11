"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { CuentaBancaria } from "@/types/finanzas";
import { etiquetaTipoCuenta } from "@/lib/cuentas";
import { formatearMoneda } from "@/lib/quincenas";
import { EditarCuentaForm } from "@/components/cuentas/EditarCuentaForm";

interface ListaCuentasProps {
  cuentas: CuentaBancaria[];
}

export function ListaCuentas({ cuentas }: ListaCuentasProps) {
  const { eliminarCuenta } = useFinanzas();
  const [editandoId, setEditandoId] = useState<string | null>(null);

  if (cuentas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
        <p className="text-sm text-muted">No tienes cuentas registradas</p>
        <p className="mt-1 text-xs text-muted">
          Usa el botón &quot;Nueva cuenta&quot; para agregar la primera
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cuentas.map((cuenta) => {
        const estaEditando = editandoId === cuenta.id;

        return (
          <div
            key={cuenta.id}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {cuenta.banco}
                  </h3>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                    {etiquetaTipoCuenta(cuenta.tipo)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted">{cuenta.nombre}</p>
                {cuenta.ultimosCuatro && (
                  <p className="mt-1 text-xs text-muted">•••• {cuenta.ultimosCuatro}</p>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditandoId(estaEditando ? null : cuenta.id)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                >
                  {estaEditando ? "Cerrar" : "Editar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editandoId === cuenta.id) setEditandoId(null);
                    eliminarCuenta(cuenta.id);
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-gasto/10 hover:text-gasto"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {!estaEditando && (
              <div className="mt-4">
                <p className="text-xs text-muted">Saldo disponible</p>
                <p className="text-2xl font-bold text-ingreso">
                  {formatearMoneda(cuenta.saldoActual, cuenta.moneda)}
                </p>
              </div>
            )}

            {estaEditando && (
              <EditarCuentaForm cuenta={cuenta} onCancelar={() => setEditandoId(null)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
