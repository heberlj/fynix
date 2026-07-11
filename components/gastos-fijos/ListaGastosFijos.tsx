"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { GastoFijo } from "@/types/finanzas";
import { diasHastaCuota } from "@/lib/prestamos";
import { agruparGastosPorQuincena, etiquetaTipoPresupuesto } from "@/lib/gastos-fijos";
import { formatearMoneda } from "@/lib/quincenas";
import { EditarGastoFijoForm } from "@/components/gastos-fijos/EditarGastoFijoForm";

interface ListaGastosFijosProps {
  gastosFijos: GastoFijo[];
}

function TarjetaGasto({
  gasto,
  editandoId,
  setEditandoId,
}: {
  gasto: GastoFijo;
  editandoId: string | null;
  setEditandoId: (id: string | null) => void;
}) {
  const { actualizarGastoFijo, eliminarGastoFijo } = useFinanzas();
  const estaEditando = editandoId === gasto.id;
  const dias = diasHastaCuota(gasto.diaPago);

  return (
    <div
      className={`rounded-xl border bg-background p-4 ${
        gasto.activo ? "border-border" : "border-dashed border-border opacity-70"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{gasto.nombre}</h3>
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
              {gasto.categoria}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                gasto.tipoPresupuesto === "esencial"
                  ? "bg-accent/10 text-accent"
                  : "bg-muted/20 text-muted"
              }`}
            >
              {etiquetaTipoPresupuesto(gasto.tipoPresupuesto)}
            </span>
            {!gasto.activo && (
              <span className="rounded-full bg-muted/20 px-2 py-0.5 text-xs font-medium text-muted">
                Inactivo
              </span>
            )}
          </div>
          {gasto.notas && <p className="mt-0.5 text-xs text-muted">{gasto.notas}</p>}
          <p className="mt-1 text-xs text-muted">Día {gasto.diaPago} · {gasto.moneda}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => actualizarGastoFijo(gasto.id, { activo: !gasto.activo })}
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
          >
            {gasto.activo ? "Pausar" : "Activar"}
          </button>
          <button
            type="button"
            onClick={() => setEditandoId(estaEditando ? null : gasto.id)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
          >
            {estaEditando ? "Cerrar" : "Editar"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (editandoId === gasto.id) setEditandoId(null);
              eliminarGastoFijo(gasto.id);
            }}
            className="rounded-lg px-2 py-1 text-xs text-muted hover:text-gasto"
          >
            Eliminar
          </button>
        </div>
      </div>

      {!estaEditando && (
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <p className="text-lg font-bold text-gasto">
            {formatearMoneda(gasto.monto, gasto.moneda)}
          </p>
          {gasto.activo && (
            <p className="text-xs text-muted">
              Pago en{" "}
              <span className="font-semibold text-foreground">
                {dias === 0 ? "hoy" : `${dias} día${dias !== 1 ? "s" : ""}`}
              </span>
            </p>
          )}
        </div>
      )}

      {estaEditando && (
        <EditarGastoFijoForm gasto={gasto} onCancelar={() => setEditandoId(null)} />
      )}
    </div>
  );
}

function ColumnaQuincena({
  quincena,
  gastos,
  total,
  moneda,
  diasPago,
}: {
  quincena: 1 | 2;
  gastos: GastoFijo[];
  total: number;
  moneda: string;
  diasPago: [number, number];
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const activos = gastos.filter((g) => g.activo);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Quincena {quincena}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {quincena === 1
              ? `Del día ${diasPago[0]} al ${diasPago[1] - 1}`
              : `Desde el día ${diasPago[1]} del mes`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Total activos</p>
          <p className="text-lg font-bold text-gasto">{formatearMoneda(total, moneda)}</p>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        {activos.length} gasto{activos.length !== 1 ? "s" : ""} activo
        {activos.length !== 1 ? "s" : ""}
        {gastos.length > activos.length && ` · ${gastos.length - activos.length} pausado${gastos.length - activos.length !== 1 ? "s" : ""}`}
      </p>

      {gastos.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted">
          Sin gastos en esta quincena
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {gastos.map((gasto) => (
            <TarjetaGasto
              key={gasto.id}
              gasto={gasto}
              editandoId={editandoId}
              setEditandoId={setEditandoId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ListaGastosFijos({ gastosFijos }: ListaGastosFijosProps) {
  const { configuracion } = useFinanzas();
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  const categorias = useMemo(() => {
    const cats = new Set(gastosFijos.map((g) => g.categoria));
    return Array.from(cats).sort();
  }, [gastosFijos]);

  const filtrados = useMemo(() => {
    if (categoriaFiltro === "todas") return gastosFijos;
    return gastosFijos.filter((g) => g.categoria === categoriaFiltro);
  }, [gastosFijos, categoriaFiltro]);

  const grupos = useMemo(() => agruparGastosPorQuincena(filtrados), [filtrados]);

  const totalesQ = useMemo(() => {
    const sumar = (q: 1 | 2) =>
      filtrados
        .filter((g) => g.activo && g.quincena === q)
        .reduce((sum, g) => sum + g.monto, 0);
    return { q1: sumar(1), q2: sumar(2) };
  }, [filtrados]);

  if (gastosFijos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
        <p className="text-sm text-muted">No tienes gastos fijos registrados</p>
        <p className="mt-1 text-xs text-muted">
          Agrega alquiler, servicios, suscripciones y otros pagos mensuales
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categorias.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoriaFiltro("todas")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              categoriaFiltro === "todas"
                ? "bg-accent text-white"
                : "bg-background text-muted hover:text-foreground"
            }`}
          >
            Todas las categorías
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaFiltro(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                categoriaFiltro === cat
                  ? "bg-accent text-white"
                  : "bg-background text-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {grupos.map(({ quincena, gastos }) => (
          <ColumnaQuincena
            key={quincena}
            quincena={quincena}
            gastos={gastos}
            total={quincena === 1 ? totalesQ.q1 : totalesQ.q2}
            moneda={configuracion.moneda}
            diasPago={configuracion.diasPago}
          />
        ))}
      </div>
    </div>
  );
}
