export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  salt: string;
  creadoEn: string;
}

export interface SesionActiva {
  usuarioId: string;
  nombre: string;
  email: string;
}

export interface RegistroUsuarios {
  usuarios: Usuario[];
}
