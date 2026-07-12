"use client";

import { useState } from "react";
import type { Transaccion } from "@/types/finanzas";
import { useFinanzas } from "@/context/FinanzasContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { Modal } from "@/components/ui/Modal";
import { FormularioTransaccion } from "@/components/transacciones/FormularioTransaccion";
import { GestionCategoriasTransacciones } from "@/components/transacciones/GestionCategoriasTransacciones";
import { ListaTransacciones } from "@/components/transacciones/ListaTransacciones";

export function TransaccionesContent() {
  const { transacciones, cargado } = useFinanzas();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [gestionarCategorias, setGestionarCategorias] = useState(false);
  const [transaccionEditando, setTransaccionEditando] = useState<Transaccion | null>(
    null
  );

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setTransaccionEditando(null);
  }

  const formularioAbierto = mostrarFormulario || Boolean(transaccionEditando);
  const tituloFormulario = transaccionEditando
    ? "Editar transacción"
    : "Nueva transacción";

  if (!cargado) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  const formulario = (
    <FormularioTransaccion
      transaccion={transaccionEditando ?? undefined}
      onExito={cerrarFormulario}
      onCancelar={cerrarFormulario}
    />
  );

  return (
    <PageContainer>
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            Transacciones
          </h1>
          <p className="mt-1 text-sm text-muted">
            Historial de gastos, ingresos y movimientos entre cuentas
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0">
          <button
            type="button"
            onClick={() => {
              const abrir = !gestionarCategorias;
              setGestionarCategorias(abrir);
              if (abrir) cerrarFormulario();
            }}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover sm:w-auto"
          >
            {gestionarCategorias ? "Cerrar categorías" : "Gestionar categorías"}
          </button>
          {!formularioAbierto && (
            <button
              type="button"
              onClick={() => {
                setMostrarFormulario(true);
                setTransaccionEditando(null);
                setGestionarCategorias(false);
              }}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
            >
              + Nueva transacción
            </button>
          )}
        </div>
      </header>

      {gestionarCategorias && (
        <GestionCategoriasTransacciones
          onCerrar={() => setGestionarCategorias(false)}
        />
      )}

      <Modal
        abierto={formularioAbierto}
        onCerrar={cerrarFormulario}
        titulo={tituloFormulario}
      >
        <div className="lg:hidden">{formulario}</div>
      </Modal>

      <div
        className={
          formularioAbierto
            ? "grid gap-8 lg:grid-cols-[380px_1fr]"
            : "grid gap-8"
        }
      >
        {formularioAbierto && (
          <div className="hidden lg:block">{formulario}</div>
        )}
        <ListaTransacciones
          transacciones={transacciones}
          onNueva={() => {
            setMostrarFormulario(true);
            setTransaccionEditando(null);
            setGestionarCategorias(false);
          }}
          onEditar={(t) => {
            if (t.cuotaPopularId) return;
            setTransaccionEditando(t);
            setMostrarFormulario(false);
            setGestionarCategorias(false);
          }}
        />
      </div>
    </PageContainer>
  );
}
