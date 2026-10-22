// ─────────────────────────────────────────────────────────────
// Métricas del negocio, calculadas siempre sobre los datos vivos del
// store (seed + lo que se hizo en la sesión). Las usan el admin, el
// portal de tienda y la pantalla de hipótesis.
// ─────────────────────────────────────────────────────────────

import {
  HOY,
  MESES,
  comisionDe,
  mesDe,
  type Campana,
  type Prueba,
  type Supuestos,
  type Suscripcion,
  type Venta,
} from "../data/seed";
import { addDays, diasEntre } from "../data/azar";
import { CANALES, type Canal, type UsuarioApp } from "../data/usuarios";
import type { Prenda } from "../data/prendas";
import { tablaCompleta } from "../data/prendas";
import type { Tienda } from "../data/tiendas";
import type { Store } from "./store";

export const finDeMes = (mes: string) => {
  const [y, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};

export const activoEn = (u: UsuarioApp, mes: string) =>
  u.fechaAlta <= finDeMes(mes) && u.ultimaActividad >= `${mes}-01`;

export const subActivaEn = (s: Suscripcion, fecha: string) =>
  s.inicio <= fecha && (!s.fin || s.fin > fecha);

export const percentil = (xs: number[], p: number) => {
  if (xs.length === 0) return 0;
  const o = [...xs].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor(o.length * p))];
};

// ── Precisión del recomendador ───────────────────────────────

/** % de compras que siguieron la recomendación y NO se devolvieron por talle. */
export function precision(ventas: Venta[]) {
  const sig = ventas.filter((v) => v.siguio);
  if (sig.length === 0) return 0;
  return (1 - sig.filter((v) => v.motivoDevolucion === "talle").length / sig.length) * 100;
}

export const tasaDevTalle = (ventas: Venta[]) =>
  ventas.length ? (ventas.filter((v) => v.motivoDevolucion === "talle").length / ventas.length) * 100 : 0;

// ── Ingresos ─────────────────────────────────────────────────

/** Ingreso por suscripciones en un mes: mensuales cobran el precio; anuales, un doceavo. */
export function ingresoSuscripcionesMes(subs: Suscripcion[], mes: string, sup: Supuestos) {
  const fecha = finDeMes(mes) < HOY ? finDeMes(mes) : HOY;
  let total = 0;
  for (const s of subs) {
    if (s.inicio > fecha || (s.fin && s.fin < `${mes}-01`)) continue;
    total += s.plan === "mensual" ? sup.precioMensual : sup.precioAnual / 12;
  }
  return total;
}

export const comisionesMes = (ventas: Venta[], mes: string) =>
  ventas.filter((v) => mesDe(v.fecha) === mes).reduce((a, v) => a + comisionDe(v), 0);

export const costoIaMes = (pruebas: Prueba[], mes: string, sup: Supuestos) =>
  pruebas.filter((p) => mesDe(p.fecha) === mes).reduce((a, p) => a + p.costoUsd, 0) * sup.dolar;

export interface PuntoMes {
  mes: string;
  activos: number;
  nuevos: number;
  premium: number;
  ventas: number;
  gmv: number;
  comisiones: number;
  suscripciones: number;
  ingresos: number;
  costoIa: number;
  pruebas: number;
  devTalle: number;
  marketing: number;
}

export function serieMensual(s: Pick<Store, "usuarios" | "suscripciones" | "ventas" | "pruebas" | "campanas" | "supuestos">): PuntoMes[] {
  return MESES.map((mes) => {
    const vm = s.ventas.filter((v) => mesDe(v.fecha) === mes);
    const fecha = finDeMes(mes) < HOY ? finDeMes(mes) : HOY;
    const suscripciones = ingresoSuscripcionesMes(s.suscripciones, mes, s.supuestos);
    const comisiones = vm.reduce((a, v) => a + comisionDe(v), 0);
    return {
      mes,
      activos: s.usuarios.filter((u) => activoEn(u, mes)).length,
      nuevos: s.usuarios.filter((u) => mesDe(u.fechaAlta) === mes).length,
      premium: s.suscripciones.filter((x) => subActivaEn(x, fecha)).length,
      ventas: vm.length,
      gmv: vm.filter((v) => v.estado === "confirmada").reduce((a, v) => a + v.precio, 0),
      comisiones,
      suscripciones,
      ingresos: suscripciones + comisiones,
      costoIa: costoIaMes(s.pruebas, mes, s.supuestos),
      pruebas: s.pruebas.filter((p) => mesDe(p.fecha) === mes).length,
      devTalle: tasaDevTalle(vm),
      marketing: s.campanas.filter((c) => c.mes === mes).reduce((a, c) => a + c.gasto, 0),
    };
  });
}

