import type { EstadoFinanzas } from "@/types/finanzas";
import { normalizarEstado } from "@/lib/storage";

export function exportarDatos(estado: EstadoFinanzas): void {
  const contenido = JSON.stringify(
    {
      version: 1,
      exportadoEn: new Date().toISOString(),
      datos: estado,
    },
    null,
    2
  );

  const blob = new Blob([contenido], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);
  enlace.href = url;
  enlace.download = `fynix-${fecha}.json`;
  enlace.click();
  URL.revokeObjectURL(url);
}

export function parsearImportacion(
  contenido: string
): { ok: true; estado: EstadoFinanzas } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(contenido) as
      | EstadoFinanzas
      | { datos?: EstadoFinanzas };

    const datos =
      "transacciones" in parsed
        ? parsed
        : parsed.datos;

    if (!datos || !Array.isArray(datos.transacciones)) {
      return { ok: false, error: "El archivo no tiene el formato correcto" };
    }

    return { ok: true, estado: normalizarEstado(datos) };
  } catch {
    return { ok: false, error: "No se pudo leer el archivo JSON" };
  }
}

export function importarDesdeArchivo(
  archivo: File
): Promise<{ ok: true; estado: EstadoFinanzas } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const lector = new FileReader();
    lector.onload = () => {
      const texto = lector.result;
      if (typeof texto !== "string") {
        resolve({ ok: false, error: "Error al leer el archivo" });
        return;
      }
      resolve(parsearImportacion(texto));
    };
    lector.onerror = () => resolve({ ok: false, error: "Error al leer el archivo" });
    lector.readAsText(archivo);
  });
}
