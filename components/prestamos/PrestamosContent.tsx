"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { saldoPendiente } from "@/lib/prestamos";
import { formatearMoneda } from "@/lib/quincenas";
import { PageContainer } from "@/components/layout/PageContainer";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";
import { Modal } from "@/components/ui/Modal";
import { FormularioPrestamo } from "@/components/prestamos/FormularioPrestamo";
import { ListaPrestamos } from "@/components/prestamos/ListaPrestamos";

export function PrestamosContent() {
  const { prestamos, cargado } = useFinanzas();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const totalesPorMoneda = useMemo(() => {
    const mapa = new Map<string, { pendiente: number; cuotaMensual: number }>();

    prestamos.forEach((p) => {
      const actual = mapa.get(p.moneda) ?? { pendiente: 0, cuotaMensual: 0 };
      actual.pendiente += saldoPendiente(p);
      if (p.cuotasPagadas < p.cuotasTotales) {
        actual.cuotaMensual += p.montoCuota;
      }
      mapa.set(p.moneda, actual);
    });

    return Array.from(mapa.entries());
  }, [prestamos]);

  if (!cargado) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  return (
    <AyudaPagina pagina="prestamos">
      <PageContainer>
        <EncabezadoPagina
          titulo="Préstamos"
          descripcion="Registra tus préstamos y paga cuotas con transacciones. En Gastos fijos aparecen solo como referencia para ver tu panorama mensual."
          acciones={
            !mostrarFormulario ? (
              <button
                type="button"
                onClick={() => setMostrarFormulario(true)}
                className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
              >
                + Nuevo préstamo
              </button>
            ) : undefined
          }
        />

        {totalesPorMoneda.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm">
            {totalesPorMoneda.map(([moneda, totales]) => (
              <div
                key={moneda}
                className="flex flex-wrap gap-3 rounded-lg border border-border bg-surface px-4 py-2"
              >
                <span className="font-medium text-foreground">{moneda}</span>
                <span className="text-muted">
                  Saldo pendiente:{" "}
                  <span className="font-semibold text-gasto">
                    {formatearMoneda(totales.pendiente, moneda)}
                  </span>
                </span>
                <span className="text-muted">
                  Cuotas mensuales:{" "}
                  <span className="font-semibold text-foreground">
                    {formatearMoneda(totales.cuotaMensual, moneda)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        <div data-ayuda="lista">
          <ListaPrestamos
            prestamos={prestamos}
            onAgregar={() => setMostrarFormulario(true)}
          />
        </div>

        <Modal
          abierto={mostrarFormulario}
          onCerrar={() => setMostrarFormulario(false)}
          titulo="Nuevo préstamo"
          variant="centro"
          tamano="amplio"
        >
          <FormularioPrestamo
            enModal
            onExito={() => setMostrarFormulario(false)}
          />
        </Modal>
      </PageContainer>
    </AyudaPagina>
  );
}
