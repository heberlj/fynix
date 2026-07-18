import type { Metadata } from "next";
import { urlBaseApp } from "@/lib/app-url";

export const NOMBRE_APP = "Fynix";
export const ESLOGAN = "Tu dinero, tu futuro.";
export const DESCRIPCION_APP =
  "Fynix es tu gestor de finanzas personales: controla ingresos, gastos fijos, tarjetas, préstamos y metas de ahorro en un solo lugar.";

export const PALABRAS_CLAVE = [
  "Fynix",
  "finanzas personales",
  "gestor de dinero",
  "control de gastos",
  "presupuesto personal",
  "ahorro",
  "quincenas",
  "tarjetas de crédito",
  "préstamos",
  "app de finanzas",
];

export const RUTAS_PUBLICAS_SITEMAP = [
  { ruta: "/", prioridad: 1, frecuencia: "weekly" as const },
  { ruta: "/login", prioridad: 0.6, frecuencia: "monthly" as const },
  { ruta: "/registro", prioridad: 0.7, frecuencia: "monthly" as const },
  {
    ruta: "/recuperar-contrasena",
    prioridad: 0.3,
    frecuencia: "yearly" as const,
  },
  {
    ruta: "/politica-privacidad",
    prioridad: 0.4,
    frecuencia: "yearly" as const,
  },
  {
    ruta: "/terminos-y-condiciones",
    prioridad: 0.4,
    frecuencia: "yearly" as const,
  },
];

export function urlBaseSeo(): string {
  return urlBaseApp();
}

export function metadataRaiz(): Metadata {
  const base = urlBaseSeo();

  return {
    metadataBase: new URL(base),
    title: {
      default: NOMBRE_APP,
      template: `%s | ${NOMBRE_APP}`,
    },
    description: DESCRIPCION_APP,
    applicationName: NOMBRE_APP,
    keywords: PALABRAS_CLAVE,
    authors: [{ name: NOMBRE_APP }],
    creator: NOMBRE_APP,
    publisher: NOMBRE_APP,
    category: "finance",
    openGraph: {
      type: "website",
      locale: "es_ES",
      url: base,
      siteName: NOMBRE_APP,
      title: NOMBRE_APP,
      description: DESCRIPCION_APP,
      images: [
        {
          url: "/logo-fynix.png",
          width: 512,
          height: 512,
          alt: NOMBRE_APP,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: NOMBRE_APP,
      description: DESCRIPCION_APP,
      images: ["/logo-fynix.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: "/",
    },
  };
}

export function metadataPagina(
  titulo: string,
  descripcion: string,
  ruta: string
): Metadata {
  return {
    title: titulo,
    description: descripcion,
    alternates: {
      canonical: ruta,
    },
    openGraph: {
      title: `${titulo} | ${NOMBRE_APP}`,
      description: descripcion,
      url: ruta,
    },
    twitter: {
      title: `${titulo} | ${NOMBRE_APP}`,
      description: descripcion,
    },
  };
}

export function jsonLdOrganizacion() {
  const base = urlBaseSeo();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: NOMBRE_APP,
        url: base,
        logo: `${base}/logo-fynix.png`,
        description: DESCRIPCION_APP,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: NOMBRE_APP,
        description: DESCRIPCION_APP,
        publisher: { "@id": `${base}/#organization` },
        inLanguage: "es",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${base}/#app`,
        name: NOMBRE_APP,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        url: base,
        description: DESCRIPCION_APP,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };
}
