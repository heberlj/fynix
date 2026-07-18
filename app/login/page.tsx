import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { EnlacesLegalesAuth } from "@/components/auth/EnlacesLegalesAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina(
  "Iniciar sesión",
  "Accede a tu cuenta de Fynix y continúa organizando tus finanzas personales.",
  "/login"
);

export default function LoginPage() {
  return (
    <AuthLayout
      titulo="Iniciar sesión"
      subtitulo="Accede a tu gestor de finanzas"
      pie={<EnlacesLegalesAuth />}
    >
      <LoginForm />
    </AuthLayout>
  );
}
