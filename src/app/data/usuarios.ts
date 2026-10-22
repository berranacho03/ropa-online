// ─────────────────────────────────────────────────────────────
// Usuarios de la app.
//
// 2.400 usuarios generados, más las tres cuentas de demostración.
// La edad sigue el segmento del Canvas (15 a 25 años, con una cola
// hasta 32), las medidas salen de altura y peso, y el canal por el
// que llegó cada uno decide cuánto convierte a Premium.
// ─────────────────────────────────────────────────────────────

import { HOY, addDays, diasEntre, elegir, entre, rng } from "./azar";
import {
  estimarMedidas,
  type Contextura,
  type Genero,
  type Medidas,
  type PreferenciaCalce,
} from "../lib/talles";

export type Canal = "tiktok" | "instagram" | "influencer" | "referidos" | "organico" | "google";

export const CANALES: { id: Canal; nombre: string }[] = [
  { id: "tiktok", nombre: "TikTok" },
  { id: "instagram", nombre: "Instagram" },
  { id: "influencer", nombre: "Influencers" },
  { id: "referidos", nombre: "Referidos" },
  { id: "organico", nombre: "Orgánico" },
  { id: "google", nombre: "Google" },
];

export const nombreCanal = (c: Canal) => CANALES.find((x) => x.id === c)?.nombre ?? c;

export interface UsuarioApp {
  id: string;
  nombre: string;
  email: string;
  edad: number;
  ciudad: string;
  fechaAlta: string;
  /** Último día con actividad en la app. */
  ultimaActividad: string;
  canal: Canal;
  /** null para quien todavía no cargó sus medidas. */
  medidas: Medidas | null;
  /** Medidas tomadas con cinta (true) o estimadas por altura y peso (false). */
  medidasMedidas: boolean;
  conFoto: boolean;
  consentimiento: boolean;
  demo?: boolean;
}

const NOMBRES_M = ["Sofía", "Valentina", "Martina", "Lucía", "Camila", "Agustina", "Florencia", "Micaela", "Julieta", "Catalina", "Emilia", "Paula", "Victoria", "Josefina", "Abril", "Mía", "Renata", "Candela", "Antonella", "Belén", "Rocío", "Milagros", "Guadalupe", "Lola", "Manuela"];
const NOMBRES_H = ["Lucas", "Mateo", "Santiago", "Joaquín", "Facundo", "Nicolás", "Tomás", "Agustín", "Bruno", "Felipe", "Martín", "Juan", "Thiago", "Benjamín", "Ignacio", "Franco", "Diego", "Rodrigo", "Gonzalo", "Federico", "Maximiliano", "Valentín", "Emiliano", "Sebastián", "Lautaro"];
const APELLIDOS = ["Rodríguez", "González", "Fernández", "García", "López", "Martínez", "Pérez", "Silva", "Sosa", "Pereira", "Suárez", "Méndez", "Ferreira", "Núñez", "Romero", "Díaz", "Álvarez", "Cabrera", "Acosta", "Olivera", "Morales", "Castro", "Ramos", "Benítez", "Gómez", "Correa", "Vázquez", "Techera", "De León", "Píriz"];
const CIUDADES: [string, number][] = [["Montevideo", 55], ["Canelones", 12], ["Maldonado", 8], ["Salto", 4], ["Paysandú", 4], ["Colonia", 3], ["Rivera", 3], ["Rocha", 2], ["Tacuarembó", 2], ["Florida", 2], ["Durazno", 2], ["Mercedes", 3]];

const PESO_CANAL: [Canal, number][] = [["tiktok", 30], ["instagram", 25], ["influencer", 18], ["referidos", 12], ["organico", 10], ["google", 5]];

function ponderado<T>(r: () => number, xs: [T, number][]): T {
  const total = xs.reduce((a, [, w]) => a + w, 0);
  let x = r() * total;
  for (const [v, w] of xs) {
    x -= w;
    if (x <= 0) return v;
  }
  return xs[0][0];
}

/** Normal aproximada (suma de uniformes). */
export const normal = (r: () => number, media: number, desvio: number) =>
  media + desvio * ((r() + r() + r() + r() + r() + r() - 3) / 0.7071);

const sinTildes = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "").toLowerCase();

/** Primer día de la plataforma: lanzamiento con las primeras tiendas. */
export const LANZAMIENTO = "2025-11-01";

