/** Tiempo sin actividad antes de mostrar el aviso (5 min). */
export const SESION_INACTIVIDAD_MS = 5 * 60 * 1000;

/** Cuenta atrás del aviso antes de cerrar sesión (60 s). */
export const SESION_AVISO_MS = 60 * 1000;

/** Mínimo entre reinicios del temporizador por actividad (evita spam). */
export const SESION_REINICIO_MIN_MS = 1_000;
