export type PlanSuscripcion = "gratis" | "pro";

export type EstadoSuscripcion = "activo" | "cancelado" | "vencido" | "pendiente";

export interface SuscripcionUsuario {
  usuarioId: string;
  plan: PlanSuscripcion;
  estado: EstadoSuscripcion;
  paypalSubscriptionId?: string;
  paypalPayerId?: string;
  periodoFin?: string;
}

export interface SuscripcionFila {
  usuario_id: string;
  plan: PlanSuscripcion;
  estado: EstadoSuscripcion;
  paypal_subscription_id: string | null;
  paypal_payer_id: string | null;
  periodo_fin: string | null;
  actualizado_en: string;
}
