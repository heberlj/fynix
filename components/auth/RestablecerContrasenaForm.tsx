"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { restablecerContrasena } from "@/lib/auth";
import { crearClienteSupabase } from "@/lib/supabase/client";
import { CampoContrasena } from "@/components/ui/CampoContrasena";
import {
  estadoRequisitosContraseña,
  validarContraseña,
} from "@/lib/validar-contraseña";

const ETIQUETAS_REQUISITOS = [
  { clave: "longitud" as const, texto: "Mínimo 8 caracteres" },
  { clave: "mayuscula" as const, texto: "Una letra mayúscula" },
  { clave: "minuscula" as const, texto: "Una letra minúscula" },
  { clave: "numero" as const, texto: "Un número" },
  { clave: "simbolo" as const, texto: "Un símbolo (!@#$%…)" },
];

export function RestablecerContrasenaForm() {
  const router = useRouter();
  const { sesion } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enlaceValido, setEnlaceValido] = useState(false);
  const [verificando, setVerificando] = useState(true);

  const requisitos = useMemo(
    () => estadoRequisitosContraseña(password),
    [password]
  );

  useEffect(() => {
    const supabase = crearClienteSupabase();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setEnlaceValido(true);
      }
      setVerificando(false);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setEnlaceValido(true);
      }
      setVerificando(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const errorContraseña = validarContraseña(password);
    if (errorContraseña) {
      setError(errorContraseña);
      return;
    }

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);
    const resultado = await restablecerContrasena(password);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.replace("/");
  }

  if (verificando) {
    return <p className="text-center text-sm text-muted">Verificando enlace...</p>;
  }

  if (!enlaceValido && !sesion) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gasto">
          El enlace no es válido o ya expiró.
        </p>
        <p className="text-sm text-muted">
          Solicita uno nuevo para restablecer tu contraseña.
        </p>
        <Link
          href="/recuperar-contrasena"
          className="inline-block text-sm font-medium text-accent hover:underline"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted">
        Elige una contraseña nueva para tu cuenta.
      </p>

      <div className="space-y-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Nueva contraseña
          </span>
          <CampoContrasena
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Crea una contraseña segura"
            minLength={8}
            required
          />
        </label>

        {password.length > 0 && (
          <ul className="space-y-1 rounded-lg bg-background px-3 py-2 text-xs">
            {ETIQUETAS_REQUISITOS.map(({ clave, texto }) => (
              <li
                key={clave}
                className={requisitos[clave] ? "text-ingreso" : "text-muted"}
              >
                {requisitos[clave] ? "✓" : "○"} {texto}
              </li>
            ))}
          </ul>
        )}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">
          Confirmar contraseña
        </span>
        <CampoContrasena
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          minLength={8}
          required
        />
      </label>

      {error && <p className="text-sm text-gasto">{error}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {cargando ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
