"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BotonGoogleAuth, SeparadorAuth } from "@/components/auth/BotonGoogleAuth";
import { useAuth } from "@/context/AuthContext";
import { CampoContrasena } from "@/components/ui/CampoContrasena";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent";

export function LoginForm() {
  const { iniciarSesion } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sesionExpirada = searchParams.get("motivo") === "inactividad";
  const errorAuth = searchParams.get("error") === "auth";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const resultado = await iniciarSesion(email, password);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.replace("/");
  }

  return (
    <div className="space-y-4">
      <BotonGoogleAuth destino="/" />
      <SeparadorAuth />

      <form onSubmit={handleSubmit} className="space-y-4">
      {sesionExpirada && (
        <p
          role="status"
          className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-muted"
        >
          Tu sesión se cerró por inactividad. Inicia sesión de nuevo para
          continuar.
        </p>
      )}

      {errorAuth && (
        <p
          role="alert"
          className="rounded-lg border border-gasto/30 bg-gasto/5 px-3 py-2.5 text-sm text-gasto"
        >
          No se pudo iniciar sesión con Google. Inténtalo de nuevo o usa tu
          correo y contraseña.
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Correo</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="tu@correo.com"
          className={inputClass}
          required
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">Contraseña</span>
          <Link
            href="/recuperar-contrasena"
            className="text-xs font-medium text-accent hover:underline"
          >
            ¿Has olvidado tu contraseña?
          </Link>
        </div>
        <CampoContrasena
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </label>

      {error && <p className="text-sm text-gasto">{error}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {cargando ? "Ingresando..." : "Iniciar sesión"}
      </button>

      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-accent hover:underline">
          Regístrate
        </Link>
      </p>
    </form>
    </div>
  );
}
