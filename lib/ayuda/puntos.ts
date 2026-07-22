export interface PuntoAyuda {
  id: string;
  titulo: string;
  descripcion: string;
}

export const AYUDA_POR_PAGINA: Record<string, PuntoAyuda[]> = {
  home: [
    {
      id: "patrimonio",
      titulo: "Cuentas, tarjetas y efectivo",
      descripcion:
        "Saldo disponible de cada fuente. Toca una para filtrar los gráficos por sus transacciones del periodo.",
    },
    {
      id: "grafico",
      titulo: "Resumen financiero",
      descripcion:
        "Ingresos, gastos y movimientos por día, semana, mes o año. Debajo verás en qué categorías gastaste más.",
    },
    {
      id: "proximos-pagos",
      titulo: "Próximos pagos",
      descripcion:
        "Compromisos ordenados por vencimiento: tarjetas, préstamos, cuotas Popular, gastos fijos y aportes. Los urgentes se resaltan según tus recordatorios.",
    },
  ],
  dashboard: [
    {
      id: "resumen",
      titulo: "Resumen y gráfico",
      descripcion:
        "Gráfico circular de la quincena actual (gastos, compromisos y disponible) junto a las tarjetas clave: disponible, ingresos, gastos, compromisos y patrimonio líquido.",
    },
    {
      id: "quincenas",
      titulo: "Quincenas del mes",
      descripcion:
        "Compara Q1 y Q2: cuánto entró, cuánto salió y cuánto te queda disponible en cada quincena.",
    },
    {
      id: "proximos-pagos",
      titulo: "Próximos pagos",
      descripcion:
        "Compromisos recurrentes ordenados por fecha: tarjetas, préstamos, cuotas Popular y gastos fijos.",
    },
    {
      id: "graficos",
      titulo: "Gráficos",
      descripcion:
        "Gastos por categoría del mes y evolución de los últimos meses para detectar tendencias.",
    },
  ],
  transacciones: [
    {
      id: "acciones",
      titulo: "Acciones",
      descripcion:
        "Crea una nueva transacción o administra las categorías de ingresos y gastos.",
    },
    {
      id: "filtros",
      titulo: "Filtros",
      descripcion:
        "Filtra el historial por mes, quincena, tipo (ingreso, gasto, movimiento) o categoría.",
    },
    {
      id: "totales",
      titulo: "Totales del periodo",
      descripcion:
        "Suma de ingresos, gastos, movimientos y balance neto según los filtros activos.",
    },
    {
      id: "historial",
      titulo: "Historial",
      descripcion:
        "Lista de movimientos. Puedes editar o eliminar cada uno. Los pagos de cuotas Popular no se editan aquí.",
    },
  ],
  cuentas: [
    {
      id: "acciones",
      titulo: "Nueva cuenta",
      descripcion: "Registra cuentas de ahorro o corriente. Personaliza color e icono para cómo se verán en Home.",
    },
    {
      id: "lista",
      titulo: "Tus cuentas",
      descripcion:
        "Cada cuenta muestra banco y saldo. Al editar puedes cambiar el color y el icono que aparecen en Home.",
    },
    {
      id: "efectivo",
      titulo: "Efectivo",
      descripcion:
        "Dinero en mano no depositado en banco. Se suma a tu liquidez en quincenas.",
    },
  ],
  tarjetas: [
    {
      id: "acciones",
      titulo: "Nueva tarjeta",
      descripcion:
        "Registra límite, deuda, fechas de corte y pago. Opcional: extensión Cuotas Popular.",
    },
    {
      id: "lista",
      titulo: "Tus tarjetas",
      descripcion:
        "Barra de uso del límite, deuda actual y próximo pago. Gestiona planes Cuotas Popular aquí.",
    },
  ],
  prestamos: [
    {
      id: "acciones",
      titulo: "Nuevo préstamo",
      descripcion:
        "Registra monto, cuotas, tasa de interés y día de pago para seguir el saldo pendiente.",
    },
    {
      id: "lista",
      titulo: "Tus préstamos",
      descripcion:
        "Progreso de cuotas pagadas, saldo e intereses. Usa «Registrar cuota pagada» para anotar cada pago.",
    },
  ],
  "gastos-fijos": [
    {
      id: "acciones",
      titulo: "Gastos fijos",
      descripcion:
        "Agrega pagos mensuales (alquiler, servicios, etc.) y clasifícalos como esenciales o flexibles.",
    },
    {
      id: "resumen",
      titulo: "Totales por quincena",
      descripcion:
        "Suma de gastos fijos en Q1 y Q2. Los préstamos aparecen solo como referencia en esta vista.",
    },
    {
      id: "lista",
      titulo: "Vista por quincena",
      descripcion:
        "Gastos agrupados por quincena. Marca pagos con «Registrar pago» cuando los cubras.",
    },
  ],
  quincenas: [
    {
      id: "selector",
      titulo: "Periodo",
      descripcion: "Navega entre meses y quincenas para revisar el detalle de cada periodo.",
    },
    {
      id: "resumen",
      titulo: "Resumen",
      descripcion:
        "Ingresos, gastos variables, compromisos (tarjetas, préstamos, fijos) y disponible proyectado.",
    },
    {
      id: "detalle",
      titulo: "Detalle",
      descripcion:
        "Desglose de compromisos y gastos por categoría en la quincena seleccionada.",
    },
  ],
  "metas-ahorro": [
    {
      id: "acciones",
      titulo: "Nueva meta",
      descripcion:
        "Crea metas con monto objetivo, fecha límite opcional y registra aportes para ver tu progreso.",
    },
    {
      id: "lista",
      titulo: "Tus metas",
      descripcion:
        "Cada meta muestra cuánto llevas ahorrado, cuánto falta y si ya la completaste.",
    },
  ],
  configuracion: [
    {
      id: "quincenas",
      titulo: "Días de pago",
      descripcion:
        "Define los dos días del mes en que recibes ingreso. Así se calculan Q1 y Q2 en toda la app.",
    },
    {
      id: "preferencias",
      titulo: "Moneda y tema",
      descripcion:
        "Moneda principal para totales y resúmenes. Tema claro, oscuro o según el sistema.",
    },
    {
      id: "respaldo",
      titulo: "Respaldo",
      descripcion:
        "Exporta o importa tus datos en JSON como copia de seguridad local adicional.",
    },
  ],
};
