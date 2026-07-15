import type { NavIconName } from "@/components/ui/NavIcon";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconName;
}

export interface NavGrupo {
  titulo: string;
  items: NavItem[];
}

export const NAV_HOME: NavItem = {
  href: "/",
  label: "Home",
  icon: "home",
};

/** @deprecated Usar NAV_HOME */
export const NAV_DASHBOARD = NAV_HOME;

export const NAV_GRUPOS: NavGrupo[] = [
  {
    titulo: "Movimientos",
    items: [
      { href: "/transacciones", label: "Transacciones", icon: "transacciones" },
      { href: "/gastos-fijos", label: "Gastos fijos", icon: "gastos-fijos" },
      { href: "/quincenas", label: "Quincenas", icon: "quincenas" },
    ],
  },
  {
    titulo: "Patrimonio",
    items: [
      { href: "/cuentas", label: "Cuentas", icon: "cuentas" },
      { href: "/tarjetas", label: "Tarjetas", icon: "tarjetas" },
      { href: "/prestamos", label: "Préstamos", icon: "prestamos" },
      { href: "/metas-ahorro", label: "Metas de ahorro", icon: "metas-ahorro" },
    ],
  },
  {
    titulo: "IA de Fynix",
    items: [
      { href: "/ia-fynix", label: "Asistente", icon: "ia-fynix" },
    ],
  },
];

export const NAV_CONFIGURACION: NavItem = {
  href: "/configuracion",
  label: "Configuración",
  icon: "configuracion",
};

const TODAS_LAS_RUTAS: NavItem[] = [
  NAV_HOME,
  ...NAV_GRUPOS.flatMap((g) => g.items),
  NAV_CONFIGURACION,
];

export function tituloDeRuta(pathname: string): string {
  const ruta = TODAS_LAS_RUTAS.find((item) => item.href === pathname);
  return ruta?.label ?? "Fynix";
}
