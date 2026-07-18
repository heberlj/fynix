"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { useAuth } from "@/context/AuthContext";
import { usePlanLimites } from "@/hooks/usePlanLimites";
import {
  MENSAJE_FINANCIAMIENTO_CUOTAS,
  MENSAJE_LIMITE_TARJETAS,
} from "@/lib/plan-limites";
import {
  almacenarNumeroTarjeta,
  detectarMarca,
  enmascararNumero,
  formatearExpiracion,
  MARCA_ETIQUETA,
  validarCvv,
  validarExpiracion,
  validarLuhn,
  validarNumeroCuotas,
} from "@/lib/tarjetas";
import { InputNumeroTarjetaSeguro } from "@/components/tarjetas/InputNumeroTarjetaSeguro";
import { TarjetaVisual } from "@/components/tarjetas/TarjetaVisual";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";
import { SelectorBanco } from "@/components/ui/SelectorBanco";
import { esBancoCertificado } from "@/lib/bancos";
import { PersonalizacionTarjetaHome } from "@/components/ui/PersonalizacionTarjetaHome";
import type { ColorHome, FinanciamientoCuotas } from "@/types/finanzas";
import {
  extensionCuotasPopularDesdeFinanciamiento,
  financiamientoPorDefecto,
  productoFinanciamientoActivo,
  validarFinanciamientoCuotas,
} from "@/lib/financiamiento-cuotas";
import { FormularioFinanciamientoCuotas } from "@/components/tarjetas/FormularioFinanciamientoCuotas";
import { colorHomePorIndice } from "@/lib/personalizacion-home";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function FormularioTarjeta({
  onExito,
  enModal = false,
}: { onExito?: () => void; enModal?: boolean } = {}) {
  const { agregarTarjeta, configuracion, tarjetas } = useFinanzas();
  const { sesion } = useAuth();
  const { puedeAgregarTarjeta, puedeFinanciamientoCuotas } = usePlanLimites();

  const [banco, setBanco] = useState("");
  const [nombreTarjeta, setNombreTarjeta] = useState("");
  const [titular, setTitular] = useState("");
  const [digitosTarjeta, setDigitosTarjeta] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState("");
  const [cvv, setCvv] = useState("");
  const [limite, setLimite] = useState("");
  const [deudaActual, setDeudaActual] = useState("");
  const [diaCorte, setDiaCorte] = useState("15");
  const [diaPago, setDiaPago] = useState("30");
  const [moneda, setMoneda] = useState(configuracion.moneda);
  const [financiamiento, setFinanciamiento] = useState<FinanciamientoCuotas>(() =>
    financiamientoPorDefecto(15, 30)
  );
  const [digitosCuotasPopular, setDigitosCuotasPopular] = useState("");
  const [colorHome, setColorHome] = useState<ColorHome>(
    colorHomePorIndice(tarjetas.length + 3)
  );
  const [error, setError] = useState("");

  const marca = useMemo(
    () => detectarMarca(digitosTarjeta),
    [digitosTarjeta]
  );

  const vistaPrevia = useMemo(
    () => ({
      banco: banco || "Banco",
      nombreTarjeta: nombreTarjeta || "Crédito",
      titular: titular || "NOMBRE APELLIDO",
      numeroEnmascarado: digitosTarjeta
        ? enmascararNumero(digitosTarjeta)
        : "•••• •••• •••• ••••",
      fechaExpiracion: fechaExpiracion || "MM/AA",
      cvv: cvv || "•••",
      marca,
      moneda,
    }),
    [banco, nombreTarjeta, titular, digitosTarjeta, fechaExpiracion, cvv, marca, moneda]
  );

  function handleExpiracionChange(valor: string) {
    setFechaExpiracion(formatearExpiracion(valor));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const limpio = digitosTarjeta;
    const limiteNum = parseFloat(limite);
    const deudaNum = parseFloat(deudaActual) || 0;

    if (!banco || !esBancoCertificado(banco)) {
      setError("Selecciona un banco de la lista");
      return;
    }
    if (!titular.trim()) {
      setError("El titular es obligatorio");
      return;
    }
    if (!validarLuhn(limpio)) {
      setError("Número de tarjeta inválido");
      return;
    }
    if (marca === "desconocida") {
      setError("Solo se aceptan tarjetas Visa o Mastercard");
      return;
    }
    if (!validarExpiracion(fechaExpiracion)) {
      setError("Fecha de expiración inválida o vencida");
      return;
    }
    if (!validarCvv(cvv, marca)) {
      setError("CVV inválido (3 dígitos)");
      return;
    }
    if (!limite || isNaN(limiteNum) || limiteNum <= 0) {
      setError("Ingresa un límite de crédito válido");
      return;
    }
    if (deudaNum < 0 || deudaNum > limiteNum) {
      setError("La deuda no puede ser negativa ni mayor al límite");
      return;
    }

    if (!puedeAgregarTarjeta(tarjetas.length)) {
      setError(MENSAJE_LIMITE_TARJETAS);
      return;
    }

    if (productoFinanciamientoActivo(financiamiento.producto)) {
      if (!puedeFinanciamientoCuotas) {
        setError(MENSAJE_FINANCIAMIENTO_CUOTAS);
        return;
      }
      const errorFin = validarFinanciamientoCuotas(financiamiento);
      if (errorFin) {
        setError(errorFin);
        return;
      }
      if (
        financiamiento.producto === "cuotas-popular" &&
        !validarNumeroCuotas(digitosCuotasPopular)
      ) {
        setError("Ingresa el número de Cuotas Popular (16 dígitos)");
        return;
      }
    }

    if (!sesion) {
      setError("Debes iniciar sesión para guardar la tarjeta de forma segura");
      return;
    }

    const numeroAlmacenado = await almacenarNumeroTarjeta(limpio, sesion.usuarioId);
    const numeroCP =
      financiamiento.producto === "cuotas-popular" && digitosCuotasPopular
        ? await almacenarNumeroTarjeta(digitosCuotasPopular, sesion.usuarioId)
        : null;

    const diaCorteNum = Math.min(31, Math.max(1, Number(diaCorte)));
    const diaPagoNum = Math.min(31, Math.max(1, Number(diaPago)));
    const financiamientoFinal: FinanciamientoCuotas = {
      ...financiamiento,
      diaCorte: financiamiento.diaCorte || diaCorteNum,
      diaPago: financiamiento.diaPago || diaPagoNum,
    };

    const tarjetaBase = {
      banco,
      nombreTarjeta: nombreTarjeta.trim() || "Crédito",
      titular: titular.trim().toUpperCase(),
      ...numeroAlmacenado,
      marca,
      fechaExpiracion,
      cvv: cvv.replace(/\D/g, ""),
      limite: limiteNum,
      deudaActual: deudaNum,
      diaCorte: diaCorteNum,
      diaPago: diaPagoNum,
      moneda,
      colorHome,
      financiamientoCuotas: financiamientoFinal,
    };

    agregarTarjeta({
      ...tarjetaBase,
      extensionCuotasPopular: extensionCuotasPopularDesdeFinanciamiento(
        { ...tarjetaBase, id: "" },
        financiamientoFinal,
        numeroCP ?? undefined
      ),
    });

    setBanco("");
    setNombreTarjeta("");
    setTitular("");
    setDigitosTarjeta("");
    setFechaExpiracion("");
    setCvv("");
    setLimite("");
    setDeudaActual("");
    onExito?.();
  }

  return (
    <div className="space-y-6">
      <TarjetaVisual tarjeta={vistaPrevia} />

      {marca !== "desconocida" && digitosTarjeta && (
        <p className="text-center text-sm text-muted">
          Detectada:{" "}
          <span className="font-semibold text-foreground">
            {MARCA_ETIQUETA[marca]}
          </span>
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className={
          enModal
            ? ""
            : "rounded-xl border border-border bg-surface p-6 shadow-sm"
        }
      >
        {!enModal && (
          <h2 className="text-base font-semibold text-foreground">
            Registrar tarjeta
          </h2>
        )}
        <p className={`text-xs text-muted ${enModal ? "" : "mt-1"}`}>
          Los 4 primeros y últimos dígitos quedan visibles para identificar la
          tarjeta; el bloque central se cifra en tu dispositivo
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SelectorBanco value={banco} onChange={setBanco} />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Nombre de la tarjeta
            </span>
            <input
              type="text"
              value={nombreTarjeta}
              onChange={(e) => setNombreTarjeta(e.target.value)}
              placeholder="Ej: Platinum, Clásica..."
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">
              Titular
            </span>
            <input
              type="text"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              placeholder="Como aparece en la tarjeta"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">
              Número de tarjeta
            </span>
            <InputNumeroTarjetaSeguro
              digitos={digitosTarjeta}
              onDigitosChange={setDigitosTarjeta}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Expiración
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={fechaExpiracion}
              onChange={(e) => handleExpiracionChange(e.target.value)}
              placeholder="MM/AA"
              maxLength={5}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">CVV</span>
            <input
              type="password"
              inputMode="numeric"
              value={cvv}
              onChange={(e) =>
                setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="•••"
              maxLength={4}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Moneda</span>
            <SelectorMoneda value={moneda} onChange={setMoneda} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Límite de crédito
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Deuda actual
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={deudaActual}
              onChange={(e) => setDeudaActual(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Día de corte
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={diaCorte}
              onChange={(e) => setDiaCorte(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Día de pago
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={diaPago}
              onChange={(e) => setDiaPago(e.target.value)}
              className={inputClass}
            />
          </label>

          <FormularioFinanciamientoCuotas
            value={financiamiento}
            onChange={setFinanciamiento}
            moneda={moneda}
            diaCorteTarjeta={Number(diaCorte) || 15}
            diaPagoTarjeta={Number(diaPago) || 30}
            digitosCuotasPopular={digitosCuotasPopular}
            onDigitosCuotasPopularChange={setDigitosCuotasPopular}
            permitirFinanciamiento={puedeFinanciamientoCuotas}
          />
        </div>

        <PersonalizacionTarjetaHome color={colorHome} onChange={setColorHome} />

        {error && <p className="mt-3 text-sm text-gasto">{error}</p>}

        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Agregar tarjeta
        </button>
      </form>
    </div>
  );
}
