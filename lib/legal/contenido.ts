import type { SeccionLegal } from "@/components/legal/PaginaLegal";

export const FECHA_ACTUALIZACION_LEGAL = "18 de julio de 2026";

export const SECCIONES_POLITICA_PRIVACIDAD: SeccionLegal[] = [
  {
    titulo: "1. Introducción",
    parrafos: [
      "En Fynix respetamos tu privacidad. Esta Política de Privacidad explica qué datos recopilamos, cómo los usamos y qué derechos tienes al utilizar nuestra aplicación de finanzas personales.",
      "Al crear una cuenta o usar Fynix, aceptas el tratamiento de tus datos conforme a este documento.",
    ],
  },
  {
    titulo: "2. Datos que recopilamos",
    parrafos: ["Podemos tratar la siguiente información:"],
    lista: [
      "Datos de cuenta: nombre, correo electrónico y credenciales de acceso.",
      "Datos financieros que tú introduces: transacciones, cuentas, tarjetas, préstamos, metas de ahorro y configuración personal.",
      "Datos técnicos básicos: tipo de navegador, dirección IP aproximada y registros necesarios para mantener el servicio seguro.",
      "Información de suscripción, si contratas un plan de pago.",
    ],
  },
  {
    titulo: "3. Cómo usamos tus datos",
    parrafos: ["Utilizamos tus datos exclusivamente para:"],
    lista: [
      "Permitirte acceder a tu cuenta y sincronizar tu información.",
      "Mostrar resúmenes, gráficos y funciones de organización financiera.",
      "Procesar pagos de suscripciones, cuando corresponda.",
      "Mejorar la estabilidad, seguridad y experiencia de uso de Fynix.",
      "Responder consultas de soporte que nos envíes.",
    ],
  },
  {
    titulo: "4. Almacenamiento y seguridad",
    parrafos: [
      "Tu información se almacena en servicios de nube seguros asociados a tu cuenta. Aplicamos medidas técnicas y organizativas razonables para proteger tus datos frente a accesos no autorizados.",
      "Los datos sensibles de tarjetas se tratan con cuidado adicional y no se comparten con terceros con fines comerciales.",
    ],
  },
  {
    titulo: "5. Compartición con terceros",
    parrafos: [
      "No vendemos ni alquilamos tu información personal. Solo compartimos datos con proveedores que nos ayudan a operar Fynix (por ejemplo, autenticación, alojamiento o procesamiento de pagos), siempre bajo obligaciones de confidencialidad.",
      "Tampoco usamos tus movimientos financieros para publicidad dirigida ni para entrenar modelos de terceros.",
    ],
  },
  {
    titulo: "6. Tus derechos",
    parrafos: ["Puedes solicitar en cualquier momento:"],
    lista: [
      "Acceder a los datos asociados a tu cuenta.",
      "Corregir información inexacta.",
      "Exportar tus datos desde la aplicación.",
      "Eliminar tu cuenta y la información vinculada, salvo lo que debamos conservar por obligación legal.",
    ],
  },
  {
    titulo: "7. Conservación",
    parrafos: [
      "Conservamos tus datos mientras mantengas una cuenta activa. Si eliminas tu cuenta, borraremos o anonimizaremos tu información en un plazo razonable, excepto los datos que debamos retener por motivos legales o de seguridad.",
    ],
  },
  {
    titulo: "8. Contacto",
    parrafos: [
      "Si tienes preguntas sobre esta política o sobre el tratamiento de tus datos, puedes escribirnos desde la sección de soporte dentro de la aplicación.",
    ],
  },
];

export const SECCIONES_TERMINOS_CONDICIONES: SeccionLegal[] = [
  {
    titulo: "1. Aceptación",
    parrafos: [
      "Estos Términos y Condiciones regulan el acceso y uso de Fynix. Al registrarte o utilizar el servicio, confirmas que has leído y aceptas estas condiciones.",
    ],
  },
  {
    titulo: "2. Descripción del servicio",
    parrafos: [
      "Fynix es una herramienta web de organización de finanzas personales. Te permite registrar ingresos, gastos, cuentas, tarjetas, préstamos y metas de ahorro.",
      "Fynix no es un banco, asesor financiero ni entidad regulada. La información mostrada es orientativa y depende de los datos que tú introduces.",
    ],
  },
  {
    titulo: "3. Cuenta de usuario",
    parrafos: ["Para usar Fynix debes:"],
    lista: [
      "Proporcionar información veraz al registrarte.",
      "Mantener la confidencialidad de tu contraseña.",
      "Notificarnos si sospechas de un acceso no autorizado a tu cuenta.",
      "Ser mayor de edad o contar con autorización legal para usar el servicio.",
    ],
  },
  {
    titulo: "4. Uso permitido",
    parrafos: [
      "Te comprometes a utilizar Fynix de forma lícita y responsable. Queda prohibido intentar acceder sin autorización a sistemas, interferir con el funcionamiento del servicio o usar la plataforma con fines fraudulentos.",
    ],
  },
  {
    titulo: "5. Planes y pagos",
    parrafos: [
      "Fynix puede ofrecer funciones gratuitas y planes de suscripción de pago. Los precios, beneficios y periodicidad de facturación se mostrarán antes de confirmar cualquier compra.",
      "Los pagos se procesan a través de proveedores externos. Las condiciones de renovación, cancelación y reembolso dependerán del plan contratado y de la política aplicable en el momento de la compra.",
    ],
  },
  {
    titulo: "6. Propiedad intelectual",
    parrafos: [
      "Fynix, su marca, diseño, código y contenidos son propiedad de sus titulares. No se concede ningún derecho sobre ellos salvo el uso personal necesario para utilizar la aplicación conforme a estos términos.",
    ],
  },
  {
    titulo: "7. Limitación de responsabilidad",
    parrafos: [
      "Fynix se ofrece «tal cual». No garantizamos que el servicio esté libre de errores o interrupciones. No somos responsables de decisiones financieras que tomes basándote en la información registrada en la app.",
      "En la medida permitida por la ley, Fynix no será responsable de daños indirectos derivados del uso o la imposibilidad de uso del servicio.",
    ],
  },
  {
    titulo: "8. Modificaciones",
    parrafos: [
      "Podemos actualizar estos términos o las funcionalidades de Fynix. Publicaremos los cambios relevantes en la aplicación. El uso continuado del servicio tras una actualización implica la aceptación de los nuevos términos.",
    ],
  },
  {
    titulo: "9. Contacto",
    parrafos: [
      "Para dudas sobre estos términos, puedes contactarnos a través de la sección de soporte disponible en la aplicación.",
    ],
  },
];
