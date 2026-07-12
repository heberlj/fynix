import { AuthLayout } from "@/components/auth/AuthLayout";
import { RestablecerContrasenaForm } from "@/components/auth/RestablecerContrasenaForm";

export default function RestablecerContrasenaPage() {
  return (
    <AuthLayout
      titulo="Nueva contraseña"
      subtitulo="Crea una contraseña segura para tu cuenta"
    >
      <RestablecerContrasenaForm />
    </AuthLayout>
  );
}
