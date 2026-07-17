"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  gastosPorCategoriaFija,
  totalMensualPorMoneda,
  totalPorQuincena,
} from "@/lib/gastos-fijos";
import { totalPrestamosPorQuincena } from "@/lib/prestamos";
import { montoPendienteAporteEnPeriodo, obtenerAporteIngreso } from "@/lib/aporte-ingreso";
import { obtenerQuincenasDelMes } from "@/lib/quincenas";
import { mesActual } from "@/lib/fechas";
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
  const { gastosFijos, prestamos, configuracion, transacciones, cargado } = useFinanzas();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [gestionarCategorias, setGestionarCategorias] = useState(false);
  const [vistaCategoria, setVistaCategoria] = useState<"todas" | "1" | "2">("todas");
  const [pagoGastoFijoId, setPagoGastoFijoId] = useState<string | null>(null);
  const [pagoAporteIngreso, setPagoAporteIngreso] = useState(false);

  const totalesPorMoneda = useMemo(
    () => Array.from(totalMensualPorMoneda(gastosFijos, transacciones).entries()),
    [gastosFijos, transacciones]
  );

  const totalQ1Gastos = useMemo(
    () => totalPorQuincena(gastosFijos, 1, transacciones).get(configuracion.moneda) ?? 0,
    [gastosFijos, transacciones, configuracion.moneda]
  );

  const totalQ2Gastos = useMemo(
    () => totalPorQuincena(gastosFijos, 2, transacciones).get(configuracion.moneda) ?? 0,
    [gastosFijos, transacciones, configuracion.moneda]
  );

  const totalQ1Aporte = useMemo(() => {
    const aporte = obtenerAporteIngreso(configuracion);
    if (!aporte || !aporte.quincenas.includes(1) || aporte.moneda !== configuracion.moneda) {
      return 0;
    }
    const periodos = obtenerQuincenasDelMes(mesActual(), configuracion.diasPago);
    const periodo = periodos.find((p) => p.quincena === 1);
    return periodo
      ? montoPendienteAporteEnPeriodo(transacciones, aporte, periodo)
      : 0;
  }, [configuracion, transacciones]);

  const totalQ2Aporte = useMemo(() => {
    const aporte = obtenerAporteIngreso(configuracion);
    if (!aporte || !aporte.quincenas.includes(2) || aporte.moneda !== configuracion.moneda) {
      return 0;
    }
    const periodos = obtenerQuincenasDelMes(mesActual(), configuracion.diasPago);
    const periodo = periodos.find((p) => p.quincena === 2);
    return periodo
      ? montoPendienteAporteEnPeriodo(transacciones, aporte, periodo)
      : 0;
  }, [configuracion, transacciones]);

  const totalQ1Prestamos = useMemo(
    () => totalPrestamosPorQuincena(prestamos, 1, configuracion.moneda),
    [prestamos, configuracion.moneda]
  );

  const totalQ2Prestamos = useMemo(
    () => totalPrestamosPorQuincena(prestamos, 2, configuracion.moneda),
    [prestamos, configuracion.moneda]
  );

  const totalQ1 = totalQ1Gastos + totalQ1Aporte + totalQ1Prestamos;
  const totalQ2 = totalQ2Gastos + totalQ2Aporte + totalQ2Prestamos;

  const hayGastosActivos = useMemo(
    () =>
      gastosFijos.some((g) =>
        g.tipoRecurrencia === "unico"
          ? !g.pagado && g.fechaVencimiento?.startsWith(mesActual())
          : g.activo
      ),
    [gastosFijos]
  );

  const porCategoria = useMemo(() => {
    const q = vistaCategoria === "todas" ? undefined : (Number(vistaCategoria) as 1 | 2);
    return gastosPorCategoriaFija(gastosFijos, q, transacciones);
  }, [gastosFijos, vistaCategoria, transacciones]);

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
          titulo="Gastos"
          descripcion="Presupuesta gastos recurrentes y pagos únicos del mes. Los préstamos aparecen como referencia."
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
                  + Nuevo gasto
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

      {hayGastosActivos && (
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
                ? "No hay gastos activos por categoría"
                : `No hay gastos en la quincena ${vistaCategoria}`}
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
          onRegistrarAporte={() => setPagoAporteIngreso(true)}
        />
      </div>

      <Modal
        abierto={mostrarFormulario}
        onCerrar={() => setMostrarFormulario(false)}
          titulo="Nuevo gasto"
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
      <Modal
        abierto={pagoAporteIngreso}
        onCerrar={() => setPagoAporteIngreso(false)}
        titulo="Registrar aporte"
        variant="centro"
        tamano="amplio"
      >
        <FormularioTransaccion
          enModal
          aporteIngresoInicial
          onExito={() => setPagoAporteIngreso(false)}
          onCancelar={() => setPagoAporteIngreso(false)}
        />
      </Modal>
    </PageContainer>
    </AyudaPagina>
  );
}
