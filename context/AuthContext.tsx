"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SesionActiva } from "@/types/auth";
import {
  cerrarSesion,
  iniciarSesion,
  obtenerSesion,
  registrarUsuario,
} from "@/lib/auth";

interface AuthContextValue {
  sesion: SesionActiva | null;
  cargado: boolean;
  iniciarSesion: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  registrar: (
    nombre: string,
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionActiva | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setSesion(obtenerSesion());
    setCargado(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const resultado = await iniciarSesion({ email, password });
    if (!resultado.ok) return resultado;
    setSesion(resultado.sesion);
    return { ok: true as const };
  }, []);

  const registrar = useCallback(
    async (nombre: string, email: string, password: string) => {
      const resultado = await registrarUsuario({ nombre, email, password });
      if (!resultado.ok) return resultado;
      setSesion(resultado.sesion);
      return { ok: true as const };
    },
    []
  );

  const logout = useCallback(() => {
    cerrarSesion();
    setSesion(null);
  }, []);

  const value = useMemo(
    () => ({
      sesion,
      cargado,
      iniciarSesion: login,
      registrar,
      cerrarSesion: logout,
    }),
    [sesion, cargado, login, registrar, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
