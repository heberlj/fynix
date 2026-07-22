import { CREDITOS_IA_GRATIS, CREDITOS_IA_PRO } from "@/lib/ia-fynix-constantes";
import { MAX_CUENTAS_GRATIS, MAX_TARJETAS_GRATIS } from "@/lib/plan-limites";
import { PRECIO_PRO_MENSUAL_USD } from "@/lib/suscripcion";

export { PRECIO_PRO_MENSUAL_USD };

export const BENEFICIOS_PLAN_GRATIS = [
  `Hasta ${MAX_CUENTAS_GRATIS} cuentas y ${MAX_TARJETAS_GRATIS} tarjeta`,
  "Transacciones, gastos fijos, préstamos y metas",
  "Quincenas personalizadas y sincronización en la nube",
  "Recordatorios de pagos en Home",
  "Respaldo manual en JSON",
  `${CREDITOS_IA_GRATIS} mensajes de IA por semana`,
  "Sin anuncios",
] as const;

export const BENEFICIOS_PLAN_PRO = [
  "Cuentas y tarjetas ilimitadas",
  "Cuotas Popular, BHD y Credimás",
  "Exportación CSV y reportes mensuales",
  "Importación de movimientos desde el banco (CSV)",
  `${CREDITOS_IA_PRO} mensajes de IA por semana`,
  "Soporte prioritario",
  "Sin anuncios",
] as const;
