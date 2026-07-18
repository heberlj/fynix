"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { usePlanLimites } from "@/hooks/usePlanLimites";
import { MENSAJE_LIMITE_CUENTAS } from "@/lib/plan-limites";
import type { ColorHome, IconoHomeCuenta, TipoCuentaBancaria } from "@/types/finanzas";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";
import { SelectorBanco } from "@/components/ui/SelectorBanco";
import { esBancoCertificado } from "@/lib/bancos";
import { PersonalizacionCuentaHome } from "@/components/ui/PersonalizacionCuentaHome";
import {
  colorHomePorIndice,
  ICONO_HOME_CUENTA_DEFAULT,
} from "@/lib/personalizacion-home";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function FormularioCuenta({
  onExito,
  enModal = false,
}: { onExito?: () => void; enModal?: boolean } = {}) {
  const { agregarCuenta, configuracion, cuentas } = useFinanzas();
  const { puedeAgregarCuenta } = usePlanLimites();

  const [banco, setBanco] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoCuentaBancaria>("ahorro");
  const [saldoActual, setSaldoActual] = useState("");
  const [ultimosCuatro, setUltimosCuatro] = useState("");
  const [moneda, setMoneda] = useState(configuracion.moneda);
  const [colorHome, setColorHome] = useState<ColorHome>(
    colorHomePorIndice(cuentas.length)
  );
  const [iconoHome, setIconoHome] = useState<IconoHomeCuenta>(
    ICONO_HOME_CUENTA_DEFAULT
  );
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const saldoNum = parseFloat(saldoActual) || 0;

    if (!banco || !esBancoCertificado(banco)) {
      setError("Selecciona un banco de la lista");
      return;
    }
    if (!nombre.trim()) {
      setError("El nombre de la cuenta es obligatorio");
      return;
    }
    if (saldoNum < 0) {
      setError("El saldo no puede ser negativo");
      return;
    }

    if (!puedeAgregarCuenta(cuentas.length)) {
      setError(MENSAJE_LIMITE_CUENTAS);
      return;
    }

    agregarCuenta({
      banco,
      nombre: nombre.trim(),
      tipo,
      saldoActual: saldoNum,
      moneda,
      ultimosCuatro: ultimosCuatro.replace(/\D/g, "").slice(-4),
      colorHome,
      iconoHome,
    });

    setBanco("");
    setNombre("");
    setTipo("ahorro");
    setSaldoActual("");
    setUltimosCuatro("");
    setColorHome(colorHomePorIndice(cuentas.length + 1));
    setIconoHome(ICONO_HOME_CUENTA_DEFAULT);
    onExito?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        enModal
          ? ""
          : "rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
      }
    >
      {!enModal && (
        <h2 className="text-base font-semibold text-foreground">Nueva cuenta</h2>
      )}
      <p className={`text-xs text-muted ${enModal ? "" : "mt-1"}`}>
        El saldo se actualizará automáticamente al registrar ingresos y gastos
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SelectorBanco
          value={banco}
          onChange={setBanco}
          className="sm:col-span-2"
        />

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Nombre de la cuenta</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Nómina, Ahorros, DOP..."
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCuentaBancaria)}
            className={inputClass}
          >
            <option value="ahorro">Ahorro</option>
            <option value="corriente">Corriente</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Moneda</span>
          <SelectorMoneda value={moneda} onChange={setMoneda} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Saldo actual</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={saldoActual}
            onChange={(e) => setSaldoActual(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Últimos 4 dígitos</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={ultimosCuatro}
            onChange={(e) => setUltimosCuatro(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="Opcional"
            className={inputClass}
          />
        </label>

        <div className="sm:col-span-2">
          <PersonalizacionCuentaHome
            color={colorHome}
            icono={iconoHome}
            onColorChange={setColorHome}
            onIconoChange={setIconoHome}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-gasto">{error}</p>}

      <button
        type="submit"
        className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Agregar cuenta
      </button>
    </form>
  );
}
