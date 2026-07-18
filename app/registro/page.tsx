import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegistroForm } from "@/components/auth/RegistroForm";
import { metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina(
  "Crear cuenta",
  "Regístrate en Fynix y organiza tus finanzas personales de forma segura.",
  "/registro"
);

export default function RegistroPage() {
  return (
    <AuthLayout
      titulo="Crear cuenta"
      subtitulo="Regístrate para guardar tus finanzas de forma segura"
    >
      <RegistroForm />
    </AuthLayout>
  );
}
