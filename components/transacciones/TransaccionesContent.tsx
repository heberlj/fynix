"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { FormularioTransaccion } from "@/components/transacciones/FormularioTransaccion";
import { ListaTransacciones } from "@/components/transacciones/ListaTransacciones";

export function TransaccionesContent() {
  const { transacciones, cargado } = useFinanzas();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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
            Transacciones
          </h1>
          <p className="mt-1 text-sm text-muted">
            Registra tus gastos diarios e ingresos de efectivo
          </p>
        </div>

        {!mostrarFormulario && (
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="w-full shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover xl:hidden"
          >
            + Nueva transacción
          </button>
        )}
      </header>

      <div className="grid gap-6 sm:gap-8 xl:grid-cols-[380px_1fr]">
        <div
          className={`space-y-4 ${mostrarFormulario ? "block" : "hidden"} xl:block`}
        >
          {mostrarFormulario && (
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              className="text-sm text-muted transition-colors hover:text-foreground xl:hidden"
            >
              ← Cancelar
            </button>
          )}
          <FormularioTransaccion onExito={() => setMostrarFormulario(false)} />
        </div>
        <ListaTransacciones transacciones={transacciones} />
      </div>
    </PageContainer>
  );
}