// ── Conversión y retención ───────────────────────────────────

/** % de usuarios (con al menos 14 días en la app) que alguna vez pagaron Premium. */
export function conversionPremium(usuarios: UsuarioApp[], subs: Suscripcion[]) {
  const base = usuarios.filter((u) => !u.demo && u.fechaAlta <= addDays(HOY, -14));
  const pagaron = new Set(subs.map((s) => s.usuarioId));
  return base.length ? (base.filter((u) => pagaron.has(u.id)).length / base.length) * 100 : 0;
}

/** % de usuarios que siguen activos `dias` después de su alta. */
export function retencion(usuarios: UsuarioApp[], dias: number) {
  const base = usuarios.filter((u) => !u.demo && u.fechaAlta <= addDays(HOY, -dias));
  if (base.length === 0) return 0;
  return (base.filter((u) => diasEntre(u.fechaAlta, u.ultimaActividad) >= dias).length / base.length) * 100;
}

/** % que vuelve a usar la app después de su primera compra (30 días o más). */
export function usoTrasPrimeraCompra(usuarios: UsuarioApp[], ventas: Venta[]) {
  const primera = new Map<string, string>();
  for (const v of ventas) if (!primera.has(v.usuarioId) || v.fecha < primera.get(v.usuarioId)!) primera.set(v.usuarioId, v.fecha);
  const umap = new Map(usuarios.map((u) => [u.id, u]));
  let base = 0;
  let siguen = 0;
  for (const [id, f] of primera) {
    if (f > addDays(HOY, -30)) continue;
    const u = umap.get(id);
    if (!u) continue;
    base++;
    if (diasEntre(f, u.ultimaActividad) >= 30) siguen++;
  }
  return base ? (siguen / base) * 100 : 0;
}

// ── Probador y costos ────────────────────────────────────────

export function costoIaPorSuscriptor(pruebas: Prueba[], subs: Suscripcion[], sup: Supuestos) {
  // Últimos 90 días: costo de las pruebas de suscriptores / meses-suscriptor.
  const desde = addDays(HOY, -90);
  const premium = new Set(subs.map((s) => s.usuarioId));
  const costo = pruebas
    .filter((p) => p.fecha >= desde && premium.has(p.usuarioId) && !p.cortesia)
    .reduce((a, p) => a + p.costoUsd, 0);
  const mesesSub = subs.reduce((a, s) => {
    const ini = s.inicio > desde ? s.inicio : desde;
    const fin = s.fin && s.fin < HOY ? s.fin : HOY;
    return a + Math.max(0, diasEntre(ini, fin)) / 30;
  }, 0);
  return mesesSub ? (costo / mesesSub) * sup.dolar : 0;
}

// ── Marketing ────────────────────────────────────────────────

export interface FilaCanal {
  canal: Canal;
  nombre: string;
  gasto: number;
  altas: number;
  premium: number;
  cac: number;
  /** Ingreso mensual promedio por usuario del canal. */
  arpu: number;
  /** Meses para recuperar el costo de adquisición. */
  payback: number | null;
}

export function marketingPorCanal(
  s: Pick<Store, "usuarios" | "suscripciones" | "ventas" | "campanas" | "supuestos">
): FilaCanal[] {
  const subsPor = new Map<string, Suscripcion[]>();
  for (const x of s.suscripciones) subsPor.set(x.usuarioId, [...(subsPor.get(x.usuarioId) ?? []), x]);
  const comPor = new Map<string, number>();
  for (const v of s.ventas) comPor.set(v.usuarioId, (comPor.get(v.usuarioId) ?? 0) + comisionDe(v));

  return CANALES.map(({ id, nombre }) => {
    const us = s.usuarios.filter((u) => u.canal === id && !u.demo);
    const gasto = s.campanas.filter((c) => c.canal === id).reduce((a, c) => a + c.gasto, 0);
    let ingresos = 0;
    let mesesUsuario = 0;
    let premium = 0;
    for (const u of us) {
      mesesUsuario += Math.max(1, diasEntre(u.fechaAlta, HOY)) / 30;
      ingresos += comPor.get(u.id) ?? 0;
      const subs = subsPor.get(u.id) ?? [];
      if (subs.length) premium++;
      for (const x of subs) {
        const meses = Math.max(1, diasEntre(x.inicio, x.fin ?? HOY) / 30);
        ingresos += x.plan === "mensual" ? meses * s.supuestos.precioMensual : s.supuestos.precioAnual;
      }
    }
    const arpu = mesesUsuario ? ingresos / mesesUsuario : 0;
    const cac = us.length ? gasto / us.length : 0;
    return {
      canal: id,
      nombre,
      gasto,
      altas: us.length,
      premium,
      cac,
      arpu,
      payback: gasto > 0 && arpu > 0 ? cac / arpu : null,
    };
  });
}

