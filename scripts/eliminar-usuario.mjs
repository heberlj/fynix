/**
 * Elimina un usuario de Supabase Auth (y datos en cascada).
 * Uso: node scripts/eliminar-usuario.mjs Heber
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function cargarEnv() {
  const ruta = new URL("../.env.local", import.meta.url);
  if (!fs.existsSync(ruta)) {
    throw new Error("No se encontró .env.local");
  }
  const env = {};
  for (const linea of fs.readFileSync(ruta, "utf8").split(/\r?\n/)) {
    if (!linea || linea.startsWith("#")) continue;
    const i = linea.indexOf("=");
    if (i === -1) continue;
    env[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  }
  return env;
}

const busqueda = (process.argv[2] ?? "").trim().toLowerCase();
if (!busqueda) {
  console.error("Indica el nombre o correo: node scripts/eliminar-usuario.mjs Heber");
  process.exit(1);
}

const env = cargarEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

if (error) {
  console.error("Error al listar usuarios:", error.message);
  process.exit(1);
}

const coincidencias = data.users.filter((u) => {
  const nombre = (u.user_metadata?.nombre ?? "").toString().toLowerCase();
  const email = (u.email ?? "").toLowerCase();
  return nombre.includes(busqueda) || email.includes(busqueda);
});

if (coincidencias.length === 0) {
  console.log(`No se encontró ningún usuario con "${busqueda}".`);
  process.exit(0);
}

for (const usuario of coincidencias) {
  const etiqueta =
    usuario.user_metadata?.nombre ?? usuario.email ?? usuario.id;
  const { error: deleteError } = await supabase.auth.admin.deleteUser(
    usuario.id
  );
  if (deleteError) {
    console.error(`No se pudo eliminar ${etiqueta}:`, deleteError.message);
    process.exit(1);
  }
  console.log(`Eliminado: ${etiqueta} (${usuario.email ?? "sin correo"})`);
}

console.log("Listo. Puedes registrarte de nuevo con el mismo correo.");
