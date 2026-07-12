import { AuthLayout } from "@/components/auth/AuthLayout";
import { RecuperarContrasenaForm } from "@/components/auth/RecuperarContrasenaForm";

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
