"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { TemaApp } from "@/types/finanzas";
import { RespaldoDatos } from "@/components/configuracion/RespaldoDatos";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";
import { SelectorTema } from "@/components/ui/SelectorTema";
import { aplicarTema } from "@/lib/tema";
import { validarDiasPago } from "@/lib/validar-configuracion";
import { PageContainer } from "@/components/layout/PageContainer";

export function ConfiguracionContent() {
  const { configuracion, actualizarConfiguracion } = useFinanzas();
  const [dia1, setDia1] = useState(String(configuracion.diasPago[0]));
  const [dia2, setDia2] = useState(String(configuracion.diasPago[1]));
  const [moneda, setMoneda] = useState(configuracion.moneda);
  const [tema, setTema] = useState<TemaApp>(configuracion.tema ?? "claro");
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  function handleTemaChange(nuevoTema: TemaApp) {
    setTema(nuevoTema);
    aplicarTema(nuevoTema);
    actualizarConfiguracion({ tema: nuevoTema });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const d1 = Number(dia1);
    const d2 = Number(dia2);
    const errorDias = validarDiasPago(d1, d2);
    if (errorDias) {
      setError(errorDias);
      return;
    }

    actualizarConfiguracion({
      diasPago: [d1, d2],
      moneda,
      tema,
    });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  }

  return (
    <PageContainer>
      <header>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Configuración</h1>
        <p className="mt-1 text-sm text-muted">
          Personaliza tu gestor de finanzas
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="max-w-lg rounded-xl border border-border bg-surface p-6 shadow-sm"
      >
        <h2 className="text-base font-semibold text-foreground">Apariencia</h2>
        <p className="mt-1 text-xs text-muted">
          Elige entre modo claro, oscuro o seguir tu sistema
        </p>
        <div className="mt-4">
          <SelectorTema value={tema} onChange={handleTemaChange} />
        </div>

        <h2 className="mt-6 text-base font-semibold text-foreground">
          Días de pago
        </h2>
        <p className="mt-1 text-xs text-muted">
          Indica los días del mes en que recibes tu salario. Las quincenas del
          calendario siempre van del 1 al 15 (Q1) y del 16 al fin de mes (Q2).
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Primer pago (día)
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={dia1}
              onChange={(e) => setDia1(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Segundo pago (día)
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={dia2}
              onChange={(e) => setDia2(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Moneda principal
          </span>
          <p className="text-xs text-muted">
            Para transacciones y resúmenes. Cada tarjeta puede tener su propia moneda.
          </p>
          <SelectorMoneda value={moneda} onChange={setMoneda} />
        </label>

        <div className="mt-4 rounded-lg bg-accent/5 px-4 py-3 text-xs text-muted">
          <p className="font-medium text-foreground">Quincenas (calendario):</p>
          <p className="mt-1">Q1: del 1 al 15 de cada mes</p>
          <p>Q2: del 16 al 30/31 de cada mes</p>
          <p className="mt-2 font-medium text-foreground">Tus días de pago:</p>
          <p className="mt-1">
            Se usan para referencia de ingresos (ej. días {dia1} y {dia2})
          </p>
        </div>

        <button
          type="submit"
          className="mt-5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {guardado ? "¡Guardado!" : "Guardar configuración"}
        </button>
        {error && <p className="mt-3 text-sm text-gasto">{error}</p>}
      </form>

      <RespaldoDatos />
    </PageContainer>
  );
}
