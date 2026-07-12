export type RequisitoContraseña =
  | "longitud"
  | "mayuscula"
  | "minuscula"
  | "numero"
  | "simbolo";

export function estadoRequisitosContraseña(password: string): Record<
  RequisitoContraseña,
  boolean
> {
  return {
    longitud: password.length >= 8,
    mayuscula: /[A-Z]/.test(password),
    minuscula: /[a-z]/.test(password),
    numero: /\d/.test(password),
    simbolo: /[^A-Za-z0-9]/.test(password),
  };
}

export function validarContraseña(password: string): string | null {
  const estado = estadoRequisitosContraseña(password);

  if (!estado.longitud) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (!estado.mayuscula) {
    return "La contraseña debe incluir al menos una letra mayúscula";
  }
  if (!estado.minuscula) {
    return "La contraseña debe incluir al menos una letra minúscula";
  }
  if (!estado.numero) {
    return "La contraseña debe incluir al menos un número";
  }
  if (!estado.simbolo) {
    return "La contraseña debe incluir al menos un símbolo (!@#$%…)";
  }

  return null;
}
