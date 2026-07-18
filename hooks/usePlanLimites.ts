"use client";

import { useSuscripcion } from "@/hooks/useSuscripcion";
import {
  MAX_CUENTAS_GRATIS,
  MAX_TARJETAS_GRATIS,
  puedeAgregarCuenta,
  puedeAgregarTarjeta,
  puedeExportarCsv,
  puedeUsarFinanciamientoCuotas,
} from "@/lib/plan-limites";
import { tienePlanPro } from "@/lib/suscripcion";

export function usePlanLimites() {
  const { suscripcion, cargado } = useSuscripcion();
  const esPro = tienePlanPro(suscripcion);

  return {
    esPro,
    cargado,
    maxCuentasGratis: MAX_CUENTAS_GRATIS,
    maxTarjetasGratis: MAX_TARJETAS_GRATIS,
    puedeAgregarCuenta: (cantidadActual: number) =>
      puedeAgregarCuenta(esPro, cantidadActual),
    puedeAgregarTarjeta: (cantidadActual: number) =>
      puedeAgregarTarjeta(esPro, cantidadActual),
    puedeFinanciamientoCuotas: puedeUsarFinanciamientoCuotas(esPro),
    puedeExportarCsv: puedeExportarCsv(esPro),
  };
}