// ── Tiendas ──────────────────────────────────────────────────

export interface ResumenTienda {
  tienda: Tienda;
  prendas: number;
  publicadas: number;
  completas: number;
  ventas: number;
  gmv: number;
  comisiones: number;
  devTalle: number;
  devTalleAntes: number;
}

export function resumenTiendas(tiendas: Tienda[], prendas: Prenda[], ventas: Venta[]): ResumenTienda[] {
  return tiendas.map((t) => {
    const ps = prendas.filter((p) => p.tiendaId === t.id);
    const vs = ventas.filter((v) => v.tiendaId === t.id);
    return {
      tienda: t,
      prendas: ps.length,
      publicadas: ps.filter((p) => p.estado === "publicada").length,
      completas: ps.filter(tablaCompleta).length,
      ventas: vs.length,
      gmv: vs.filter((v) => v.estado === "confirmada").reduce((a, v) => a + v.precio, 0),
      comisiones: vs.reduce((a, v) => a + comisionDe(v), 0),
      devTalle: tasaDevTalle(vs),
      devTalleAntes: t.devTalleAntes,
    };
  });
}

// ── Hipótesis de los documentos ──────────────────────────────

export type TipoRiesgo = "Factibilidad" | "Viabilidad" | "Deseabilidad";

export interface Hipotesis {
  id: string;
  tipo: TipoRiesgo;
  hipotesis: string;
  metrica: string;
  valor: string;
  meta: string;
  /** null: no hay meta numérica, es un dato para discutir. */
  cumple: boolean | null;
  ruta: string;
}

const fmt = (n: number, dec = 1) => n.toFixed(dec).replace(".", ",");

