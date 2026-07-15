"use client";

import { useEffect, useMemo, useState } from "react";
import type { CuentaBancaria, TarjetaCredito, Transaccion } from "@/types/finanzas";
import type { DatoCategoria } from "@/lib/graficos";
import { colorCategoriaGasto } from "@/lib/categorias-transacciones";
import { filtrarGastosCategoriaPeriodoHome, type SeleccionFuenteHome } from "@/lib/resumen-home";
import type { RangoPeriodoHome, TipoPeriodoHome } from "@/lib/periodos-home";
import { useFinanzas } from "@/context/FinanzasContext";
import { GraficoCircular } from "@/components/ui/GraficoCircular";
import { DetalleTransaccionesHome } from "@/components/home/DetalleTransaccionesHome";
import { ModalDetalleTransaccionesHome } from "@/components/home/ModalDetalleTransaccionesHome";
import { EdicionCategoriasGastoHome } from "@/components/home/EdicionCategoriasGastoHome";

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

  useEffect(() => {
    setCategoriaExpandida(null);
    setModalAbierto(false);
  }, [rango.inicio, rango.fin]);

  const segmentos = useMemo(
    () =>
      datos.map((dato, i) => ({
        id: dato.categoria,
        etiqueta: dato.categoria,
        valor: dato.monto,
        color: colorCategoriaGasto(configuracion, dato.categoria, i),
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
    setCategoriaExpandida((actual) => (actual === id ? null : id));
  }

  function alternarEdicion() {
    setModoEdicion((actual) => {
      if (!actual) {
        setCategoriaExpandida(null);
        setModalAbierto(false);
      }
      return !actual;
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-xs text-muted sm:max-w-md">{subtitulo}</p>
        <button
          type="button"
          onClick={alternarEdicion}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            modoEdicion
              ? "bg-accent text-white"
              : "border border-border bg-background text-muted hover:text-foreground"
          }`}
        >
          {modoEdicion ? "Listo" : "Editar categorías"}
        </button>
      </div>

      {modoEdicion ? (
        <EdicionCategoriasGastoHome />
      ) : (
        <>
          <GraficoCircular
            segmentos={segmentos}
            moneda={moneda}
            titulo="Gastos por categoría"
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
