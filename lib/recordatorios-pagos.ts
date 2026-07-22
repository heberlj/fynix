import type { ConfiguracionUsuario, RecordatoriosPagosConfig } from "@/types/finanzas";
import { RECORDATORIOS_PAGOS_DEFAULT } from "@/types/finanzas";

const DIAS_ANTES_VALIDOS = [1, 2, 3, 5, 7] as const;

export function normalizarRecordatoriosPagos(
  raw: Partial<RecordatoriosPagosConfig> | undefined
): RecordatoriosPagosConfig {
  const diasAntes = raw?.diasAntes ?? RECORDATORIOS_PAGOS_DEFAULT.diasAntes;
  const diasNormalizado = DIAS_ANTES_VALIDOS.includes(
    diasAntes as (typeof DIAS_ANTES_VALIDOS)[number]
  )
    ? diasAntes
    : RECORDATORIOS_PAGOS_DEFAULT.diasAntes;

  return {
    activo: raw?.activo ?? RECORDATORIOS_PAGOS_DEFAULT.activo,
    diasAntes: diasNormalizado,
    notificacionesNavegador:
      raw?.notificacionesNavegador ??
      RECORDATORIOS_PAGOS_DEFAULT.notificacionesNavegador,
  };
}

export function obtenerRecordatoriosPagos(
  configuracion: ConfiguracionUsuario
): RecordatoriosPagosConfig {
  return normalizarRecordatoriosPagos(configuracion.recordatoriosPagos);
}

export const OPCIONES_DIAS_RECORDATORIO = DIAS_ANTES_VALIDOS.map((dias) => ({
  valor: dias,
  etiqueta: dias === 1 ? "1 día antes" : `${dias} días antes`,
}));

const PREFIJO_STORAGE = "fynix_recordatorio_";

export function claveRecordatorioNotificado(id: string, fecha: string): string {
  return `${PREFIJO_STORAGE}${id}_${fecha}`;
}

export function recordatorioYaNotificadoHoy(
  id: string,
  fecha: string
): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(claveRecordatorioNotificado(id, fecha)) === "1";
}

export function marcarRecordatorioNotificado(id: string, fecha: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(claveRecordatorioNotificado(id, fecha), "1");
}

export async function solicitarPermisoNotificaciones(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function notificacionesNavegadorDisponibles(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}
