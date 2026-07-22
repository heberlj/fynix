"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { GastoFijo } from "@/types/finanzas";
import { etiquetaProductoFinanciamiento } from "@/lib/financiamiento-cuotas";
import {
  diasHastaCuota,
  prestamoTienePagoEnPeriodo,
  type PrestamoVistaGastosFijos,
} from "@/lib/prestamos";
import {
  agruparGastosPorQuincena,
  diasHastaFechaGasto,
  esGastoRecurrente,
  esGastoUnicoPendiente,
  etiquetaTipoPresupuesto,
  etiquetaTipoRecurrencia,
  gastoFijoCubiertoEnPeriodo,
  gastoVisibleEnPresupuesto,
  obtenerGastosFijosPendientesEnPeriodo,
  resumenMontosPendientesGastosFijos,
} from "@/lib/gastos-fijos";
import {
  agruparPrestamosPorQuincena,
  prestamosParaVistaGastosFijos,
  totalPrestamosPorQuincena,
} from "@/lib/prestamos";
import { formatearMoneda, obtenerQuincenaActual, obtenerQuincenasDelMes, periodoDeFecha } from "@/lib/quincenas";
import { fechaHoy, formatearFecha, mesActual } from "@/lib/fechas";
import { confirmarAccion, confirmarEliminacion } from "@/lib/confirmar";
import {
  montoPendienteAporteEnPeriodo,
  obtenerAporteIngreso,
} from "@/lib/aporte-ingreso";
import { TarjetaAporteIngreso } from "@/components/gastos-fijos/TarjetaAporteIngreso";
import { EditarGastoFijoForm } from "@/components/gastos-fijos/EditarGastoFijoForm";
import { EstadoVacio } from "@/components/ui/EstadoVacio";

interface ListaGastosFijosProps {
  gastosFijos: GastoFijo[];
  onAgregar?: () => void;
  onRegistrarPago?: (gastoId: string) => void;
  onRegistrarAporte?: () => void;
}

