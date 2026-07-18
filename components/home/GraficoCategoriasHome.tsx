"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CuentaBancaria, TarjetaCredito, Transaccion } from "@/types/finanzas";
import type { DatoCategoria } from "@/lib/graficos";
import { colorCategoriaGasto, iconoCategoriaGasto } from "@/lib/categorias-transacciones";
import { filtrarGastosCategoriaPeriodoHome, type SeleccionFuenteHome } from "@/lib/resumen-home";
import type { RangoPeriodoHome, TipoPeriodoHome } from "@/lib/periodos-home";
import { useFinanzas } from "@/context/FinanzasContext";
import { GraficoCircular } from "@/components/ui/GraficoCircular";
import { DetalleTransaccionesHome } from "@/components/home/DetalleTransaccionesHome";
import { ModalDetalleTransaccionesHome } from "@/components/home/ModalDetalleTransaccionesHome";
import { EdicionCategoriasGastoHome } from "@/components/home/EdicionCategoriasGastoHome";
import { useEsMovil } from "@/lib/use-media-query";

interface GraficoCategoriasHomeProps {
  datos: DatoCategoria[];
  transacciones: Transaccion[];
  rango: RangoPeriodoHome;
  tipoPeriodo: TipoPeriodoHome;
  moneda: string;
  fuente?: SeleccionFuenteHome | null;
  cuentas: CuentaBancaria[];
  tarjetas: TarjetaCredito[];
  subtitulo?: string;
}

const cardClass =
  "flex h-full flex-col rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6";

function BotonEditarCategorias({
  modoEdicion,
  onClick,
}: {
  modoEdicion: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        modoEdicion
          ? "bg-accent text-white"
          : "border border-border bg-background text-muted hover:text-foreground"
      }`}
    >
      {modoEdicion ? "Listo" : "Editar categorías"}
    </button>
  );
}

export function GraficoCategoriasHome({
  datos,
  transacciones,
  rango,
  tipoPeriodo,
  moneda,
  fuente,
  cuentas,
  tarjetas,
  subtitulo = "Cada porción representa cuánto gastaste en esa categoría en el periodo seleccionado.",
}: GraficoCategoriasHomeProps) {
  const { configuracion } = useFinanzas();
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(
    null
  );
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const refDetalle = useRef<HTMLDivElement>(null);
  const esMovil = useEsMovil();

  useEffect(() => {
    setCategoriaExpandida(null);
    setModalAbierto(false);
  }, [rango.inicio, rango.fin]);

  const segmentos = useMemo(
    () =>
      datos.map((dato) => ({
        id: dato.categoria,
        etiqueta: dato.categoria,
        valor: dato.monto,
        color: colorCategoriaGasto(configuracion, dato.categoria),
        iconoId: iconoCategoriaGasto(configuracion, dato.categoria),
        descripcion: `${dato.porcentaje.toFixed(1)}% del total de gastos del periodo.`,
      })),
    [datos, configuracion]
  );

  const total = datos.reduce((sum, d) => sum + d.monto, 0);
  const top = datos[0];

  const transaccionesCategoria = useMemo(() => {
    if (!categoriaExpandida) return [];
    return filtrarGastosCategoriaPeriodoHome(
      transacciones,
      rango,
      moneda,
      fuente,
      categoriaExpandida
    );
  }, [categoriaExpandida, transacciones, rango, moneda, fuente]);

  function manejarClicCategoria(id: string) {
    if (modoEdicion) return;

    if (categoriaExpandida === id) {
      setCategoriaExpandida(null);
      setModalAbierto(false);
      return;
    }

    setCategoriaExpandida(id);
    if (esMovil) {
      setModalAbierto(true);
    }
  }

  useEffect(() => {
    if (!categoriaExpandida || esMovil || !refDetalle.current) return;
    refDetalle.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [categoriaExpandida, esMovil, transaccionesCategoria.length]);

  function alternarEdicion() {
    setModoEdicion((actual) => {
      if (!actual) {
        setCategoriaExpandida(null);
        setModalAbierto(false);
      }
      return !actual;
    });
  }

  const botonEditar = (
    <BotonEditarCategorias modoEdicion={modoEdicion} onClick={alternarEdicion} />
  );

  return (
    <div>
      {modoEdicion ? (
        <div className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground">
              Gastos por categoría
            </h3>
            {botonEditar}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted">{subtitulo}</p>
          <div className="mt-4">
            <EdicionCategoriasGastoHome />
          </div>
        </div>
      ) : (
        <>
          <GraficoCircular
            segmentos={segmentos}
            moneda={moneda}
            titulo="Gastos por categoría"
            subtitulo={subtitulo}
            accionHeader={botonEditar}
            centroEtiqueta={top ? "Mayor gasto" : undefined}
            centroValor={top ? top.categoria : undefined}
            centroNota={
              top ? `${top.porcentaje.toFixed(0)}% del total` : undefined
            }
            totalReferencia={total}
            mensajeVacio="Sin gastos para mostrar en este periodo"
            segmentoSeleccionado={categoriaExpandida}
            onSegmentoClick={manejarClicCategoria}
          />

          {categoriaExpandida && (
            <div ref={refDetalle} className="scroll-mt-24">
              {esMovil ? (
                <div className="mt-3 rounded-xl border border-border bg-background px-4 py-3 text-center shadow-sm">
                  <p className="text-sm font-medium text-foreground">
                    {transaccionesCategoria.length} gasto
                    {transaccionesCategoria.length !== 1 ? "s" : ""} en{" "}
                    {categoriaExpandida}
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalAbierto(true)}
                    className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
                  >
                    Ver listado completo
                  </button>
                </div>
              ) : (
                <DetalleTransaccionesHome
                  transacciones={transaccionesCategoria}
                  filtro="gastos"
                  titulo={categoriaExpandida}
                  moneda={moneda}
                  fuente={fuente}
                  cuentas={cuentas}
                  tarjetas={tarjetas}
                  onVerMas={() => setModalAbierto(true)}
                />
              )}
            </div>
          )}
        </>
      )}

      {categoriaExpandida && (
        <ModalDetalleTransaccionesHome
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          filtro="gastos"
          categoria={categoriaExpandida}
          titulo={categoriaExpandida}
          transacciones={transacciones}
          moneda={moneda}
          fuente={fuente}
          cuentas={cuentas}
          tarjetas={tarjetas}
          rangoInicial={rango}
          tipoPeriodoInicial={tipoPeriodo}
        />
      )}
    </div>
  );
}
