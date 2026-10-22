// ─────────────────────────────────────────────────────────────
// Motor de datos de la maqueta.
//
// Todo se genera con un PRNG sembrado por string, así los números
// son estables entre recargas y coherentes entre pantallas: el
// talle que se recomienda, las ventas y las devoluciones cuentan
// siempre la misma historia.
// ─────────────────────────────────────────────────────────────

/** Fecha de referencia de la demo. */
export const HOY = "2026-10-22";

// ── PRNG determinístico ──────────────────────────────────────

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 */
export function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const entre = (r: () => number, min: number, max: number) =>
  Math.floor(r() * (max - min + 1)) + min;

export const elegir = <T>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)];

// ── Calendario ───────────────────────────────────────────────

export function addDays(iso: string, d: number) {
  const t = new Date(iso + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + d);
  return t.toISOString().slice(0, 10);
}

/** Días enteros entre dos fechas ISO. */
export function diasEntre(desde: string, hasta: string) {
  return Math.round(
    (new Date(hasta + "T00:00:00Z").getTime() - new Date(desde + "T00:00:00Z").getTime()) /
      86_400_000
  );
}

/** Los últimos `n` meses hasta HOY, en formato `YYYY-MM`. */
export function ultimosMeses(n: number): string[] {
  const [y, m] = HOY.slice(0, 7).split("-").map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

export const MESES_12 = ultimosMeses(12);
export const MESES_6 = ultimosMeses(6);
export const MES_ACTUAL = HOY.slice(0, 7);
