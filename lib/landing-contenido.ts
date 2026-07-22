import { CREDITOS_IA_GRATIS, CREDITOS_IA_PRO } from "@/lib/ia-fynix-constantes";
import { MAX_CUENTAS_GRATIS, MAX_TARJETAS_GRATIS } from "@/lib/plan-limites";
import { PRECIO_PRO_MENSUAL_USD } from "@/lib/suscripcion";

export const FAQ_LANDING = [
  {
    pregunta: "¿Fynix es gratis?",
    respuesta: `Sí. Puedes crear una cuenta sin tarjeta y usar el plan Gratis con hasta ${MAX_CUENTAS_GRATIS} cuentas, ${MAX_TARJETAS_GRATIS} tarjeta, quincenas, gastos fijos, metas y ${CREDITOS_IA_GRATIS} mensajes de IA por semana. Sin anuncios.`,
  },
  {
    pregunta: "¿Se conecta automáticamente a mi banco?",
    respuesta:
      "No hay conexión en vivo con el banco. Tú registras movimientos manualmente o, con Fynix Pro, importas un archivo CSV de tu banco. Fynix ayuda a detectar transferencias, gastos fijos y categorías que ya corregiste.",
  },
  {
    pregunta: "¿Mis datos están seguros?",
    respuesta:
      "Tu información se guarda en tu cuenta en la nube. No vendemos tus datos ni usamos tus movimientos para publicidad. Puedes exportar o respaldar tus datos en JSON cuando quieras.",
  },
  {
    pregunta: "¿Funciona en el celular?",
    respuesta:
      "Sí. Fynix es una web app que puedes añadir a la pantalla de inicio (PWA) en Android o iPhone y usarla como una app, con tu mismo login y datos sincronizados.",
  },
  {
    pregunta: "¿Qué incluye Fynix Pro?",
    respuesta: `Por US$${PRECIO_PRO_MENSUAL_USD}/mes obtienes cuentas y tarjetas ilimitadas, cuotas Popular/BHD/Credimás, exportación CSV, importación bancaria (CSV) y ${CREDITOS_IA_PRO} mensajes de IA por semana. Pagas con PayPal y cancelas cuando quieras.`,
  },
  {
    pregunta: "¿Puedo iniciar sesión con Google?",
    respuesta:
      "Sí. En login o registro puedes usar «Continuar con Google» además del correo y contraseña. Es la misma cuenta: eliges el método que prefieras.",
  },
] as const;

export const PUBLICO_FYNIX = [
  {
    titulo: "Cobras quincenal",
    descripcion: "Ideal si recibes ingresos los días 15 y 30 (o fechas que tú defines).",
    icono: "calendario",
  },
  {
    titulo: "Manejas DOP y USD",
    descripcion:
      "Cuentas en pesos y dólares, gastos en la moneda que corresponda y vista clara de cada quincena.",
    icono: "monedas",
  },
  {
    titulo: "Usas tarjetas locales",
    descripcion:
      "Popular, BHD, cuotas y compromisos fijos organizados por Q1 y Q2, no solo por mes calendario.",
    icono: "tarjeta",
  },
] as const;

export const ENLACES_NAV_LANDING = [
  { href: "#como-funciona", etiqueta: "Cómo funciona" },
  { href: "#capturas", etiqueta: "Vista previa" },
  { href: "#beneficios", etiqueta: "Beneficios" },
  { href: "#planes", etiqueta: "Planes" },
  { href: "#faq", etiqueta: "FAQ" },
] as const;

export const CAPTURAS_LANDING = [
  {
    id: "home",
    titulo: "Home",
    descripcion: "Patrimonio, gráfico y próximos pagos de la quincena.",
  },
  {
    id: "gastos-fijos",
    titulo: "Gastos fijos",
    descripcion: "Q1 y Q2 con compromisos y pagos pendientes.",
  },
  {
    id: "ia",
    titulo: "IA Fynix",
    descripcion: "Pregunta qué pagar primero con contexto real.",
  },
] as const;

export type IdCapturaLanding = (typeof CAPTURAS_LANDING)[number]["id"];
