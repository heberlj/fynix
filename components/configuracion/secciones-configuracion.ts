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
}

export const SECCIONES_CONFIGURACION: SeccionConfiguracion[] = [
  {
    id: "perfil",
    label: "Perfil",
    descripcion: "Cuenta, salario y moneda",
  },
  {
    id: "apariencia",
    label: "Apariencia",
    descripcion: "Tema claro u oscuro",
  },
  {
    id: "diezmos",
    label: "Diezmos",
    descripcion: "Aporte según ingresos",
  },
  {
    id: "suscripcion",
    label: "Suscripción",
    descripcion: "Plan y beneficios",
  },
  {
    id: "acerca",
    label: "Acerca de Fynix",
    descripcion: "Versión y respaldo",
  },
];
