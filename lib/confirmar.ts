export function confirmarEliminacion(
  nombre: string,
  tipo?: string
): boolean {
  const etiqueta = tipo ? `${tipo} «${nombre}»` : `«${nombre}»`;
  return window.confirm(
    `¿Eliminar ${etiqueta}? Esta acción no se puede deshacer.`
  );
}

export function confirmarAccion(mensaje: string): boolean {
  return window.confirm(mensaje);
}
