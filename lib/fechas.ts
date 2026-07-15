const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function fechaHoy(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

export function mesActual(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return `${dia} ${MESES[mes - 1]} ${anio}`;
}

export function opcionesMeses(cantidad = 12): { valor: string; etiqueta: string }[] {
  const opciones: { valor: string; etiqueta: string }[] = [];
  const hoy = new Date();

  for (let i = 0; i < cantidad; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const valor = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    const etiqueta = `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
    opciones.push({ valor, etiqueta });
  }

  return opciones;
}

export function opcionesAnios(cantidad = 6): { valor: string; etiqueta: string }[] {
  const anioActual = new Date().getFullYear();
  const opciones: { valor: string; etiqueta: string }[] = [];

  for (let i = 0; i < cantidad; i++) {
    const anio = anioActual - i;
    opciones.push({ valor: String(anio), etiqueta: String(anio) });
  }

  return opciones;
}