export function hipotesis(s: Store): Hipotesis[] {
  const prec = precision(s.ventas);
  const lat = s.pruebas.filter((p) => p.fecha >= addDays(HOY, -90)).map((p) => p.latenciaMs);
  const p95 = percentil(lat, 0.95) / 1000;
  const costoSub = costoIaPorSuscriptor(s.pruebas, s.suscripciones, s.supuestos);
  const conv = conversionPremium(s.usuarios, s.suscripciones);
  const canales = marketingPorCanal(s);
  const pagos = canales.filter((c) => c.payback !== null);
  const okPayback = pagos.filter((c) => c.payback! <= 6).length;
  const tiendasActivas = s.tiendas.filter((t) => t.estado !== "pausada");
  const prendasActivas = s.prendas.filter((p) => tiendasActivas.some((t) => t.id === p.tiendaId));
  const completas = prendasActivas.length ? (prendasActivas.filter(tablaCompleta).length / prendasActivas.length) * 100 : 0;
  const reales = s.usuarios.filter((u) => !u.demo);
  const conFoto = (reales.filter((u) => u.conFoto).length / reales.length) * 100;
  const resumen = resumenTiendas(s.tiendas.filter((t) => t.estado === "activa"), s.prendas, s.ventas);
  const conVentas = resumen.filter((r) => r.ventas >= 10);
  const bajaron = conVentas.filter((r) => r.devTalle < r.devTalleAntes).length;
  const comisionMedia = s.tiendas.filter((t) => t.estado === "activa").reduce((a, t) => a + t.comisionPct, 0) / Math.max(1, s.tiendas.filter((t) => t.estado === "activa").length);
  const ret = usoTrasPrimeraCompra(s.usuarios, s.ventas);
  const mejorCanal = [...canales].filter((c) => c.altas > 0).sort((a, b) => b.premium / b.altas - a.premium / a.altas)[0];
  const solicitudesTarde = s.privacidad.filter((p) => p.estado === "cumplida" && p.cumplida && diasEntre(p.fecha, p.cumplida) > 10).length;
  const ingresosMes = ingresoSuscripcionesMes(s.suscripciones, mesDe(HOY), s.supuestos);
  const premiumHoy = s.suscripciones.filter((x) => subActivaEn(x, HOY)).length;

  return [
    {
      id: "F1",
      tipo: "Factibilidad",
      hipotesis: "El algoritmo recomienda el talle correcto en al menos el 85 % de los casos.",
      metrica: "Compras que siguieron la recomendación y no se devolvieron por talle",
      valor: `${fmt(prec)} %`,
      meta: "≥ 85 %",
      cumple: prec >= 85,
      ruta: "/admin/precision",
    },
    {
      id: "F2",
      tipo: "Factibilidad",
      hipotesis: "La IA genera una prueba virtual realista con una sola foto, en no más de 10 segundos.",
      metrica: "Tiempo de la prueba virtual, percentil 95 (últimos 90 días)",
      valor: `${fmt(p95)} s`,
      meta: "≤ 10 s",
      cumple: p95 <= 10,
      ruta: "/admin/probador",
    },
    {
      id: "F3",
      tipo: "Factibilidad",
      hipotesis: "Las tiendas comparten sus catálogos y las medidas de todas sus prendas.",
      metrica: "Prendas con tabla de talles completa",
      valor: `${fmt(completas)} %`,
      meta: "≥ 90 %",
      cumple: completas >= 90,
      ruta: "/admin/catalogo",
    },
    {
      id: "F5",
      tipo: "Factibilidad",
      hipotesis: "Podemos almacenar los datos de los usuarios de forma segura y cumplir la normativa.",
      metrica: "Solicitudes de privacidad cumplidas fuera de plazo (10 días)",
      valor: String(solicitudesTarde),
      meta: "0",
      cumple: solicitudesTarde === 0,
      ruta: "/admin/privacidad",
    },
    {
      id: "V1",
      tipo: "Viabilidad",
      hipotesis: "Al menos un 5 % de los usuarios gratuitos se pasa a un plan pago.",
      metrica: "Usuarios que alguna vez pagaron Premium",
      valor: `${fmt(conv)} %`,
      meta: "≥ 5 %",
      cumple: conv >= 5,
      ruta: "/admin/suscripciones",
    },
    {
      id: "V2",
      tipo: "Viabilidad",
      hipotesis: "Las tiendas ceden una comisión porque les bajamos las devoluciones por talle.",
      metrica: "Tiendas activas que bajaron sus devoluciones por talle (con 10+ ventas)",
      valor: `${bajaron} de ${conVentas.length}`,
      meta: "Comisión media " + fmt(comisionMedia) + " %",
      cumple: conVentas.length > 0 && bajaron / conVentas.length >= 0.8,
      ruta: "/admin/tiendas",
    },
    {
      id: "V3",
      tipo: "Viabilidad",
      hipotesis: "El costo de IA por prueba virtual es menor que lo que paga el suscriptor.",
      metrica: "Costo de IA por suscriptor por mes vs. precio del plan mensual",
      valor: `$ ${Math.round(costoSub)} de $ ${s.supuestos.precioMensual}`,
      meta: "Costo < precio",
      cumple: costoSub < s.supuestos.precioMensual,
      ruta: "/admin/probador",
    },
    {
      id: "V4",
      tipo: "Viabilidad",
      hipotesis: "Lo gastado en marketing se recupera en un máximo de 6 meses.",
      metrica: "Canales pagos con payback ≤ 6 meses",
      valor: `${okPayback} de ${pagos.length}`,
      meta: "Todos",
      cumple: pagos.length > 0 && okPayback === pagos.length,
      ruta: "/admin/marketing",
    },
    {
      id: "V5",
      tipo: "Viabilidad",
      hipotesis: "Cubrimos los costos fijos con suscripciones y comisiones.",
      metrica: `Ingreso por suscripciones este mes (${premiumHoy} suscriptores)`,
      valor: `$ ${Math.round(ingresosMes).toLocaleString("es-UY")}`,
      meta: "Ver costos fijos",
      cumple: null,
      ruta: "/admin/suscripciones",
    },
    {
      id: "D2",
      tipo: "Deseabilidad",
      hipotesis: "Los usuarios están dispuestos a subir una foto propia para ver cómo les queda la prenda.",
      metrica: "Usuarios con foto cargada",
      valor: `${fmt(conFoto)} %`,
      meta: "Sin meta",
      cumple: null,
      ruta: "/admin/usuarios",
    },
    {
      id: "D4",
      tipo: "Deseabilidad",
      hipotesis: "Redes sociales e influencers son el canal más efectivo para llegar a los jóvenes.",
      metrica: "Canal con mayor conversión a Premium",
      valor: mejorCanal ? mejorCanal.nombre : "—",
      meta: "Influencers o redes",
      cumple: mejorCanal ? ["influencer", "tiktok", "instagram"].includes(mejorCanal.canal) : null,
      ruta: "/admin/marketing",
    },
    {
      id: "D5",
      tipo: "Deseabilidad",
      hipotesis: "Los usuarios siguen usando la app después de la primera compra.",
      metrica: "Siguen activos 30 días después de su primera compra",
      valor: `${fmt(ret)} %`,
      meta: "≥ 50 %",
      cumple: ret >= 50,
      ruta: "/admin/usuarios",
    },
  ];
}

export type { Campana };
