import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RecuperarContrasenaForm } from "@/components/auth/RecuperarContrasenaForm";
import { metadataPagina } from "@/lib/seo";

export const metadata: Metadata = metadataPagina(
  "Recuperar contraseña",
  "Recupera el acceso a tu cuenta de Fynix con un enlace seguro a tu correo.",
  "/recuperar-contrasena"
);

export default function RecuperarContrasenaPage() {
  return (
    <AuthLayout
      titulo="Recuperar contraseña"
      subtitulo="Te enviaremos un enlace a tu correo"
    >
      <RecuperarContrasenaForm />
    </AuthLayout>
  );
}
