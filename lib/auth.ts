import type { SesionActiva } from "@/types/auth";
import type { Session } from "@supabase/supabase-js";
import { crearClienteSupabase } from "@/lib/supabase/client";
import { validarContraseña } from "@/lib/validar-contraseña";

function mapearSesion(session: Session | null): SesionActiva | null {
  if (!session?.user) return null;

  const nombre =
    (session.user.user_metadata?.nombre as string | undefined)?.trim() ||
    session.user.email?.split("@")[0] ||
    "Usuario";

  return {
    usuarioId: session.user.id,
    nombre,
    email: session.user.email ?? "",
  };
}

function mensajeErrorAuth(mensaje: string): string {
  const texto = mensaje.toLowerCase();

  if (texto.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos";
  }
  if (texto.includes("user already registered")) {
    return "Ya existe una cuenta con ese correo";
  }
  if (texto.includes("email not confirmed")) {
    return "Confirma tu correo antes de iniciar sesión";
  }
  if (texto.includes("password")) {
    return "La contraseña no cumple los requisitos de seguridad";
  }

  return mensaje || "No se pudo completar la operación";
}

export async function obtenerSesion(): Promise<SesionActiva | null> {
  if (typeof window === "undefined") return null;

  const supabase = crearClienteSupabase();
  const { data } = await supabase.auth.getSession();
  return mapearSesion(data.session);
}

export async function registrarUsuario(datos: {
  nombre: string;
  email: string;
  password: string;
}): Promise<{ ok: true; sesion: SesionActiva } | { ok: false; error: string }> {
  const nombre = datos.nombre.trim();
  const email = datos.email.trim().toLowerCase();
  const password = datos.password;

  if (!nombre) return { ok: false, error: "El nombre es obligatorio" };
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Ingresa un correo válido" };
  }
  const errorContraseña = validarContraseña(password);
  if (errorContraseña) {
    return { ok: false, error: errorContraseña };
  }

  const supabase = crearClienteSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  });

  if (error) {
    return { ok: false, error: mensajeErrorAuth(error.message) };
  }

  const sesion = mapearSesion(data.session);
  if (!sesion) {
    return {
      ok: false,
      error: "Cuenta creada. Revisa tu correo para confirmar e inicia sesión.",
    };
  }

  return { ok: true, sesion };
}

export async function iniciarSesion(datos: {
  email: string;
  password: string;
}): Promise<{ ok: true; sesion: SesionActiva } | { ok: false; error: string }> {
  const email = datos.email.trim().toLowerCase();
  const supabase = crearClienteSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: datos.password,
  });

  if (error) {
    return { ok: false, error: mensajeErrorAuth(error.message) };
  }

  const sesion = mapearSesion(data.session);
  if (!sesion) {
    return { ok: false, error: "No se pudo iniciar sesión" };
  }

  return { ok: true, sesion };
}

export async function cerrarSesion(): Promise<void> {
  if (typeof window === "undefined") return;
  const supabase = crearClienteSupabase();
  await supabase.auth.signOut();
}
