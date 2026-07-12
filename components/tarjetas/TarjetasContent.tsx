"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { FormularioTarjeta } from "@/components/tarjetas/FormularioTarjeta";
import { ListaTarjetas } from "@/components/tarjetas/ListaTarjetas";
import { formatearMoneda } from "@/lib/quincenas";

export function TarjetasContent() {
  const { tarjetas, cargado } = useFinanzas();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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
    <PageContainer>
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Tarjetas de crédito
          </h1>
          <p className="mt-1 text-sm text-muted">
            Registra tus tarjetas y visualiza un simulacro con detección automática
            Visa / Mastercard
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
        </div>

        {!mostrarFormulario && (
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="w-full shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
          >
            + Nueva tarjeta
          </button>
        )}
      </header>

      <div
        className={
          mostrarFormulario
            ? "grid gap-8 xl:grid-cols-[400px_1fr]"
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
            <FormularioTarjeta onExito={() => setMostrarFormulario(false)} />
          </div>
        )}
        <ListaTarjetas
          tarjetas={tarjetas}
          onAgregar={() => setMostrarFormulario(true)}
        />
      </div>
    </PageContainer>
  );
}
