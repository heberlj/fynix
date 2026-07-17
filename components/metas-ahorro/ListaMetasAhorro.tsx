"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { MetaAhorro } from "@/types/finanzas";
import { formatearFecha } from "@/lib/fechas";
import {
  diasHastaLimite,
  faltanteMeta,
  metaCompletada,
  progresoMeta,
} from "@/lib/metas-ahorro";
import { formatearMoneda } from "@/lib/quincenas";
import { confirmarEliminacion } from "@/lib/confirmar";
import { EditarMetaAhorroForm } from "@/components/metas-ahorro/EditarMetaAhorroForm";
import { EstadoVacio } from "@/components/ui/EstadoVacio";

interface ListaMetasAhorroProps {
  metas: MetaAhorro[];
  onAgregar?: () => void;
  onRegistrarAporte?: (metaId: string) => void;
}

function BarraProgreso({ meta }: { meta: MetaAhorro }) {
  const porcentaje = progresoMeta(meta);
  const completada = metaCompletada(meta);

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-muted">
        <span>
          {formatearMoneda(meta.montoActual, meta.moneda)} de{" "}
          {formatearMoneda(meta.montoObjetivo, meta.moneda)}
        </span>
        <span>{porcentaje.toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-background">
        <div
          className={`h-full rounded-full transition-all ${completada ? "bg-ingreso" : "bg-accent"}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

export function ListaMetasAhorro({
  metas,
  onAgregar,
  onRegistrarAporte,
}: ListaMetasAhorroProps) {
  const { eliminarMetaAhorro } = useFinanzas();
  const [editandoId, setEditandoId] = useState<string | null>(null);

  if (metas.length === 0) {
    return (
      <EstadoVacio
        titulo="No tienes metas de ahorro"
        descripcion="Crea una meta para un fondo de emergencia, un viaje o cualquier objetivo financiero."
        accionEtiqueta="+ Nueva meta"
        onAccion={onAgregar}
      />
    );
  }

  return (
    <div className="space-y-6">
      {metas.map((meta) => {
        const completada = metaCompletada(meta);
        const faltante = faltanteMeta(meta);
        const dias = diasHastaLimite(meta.fechaLimite);
        const estaEditando = editandoId === meta.id;

        return (
          <div
            key={meta.id}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {meta.nombre}
                  </h3>
                  {completada && (
                    <span className="rounded-full bg-ingreso/10 px-2 py-0.5 text-xs font-medium text-ingreso">
                      Completada
                    </span>
                  )}
                </div>
                {meta.notas && (
                  <p className="mt-0.5 text-sm text-muted">{meta.notas}</p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {meta.moneda}
                  {meta.fechaLimite && (
                    <>
                      {" · "}
                      Límite: {formatearFecha(meta.fechaLimite)}
                      {dias !== null && (
                        <>
                          {" "}
                          ({dias >= 0 ? `${dias} días` : "vencida"})
                        </>
                      )}
                    </>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditandoId(estaEditando ? null : meta.id)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                >
                  {estaEditando ? "Cerrar" : "Editar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmarEliminacion(meta.nombre, "la meta")) return;
                    if (editandoId === meta.id) setEditandoId(null);
                    eliminarMetaAhorro(meta.id);
                  }}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-gasto hover:bg-gasto/10"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <BarraProgreso meta={meta} />

            {!completada && (
              <p className="mt-2 text-sm text-muted">
                Faltan{" "}
                <span className="font-semibold text-foreground">
                  {formatearMoneda(faltante, meta.moneda)}
                </span>
              </p>
            )}

            {estaEditando && (
              <EditarMetaAhorroForm
                meta={meta}
                onCancelar={() => setEditandoId(null)}
              />
            )}

            {!estaEditando && onRegistrarAporte && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => onRegistrarAporte(meta.id)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
                >
                  + Registrar aporte
                </button>
                <p className="mt-2 text-xs text-muted">
                  El dinero saldrá de una cuenta o efectivo y quedará registrado como
                  movimiento en Transacciones
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
