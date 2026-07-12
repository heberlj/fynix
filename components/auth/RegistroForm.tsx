"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  estadoRequisitosContraseña,
  validarContraseña,
} from "@/lib/validar-contraseña";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent";

const ETIQUETAS_REQUISITOS = [
  { clave: "longitud" as const, texto: "Mínimo 8 caracteres" },
  { clave: "mayuscula" as const, texto: "Una letra mayúscula" },
  { clave: "minuscula" as const, texto: "Una letra minúscula" },
  { clave: "numero" as const, texto: "Un número" },
  { clave: "simbolo" as const, texto: "Un símbolo (!@#$%…)" },
];

export function RegistroForm() {
  const { registrar } = useAuth();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const requisitos = useMemo(
    () => estadoRequisitosContraseña(password),
    [password]
  );

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
    const resultado = await registrar(nombre, email, password);
    setCargando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.replace("/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Nombre</span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoComplete="name"
          placeholder="Tu nombre"
          className={inputClass}
          required
        />
      </label>

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

      <div className="space-y-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Crea una contraseña segura"
            className={inputClass}
            minLength={8}
            required
          />
        </label>

        {password.length > 0 && (
          <ul className="space-y-1 rounded-lg bg-background px-3 py-2 text-xs">
            {ETIQUETAS_REQUISITOS.map(({ clave, texto }) => (
              <li
                key={clave}
                className={
                  requisitos[clave] ? "text-ingreso" : "text-muted"
                }
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
        <input
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          className={inputClass}
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
        {cargando ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
