/** Normaliza encabezados de CSV para comparación flexible. */
export function normalizarEncabezado(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Detecta delimitador (; más común en bancos RD, o ,) */
export function detectarDelimitador(primeraLinea: string): string {
  const puntosYComa = (primeraLinea.match(/;/g) ?? []).length;
  const comas = (primeraLinea.match(/,/g) ?? []).length;
  return puntosYComa >= comas ? ";" : ",";
}

/** Parsea una línea CSV respetando comillas. */
export function parsearLineaCsv(linea: string, delimitador: string): string[] {
  const celdas: string[] = [];
  let actual = "";
  let entreComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        entreComillas = !entreComillas;
      }
      continue;
    }
    if (c === delimitador && !entreComillas) {
      celdas.push(actual.trim());
      actual = "";
      continue;
    }
    actual += c;
  }
  celdas.push(actual.trim());
  return celdas;
}

export function parsearCsv(contenido: string): string[][] {
  const lineas = contenido
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lineas.length === 0) return [];

  const delimitador = detectarDelimitador(lineas[0]);
  return lineas.map((l) => parsearLineaCsv(l, delimitador));
}

export function indiceColumna(
  encabezados: string[],
  alias: string[]
): number {
  const normalizados = encabezados.map(normalizarEncabezado);
  for (const aliasItem of alias) {
    const busqueda = normalizarEncabezado(aliasItem);
    const idx = normalizados.findIndex(
      (h) => h === busqueda || h.includes(busqueda) || busqueda.includes(h)
    );
    if (idx >= 0) return idx;
  }
  return -1;
}
