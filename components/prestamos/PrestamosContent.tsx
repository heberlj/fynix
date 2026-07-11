"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { saldoPendiente } from "@/lib/prestamos";
import { formatearMoneda } from "@/lib/quincenas";
import { PageContainer } from "@/components/layout/PageContainer";
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
    <PageContainer>
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Préstamos</h1>
          <p className="mt-1 text-sm text-muted">
            Registra tus préstamos, lleva el control de cuotas y ve en qué quincena
            cae cada pago
          </p>

          {totalesPorMoneda.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
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
        </div>

        {!mostrarFormulario && (
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="w-full shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
          >
            + Nuevo préstamo
          </button>
        )}
      </header>

      <div
        className={
          mostrarFormulario
            ? "grid gap-8 xl:grid-cols-[380px_1fr]"
            : "grid gap-8"
        }
      >
        {mostrarFormulario && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              ← Cancelar
            </button>
            <FormularioPrestamo onExito={() => setMostrarFormulario(false)} />
          </div>
        )}
        <ListaPrestamos prestamos={prestamos} />
      </div>
    </PageContainer>
  );
}
