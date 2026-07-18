import type { Metadata } from "next";
import { PaginaLegal } from "@/components/legal/PaginaLegal";
import {
  FECHA_ACTUALIZACION_LEGAL,
  SECCIONES_POLITICA_PRIVACIDAD,
} from "@/lib/legal/contenido";
import { metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina(
  "Política de Privacidad",
  "Conoce cómo Fynix recopila, usa y protege tu información personal y financiera.",
  "/politica-privacidad"
);

export default function PoliticaPrivacidadPage() {
  return (
    <PaginaLegal
      titulo="Política de Privacidad"
      actualizado={FECHA_ACTUALIZACION_LEGAL}
      secciones={SECCIONES_POLITICA_PRIVACIDAD}
    />
  );
}
