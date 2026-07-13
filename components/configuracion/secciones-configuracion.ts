export type SeccionConfiguracionId =
  | "perfil"
  | "apariencia"
  | "diezmos"
  | "suscripcion"
  | "acerca";

export interface SeccionConfiguracion {
  id: SeccionConfiguracionId;
  label: string;
  descripcion: string;
  icono: string;
}

export const SECCIONES_CONFIGURACION: SeccionConfiguracion[] = [
  {
    id: "perfil",
    label: "Perfil",
    descripcion: "Cuenta, salario y moneda",
    icono: "👤",
  },
  {
    id: "apariencia",
    label: "Apariencia",
    descripcion: "Tema claro u oscuro",
    icono: "🎨",
  },
  {
    id: "diezmos",
    label: "Diezmos",
    descripcion: "Aporte según ingresos",
    icono: "🙏",
  },
  {
    id: "suscripcion",
    label: "Suscripción",
    descripcion: "Plan y beneficios",
    icono: "✨",
  },
  {
    id: "acerca",
    label: "Acerca de Fynix",
    descripcion: "Versión y respaldo",
    icono: "ℹ️",
  },
];