export function medidasAleatorias(r: () => number, genero: Genero): Medidas {
  const altura = Math.round(genero === "mujer" ? normal(r, 163, 6) : normal(r, 176, 7));
  const imc = Math.max(17, Math.min(33, normal(r, 22.3, 2.8)));
  const peso = Math.round(imc * (altura / 100) ** 2);
  const contextura = elegir<Contextura>(r, ["delgada", "media", "media", "robusta"]);
  const est = estimarMedidas(altura, peso, genero, contextura);
  const preferencia = ponderado<PreferenciaCalce>(r, [["regular", 55], ["holgado", 30], ["ajustado", 15]]);
  return {
    altura,
    peso,
    pecho: est.pecho + entre(r, -3, 3),
    cintura: est.cintura + entre(r, -3, 3),
    cadera: est.cadera + entre(r, -3, 3),
    genero,
    preferencia,
  };
}

function generar(): UsuarioApp[] {
  const r = rng("usuarios");
  const total = diasEntre(LANZAMIENTO, HOY);
  const out: UsuarioApp[] = [];
  const emails = new Set<string>();
  for (let i = 0; i < 2400; i++) {
    const genero: Genero = r() < 0.56 ? "mujer" : "hombre";
    const nombre = elegir(r, genero === "mujer" ? NOMBRES_M : NOMBRES_H);
    const apellido = elegir(r, APELLIDOS);
    let email = `${sinTildes(nombre)}.${sinTildes(apellido)}@mail.com`;
    let n = 2;
    while (emails.has(email)) email = `${sinTildes(nombre)}.${sinTildes(apellido)}${n++}@mail.com`;
    emails.add(email);

    // Crecimiento: más altas en los meses recientes (raíz del azar).
    const fechaAlta = addDays(LANZAMIENTO, Math.floor(Math.sqrt(r()) * total));
    const canal = ponderado(r, PESO_CANAL);

    // Cuánto tiempo sigue usando la app. Referidos e influencers retienen mejor.
    const fiel = r() < (canal === "referidos" ? 0.62 : canal === "influencer" ? 0.55 : 0.46);
    const dias = fiel ? diasEntre(fechaAlta, HOY) : Math.floor(r() * r() * 120);
    const ultimaActividad = addDays(fechaAlta, Math.min(dias, diasEntre(fechaAlta, HOY)));

    const edadBase = Math.round(normal(r, 21, 3.2));
    const sinMedidas = r() < 0.04;
    out.push({
      id: `u${String(i + 1).padStart(4, "0")}`,
      nombre: `${nombre} ${apellido}`,
      email,
      edad: Math.max(15, Math.min(32, edadBase)),
      ciudad: ponderado(r, CIUDADES),
      fechaAlta,
      ultimaActividad,
      canal,
      medidas: sinMedidas ? null : medidasAleatorias(r, genero),
      medidasMedidas: r() < 0.58,
      conFoto: r() < 0.41,
      consentimiento: true,
    });
  }

  // Cuentas de demostración, con id fijo.
  out.push(
    {
      id: "u-sofi",
      nombre: "Sofía Méndez",
      email: "sofi@ropa.app",
      edad: 21,
      ciudad: "Montevideo",
      fechaAlta: "2026-03-14",
      ultimaActividad: HOY,
      canal: "influencer",
      medidas: { altura: 165, peso: 57, pecho: 87, cintura: 67, cadera: 94, genero: "mujer", preferencia: "regular" },
      medidasMedidas: true,
      conFoto: true,
      consentimiento: true,
      demo: true,
    },
    {
      id: "u-lucas",
      nombre: "Lucas Ferreira",
      email: "lucas@ropa.app",
      edad: 19,
      ciudad: "Montevideo",
      fechaAlta: "2026-08-02",
      ultimaActividad: HOY,
      canal: "tiktok",
      medidas: { altura: 178, peso: 72, pecho: 97, cintura: 81, cadera: 97, genero: "hombre", preferencia: "holgado" },
      medidasMedidas: false,
      conFoto: false,
      consentimiento: true,
      demo: true,
    },
    {
      id: "u-nuevo",
      nombre: "Usuario nuevo",
      email: "nuevo@ropa.app",
      edad: 18,
      ciudad: "Montevideo",
      fechaAlta: HOY,
      ultimaActividad: HOY,
      canal: "instagram",
      medidas: null,
      medidasMedidas: false,
      conFoto: false,
      consentimiento: false,
      demo: true,
    }
  );
  return out;
}

export const USUARIOS_SEED: UsuarioApp[] = generar();

/** El usuario de la app que corresponde a una cuenta de demostración. */
export const ID_DEMO: Record<string, string> = {
  "sofi@ropa.app": "u-sofi",
  "lucas@ropa.app": "u-lucas",
  "nuevo@ropa.app": "u-nuevo",
};
