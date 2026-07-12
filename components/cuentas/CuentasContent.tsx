"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { totalCuentasPorMoneda } from "@/lib/cuentas";
import { formatearMoneda } from "@/lib/quincenas";
import { PageContainer } from "@/components/layout/PageContainer";
import { FormularioCuenta } from "@/components/cuentas/FormularioCuenta";
import { ListaCuentas } from "@/components/cuentas/ListaCuentas";
import { TarjetaEfectivo } from "@/components/cuentas/TarjetaEfectivo";

export function CuentasContent() {
  const { cuentas, efectivo, configuracion, cargado } = useFinanzas();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const totalesPorMoneda = useMemo(() => {
    const mapa = totalCuentasPorMoneda(cuentas);
    const resultado = Array.from(mapa.entries());

    if (efectivo > 0 || resultado.length === 0) {
      const idx = resultado.findIndex(([m]) => m === configuracion.moneda);
      if (idx >= 0) {
        resultado[idx][1] += efectivo;
      } else {
        resultado.push([configuracion.moneda, efectivo]);
      }
    }

    return resultado;
  }, [cuentas, efectivo, configuracion.moneda]);

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
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Cuentas y efectivo</h1>
          <p className="mt-1 text-sm text-muted">
            Registra tus cuentas bancarias y el dinero en efectivo que tienes disponible
          </p>

          {totalesPorMoneda.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {totalesPorMoneda.map(([moneda, total]) => (
                <div
                  key={moneda}
                  className="rounded-lg border border-border bg-surface px-4 py-2"
                >
                  <span className="font-medium text-foreground">{moneda}</span>
                  <span className="ml-3 text-muted">
                    Total líquido:{" "}
                    <span className="font-semibold text-ingreso">
                      {formatearMoneda(total, moneda)}
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
            + Nueva cuenta
          </button>
        )}
      </header>

      <TarjetaEfectivo />

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
            <FormularioCuenta onExito={() => setMostrarFormulario(false)} />
          </div>
        )}
        <ListaCuentas
          cuentas={cuentas}
          onAgregar={() => setMostrarFormulario(true)}
        />
      </div>
    </PageContainer>
  );
}
