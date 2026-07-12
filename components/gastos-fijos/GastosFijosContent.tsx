"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  gastosPorCategoriaFija,
  totalMensualPorMoneda,
  totalPorQuincena,
} from "@/lib/gastos-fijos";
import { totalPrestamosPorQuincena } from "@/lib/prestamos";
import { formatearMoneda } from "@/lib/quincenas";
import { PageContainer } from "@/components/layout/PageContainer";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";
import { Modal } from "@/components/ui/Modal";
import { FormularioGastoFijo } from "@/components/gastos-fijos/FormularioGastoFijo";
import { GestionCategoriasGastosFijos } from "@/components/gastos-fijos/GestionCategoriasGastosFijos";
import { ListaGastosFijos } from "@/components/gastos-fijos/ListaGastosFijos";
import { FormularioTransaccion } from "@/components/transacciones/FormularioTransaccion";

export function GastosFijosContent() {
  const { gastosFijos, prestamos, configuracion, cargado } = useFinanzas();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [gestionarCategorias, setGestionarCategorias] = useState(false);
  const [vistaCategoria, setVistaCategoria] = useState<"todas" | "1" | "2">("todas");
  const [pagoGastoFijoId, setPagoGastoFijoId] = useState<string | null>(null);

  const totalesPorMoneda = useMemo(
    () => Array.from(totalMensualPorMoneda(gastosFijos).entries()),
    [gastosFijos]
  );

  const totalQ1Gastos = useMemo(
    () => totalPorQuincena(gastosFijos, 1).get(configuracion.moneda) ?? 0,
    [gastosFijos, configuracion.moneda]
  );

  const totalQ2Gastos = useMemo(
    () => totalPorQuincena(gastosFijos, 2).get(configuracion.moneda) ?? 0,
    [gastosFijos, configuracion.moneda]
  );

  const totalQ1Prestamos = useMemo(
    () => totalPrestamosPorQuincena(prestamos, 1, configuracion.moneda),
    [prestamos, configuracion.moneda]
  );

  const totalQ2Prestamos = useMemo(
    () => totalPrestamosPorQuincena(prestamos, 2, configuracion.moneda),
    [prestamos, configuracion.moneda]
  );

  const totalQ1 = totalQ1Gastos + totalQ1Prestamos;
  const totalQ2 = totalQ2Gastos + totalQ2Prestamos;

  const hayGastosFijosActivos = useMemo(
    () => gastosFijos.some((g) => g.activo),
    [gastosFijos]
  );

  const porCategoria = useMemo(() => {
    const q = vistaCategoria === "todas" ? undefined : (Number(vistaCategoria) as 1 | 2);
    return gastosPorCategoriaFija(gastosFijos, q);
  }, [gastosFijos, vistaCategoria]);

  if (!cargado) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <AyudaPagina pagina="gastos-fijos">
      <PageContainer>
        <EncabezadoPagina
          titulo="Gastos fijos"
          descripcion="Pagos mensuales por quincena. Los préstamos aparecen aquí solo como referencia para ver tu panorama; en el resto de la app siguen siendo préstamos."
          dataAyuda="acciones"
          acciones={
            <>
              <button
                type="button"
                onClick={() => {
                  const abrir = !gestionarCategorias;
                  setGestionarCategorias(abrir);
                  if (abrir) setMostrarFormulario(false);
                }}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover sm:w-auto"
              >
                {gestionarCategorias ? "Cerrar categorías" : "Gestionar categorías"}
              </button>
              {!mostrarFormulario && (
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(true);
                    setGestionarCategorias(false);
                  }}
                  className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
                >
                  + Nuevo gasto fijo
                </button>
              )}
            </>
          }
        />

        {totalesPorMoneda.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm">
            {totalesPorMoneda.map(([moneda, total]) => (
              <div
                key={moneda}
                className="rounded-lg border border-border bg-surface px-4 py-2"
              >
                <span className="font-medium text-foreground">{moneda}</span>
                <span className="ml-3 text-muted">
                  Total mensual:{" "}
                  <span className="font-semibold text-gasto">
                    {formatearMoneda(total, moneda)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

      {gestionarCategorias && (
        <GestionCategoriasGastosFijos onCerrar={() => setGestionarCategorias(false)} />
      )}

      <div data-ayuda="resumen" className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Quincena 1</p>
          <p className="mt-1 text-2xl font-bold text-gasto">
            {formatearMoneda(totalQ1, configuracion.moneda)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Gastos que pagas o presupuestas en la primera quincena
            {totalQ1Prestamos > 0 && (
              <>
                {" "}
                · incluye {formatearMoneda(totalQ1Prestamos, configuracion.moneda)} en
                préstamos (referencia)
              </>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Quincena 2</p>
          <p className="mt-1 text-2xl font-bold text-gasto">
            {formatearMoneda(totalQ2, configuracion.moneda)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Gastos que pagas o presupuestas en la segunda quincena
            {totalQ2Prestamos > 0 && (
              <>
                {" "}
                · incluye {formatearMoneda(totalQ2Prestamos, configuracion.moneda)} en
                préstamos (referencia)
              </>
            )}
          </p>
        </div>
      </div>

      {hayGastosFijosActivos && (
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Por categoría</h2>
            <div className="flex gap-2">
              {(["todas", "1", "2"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVistaCategoria(v)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    vistaCategoria === v
                      ? "bg-accent text-white"
                      : "bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {v === "todas" ? "Todas" : `Q${v}`}
                </button>
              ))}
            </div>
          </div>
          {porCategoria.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {porCategoria.map((item) => (
                <div
                  key={item.categoria}
                  className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm"
                >
                  <span className="text-muted">
                    {item.categoria}{" "}
                    <span className="text-xs">({item.cantidad})</span>
                  </span>
                  <span className="font-semibold text-gasto">
                    {formatearMoneda(item.monto, configuracion.moneda)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted">
              {vistaCategoria === "todas"
                ? "No hay gastos fijos activos por categoría"
                : `No hay gastos fijos en la quincena ${vistaCategoria}`}
            </p>
          )}
        </div>
      )}

      <div data-ayuda="lista">
        <ListaGastosFijos
          gastosFijos={gastosFijos}
          onAgregar={() => {
            setMostrarFormulario(true);
            setGestionarCategorias(false);
          }}
          onRegistrarPago={(id) => setPagoGastoFijoId(id)}
        />
      </div>

      <Modal
        abierto={mostrarFormulario}
        onCerrar={() => setMostrarFormulario(false)}
        titulo="Nuevo gasto fijo"
        variant="centro"
      >
        <FormularioGastoFijo
          enModal
          onExito={() => setMostrarFormulario(false)}
        />
      </Modal>

      <Modal
        abierto={pagoGastoFijoId != null}
        onCerrar={() => setPagoGastoFijoId(null)}
        titulo="Registrar pago"
        variant="centro"
        tamano="amplio"
      >
        <FormularioTransaccion
          enModal
          gastoFijoInicialId={pagoGastoFijoId ?? undefined}
          onExito={() => setPagoGastoFijoId(null)}
          onCancelar={() => setPagoGastoFijoId(null)}
        />
      </Modal>
    </PageContainer>
    </AyudaPagina>
  );
}
