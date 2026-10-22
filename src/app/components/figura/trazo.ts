/** Polígono cerrado con las esquinas redondeadas (radio en px). */
export function suave(xs: [number, number][], r = 6): string {
  const n = xs.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = xs[(i - 1 + n) % n];
    const cur = xs[i];
    const next = xs[(i + 1) % n];
    const a = recortar(cur, prev, r);
    const b = recortar(cur, next, r);
    d += `${i === 0 ? "M" : "L"}${a[0].toFixed(1)},${a[1].toFixed(1)} Q${cur[0].toFixed(1)},${cur[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} `;
  }
  return d + "Z";
}

/** Punto a distancia `r` de `desde` en dirección a `hacia` (como mucho, la mitad del lado). */
function recortar(desde: [number, number], hacia: [number, number], r: number): [number, number] {
  const dx = hacia[0] - desde[0];
  const dy = hacia[1] - desde[1];
  const len = Math.hypot(dx, dy) || 1;
  const k = Math.min(r, len / 2) / len;
  return [desde[0] + dx * k, desde[1] + dy * k];
}

/** Espeja una lista de puntos del lado izquierdo al derecho, sobre x = cx. */
export const espejo = (xs: [number, number][], cx = 120): [number, number][] =>
  xs.map(([x, y]) => [2 * cx - x, y] as [number, number]).reverse();
