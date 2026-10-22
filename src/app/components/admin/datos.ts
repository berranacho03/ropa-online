/** Cálculos de apoyo del admin que no están en lib/metricas. */

import { HOY, mesDe, type Suscripcion, type Venta } from "../../data/seed";
import { addDays } from "../../data/azar";
import { subActivaEn } from "../../lib/metricas";
import type { PlanUsuario } from "./piezas";

/** Plan de cada usuario hoy: Premium activo, ex Premium o gratis. */
export function planesPorUsuario(subs: Suscripcion[]) {
  const m = new Map<string, PlanUsuario>();
  for (const s of subs) {
    if (subActivaEn(s, HOY)) m.set(s.usuarioId, "premium");
    else if (m.get(s.usuarioId) !== "premium") m.set(s.usuarioId, "ex");
  }
  return m;
}

export const planDe = (m: Map<string, PlanUsuario>, id: string): PlanUsuario => m.get(id) ?? "gratis";

/** Cuenta por clave. */
export function contarPor<T>(xs: T[], clave: (x: T) => string) {
  const m = new Map<string, number>();
  for (const x of xs) m.set(clave(x), (m.get(clave(x)) ?? 0) + 1);
  return m;
}

/** Mes anterior a `2026-10` → `2026-09`. */
export function mesAnterior(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** Día equivalente del mes anterior (para comparar el mes en curso con el mismo tramo). */
export const mismoDiaMesAnterior = () => `${mesAnterior(mesDe(HOY))}-${HOY.slice(8, 10)}`;

/** Ventas del mes en curso y del mismo tramo del mes anterior. */
export function ventasMesYPrevio(ventas: Venta[]) {
  const mes = mesDe(HOY);
  const prev = mesAnterior(mes);
  const corte = mismoDiaMesAnterior();
  return {
    actual: ventas.filter((v) => mesDe(v.fecha) === mes),
    previo: ventas.filter((v) => mesDe(v.fecha) === prev && v.fecha <= corte),
  };
}

export const variacion = (a: number, b: number) => (b ? ((a - b) / b) * 100 : undefined);

export const hace = (dias: number) => addDays(HOY, -dias);

/** Ordena por fecha descendente; a igual fecha, lo agregado último va primero. */
export function recientes<T extends { fecha: string }>(xs: T[]) {
  return xs
    .map((x, i) => ({ x, i }))
    .sort((a, b) => b.x.fecha.localeCompare(a.x.fecha) || b.i - a.i)
    .map((e) => e.x);
}

export const fmt1 = (n: number) => n.toFixed(1).replace(".", ",");
