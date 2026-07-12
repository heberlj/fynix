const CLAVES_FIJAS = [
  "fynix-usuarios",
  "fynix-sesion",
  "gestor-money-data",
  "fynix-legacy-migrated",
  "fynix-migrado-supabase",
] as const;

/** Elimina por completo el almacenamiento local del sistema anterior */
export function limpiarDatosLocalesAntiguos(): void {
  if (typeof window === "undefined") return;

  for (const clave of CLAVES_FIJAS) {
    localStorage.removeItem(clave);
  }

  const prefijos = ["fynix-data-"];
  const aBorrar: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const clave = localStorage.key(i);
    if (!clave) continue;
    if (prefijos.some((prefijo) => clave.startsWith(prefijo))) {
      aBorrar.push(clave);
    }
  }

  for (const clave of aBorrar) {
    localStorage.removeItem(clave);
  }
}
