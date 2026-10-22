// ─────────────────────────────────────────────────────────────
// Geometría del maniquí ilustrado.
//
// Un cuerpo de frente en un viewBox de 240 × 540, con el eje en
// x = 120. Las medidas de la persona definen los anchos; las prendas
// se dibujan sobre las mismas coordenadas, así una M y una XL se ven
// distintas sobre el mismo cuerpo.
// ─────────────────────────────────────────────────────────────

import type { Medidas } from "../../lib/talles";

export const CX = 120;
export const VIEWBOX = "0 0 240 540";

export const Y = {
  cabeza: 60,
  cuello: 92,
  hombro: 110,
  pecho: 145,
  cintura: 205,
  cadera: 248,
  entrepierna: 274,
  rodilla: 392,
  tobillo: 496,
  muneca: 290,
};

export interface Cuerpo {
  /** Medios anchos, en px. */
  hombro: number;
  pecho: number;
  cintura: number;
  cadera: number;
  genero: Medidas["genero"];
}

/** De centímetros de contorno a medio ancho en px. */
export function cuerpoDe(m: Pick<Medidas, "pecho" | "cintura" | "cadera" | "genero">): Cuerpo {
  const pecho = m.pecho * 0.42;
  return {
    pecho,
    cintura: m.cintura * 0.41,
    cadera: m.cadera * 0.42,
    hombro: pecho * (m.genero === "hombre" ? 1.14 : 1.06),
    genero: m.genero,
  };
}

/** Cuerpo de referencia, para dibujar una prenda sola (foto de catálogo). */
export const CUERPO_CATALOGO: Cuerpo = cuerpoDe({ pecho: 92, cintura: 75, cadera: 98, genero: "mujer" });

export function oscurecer(hex: string, f = 0.25) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - f));
  const g = Math.round(((n >> 8) & 255) * (1 - f));
  const b = Math.round((n & 255) * (1 - f));
  return `rgb(${r},${g},${b})`;
}

export function aclarar(hex: string, f = 0.3) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * f);
  const g = Math.round(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * f);
  const b = Math.round((n & 255) + (255 - (n & 255)) * f);
  return `rgb(${r},${g},${b})`;
}

/** ¿Conviene texto oscuro sobre este color? */
export function esClaro(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const l = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l > 170;
}

export const pts = (xs: [number, number][]) =>
  "M" + xs.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L") + " Z";
