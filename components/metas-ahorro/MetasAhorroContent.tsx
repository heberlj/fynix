"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { metasOrdenadas, totalAhorradoPorMoneda } from "@/lib/metas-ahorro";
import { formatearMoneda } from "@/lib/quincenas";
import { PageContainer } from "@/components/layout/PageContainer";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";
import { Modal } from "@/components/ui/Modal";
import { FormularioMetaAhorro } from "@/components/metas-ahorro/FormularioMetaAhorro";
import { FormularioTransaccion } from "@/components/transacciones/FormularioTransaccion";
import { ListaMetasAhorro } from "@/components/metas-ahorro/ListaMetasAhorro";

export function MetasAhorroContent() {
  const { metasAhorro, cargado } = useFinanzas();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [metaAporteId, setMetaAporteId] = useState<string | null>(null);

  const totalesPorMoneda = useMemo(
    () => Array.from(totalAhorradoPorMoneda(metasAhorro).entries()),
    [metasAhorro]
  );

  const metas = useMemo(() => metasOrdenadas(metasAhorro), [metasAhorro]);

  if (!cargado) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <AyudaPagina pagina="metas-ahorro">
      <PageContainer>
        <EncabezadoPagina
          titulo="Metas de ahorro"
          descripcion="Define objetivos y registra aportes para ver tu progreso hacia cada meta."
          dataAyuda="acciones"
          acciones={
            !mostrarFormulario ? (
              <button
                type="button"
                onClick={() => setMostrarFormulario(true)}
                className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
              >
                + Nueva meta
              </button>
            ) : undefined
          }
        />

        {totalesPorMoneda.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm">
            {totalesPorMoneda.map(([moneda, total]) => (
              <div
                key={moneda}
                className="flex flex-wrap gap-3 rounded-lg border border-border bg-surface px-4 py-2"
              >
                <span className="font-medium text-foreground">{moneda}</span>
                <span className="text-muted">
                  Total ahorrado:{" "}
                  <span className="font-semibold text-ingreso">
                    {formatearMoneda(total, moneda)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        <div data-ayuda="lista">
          <ListaMetasAhorro
            metas={metas}
            onAgregar={() => setMostrarFormulario(true)}
            onRegistrarAporte={(metaId) => setMetaAporteId(metaId)}
          />
        </div>

        <Modal
          abierto={mostrarFormulario}
          onCerrar={() => setMostrarFormulario(false)}
          titulo="Nueva meta de ahorro"
          variant="centro"
          tamano="amplio"
        >
          <FormularioMetaAhorro
            enModal
            onExito={() => setMostrarFormulario(false)}
          />
        </Modal>

        <Modal
          abierto={metaAporteId != null}
          onCerrar={() => setMetaAporteId(null)}
          titulo="Registrar aporte"
          variant="centro"
          tamano="amplio"
        >
          <FormularioTransaccion
            enModal
            metaAhorroInicialId={metaAporteId ?? undefined}
            onExito={() => setMetaAporteId(null)}
            onCancelar={() => setMetaAporteId(null)}
          />
        </Modal>
      </PageContainer>
    </AyudaPagina>
  );
}
