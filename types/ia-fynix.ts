import type { PlanSuscripcion } from "@/types/suscripcion";
import type { ContextoIaFynix } from "@/lib/ia-fynix-contexto";

export interface MensajeChatIa {
  rol: "usuario" | "asistente";
  contenido: string;
}

export interface CreditosIaFynix {
  usado: number;
  limite: number;
  restante: number;
  /** Inicio del período semanal actual (lunes 00:00 UTC, ISO). */
  periodoInicio: string;
  /** Próximo lunes en que se renuevan los créditos (ISO). */
  renuevaEn: string;
  plan: PlanSuscripcion;
}

/** @deprecated Usar CreditosIaFynix */
export type CuotaIaFynix = CreditosIaFynix;

export interface ChatIaRequest {
  mensaje: string;
  contexto: ContextoIaFynix;
  historial?: MensajeChatIa[];
}

export interface ChatIaResponse {
  respuesta: string;
  creditos: CreditosIaFynix;
  origen: "agente" | "local";
}
