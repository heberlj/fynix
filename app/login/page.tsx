import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      titulo="Iniciar sesión"
      subtitulo="Accede a tu gestor de finanzas"
    >
      <LoginForm />
    </AuthLayout>
  );
}
