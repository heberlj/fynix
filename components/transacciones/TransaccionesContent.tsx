"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Transaccion } from "@/types/finanzas";
import { useFinanzas } from "@/context/FinanzasContext";
import { PageContainer } from "@/components/layout/PageContainer";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";
import { Modal } from "@/components/ui/Modal";
import { FormularioTransaccion } from "@/components/transacciones/FormularioTransaccion";
import { GestionCategoriasTransacciones } from "@/components/transacciones/GestionCategoriasTransacciones";
import { ImportarMovimientosBanco } from "@/components/transacciones/ImportarMovimientosBanco";
import { ListaTransacciones } from "@/components/transacciones/ListaTransacciones";

export function TransaccionesContent() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="text-muted">Cargando transacciones...</p>
        </div>
      }
    >
      <TransaccionesContentInner />
    </Suspense>
  );
}

function TransaccionesContentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { transacciones, cargado } = useFinanzas();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [gestionarCategorias, setGestionarCategorias] = useState(false);
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const [mensajeImportacion, setMensajeImportacion] = useState("");
  const [transaccionEditando, setTransaccionEditando] = useState<Transaccion | null>(
    null
  );

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setTransaccionEditando(null);
  }

  useEffect(() => {
    if (searchParams.get("nueva") !== "1") return;

    setMostrarFormulario(true);
    setTransaccionEditando(null);
    setGestionarCategorias(false);
    router.replace("/transacciones");
  }, [searchParams, router]);

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
          acciones={
            <>
              <button
                type="button"
                onClick={() => {
                  setGestionarCategorias(true);
                  cerrarFormulario();
                }}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover sm:w-auto"
              >
                Gestionar categorías
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarImportar(true);
                  cerrarFormulario();
                  setGestionarCategorias(false);
                }}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover sm:w-auto"
              >
                Importar del banco
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

        {mensajeImportacion && (
          <p className="rounded-lg border border-ingreso/30 bg-ingreso/10 px-4 py-3 text-sm text-ingreso">
            {mensajeImportacion}
          </p>
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

        <Modal
          abierto={gestionarCategorias}
          onCerrar={() => setGestionarCategorias(false)}
          titulo="Gestionar categorías"
          variant="centro"
          tamano="amplio"
        >
          <GestionCategoriasTransacciones
            onCerrar={() => setGestionarCategorias(false)}
          />
        </Modal>
        <Modal
          abierto={mostrarImportar}
          onCerrar={() => setMostrarImportar(false)}
          titulo="Importar movimientos del banco"
          variant="centro"
          tamano="amplio"
        >
          <ImportarMovimientosBanco
            onCerrar={() => setMostrarImportar(false)}
            onImportado={(n) => {
              setMensajeImportacion(
                `Se importaron ${n} movimiento${n !== 1 ? "s" : ""} correctamente.`
              );
              setTimeout(() => setMensajeImportacion(""), 5000);
            }}
          />
        </Modal>
      </PageContainer>
    </AyudaPagina>
  );
}
