import type { RegistroUsuarios, SesionActiva, Usuario } from "@/types/auth";
import { inicializarDatosUsuario } from "@/lib/storage";

const USUARIOS_KEY = "fynix-usuarios";
const SESION_KEY = "fynix-sesion";
const LEGACY_DATA_KEY = "gestor-money-data";
const LEGACY_MIGRATED_KEY = "fynix-legacy-migrated";

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function generarSalt(): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function cargarRegistro(): RegistroUsuarios {
  if (typeof window === "undefined") return { usuarios: [] };

  try {
    const raw = localStorage.getItem(USUARIOS_KEY);
    if (!raw) return { usuarios: [] };
    const parsed = JSON.parse(raw) as RegistroUsuarios;
    return { usuarios: parsed.usuarios ?? [] };
  } catch {
    return { usuarios: [] };
  }
}

function guardarRegistro(registro: RegistroUsuarios): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USUARIOS_KEY, JSON.stringify(registro));
}

export function obtenerSesion(): SesionActiva | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(SESION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SesionActiva;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion: SesionActiva | null): void {
  if (typeof window === "undefined") return;

  if (sesion) {
    localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
  } else {
    localStorage.removeItem(SESION_KEY);
  }
}

export function claveDatosUsuario(usuarioId: string): string {
  return `fynix-data-${usuarioId}`;
}

/** Migra datos pre-auth una sola vez, solo para el primer usuario registrado */
export function migrarDatosLegacy(usuarioId: string): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(LEGACY_MIGRATED_KEY)) return;

  const clave = claveDatosUsuario(usuarioId);
  if (localStorage.getItem(clave)) {
    localStorage.setItem(LEGACY_MIGRATED_KEY, usuarioId);
    return;
  }

  const legacy = localStorage.getItem(LEGACY_DATA_KEY);
  if (legacy) {
    localStorage.setItem(clave, legacy);
  }

  localStorage.setItem(LEGACY_MIGRATED_KEY, usuarioId);
}

export async function registrarUsuario(datos: {
  nombre: string;
  email: string;
  password: string;
}): Promise<{ ok: true; sesion: SesionActiva } | { ok: false; error: string }> {
  const nombre = datos.nombre.trim();
  const email = normalizarEmail(datos.email);
  const password = datos.password;

  if (!nombre) return { ok: false, error: "El nombre es obligatorio" };
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Ingresa un correo válido" };
  }
  if (password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const registro = cargarRegistro();
  if (registro.usuarios.some((u) => u.email === email)) {
    return { ok: false, error: "Ya existe una cuenta con ese correo" };
  }

  const salt = await generarSalt();
  const passwordHash = await hashPassword(password, salt);
  const usuario: Usuario = {
    id: crypto.randomUUID(),
    nombre,
    email,
    passwordHash,
    salt,
    creadoEn: new Date().toISOString(),
  };

  registro.usuarios.push(usuario);
  guardarRegistro(registro);
  migrarDatosLegacy(usuario.id);
  inicializarDatosUsuario(usuario.id);

  const sesion: SesionActiva = {
    usuarioId: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
  };
  guardarSesion(sesion);

  return { ok: true, sesion };
}

export async function iniciarSesion(datos: {
  email: string;
  password: string;
}): Promise<{ ok: true; sesion: SesionActiva } | { ok: false; error: string }> {
  const email = normalizarEmail(datos.email);
  const registro = cargarRegistro();
  const usuario = registro.usuarios.find((u) => u.email === email);

  if (!usuario) {
    return { ok: false, error: "Correo o contraseña incorrectos" };
  }

  const hash = await hashPassword(datos.password, usuario.salt);
  if (hash !== usuario.passwordHash) {
    return { ok: false, error: "Correo o contraseña incorrectos" };
  }

  const sesion: SesionActiva = {
    usuarioId: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
  };
  guardarSesion(sesion);

  return { ok: true, sesion };
}

export function cerrarSesion(): void {
  guardarSesion(null);
}
