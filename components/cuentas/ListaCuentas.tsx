"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { CuentaBancaria } from "@/types/finanzas";
import { etiquetaTipoCuenta, claseColorSaldoCuenta } from "@/lib/cuentas";
import {
  colorHomeCuenta,
  ESTILOS_COLOR_HOME,
  iconoHomeCuenta,
} from "@/lib/personalizacion-home";
import { confirmarEliminacion } from "@/lib/confirmar";
import { formatearMoneda } from "@/lib/quincenas";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { IconoHome } from "@/components/ui/IconoHome";
import { EditarCuentaForm } from "@/components/cuentas/EditarCuentaForm";

interface ListaCuentasProps {
  cuentas: CuentaBancaria[];
  onAgregar?: () => void;
}

export function ListaCuentas({ cuentas, onAgregar }: ListaCuentasProps) {
  const { eliminarCuenta } = useFinanzas();
  const [editandoId, setEditandoId] = useState<string | null>(null);

  if (cuentas.length === 0) {
    return (
      <EstadoVacio
        titulo="No tienes cuentas registradas"
        descripcion="Agrega tus cuentas bancarias para llevar el saldo y registrar movimientos."
        accionEtiqueta="+ Nueva cuenta"
        onAccion={onAgregar}
      />
    );
  }

  return (
    <div className="space-y-4">
      {cuentas.map((cuenta, indice) => {
        const estaEditando = editandoId === cuenta.id;
        const color = colorHomeCuenta(cuenta, indice);
        const icono = iconoHomeCuenta(cuenta);
        const estilo = ESTILOS_COLOR_HOME[color];

        return (
          <div
            key={cuenta.id}
            className={`rounded-xl border p-4 shadow-sm sm:p-6 ${estilo.fondo} ${estilo.borde}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${estilo.iconoFondo} ${estilo.icono}`}
                >
                  <IconoHome nombre={icono} className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {cuenta.banco}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilo.iconoFondo} ${estilo.icono}`}
                    >
                      {etiquetaTipoCuenta(cuenta.tipo)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{cuenta.nombre}</p>
                  {cuenta.ultimosCuatro && (
                    <p className="mt-1 text-xs text-muted">•••• {cuenta.ultimosCuatro}</p>
                  )}
                </div>
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
                    if (
                      !confirmarEliminacion(
                        `${cuenta.banco} · ${cuenta.nombre}`,
                        "la cuenta"
                      )
                    ) {
                      return;
                    }
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
                <p
                  className={`text-2xl font-bold ${claseColorSaldoCuenta(cuenta.saldoActual)}`}
                >
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
