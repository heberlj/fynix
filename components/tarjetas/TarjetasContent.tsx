"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { usePlanLimites } from "@/hooks/usePlanLimites";
import { MENSAJE_LIMITE_TARJETAS } from "@/lib/plan-limites";
import { PageContainer } from "@/components/layout/PageContainer";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";
import { Modal } from "@/components/ui/Modal";
import { FormularioTarjeta } from "@/components/tarjetas/FormularioTarjeta";
import { ListaTarjetas } from "@/components/tarjetas/ListaTarjetas";
import { formatearMoneda } from "@/lib/quincenas";
import { AvisoLimitePro } from "@/components/suscripcion/AvisoLimitePro";

export function TarjetasContent() {
  const { tarjetas, cargado } = useFinanzas();
  const { puedeAgregarTarjeta } = usePlanLimites();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarLimite, setMostrarLimite] = useState(false);

  const puedeAgregar = puedeAgregarTarjeta(tarjetas.length);

  function abrirFormulario() {
    if (!puedeAgregar) {
      setMostrarLimite(true);
      return;
    }
    setMostrarLimite(false);
    setMostrarFormulario(true);
  }

  const totalesPorMoneda = useMemo(() => {
    const mapa = new Map<string, { deuda: number; disponible: number }>();

    tarjetas.forEach((t) => {
      const actual = mapa.get(t.moneda) ?? { deuda: 0, disponible: 0 };
      actual.deuda += t.deudaActual;
      actual.disponible += t.limite - t.deudaActual;
      mapa.set(t.moneda, actual);
    });

    return Array.from(mapa.entries());
  }, [tarjetas]);

  if (!cargado) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <AyudaPagina pagina="tarjetas">
      <PageContainer>
        <EncabezadoPagina
          titulo="Tarjetas de crédito"
          descripcion="Registra tus tarjetas y visualiza un simulacro con detección automática Visa / Mastercard"
          dataAyuda="acciones"
          acciones={
            !mostrarFormulario ? (
              <button
                type="button"
                onClick={abrirFormulario}
                className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
              >
                + Nueva tarjeta
              </button>
            ) : undefined
          }
        />

        {mostrarLimite && (
          <AvisoLimitePro mensaje={MENSAJE_LIMITE_TARJETAS} />
        )}

        {totalesPorMoneda.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm">
            {totalesPorMoneda.map(([moneda, totales]) => (
              <div
                key={moneda}
                className="flex flex-wrap gap-3 rounded-lg border border-border bg-surface px-4 py-2"
              >
                <span className="font-medium text-foreground">{moneda}</span>
                <span className="text-muted">
                  Deuda:{" "}
                  <span className="font-semibold text-gasto">
                    {formatearMoneda(totales.deuda, moneda)}
                  </span>
                </span>
                <span className="text-muted">
                  Disponible:{" "}
                  <span className="font-semibold text-ingreso">
                    {formatearMoneda(totales.disponible, moneda)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        <div data-ayuda="lista">
          <ListaTarjetas
            tarjetas={tarjetas}
            onAgregar={abrirFormulario}
          />
        </div>

        <Modal
          abierto={mostrarFormulario}
          onCerrar={() => setMostrarFormulario(false)}
          titulo="Nueva tarjeta"
          variant="centro"
          tamano="amplio"
        >
          <FormularioTarjeta
            enModal
            onExito={() => setMostrarFormulario(false)}
          />
        </Modal>
      </PageContainer>
    </AyudaPagina>
  );
}
