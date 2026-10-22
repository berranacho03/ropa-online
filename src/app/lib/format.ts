/** Formateo consistente de moneda, números y fechas en toda la maqueta. */

const nfMoneda = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const nfMonedaDec = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const nfNum = new Intl.NumberFormat("es-UY");

export const money = (n: number) => nfMoneda.format(Math.round(n));
export const moneyDec = (n: number) => nfMonedaDec.format(n);
export const num = (n: number) => nfNum.format(n);

/** Compacta cifras grandes para los KPI: 1.2 M, 385 k. */
export function moneyCorto(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$ ${(n / 1_000_000).toFixed(1).replace(".", ",")} M`;
  if (abs >= 10_000) return `$ ${Math.round(n / 1000)} k`;
  return money(n);
}

export const pct = (n: number, dec = 0) =>
  `${n >= 0 ? "" : "−"}${Math.abs(n).toFixed(dec).replace(".", ",")} %`;

const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "set",
  "oct",
  "nov",
  "dic",
];

const MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "setiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** ISO `2026-09-04` → `04 set 2026`. */
export function fecha(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d} ${MESES[Number(m) - 1]} ${y}`;
}

/** ISO → `4 de setiembre de 2026`. */
export function fechaLarga(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(d)} de ${MESES_LARGOS[Number(m) - 1]} de ${y}`;
}

/** `2026-09` → `set 2026`. */
export function mesCorto(ym: string) {
  const [y, m] = ym.split("-");
  return `${MESES[Number(m) - 1]} ${y.slice(2)}`;
}

export function fechaHora(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fecha(iso);
  return `${fecha(iso)} · ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

/** Días transcurridos entre una fecha ISO y hoy (la fecha fija de la demo). */
export function diasDesde(iso: string, hoy: string) {
  const a = new Date(iso.slice(0, 10)).getTime();
  const b = new Date(hoy.slice(0, 10)).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function relativo(iso: string, hoy: string) {
  const d = diasDesde(iso, hoy);
  if (d === 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 0) return `en ${Math.abs(d)} días`;
  if (d < 30) return `hace ${d} días`;
  const meses = Math.round(d / 30);
  return meses === 1 ? "hace 1 mes" : `hace ${meses} meses`;
}
