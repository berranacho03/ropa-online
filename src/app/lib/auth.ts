export type Rol = "admin" | "tienda" | "usuario";

export interface Usuario {
  email: string;
  nombre: string;
  iniciales: string;
  rol: Rol;
  cargo: string;
  /** Sólo para el rol `tienda`: la tienda que administra. */
  tiendaId?: string;
  /** Sólo para el rol `usuario`. */
  plan?: "gratis" | "premium";
  /** Usuario que todavía no cargó sus medidas: entra al onboarding. */
  nuevo?: boolean;
}

type Credencial = Usuario & { password: string };

export const USUARIOS_DEMO: Credencial[] = [
  {
    email: "admin@ropa.app",
    password: "admin",
    nombre: "Equipo ROPA",
    iniciales: "ER",
    rol: "admin",
    cargo: "Administración de la plataforma",
  },
  {
    email: "sofi@ropa.app",
    password: "sofi",
    nombre: "Sofía Méndez",
    iniciales: "SM",
    rol: "usuario",
    cargo: "Usuaria Premium",
    plan: "premium",
  },
  {
    email: "lucas@ropa.app",
    password: "lucas",
    nombre: "Lucas Ferreira",
    iniciales: "LF",
    rol: "usuario",
    cargo: "Usuario gratuito",
    plan: "gratis",
  },
  {
    email: "nuevo@ropa.app",
    password: "nuevo",
    nombre: "Usuario nuevo",
    iniciales: "UN",
    rol: "usuario",
    cargo: "Recién registrado",
    plan: "gratis",
    nuevo: true,
  },
  {
    email: "tienda@ropa.app",
    password: "tienda",
    nombre: "Camila Rodríguez",
    iniciales: "CR",
    rol: "tienda",
    cargo: "Responsable de e-commerce",
    tiendaId: "norte",
  },
  {
    email: "nueva-tienda@ropa.app",
    password: "tienda",
    nombre: "Martín Silva",
    iniciales: "MS",
    rol: "tienda",
    cargo: "Dueño",
    tiendaId: "bruma",
  },
];

const KEY = "ropa.auth";

export function login(email: string, password: string): Usuario | null {
  const encontrado = USUARIOS_DEMO.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
  );
  if (!encontrado) return null;
  const { password: _pw, ...usuario } = encontrado;
  sessionStorage.setItem(KEY, JSON.stringify(usuario));
  return usuario;
}

export function logout() {
  sessionStorage.removeItem(KEY);
}

export function getUsuario(): Usuario | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Usuario) : null;
  } catch {
    return null;
  }
}

/** A dónde va cada rol al entrar. */
export const INICIO_DE: Record<Rol, string> = {
  admin: "/admin",
  tienda: "/tienda",
  usuario: "/app",
};
