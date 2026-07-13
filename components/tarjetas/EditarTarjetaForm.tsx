"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { useAuth } from "@/context/AuthContext";
import type { ColorHome, FinanciamientoCuotas, TarjetaCredito } from "@/types/finanzas";
import {
  extensionCuotasPopularDesdeFinanciamiento,
  financiamientoPorDefecto,
  obtenerFinanciamientoTarjeta,
  productoFinanciamientoActivo,
  validarFinanciamientoCuotas,
} from "@/lib/financiamiento-cuotas";
import { FormularioFinanciamientoCuotas } from "@/components/tarjetas/FormularioFinanciamientoCuotas";
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
import { bancoPermitido } from "@/lib/bancos";
import { PersonalizacionTarjetaHome } from "@/components/ui/PersonalizacionTarjetaHome";
import { colorHomeTarjeta } from "@/lib/personalizacion-home";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface EditarTarjetaFormProps {
  tarjeta: TarjetaCredito;
  onCancelar: () => void;
}

export function EditarTarjetaForm({ tarjeta, onCancelar }: EditarTarjetaFormProps) {
  const { actualizarTarjeta } = useFinanzas();
  const { sesion } = useAuth();

  const [banco, setBanco] = useState(tarjeta.banco);
  const [nombreTarjeta, setNombreTarjeta] = useState(tarjeta.nombreTarjeta);
  const [titular, setTitular] = useState(tarjeta.titular);
  const [digitosTarjeta, setDigitosTarjeta] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState(tarjeta.fechaExpiracion);
  const [cvv, setCvv] = useState("");
  const [limite, setLimite] = useState(String(tarjeta.limite));
  const [deudaActual, setDeudaActual] = useState(String(tarjeta.deudaActual));
  const [diaCorte, setDiaCorte] = useState(String(tarjeta.diaCorte));
  const [diaPago, setDiaPago] = useState(String(tarjeta.diaPago));
  const [moneda, setMoneda] = useState(tarjeta.moneda);
  const [financiamiento, setFinanciamiento] = useState<FinanciamientoCuotas>(() =>
    obtenerFinanciamientoTarjeta(tarjeta)
  );
  const [digitosCuotasPopular, setDigitosCuotasPopular] = useState("");
  const [error, setError] = useState("");
  const [colorHome, setColorHome] = useState<ColorHome>(colorHomeTarjeta(tarjeta));

  const marcaDetectada = useMemo(
    () => (digitosTarjeta ? detectarMarca(digitosTarjeta) : tarjeta.marca),
    [digitosTarjeta, tarjeta.marca]
  );

  const vistaPrevia = useMemo(
    () => ({
      banco: banco || "Banco",
      nombreTarjeta: nombreTarjeta || "Crédito",
      titular: titular || "NOMBRE APELLIDO",
      numeroEnmascarado: digitosTarjeta
        ? enmascararNumero(digitosTarjeta)
        : tarjeta.numeroEnmascarado,
      fechaExpiracion: fechaExpiracion || "MM/AA",
      cvv: cvv || tarjeta.cvv || "•••",
      marca: marcaDetectada,
      moneda,
    }),
    [
      banco,
      nombreTarjeta,
      titular,
      digitosTarjeta,
      tarjeta.numeroEnmascarado,
      tarjeta.cvv,
      fechaExpiracion,
      cvv,
      marcaDetectada,
      moneda,
    ]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const limpio = digitosTarjeta;
    const limiteNum = parseFloat(limite);
    const deudaNum = parseFloat(deudaActual) || 0;
    const marca = digitosTarjeta ? marcaDetectada : tarjeta.marca;
    const cvvFinal = cvv ? cvv.replace(/\D/g, "") : tarjeta.cvv;

    if (!banco || !bancoPermitido(banco, tarjeta.banco)) {
      setError("Selecciona un banco de la lista");
      return;
    }
    if (!titular.trim()) {
      setError("El titular es obligatorio");
      return;
    }
    if (digitosTarjeta) {
      if (!validarLuhn(limpio)) {
        setError("Número de tarjeta inválido");
        return;
      }
      if (marca === "desconocida") {
        setError("Solo se aceptan tarjetas Visa o Mastercard");
        return;
      }
    }
    if (!validarExpiracion(fechaExpiracion)) {
      setError("Fecha de expiración inválida o vencida");
      return;
    }
    if (cvv && !validarCvv(cvv, marca)) {
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

    if (productoFinanciamientoActivo(financiamiento.producto)) {
      const errorFin = validarFinanciamientoCuotas(financiamiento);
      if (errorFin) {
        setError(errorFin);
        return;
      }
      if (
        financiamiento.producto === "cuotas-popular" &&
        digitosCuotasPopular &&
        !validarNumeroCuotas(digitosCuotasPopular)
      ) {
        setError("El número de Cuotas Popular debe tener 16 dígitos");
        return;
      }
      if (
        financiamiento.producto === "cuotas-popular" &&
        !digitosCuotasPopular &&
        !tarjeta.extensionCuotasPopular?.numeroEnmascarado
      ) {
        setError("Ingresa el número de Cuotas Popular (16 dígitos)");
        return;
      }
    }

    if (!sesion) {
      setError("Debes iniciar sesión para guardar la tarjeta de forma segura");
      return;
    }

    const numeroTarjetaAlmacenado = digitosTarjeta
      ? await almacenarNumeroTarjeta(limpio, sesion.usuarioId)
      : null;

    const numeroCP = digitosCuotasPopular
      ? await almacenarNumeroTarjeta(digitosCuotasPopular, sesion.usuarioId)
      : productoFinanciamientoActivo(financiamiento.producto) &&
          financiamiento.producto === "cuotas-popular" &&
          tarjeta.extensionCuotasPopular
        ? {
            numeroEnmascarado: tarjeta.extensionCuotasPopular.numeroEnmascarado,
            primerosCuatro: tarjeta.extensionCuotasPopular.primerosCuatro,
            ultimosCuatro: tarjeta.extensionCuotasPopular.ultimosCuatro,
            numeroCifrado: tarjeta.extensionCuotasPopular.numeroCifrado,
          }
        : null;

    const diaCorteNum = Math.min(31, Math.max(1, Number(diaCorte)));
    const diaPagoNum = Math.min(31, Math.max(1, Number(diaPago)));
    const financiamientoFinal: FinanciamientoCuotas = {
      ...financiamiento,
      gastoFijoId:
        financiamiento.gastoFijoId ??
        tarjeta.financiamientoCuotas?.gastoFijoId,
      diaCorte: financiamiento.diaCorte || diaCorteNum,
      diaPago: financiamiento.diaPago || diaPagoNum,
    };

    const tarjetaActualizada: TarjetaCredito = {
      ...tarjeta,
      banco,
      nombreTarjeta: nombreTarjeta.trim() || "Crédito",
      titular: titular.trim().toUpperCase(),
      ...(numeroTarjetaAlmacenado
        ? {
            ...numeroTarjetaAlmacenado,
            marca,
          }
        : {}),
      fechaExpiracion,
      cvv: cvvFinal,
      limite: limiteNum,
      deudaActual: deudaNum,
      diaCorte: diaCorteNum,
      diaPago: diaPagoNum,
      moneda,
      colorHome,
      financiamientoCuotas: financiamientoFinal,
      extensionCuotasPopular: extensionCuotasPopularDesdeFinanciamiento(
        tarjeta,
        financiamientoFinal,
        numeroCP ?? undefined
      ),
    };

    actualizarTarjeta(tarjeta.id, tarjetaActualizada);

    onCancelar();
  }

  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <div className="flex justify-center xl:justify-start">
          <TarjetaVisual tarjeta={vistaPrevia} compacta />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Editar tarjeta</h4>
            {marcaDetectada !== "desconocida" && (
              <p className="mt-0.5 text-xs text-muted">
                {digitosTarjeta ? "Detectada: " : "Marca: "}
                <span className="font-medium text-foreground">
                  {MARCA_ETIQUETA[marcaDetectada]}
                </span>
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectorBanco value={banco} onChange={setBanco} />

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Nombre de la tarjeta
              </span>
              <input
                type="text"
                value={nombreTarjeta}
                onChange={(e) => setNombreTarjeta(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">Titular</span>
              <input
                type="text"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
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
              <span className="text-xs text-muted">
                Guardado: {tarjeta.numeroEnmascarado}. Escribe un número nuevo
                solo si quieres cambiarlo.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Expiración</span>
              <input
                type="text"
                inputMode="numeric"
                value={fechaExpiracion}
                onChange={(e) => setFechaExpiracion(formatearExpiracion(e.target.value))}
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
                placeholder="Vacío = sin cambios"
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
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Deuda actual</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={deudaActual}
                onChange={(e) => setDeudaActual(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Día de corte</span>
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
              <span className="text-sm font-medium text-foreground">Día de pago</span>
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
              diaCorteTarjeta={Number(diaCorte) || tarjeta.diaCorte}
              diaPagoTarjeta={Number(diaPago) || tarjeta.diaPago}
              digitosCuotasPopular={digitosCuotasPopular}
              onDigitosCuotasPopularChange={setDigitosCuotasPopular}
              numeroCuotasPopularGuardado={
                tarjeta.extensionCuotasPopular?.numeroEnmascarado
              }
            />
          </div>

          <PersonalizacionTarjetaHome color={colorHome} onChange={setColorHome} />

          {error && <p className="text-sm text-gasto">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Guardar cambios
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
