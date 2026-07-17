"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";
import { ResumenCuentasTarjetas } from "@/components/home/ResumenCuentasTarjetas";
import { GraficoFinanzasHome } from "@/components/home/GraficoFinanzasHome";
import { BotonFlotanteNuevaTransaccion } from "@/components/transacciones/BotonFlotanteNuevaTransaccion";
import { etiquetaOrigen } from "@/lib/transacciones";
import type { SeleccionFuenteHome } from "@/lib/resumen-home";
import { obtenerQuincenaActual } from "@/lib/quincenas";

export function HomeContent() {
  const { transacciones, tarjetas, cuentas, efectivo, configuracion, cargado } =
    useFinanzas();
  const [seleccionFuente, setSeleccionFuente] =
    useState<SeleccionFuenteHome | null>(null);

  const etiquetaFuente = useMemo(() => {
    if (!seleccionFuente) return undefined;
    return etiquetaOrigen(seleccionFuente, cuentas, tarjetas);
  }, [seleccionFuente, cuentas, tarjetas]);

  if (!cargado) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  const quincenaActual = obtenerQuincenaActual(configuracion);

  return (
    <AyudaPagina pagina="home">
      <PageContainer>
        <EncabezadoPagina
          titulo="Home"
          descripcion={`Quincena actual: ${quincenaActual.etiqueta}`}
        />

        <section data-ayuda="patrimonio" className="space-y-6">
          <ResumenCuentasTarjetas
            cuentas={cuentas}
            tarjetas={tarjetas}
            efectivo={efectivo}
            moneda={configuracion.moneda}
            seleccion={seleccionFuente}
            onSeleccionChange={setSeleccionFuente}
          />

          <div data-ayuda="grafico">
            <GraficoFinanzasHome
              transacciones={transacciones}
              cuentas={cuentas}
              tarjetas={tarjetas}
              moneda={configuracion.moneda}
              fuenteSeleccionada={seleccionFuente}
              etiquetaFuente={etiquetaFuente}
            />
          </div>
        </section>
      </PageContainer>
      <BotonFlotanteNuevaTransaccion />
    </AyudaPagina>
  );
}
