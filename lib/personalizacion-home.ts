import type {
  ColorHome,
  CuentaBancaria,
  IconoHome,
  IconoHomeCuenta,
  TarjetaCredito,
} from "@/types/finanzas";

export interface EstiloColorHome {
  fondo: string;
  iconoFondo: string;
  icono: string;
  borde: string;
}

export const COLORES_HOME: ColorHome[] = [
  "azul",
  "verde",
  "morado",
  "naranja",
  "rosa",
  "teal",
  "pizarra",
  "rojo",
  "indigo",
  "amarillo",
];

export const ETIQUETAS_COLOR_HOME: Record<ColorHome, string> = {
  azul: "Azul",
  verde: "Verde",
  morado: "Morado",
  naranja: "Naranja",
  rosa: "Rosa",
  teal: "Teal",
  pizarra: "Gris",
  rojo: "Rojo",
  indigo: "Índigo",
  amarillo: "Amarillo",
};

export const ESTILOS_COLOR_HOME: Record<ColorHome, EstiloColorHome> = {
  azul: {
    fondo: "bg-blue-500/15",
    iconoFondo: "bg-blue-500/25",
    icono: "text-blue-600 dark:text-blue-400",
    borde: "border-blue-500/25",
  },
  verde: {
    fondo: "bg-emerald-500/15",
    iconoFondo: "bg-emerald-500/25",
    icono: "text-emerald-600 dark:text-emerald-400",
    borde: "border-emerald-500/25",
  },
  morado: {
    fondo: "bg-purple-500/15",
    iconoFondo: "bg-purple-500/25",
    icono: "text-purple-600 dark:text-purple-400",
    borde: "border-purple-500/25",
  },
  naranja: {
    fondo: "bg-orange-500/15",
    iconoFondo: "bg-orange-500/25",
    icono: "text-orange-600 dark:text-orange-400",
    borde: "border-orange-500/25",
  },
  rosa: {
    fondo: "bg-pink-500/15",
    iconoFondo: "bg-pink-500/25",
    icono: "text-pink-600 dark:text-pink-400",
    borde: "border-pink-500/25",
  },
  teal: {
    fondo: "bg-teal-500/15",
    iconoFondo: "bg-teal-500/25",
    icono: "text-teal-600 dark:text-teal-400",
    borde: "border-teal-500/25",
  },
  pizarra: {
    fondo: "bg-slate-500/15",
    iconoFondo: "bg-slate-500/25",
    icono: "text-slate-600 dark:text-slate-400",
    borde: "border-slate-500/25",
  },
  rojo: {
    fondo: "bg-red-500/15",
    iconoFondo: "bg-red-500/25",
    icono: "text-red-600 dark:text-red-400",
    borde: "border-red-500/25",
  },
  indigo: {
    fondo: "bg-indigo-500/15",
    iconoFondo: "bg-indigo-500/25",
    icono: "text-indigo-600 dark:text-indigo-400",
    borde: "border-indigo-500/25",
  },
  amarillo: {
    fondo: "bg-amber-500/15",
    iconoFondo: "bg-amber-500/25",
    icono: "text-amber-600 dark:text-amber-400",
    borde: "border-amber-500/25",
  },
};

export const ICONOS_CUENTA_HOME: IconoHomeCuenta[] = [
  "cuenta",
  "banco",
  "ahorro",
  "monedas",
  "cartera",
  "estrella",
];

export const ETIQUETAS_ICONO_HOME: Record<IconoHome, string> = {
  cuenta: "Cuenta",
  banco: "Banco",
  ahorro: "Ahorro",
  monedas: "Monedas",
  cartera: "Cartera",
  estrella: "Estrella",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo",
};

export const COLOR_HOME_CUENTA_DEFAULT: ColorHome = "azul";
export const ICONO_HOME_CUENTA_DEFAULT: IconoHomeCuenta = "cuenta";
export const COLOR_HOME_TARJETA_DEFAULT: ColorHome = "indigo";
export const COLOR_HOME_EFECTIVO: ColorHome = "verde";

export function esColorHome(valor: unknown): valor is ColorHome {
  return typeof valor === "string" && COLORES_HOME.includes(valor as ColorHome);
}

export function esIconoHomeCuenta(valor: unknown): valor is IconoHomeCuenta {
  return typeof valor === "string" && ICONOS_CUENTA_HOME.includes(valor as IconoHomeCuenta);
}

export function colorHomePorIndice(indice: number): ColorHome {
  return COLORES_HOME[indice % COLORES_HOME.length];
}

export function colorHomeCuenta(cuenta: CuentaBancaria, indice = 0): ColorHome {
  return cuenta.colorHome ?? colorHomePorIndice(indice);
}

export function iconoHomeCuenta(cuenta: CuentaBancaria): IconoHomeCuenta {
  return cuenta.iconoHome ?? ICONO_HOME_CUENTA_DEFAULT;
}

export function colorHomeTarjeta(tarjeta: TarjetaCredito, indice = 0): ColorHome {
  return tarjeta.colorHome ?? colorHomePorIndice(indice + 3);
}

export function iconoHomeTarjeta(): IconoHome {
  return "tarjeta";
}
