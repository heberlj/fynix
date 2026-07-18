import type { Metadata } from "next";
import { PaginaLegal } from "@/components/legal/PaginaLegal";
import {
  FECHA_ACTUALIZACION_LEGAL,
  SECCIONES_TERMINOS_CONDICIONES,
} from "@/lib/legal/contenido";
import { metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina(
  "Términos y Condiciones",
  "Lee las condiciones de uso del servicio Fynix y tus responsabilidades como usuario.",
  "/terminos-y-condiciones"
);

export default function TerminosCondicionesPage() {
  return (
    <PaginaLegal
      titulo="Términos y Condiciones"
      actualizado={FECHA_ACTUALIZACION_LEGAL}
      secciones={SECCIONES_TERMINOS_CONDICIONES}
    />
  );
}
