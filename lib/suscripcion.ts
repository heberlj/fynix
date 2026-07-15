import type {
  PlanSuscripcion,
  SuscripcionFila,
  SuscripcionUsuario,
} from "@/types/suscripcion";
import {
  CREDITOS_IA_GRATIS,
  CREDITOS_IA_PRO,
} from "@/lib/ia-fynix-constantes";

export const SUSCRIPCION_GRATIS: SuscripcionUsuario = {
  usuarioId: "",
  plan: "gratis",
  estado: "activo",
};

/** Precio mensual de Fynix Pro (USD). */
export const PRECIO_PRO_MENSUAL_USD = 2.99;

export function filaASuscripcion(fila: SuscripcionFila): SuscripcionUsuario {
  return {
    usuarioId: fila.usuario_id,
    plan: fila.plan,
    estado: fila.estado,
    paypalSubscriptionId: fila.paypal_subscription_id ?? undefined,
    paypalPayerId: fila.paypal_payer_id ?? undefined,
    periodoFin: fila.periodo_fin ?? undefined,
  };
}

export function tienePlanPro(suscripcion: SuscripcionUsuario): boolean {
  return suscripcion.plan === "pro" && suscripcion.estado === "activo";
}

export function limiteCreditosIa(
  suscripcion: Pick<SuscripcionUsuario, "plan" | "estado">
): number {
  return tienePlanPro(suscripcion as SuscripcionUsuario)
    ? CREDITOS_IA_PRO
    : CREDITOS_IA_GRATIS;
}

export function etiquetaPlan(plan: PlanSuscripcion): string {
  return plan === "pro" ? "Fynix Pro" : "Gratis";
}

export function etiquetaEstadoSuscripcion(
  plan: PlanSuscripcion,
  estado: SuscripcionUsuario["estado"]
): string {
  if (plan === "gratis") return "Activo";
  if (estado === "activo") return "Activo";
  if (estado === "cancelado") return "Cancelado";
  if (estado === "vencido") return "Vencido";
  return "Pendiente";
}
