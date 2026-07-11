export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export interface NavGrupo {
  titulo: string;
  items: NavItem[];
}

export const NAV_DASHBOARD: NavItem = {
  href: "/",
  label: "Dashboard",
  icon: "◈",
};

export const NAV_GRUPOS: NavGrupo[] = [
  {
    titulo: "Movimientos",
    items: [
      { href: "/transacciones", label: "Transacciones", icon: "⇄" },
      { href: "/gastos-fijos", label: "Gastos fijos", icon: "⊡" },
      { href: "/quincenas", label: "Quincenas", icon: "◫" },
    ],
  },
  {
    titulo: "Patrimonio",
    items: [
      { href: "/cuentas", label: "Cuentas", icon: "◉" },
      { href: "/tarjetas", label: "Tarjetas", icon: "▣" },
      { href: "/prestamos", label: "Préstamos", icon: "◎" },
      { href: "/presupuesto", label: "Presupuesto", icon: "◐" },
    ],
  },
];

export const NAV_CONFIGURACION: NavItem = {
  href: "/configuracion",
  label: "Configuración",
  icon: "⚙",
};
