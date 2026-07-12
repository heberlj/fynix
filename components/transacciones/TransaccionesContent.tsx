"use client";

import { useState } from "react";
import type { Transaccion } from "@/types/finanzas";
import { useFinanzas } from "@/context/FinanzasContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";
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

  return (
    <AyudaPagina pagina="transacciones">
      <PageContainer>
        <EncabezadoPagina
          titulo="Transacciones"
          descripcion="Historial de gastos, ingresos y movimientos entre cuentas"
          dataAyuda="acciones"
          acciones={
            <>
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
            </>
          }
        />

        {gestionarCategorias && (
          <GestionCategoriasTransacciones
            onCerrar={() => setGestionarCategorias(false)}
          />
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

        <Modal
          abierto={formularioAbierto}
          onCerrar={cerrarFormulario}
          titulo={tituloFormulario}
          variant="centro"
          tamano="amplio"
        >
          <FormularioTransaccion
            enModal
            transaccion={transaccionEditando ?? undefined}
            onExito={cerrarFormulario}
            onCancelar={cerrarFormulario}
          />
        </Modal>
      </PageContainer>
    </AyudaPagina>
  );
}