function TarjetaGasto({
  gasto,
  editandoId,
  setEditandoId,
  pagadoEnQuincena,
  pendiente,
  onRegistrarPago,
}: {
  gasto: GastoFijo;
  editandoId: string | null;
  setEditandoId: (id: string | null) => void;
  pagadoEnQuincena: boolean;
  pendiente: boolean;
  onRegistrarPago?: (gastoId: string) => void;
}) {
  const { actualizarGastoFijo, eliminarGastoFijo } = useFinanzas();
  const estaEditando = editandoId === gasto.id;
  const esRecurrente = esGastoRecurrente(gasto);
  const diasFecha = diasHastaFechaGasto(gasto);
  const dias =
    diasFecha != null
      ? diasFecha
      : diasHastaCuota(gasto.diaPago);

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
            {gasto.productoFinanciamiento && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                {etiquetaProductoFinanciamiento(gasto.productoFinanciamiento)}
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                gasto.tipoPresupuesto === "esencial"
                  ? "bg-accent/10 text-accent"
                  : "bg-muted/20 text-muted"
              }`}
            >
              {etiquetaTipoPresupuesto(gasto.tipoPresupuesto)}
            </span>
            <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">
              {etiquetaTipoRecurrencia(gasto.tipoRecurrencia ?? "recurrente")}
            </span>
            {pendiente && (
              <span className="rounded-full bg-gasto/10 px-2 py-0.5 text-xs font-medium text-gasto">
                Pendiente
              </span>
            )}
            {!gasto.activo && esRecurrente && (
              <span className="rounded-full bg-muted/20 px-2 py-0.5 text-xs font-medium text-muted">
                Inactivo
              </span>
            )}
          </div>
          {gasto.notas && <p className="mt-0.5 text-xs text-muted">{gasto.notas}</p>}
          <p className="mt-1 text-xs text-muted">
            {esRecurrente
              ? `Día ${gasto.diaPago}`
              : gasto.fechaVencimiento
                ? formatearFecha(gasto.fechaVencimiento)
                : `Día ${gasto.diaPago}`}
            {" · "}
            {gasto.moneda}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {(gasto.activo || !esRecurrente) && (
            <button
              type="button"
              onClick={() => {
                if (pagadoEnQuincena) {
                  const ok = confirmarAccion(
                    `Ya hay un pago registrado para "${gasto.nombre}" en esta quincena. ¿Registrar otro?`
                  );
                  if (!ok) return;
                }
                if (!onRegistrarPago) return;
                onRegistrarPago(gasto.id);
              }}
              className={`rounded-lg px-2 py-1 text-xs font-medium ${
                pagadoEnQuincena
                  ? "text-muted hover:text-foreground"
                  : "bg-accent/10 text-accent hover:bg-accent/20"
              }`}
            >
              {pagadoEnQuincena ? "Registrar otro pago" : "Registrar pago"}
            </button>
          )}
          {esRecurrente && (
            <button
              type="button"
              onClick={() => actualizarGastoFijo(gasto.id, { activo: !gasto.activo })}
              className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
            >
              {gasto.activo ? "Pausar" : "Activar"}
            </button>
          )}
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
              if (!confirmarEliminacion(gasto.nombre, "el gasto")) {
                return;
              }
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
          <div>
            <p className="text-lg font-bold text-gasto">
              {formatearMoneda(gasto.monto, gasto.moneda)}
            </p>
            {pagadoEnQuincena && (
              <p className="mt-0.5 text-xs font-medium text-ingreso">
                {esRecurrente ? "Pagado en esta quincena" : "Pagado"}
              </p>
            )}
            {pendiente && !pagadoEnQuincena && (
              <p className="mt-0.5 text-xs font-medium text-gasto">
                Venció sin pagar
              </p>
            )}
          </div>
          {(gasto.activo || !esRecurrente) && (
            <p className="text-xs text-muted">
              {diasFecha != null ? (
                diasFecha < 0 ? (
                  <span className="font-semibold text-gasto">Vencido</span>
                ) : (
                  <>
                    Pago en{" "}
                    <span className="font-semibold text-foreground">
                      {diasFecha === 0 ? "hoy" : `en ${diasFecha} día${diasFecha !== 1 ? "s" : ""}`}
                    </span>
                  </>
                )
              ) : (
                <>
                  Pago en{" "}
                  <span className="font-semibold text-foreground">
                    {dias === 0 ? "hoy" : `${dias} día${dias !== 1 ? "s" : ""}`}
                  </span>
                </>
              )}
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

function TarjetaPrestamo({
  prestamo,
  pagadoEnQuincena,
}: {
  prestamo: PrestamoVistaGastosFijos;
  pagadoEnQuincena: boolean;
}) {
  const { registrarPagoPrestamo } = useFinanzas();
  const dias = diasHastaCuota(prestamo.diaPago);
  const numeroCuota = prestamo.cuotasPagadas + 1;

  return (
    <div className="rounded-xl border border-dashed border-accent/40 bg-accent/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{prestamo.entidad}</h3>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              Préstamo
            </span>
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted">
              Cuota {numeroCuota}/{prestamo.cuotasTotales}
            </span>
          </div>
          {prestamo.descripcion && (
            <p className="mt-0.5 text-xs text-muted">{prestamo.descripcion}</p>
          )}
          <p className="mt-1 text-xs text-muted">
            Día {prestamo.diaPago} · {prestamo.moneda} · solo referencia en esta vista
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => registrarPagoPrestamo(prestamo.id)}
            className={`rounded-lg px-2 py-1 text-xs font-medium ${
              pagadoEnQuincena
                ? "text-muted hover:text-foreground"
                : "bg-accent/10 text-accent hover:bg-accent/20"
            }`}
          >
            {pagadoEnQuincena ? "Registrar otro pago" : "Registrar pago"}
          </button>
          <Link
            href="/prestamos"
            className="rounded-lg px-2 py-1 text-xs font-medium text-muted hover:text-foreground"
          >
            Ver préstamo
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-gasto">
            {formatearMoneda(prestamo.montoCuota, prestamo.moneda)}
          </p>
          {pagadoEnQuincena && (
            <p className="mt-0.5 text-xs font-medium text-ingreso">
              Pagado en esta quincena
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

function ColumnaQuincena({
  quincena,
  gastos,
  prestamos,
  totalGastos,
  totalPrestamos,
  totalAporte,
  moneda,
  transacciones,
  configuracion,
  onRegistrarPago,
  onRegistrarAporte,
  onMarcarPagadosEnLote,
  esQuincenaActual,
  pendientesEnQuincena,
}: {
  quincena: 1 | 2;
  gastos: GastoFijo[];
  prestamos: PrestamoVistaGastosFijos[];
  totalGastos: number;
  totalPrestamos: number;
  totalAporte: number;
  moneda: string;
  transacciones: ReturnType<typeof useFinanzas>["transacciones"];
  configuracion: ReturnType<typeof useFinanzas>["configuracion"];
  onRegistrarPago?: (gastoId: string) => void;
  onRegistrarAporte?: () => void;
  onMarcarPagadosEnLote?: () => void;
  esQuincenaActual: boolean;
  pendientesEnQuincena: number;
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const activos = gastos.filter((g) => g.activo);
  const aporte = obtenerAporteIngreso(configuracion);
  const total = totalGastos + totalPrestamos + totalAporte;
  const periodoQuincena = useMemo(() => {
    const periodos = obtenerQuincenasDelMes(mesActual(), configuracion.diasPago);
    return (
      periodos.find((p) => p.quincena === quincena) ??
      periodoDeFecha(fechaHoy(), configuracion.diasPago)
    );
  }, [configuracion.diasPago, quincena]);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Quincena {quincena}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {quincena === 1
              ? "Del día 1 al 15"
              : "Del día 16 al fin de mes"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Total en vista</p>
          <p className="text-lg font-bold text-gasto">{formatearMoneda(total, moneda)}</p>
          {totalPrestamos > 0 && (
            <p className="mt-0.5 text-xs text-muted">
              Gastos: {formatearMoneda(totalGastos, moneda)}
              {totalAporte > 0 && (
                <> · Aporte: {formatearMoneda(totalAporte, moneda)}</>
              )}
              {" "}· Préstamos: {formatearMoneda(totalPrestamos, moneda)}
            </p>
          )}
          {totalPrestamos === 0 && totalAporte > 0 && (
            <p className="mt-0.5 text-xs text-muted">
              Gastos: {formatearMoneda(totalGastos, moneda)} · Aporte:{" "}
              {formatearMoneda(totalAporte, moneda)}
            </p>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        {activos.length} gasto{activos.length !== 1 ? "s" : ""} activo
        {activos.length !== 1 ? "s" : ""}
        {gastos.length > activos.length &&
          ` · ${gastos.length - activos.length} pausado${gastos.length - activos.length !== 1 ? "s" : ""}`}
        {prestamos.length > 0 &&
          ` · ${prestamos.length} préstamo${prestamos.length !== 1 ? "s" : ""} (referencia)`}
        {aporte && aporte.quincenas.includes(quincena) && " · 1 aporte según ingresos"}
      </p>

      {esQuincenaActual && pendientesEnQuincena > 0 && onMarcarPagadosEnLote && (
        <button
          type="button"
          onClick={onMarcarPagadosEnLote}
          className="mt-3 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent/90 sm:w-auto"
        >
          Marcar pagados de esta quincena ({pendientesEnQuincena})
        </button>
      )}

      {gastos.length === 0 && prestamos.length === 0 && !(aporte && aporte.quincenas.includes(quincena)) ? (
        <p className="mt-6 rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted">
          Sin gastos ni préstamos en esta quincena
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {aporte && aporte.quincenas.includes(quincena) && (
            <TarjetaAporteIngreso
              aporte={aporte}
              transacciones={transacciones}
              periodoQuincena={periodoQuincena}
              onRegistrarPago={onRegistrarAporte}
            />
          )}
          {gastos.map((gasto) => (
            <TarjetaGasto
              key={gasto.id}
              gasto={gasto}
              editandoId={editandoId}
              setEditandoId={setEditandoId}
              pagadoEnQuincena={gastoFijoCubiertoEnPeriodo(
                gasto,
                transacciones,
                periodoQuincena
              )}
              pendiente={esGastoUnicoPendiente(gasto, transacciones)}
              onRegistrarPago={onRegistrarPago}
            />
          ))}
          {prestamos.length > 0 && (
            <>
              {gastos.length > 0 && (
                <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Préstamos (solo referencia)
                </p>
              )}
              {prestamos.map((prestamo) => (
                <TarjetaPrestamo
                  key={prestamo.id}
                  prestamo={prestamo}
                  pagadoEnQuincena={prestamoTienePagoEnPeriodo(
                    transacciones,
                    prestamo.id,
                    periodoQuincena,
                    prestamo.moneda
                  )}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ListaGastosFijos({
  gastosFijos,
  onAgregar,
  onRegistrarPago,
  onRegistrarAporte,
}: ListaGastosFijosProps) {
  const { configuracion, transacciones, prestamos, registrarPagosGastosFijosEnLote } =
    useFinanzas();
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [mensajeLote, setMensajeLote] = useState("");

  const quincenaActual = useMemo(
    () => obtenerQuincenaActual(configuracion).quincena,
    [configuracion]
  );

  const periodosMes = useMemo(
    () => obtenerQuincenasDelMes(mesActual(), configuracion.diasPago),
    [configuracion.diasPago]
  );

  function marcarPagadosEnLote(quincena: 1 | 2) {
    setMensajeLote("");
    const periodo =
      periodosMes.find((p) => p.quincena === quincena) ?? periodoDeFecha(fechaHoy());
    const pendientes = obtenerGastosFijosPendientesEnPeriodo(
      gastosFijos,
      transacciones,
      periodo
    );
    if (pendientes.length === 0) return;

    const totales = resumenMontosPendientesGastosFijos(pendientes)
      .map(({ moneda, total }) => formatearMoneda(total, moneda))
      .join(" + ");
    const lineas = pendientes
      .slice(0, 8)
      .map(
        ({ gasto, montoPendiente }) =>
          `• ${gasto.nombre}: ${formatearMoneda(montoPendiente, gasto.moneda)}`
      );
    const mas =
      pendientes.length > 8
        ? `\n… y ${pendientes.length - 8} más`
        : "";
    const ok = confirmarAccion(
      `¿Registrar ${pendientes.length} pago${pendientes.length !== 1 ? "s" : ""} por ${totales}?\n\n${lineas.join("\n")}${mas}\n\nSe usará la cuenta o tarjeta por defecto de cada moneda.`
    );
    if (!ok) return;

    const resultado = registrarPagosGastosFijosEnLote(quincena);
    if (resultado.registrados > 0) {
      setMensajeLote(
        resultado.omitidos.length > 0
          ? `${resultado.registrados} pago${resultado.registrados !== 1 ? "s" : ""} registrado${resultado.registrados !== 1 ? "s" : ""}. ${resultado.omitidos.length} omitido${resultado.omitidos.length !== 1 ? "s" : ""} (sin origen de pago).`
          : `${resultado.registrados} pago${resultado.registrados !== 1 ? "s" : ""} registrado${resultado.registrados !== 1 ? "s" : ""} en esta quincena.`
      );
    } else if (resultado.omitidos.length > 0) {
      setMensajeLote(
        `No se registró ningún pago. ${resultado.omitidos.map((o) => o.nombre).join(", ")}: sin cuenta ni tarjeta en su moneda.`
      );
    }
  }

  const categorias = useMemo(() => {
    const cats = new Set(gastosFijos.map((g) => g.categoria));
    return Array.from(cats).sort();
  }, [gastosFijos]);

  const filtrados = useMemo(() => {
    if (categoriaFiltro === "todas") return gastosFijos;
    return gastosFijos.filter((g) => g.categoria === categoriaFiltro);
  }, [gastosFijos, categoriaFiltro]);

  const grupos = useMemo(
    () => agruparGastosPorQuincena(filtrados, transacciones),
    [filtrados, transacciones]
  );

  const gruposPrestamos = useMemo(
    () => agruparPrestamosPorQuincena(prestamos),
    [prestamos]
  );

  const totalesQ = useMemo(() => {
    const moneda = configuracion.moneda;
    const aporte = obtenerAporteIngreso(configuracion);
    const periodos = obtenerQuincenasDelMes(mesActual(), configuracion.diasPago);
    const periodoQ1 = periodos.find((p) => p.quincena === 1)!;
    const periodoQ2 = periodos.find((p) => p.quincena === 2)!;

    const sumarGastos = (q: 1 | 2, monedaFiltro: string) =>
      filtrados
        .filter(
          (g) =>
            g.quincena === q &&
            g.moneda === monedaFiltro &&
            gastoVisibleEnPresupuesto(g, transacciones)
        )
        .reduce((sum, g) => sum + g.monto, 0);

    const aporteQ1 =
      aporte && aporte.quincenas.includes(1) && aporte.moneda === moneda
        ? montoPendienteAporteEnPeriodo(transacciones, aporte, periodoQ1)
        : 0;
    const aporteQ2 =
      aporte && aporte.quincenas.includes(2) && aporte.moneda === moneda
        ? montoPendienteAporteEnPeriodo(transacciones, aporte, periodoQ2)
        : 0;

    const gastosQ1 = sumarGastos(1, moneda);
    const gastosQ2 = sumarGastos(2, moneda);

    return {
      q1: gastosQ1 + aporteQ1 + totalPrestamosPorQuincena(prestamos, 1, moneda),
      q2: gastosQ2 + aporteQ2 + totalPrestamosPorQuincena(prestamos, 2, moneda),
      gastosQ1,
      gastosQ2,
      aporteQ1,
      aporteQ2,
      prestamosQ1: totalPrestamosPorQuincena(prestamos, 1, moneda),
      prestamosQ2: totalPrestamosPorQuincena(prestamos, 2, moneda),
    };
  }, [filtrados, prestamos, configuracion, transacciones]);

  const hayPrestamos = prestamosParaVistaGastosFijos(prestamos).length > 0;

  const pendientesPorQuincena = useMemo(() => {
    const q1 =
      periodosMes.find((p) => p.quincena === 1) ?? periodoDeFecha(fechaHoy());
    const q2 =
      periodosMes.find((p) => p.quincena === 2) ?? periodoDeFecha(fechaHoy());
    return {
      1: obtenerGastosFijosPendientesEnPeriodo(gastosFijos, transacciones, q1)
        .length,
      2: obtenerGastosFijosPendientesEnPeriodo(gastosFijos, transacciones, q2)
        .length,
    };
  }, [gastosFijos, transacciones, periodosMes]);

  if (gastosFijos.length === 0 && !hayPrestamos) {
    return (
      <EstadoVacio
        titulo="No tienes gastos registrados"
        descripcion="Agrega gastos recurrentes o pagos únicos para presupuestar el mes."
        accionEtiqueta="+ Nuevo gasto"
        onAccion={onAgregar}
      />
    );
  }

  return (
    <div className="space-y-4">
      {mensajeLote && (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground">
          {mensajeLote}
        </p>
      )}
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
        {grupos.map(({ quincena, gastos }) => {
          const prestamosQuincena =
            gruposPrestamos.find((g) => g.quincena === quincena)?.prestamos ?? [];
          return (
            <ColumnaQuincena
              key={quincena}
              quincena={quincena}
              gastos={gastos}
              prestamos={prestamosQuincena}
              totalGastos={quincena === 1 ? totalesQ.gastosQ1 : totalesQ.gastosQ2}
              totalAporte={quincena === 1 ? totalesQ.aporteQ1 : totalesQ.aporteQ2}
              totalPrestamos={
                quincena === 1 ? totalesQ.prestamosQ1 : totalesQ.prestamosQ2
              }
              moneda={configuracion.moneda}
              transacciones={transacciones}
              configuracion={configuracion}
              onRegistrarPago={onRegistrarPago}
              onRegistrarAporte={onRegistrarAporte}
              esQuincenaActual={quincena === quincenaActual}
              pendientesEnQuincena={pendientesPorQuincena[quincena]}
              onMarcarPagadosEnLote={
                quincena === quincenaActual
                  ? () => marcarPagadosEnLote(quincena)
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
