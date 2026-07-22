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
  iniciarSesionConGoogle,
  obtenerSesion,
  registrarUsuario,
  actualizarNombrePerfil,
} from "@/lib/auth";
import { limpiarDatosLocalesAntiguos } from "@/lib/limpiar-datos-locales";
import {
  crearClienteSupabase,
  supabaseConfigurado,
} from "@/lib/supabase/client";
import { ErrorConfiguracionSupabase } from "@/components/auth/ErrorConfiguracionSupabase";

interface AuthContextValue {
  sesion: SesionActiva | null;
  cargado: boolean;
  iniciarSesion: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  iniciarSesionConGoogle: (
    destino?: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  registrar: (
    nombre: string,
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  cerrarSesion: () => void;
  actualizarPerfil: (
    nombre: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionActiva | null>(null);
  const [cargado, setCargado] = useState(false);
  const [configOk] = useState(() => supabaseConfigurado());

  useEffect(() => {
    if (!configOk) {
      setCargado(true);
      return;
    }

    limpiarDatosLocalesAntiguos();

    let supabase;
    try {
      supabase = crearClienteSupabase();
    } catch {
      setCargado(true);
      return;
    }

    void obtenerSesion().then((activa) => {
      setSesion(activa);
      setCargado(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setSesion(null);
        setCargado(true);
        return;
      }

      const nombre =
        (session.user.user_metadata?.nombre as string | undefined)?.trim() ||
        (session.user.user_metadata?.full_name as string | undefined)?.trim() ||
        (session.user.user_metadata?.name as string | undefined)?.trim() ||
        session.user.email?.split("@")[0] ||
        "Usuario";

      setSesion({
        usuarioId: session.user.id,
        nombre,
        email: session.user.email ?? "",
      });
      setCargado(true);
    });

    return () => subscription.unsubscribe();
  }, [configOk]);

  if (!configOk) {
    return <ErrorConfiguracionSupabase />;
  }

  const login = useCallback(async (email: string, password: string) => {
    const resultado = await iniciarSesion({ email, password });
    if (!resultado.ok) return resultado;
    setSesion(resultado.sesion);
    return { ok: true as const };
  }, []);

  const loginGoogle = useCallback(async (destino = "/") => {
    return iniciarSesionConGoogle(destino);
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
    void cerrarSesion().then(() => setSesion(null));
  }, []);

  const actualizarPerfil = useCallback(async (nombre: string) => {
    const resultado = await actualizarNombrePerfil(nombre);
    if (!resultado.ok) return resultado;
    setSesion(resultado.sesion);
    return { ok: true as const };
  }, []);

  const value = useMemo(
    () => ({
      sesion,
      cargado,
      iniciarSesion: login,
      iniciarSesionConGoogle: loginGoogle,
      registrar,
      cerrarSesion: logout,
      actualizarPerfil,
    }),
    [sesion, cargado, login, loginGoogle, registrar, logout, actualizarPerfil]
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
