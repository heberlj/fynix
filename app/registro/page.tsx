import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegistroForm } from "@/components/auth/RegistroForm";

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
