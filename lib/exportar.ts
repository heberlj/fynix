import type { EstadoFinanzas, Transaccion } from "@/types/finanzas";
import { normalizarEstado } from "@/lib/storage";

function escaparCsv(valor: string | number): string {
  const texto = String(valor);
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function filaCsv(celdas: (string | number)[]): string {
  return celdas.map(escaparCsv).join(",");
}

function descargarTexto(
  contenido: string,
  nombreArchivo: string,
  tipoMime: string
): void {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}

function prefijoArchivo(): string {
  return new Date().toISOString().slice(0, 10);
}

function ordenarTransacciones(transacciones: Transaccion[]): Transaccion[] {
  return [...transacciones].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function exportarTransaccionesCsv(estado: EstadoFinanzas): void {
  const encabezados = [
    "Fecha",
    "Descripción",
    "Tipo",
    "Categoría",
    "Monto",
    "Moneda",
    "Quincena",
  ];

  const filas = ordenarTransacciones(estado.transacciones).map((t) =>
    filaCsv([
      t.fecha,
      t.descripcion,
      t.tipo,
      t.categoria,
      t.monto,
      t.moneda,
      `Q${t.quincena}`,
    ])
  );

  const contenido = [filaCsv(encabezados), ...filas].join("\n");
  descargarTexto(
    contenido,
    `fynix-transacciones-${prefijoArchivo()}.csv`,
    "text/csv;charset=utf-8"
  );
}

export function exportarReporteCsv(estado: EstadoFinanzas): void {
  const resumen = new Map<
    string,
    { ingresos: number; gastos: number; moneda: string }
  >();

  for (const t of estado.transacciones) {
    if (t.tipo === "transferencia") continue;

    const mes = t.fecha.slice(0, 7);
    const clave = `${mes}|${t.moneda}`;
    const actual = resumen.get(clave) ?? {
      ingresos: 0,
      gastos: 0,
      moneda: t.moneda,
    };

    if (t.tipo === "ingreso") {
      actual.ingresos += t.monto;
    } else if (t.tipo === "gasto") {
      actual.gastos += t.monto;
    }

    resumen.set(clave, actual);
  }

  const encabezados = ["Mes", "Moneda", "Ingresos", "Gastos", "Balance"];
  const filas = Array.from(resumen.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clave, datos]) => {
      const mes = clave.split("|")[0];
      const balance = Math.round((datos.ingresos - datos.gastos) * 100) / 100;
      return filaCsv([mes, datos.moneda, datos.ingresos, datos.gastos, balance]);
    });

  const contenido = [filaCsv(encabezados), ...filas].join("\n");
  descargarTexto(
    contenido,
    `fynix-reporte-${prefijoArchivo()}.csv`,
    "text/csv;charset=utf-8"
  );
}

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
