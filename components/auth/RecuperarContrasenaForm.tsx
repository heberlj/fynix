"use client";

import Link from "next/link";
import { useState } from "react";
import { solicitarRecuperacionContrasena } from "@/lib/auth";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent";

export function RecuperarContrasenaForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    const resultado = await solicitarRecuperacionContrasena(email);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-foreground">
          Si existe una cuenta con <span className="font-medium">{email}</span>,
          recibirás un correo con el enlace para restablecer tu contraseña.
        </p>
        <p className="text-xs text-muted">
          Revisa también la carpeta de spam. El enlace expira en unos minutos.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-accent hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted">
        Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
      </p>

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

      {error && <p className="text-sm text-gasto">{error}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {cargando ? "Enviando..." : "Enviar enlace"}
      </button>

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
