// ─────────────────────────────────────────────────────────────
// Motor de datos de la demo.
//
// A partir de tiendas, prendas y usuarios genera 12 meses de
// historia: suscripciones, ventas derivadas con su devolución,
// pruebas virtuales, campañas, tickets y solicitudes de privacidad.
//
// Está calibrado hacia atrás desde las hipótesis de los documentos,
// para que algunas metas se cumplan y otras no:
//   · precisión del talle cuando se sigue la recomendación ≈ 87 %  (meta ≥ 85 %) ✓
//   · conversión de gratuitos a Premium ≈ 4,6 %                    (meta ≥ 5 %)  ✗
//   · prueba virtual p95 ≈ 9 s                                      (meta ≤ 10 s) ✓
//   · costo de IA por suscriptor ≪ precio del plan                              ✓
//   · payback de marketing: unos canales en ≤ 6 meses, otros no
// ─────────────────────────────────────────────────────────────

import { HOY, addDays, diasEntre, elegir, entre, rng } from "./azar";
import { TIENDAS, tiendaById } from "./tiendas";
import { PRENDAS_SEED, type Prenda } from "./prendas";
import { USUARIOS_SEED, LANZAMIENTO, normal, type Canal, type UsuarioApp } from "./usuarios";
import { recomendar, type Categoria, type Medidas } from "../lib/talles";

export { HOY } from "./azar";

// ── Supuestos de negocio (editables en Configuración) ───────

export interface Supuestos {
  precioMensual: number;
  precioAnual: number;
  comisionDefecto: number;
  costoIaUsd: number;
  /** Pesos uruguayos por dólar. */
  dolar: number;
  pruebasCortesia: number;
}

export const SUPUESTOS_DEFECTO: Supuestos = {
  precioMensual: 249,
  precioAnual: 1990,
  comisionDefecto: 6,
  costoIaUsd: 0.04,
  dolar: 40,
  pruebasCortesia: 1,
};

// ── Tipos ────────────────────────────────────────────────────

export type PlanPremium = "mensual" | "anual";

export interface Suscripcion {
  id: string;
  usuarioId: string;
  plan: PlanPremium;
  inicio: string;
  /** Fecha de baja; sin fin, sigue activa. */
  fin?: string;
}

export type Feedback = "bien" | "chico" | "grande";

export interface Venta {
  id: string;
  usuarioId: string;
  prendaId: string;
  tiendaId: string;
  fecha: string;
  talle: string;
  talleRecomendado: string;
  confianza: number;
  /** El usuario compró el talle que le recomendamos. */
  siguio: boolean;
  /** Se probó la prenda en el probador antes de comprar. */
  conPrueba: boolean;
  precio: number;
  comisionPct: number;
  estado: "confirmada" | "devuelta";
  motivoDevolucion?: "talle" | "otro";
  /** Respuesta a "¿Te quedó bien el talle?". */
  feedback?: Feedback;
}

export interface Prueba {
  id: string;
  usuarioId: string;
  prendaId: string;
  fecha: string;
  talle: string;
  latenciaMs: number;
  costoUsd: number;
  ok: boolean;
  cortesia: boolean;
  modo: "ejemplo" | "foto" | "vivo";
}

export interface Campana {
  id: string;
  canal: Canal;
  nombre: string;
  mes: string;
  gasto: number;
}

export interface MensajeTicket {
  de: "cliente" | "soporte";
  texto: string;
  fecha: string;
}

export interface Ticket {
  id: string;
  origen: "usuario" | "tienda";
  autorId: string;
  asunto: string;
  categoria: "talle" | "probador" | "pago" | "cuenta" | "catalogo" | "comisiones";
  estado: "abierto" | "resuelto";
  fecha: string;
  /** Horas hasta la primera respuesta. */
  respuestaHoras: number;
  mensajes: MensajeTicket[];
}

export interface SolicitudPrivacidad {
  id: string;
  usuarioId: string;
  tipo: "borrar-foto" | "borrar-cuenta" | "exportar";
  fecha: string;
  estado: "pendiente" | "cumplida";
  cumplida?: string;
}

// ── Utilidades ───────────────────────────────────────────────

const minFecha = (a: string, b: string) => (a < b ? a : b);

export const mesDe = (iso: string) => iso.slice(0, 7);

export function mesesEntre(desde: string, hasta: string): string[] {
  const out: string[] = [];
  let [y, m] = desde.slice(0, 7).split("-").map(Number);
  const [yh, mh] = hasta.slice(0, 7).split("-").map(Number);
  while (y < yh || (y === yh && m <= mh)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

/** Meses de vida de la plataforma, de noviembre 2025 a hoy. */
export const MESES = mesesEntre(LANZAMIENTO, HOY);
export const MES_ACTUAL = mesDe(HOY);

const prendasPublicadas = PRENDAS_SEED.filter(
  (p) => p.estado === "publicada" && tiendaById(p.tiendaId)?.estado === "activa"
);

export const compatible = (p: Prenda, m: Medidas) =>
  p.genero === "unisex" || p.genero === m.genero;

/** Probabilidad base de devolución por talle cuando se siguió la recomendación. */
const DEV_BASE: Record<Categoria, number> = {
  remera: 0.102,
  buzo: 0.116,
  camisa: 0.16,
  campera: 0.131,
  vestido: 0.217,
  jean: 0.29,
  pantalon: 0.203,
  short: 0.145,
  pollera: 0.174,
};

// ── Suscripciones ────────────────────────────────────────────

const CONVIERTE: Record<Canal, number> = {
  tiktok: 0.036,
  instagram: 0.043,
  influencer: 0.083,
  referidos: 0.066,
  organico: 0.047,
  google: 0.032,
};

function generarSuscripciones(usuarios: UsuarioApp[]): Suscripcion[] {
  const r = rng("suscripciones");
  const out: Suscripcion[] = [];
  for (const u of usuarios) {
    if (u.id === "u-sofi") {
      out.push({ id: "s-sofi", usuarioId: u.id, plan: "mensual", inicio: "2026-06-03" });
      continue;
    }
    if (u.demo) continue;
    if (r() > CONVIERTE[u.canal]) continue;
    const inicio = addDays(u.fechaAlta, entre(r, 1, 45));
    if (inicio > HOY) continue;
    const plan: PlanPremium = r() < 0.28 ? "anual" : "mensual";
    let fin: string | undefined;
    if (plan === "mensual") {
      // Churn mensual de ~7 %.
      const meses = diasEntre(inicio, HOY) / 30;
      for (let k = 1; k <= meses; k++) {
        if (r() < 0.07) {
          fin = addDays(inicio, k * 30);
          break;
        }
      }
    }
    // Quien deja de usar la app, deja de pagar.
    if (!fin && u.ultimaActividad < addDays(HOY, -45) && plan === "mensual") {
      fin = addDays(u.ultimaActividad, entre(r, 5, 30));
      if (fin < inicio) fin = addDays(inicio, 30);
    }
    out.push({ id: `s${out.length + 1}`, usuarioId: u.id, plan, inicio, fin: fin && fin <= HOY ? fin : undefined });
  }
  return out;
}

export const esPremiumEn = (subs: Suscripcion[], usuarioId: string, fecha: string) =>
  subs.some((s) => s.usuarioId === usuarioId && s.inicio <= fecha && (!s.fin || s.fin > fecha));

// ── Ventas derivadas ─────────────────────────────────────────

function generarVentas(usuarios: UsuarioApp[], subs: Suscripcion[]): Venta[] {
  const r = rng("ventas");
  const out: Venta[] = [];
  const porUsuario = new Map<string, Suscripcion[]>();
  for (const s of subs) porUsuario.set(s.usuarioId, [...(porUsuario.get(s.usuarioId) ?? []), s]);

  for (const u of usuarios) {
    if (!u.medidas || u.id === "u-nuevo") continue;
    const dias = diasEntre(u.fechaAlta, u.ultimaActividad);
    const premium = (porUsuario.get(u.id) ?? []).length > 0;
    // Compras esperadas por mes activo.
    const tasa = premium ? 0.75 : 0.32;
    const n = u.demo ? (u.id === "u-sofi" ? 7 : 2) : Math.round((dias / 30) * tasa * (0.5 + r()));
    const candidatas = prendasPublicadas.filter((p) => compatible(p, u.medidas!));
    for (let k = 0; k < n; k++) {
      const fecha = addDays(u.fechaAlta, Math.floor(r() * Math.max(1, dias)));
      const disponibles = candidatas.filter((p) => tiendaById(p.tiendaId)!.fechaAlta <= fecha);
      if (disponibles.length === 0) continue;
      const prenda = elegir(r, disponibles);
      const rec = recomendar(prenda.tabla, prenda.categoria, u.medidas);
      if (!rec) continue;
      const eraPremium = esPremiumEn(subs, u.id, fecha);
      const conPrueba = eraPremium ? r() < 0.7 : false;
      const siguio = r() < (conPrueba ? 0.93 : 0.8);
      let talle = rec.talle;
      if (!siguio) {
        const otros = rec.ranking.slice(1, 3).map((x) => x.talle);
        talle = otros.length ? elegir(r, otros) : rec.talle;
      }
      const iT = prenda.talles.indexOf(talle);
      const iR = prenda.talles.indexOf(rec.talle);

      let pDev = siguio
        ? DEV_BASE[prenda.categoria] * (2.1 - (rec.confianza / 100) * 1.45)
        : 0.34;
      // Tienda Norte fue la tienda piloto: sus tablas se revisaron con el equipo.
      if (prenda.tiendaId === "norte") pDev *= 0.72;
      if (conPrueba) pDev *= 0.75;
      // Las tiendas con molde chico confunden más a quien no sigue la recomendación.
      if (!siguio) pDev += Math.abs(tiendaById(prenda.tiendaId)!.sesgoTalle) * 0.02;
      const x = r();
      let estado: Venta["estado"] = "confirmada";
      let motivo: Venta["motivoDevolucion"];
      if (x < pDev) {
        estado = "devuelta";
        motivo = "talle";
      } else if (x < pDev + 0.05) {
        estado = "devuelta";
        motivo = "otro";
      }
      let feedback: Feedback | undefined;
      if (r() < 0.62) {
        if (motivo === "talle") {
          // Si compró más chico que lo recomendado o la tabla le quedaba justa, le quedó chico.
          const chico = siguio ? rec.zonas.some((z) => z.veredicto === "justo" || z.veredicto === "chico") || r() < 0.5 : iT < iR;
          feedback = chico ? "chico" : "grande";
        } else feedback = "bien";
      }
      const tienda = tiendaById(prenda.tiendaId)!;
      out.push({
        id: `v${String(out.length + 1).padStart(5, "0")}`,
        usuarioId: u.id,
        prendaId: prenda.id,
        tiendaId: prenda.tiendaId,
        fecha,
        talle,
        talleRecomendado: rec.talle,
        confianza: rec.confianza,
        siguio,
        conPrueba,
        precio: prenda.precio,
        comisionPct: tienda.comisionPct,
        estado,
        motivoDevolucion: motivo,
        feedback,
      });
    }
  }
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ── Pruebas virtuales ────────────────────────────────────────

/** Latencia con cola larga: mediana ~5,4 s, p95 ~9 s. */
const latencia = (r: () => number) =>
  Math.round(Math.min(19000, Math.max(2600, Math.exp(normal(r, Math.log(5400), 0.31)))));

function generarPruebas(usuarios: UsuarioApp[], subs: Suscripcion[], ventas: Venta[]): Prueba[] {
  const r = rng("pruebas");
  const out: Prueba[] = [];
  const umap = new Map(usuarios.map((u) => [u.id, u]));
  const nueva = (usuarioId: string, prendaId: string, fecha: string, talle: string, cortesia: boolean) => {
    const ok = r() > 0.025;
    out.push({
      id: `p${String(out.length + 1).padStart(5, "0")}`,
      usuarioId,
      prendaId,
      fecha,
      talle,
      latenciaMs: latencia(r),
      costoUsd: ok ? Math.round((0.032 + r() * 0.018) * 1000) / 1000 : 0.01,
      ok,
      cortesia,
      modo: r() < 0.82 ? "foto" : "vivo",
    });
  };

  // Las compras con prueba tienen su prueba ese día.
  for (const v of ventas) if (v.conPrueba) nueva(v.usuarioId, v.prendaId, v.fecha, v.talle, false);

  // Uso libre de los Premium.
  for (const s of subs) {
    const u = umap.get(s.usuarioId);
    if (!u?.medidas) continue;
    const hasta = s.fin ?? (u.ultimaActividad < HOY ? u.ultimaActividad : HOY);
    const dias = Math.max(1, diasEntre(s.inicio, hasta));
    const n = Math.round((dias / 30) * entre(r, 6, 16));
    const candidatas = prendasPublicadas.filter((p) => compatible(p, u.medidas!));
    for (let k = 0; k < n; k++) {
      const p = elegir(r, candidatas);
      nueva(u.id, p.id, addDays(s.inicio, Math.floor(r() * dias)), elegir(r, p.talles), false);
    }
  }

  // Muchos Premium empezaron por la prueba de cortesía.
  for (const s of subs) {
    const u = umap.get(s.usuarioId);
    if (!u?.medidas || u.demo || r() > 0.55) continue;
    const p = elegir(r, prendasPublicadas.filter((x) => compatible(x, u.medidas!)));
    const f = addDays(s.inicio, -entre(r, 0, 10));
    nueva(u.id, p.id, f < u.fechaAlta ? u.fechaAlta : f, elegir(r, p.talles), true);
  }

  // La prueba de cortesía de los gratuitos.
  const premium = new Set(subs.map((s) => s.usuarioId));
  for (const u of usuarios) {
    if (premium.has(u.id) || !u.medidas || u.demo) continue;
    if (r() < 0.38) {
      const p = elegir(r, prendasPublicadas.filter((x) => compatible(x, u.medidas!)));
      nueva(u.id, p.id, addDays(u.fechaAlta, entre(r, 0, Math.max(0, diasEntre(u.fechaAlta, u.ultimaActividad)))), elegir(r, p.talles), true);
    }
  }
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// ── Campañas de marketing ────────────────────────────────────

function generarCampanas(): Campana[] {
  const r = rng("campanas");
  const out: Campana[] = [];
  const nombres: Record<Canal, string[]> = {
    tiktok: ["Reto #MiTalle", "Antes y después", "Probador en 10 s", "Unboxing sin devolución"],
    instagram: ["Reels de lanzamiento", "Carrusel de tiendas", "Stories con encuesta"],
    influencer: ["@vale.outfits", "@tomi.urbano", "@lu.closet", "@fede.fits", "@cami.moda"],
    google: ["Búsqueda: talle jean", "Búsqueda: probador virtual"],
    referidos: [],
    organico: [],
  };
  const gastoBase: Record<Canal, [number, number]> = {
    tiktok: [4500, 10500],
    instagram: [3750, 8750],
    influencer: [7500, 22500],
    google: [3000, 6250],
    referidos: [0, 0],
    organico: [0, 0],
  };
  for (const mes of MESES) {
    for (const canal of ["tiktok", "instagram", "influencer", "google"] as Canal[]) {
      if (canal === "google" && r() < 0.5) continue;
      if (canal === "influencer" && r() < 0.25) continue;
      const [a, b] = gastoBase[canal];
      out.push({
        id: `c${out.length + 1}`,
        canal,
        nombre: elegir(r, nombres[canal]),
        mes,
        gasto: Math.round((a + r() * (b - a)) / 250) * 250,
      });
    }
  }
  return out;
}

// ── Soporte ──────────────────────────────────────────────────

const TEMAS: { origen: Ticket["origen"]; categoria: Ticket["categoria"]; asunto: string; cliente: string; soporte: string }[] = [
  { origen: "usuario", categoria: "talle", asunto: "Me recomendó M y me quedó chico", cliente: "Compré el jean en M como decía la app y no me cierra. ¿Puede ser que mis medidas estén mal?", soporte: "¡Gracias por avisar! Revisamos la tabla de esa prenda y la tienda la tenía mal cargada en la cintura. Ya está corregida; te sugerimos volver a medir la cintura a la altura del ombligo." },
  { origen: "usuario", categoria: "probador", asunto: "La prueba virtual tardó mucho", cliente: "Subí la foto y estuvo como 20 segundos cargando.", soporte: "Tuvimos una demora puntual del proveedor a esa hora. Ya está normalizado y te devolvimos la prueba." },
  { origen: "usuario", categoria: "pago", asunto: "Me cobraron dos veces Premium", cliente: "Veo dos cargos de $ 249 este mes.", soporte: "Uno de los cargos era una preautorización y se liberó solo. Igual te dejamos el comprobante." },
  { origen: "usuario", categoria: "cuenta", asunto: "¿Cómo borro mi foto?", cliente: "Quiero que no quede guardada mi foto.", soporte: "Desde Perfil → Privacidad → Borrar mi foto. Se elimina en el momento." },
  { origen: "usuario", categoria: "talle", asunto: "No sé cómo medirme la cadera", cliente: "¿Dónde mido exactamente la cadera?", soporte: "En la parte más ancha, con los pies juntos. En Mis medidas hay una guía con dibujos." },
  { origen: "usuario", categoria: "probador", asunto: "La foto no se ve bien", cliente: "La prenda quedó corrida en mi foto.", soporte: "Funciona mejor con una foto de frente, de cuerpo entero y fondo liso. ¡Probá de nuevo!" },
  { origen: "tienda", categoria: "catalogo", asunto: "Error al subir el CSV", cliente: "Me dice que faltan columnas pero están todas.", soporte: "La columna de talles tenía otro nombre. Ya la mapeamos; en la carga podés elegir a qué campo corresponde cada columna." },
  { origen: "tienda", categoria: "comisiones", asunto: "Duda con la liquidación de setiembre", cliente: "¿Las devoluciones se descuentan de la comisión?", soporte: "Sí: una venta devuelta no comisiona. En Comisiones está el detalle venta por venta." },
  { origen: "tienda", categoria: "catalogo", asunto: "¿Puedo usar la misma tabla para varias prendas?", cliente: "Tengo 20 remeras con la misma moldería.", soporte: "Sí, en Tablas de talles podés crear una plantilla y aplicarla a varias prendas a la vez." },
  { origen: "tienda", categoria: "talle", asunto: "Muchas devoluciones en un jean", cliente: "El Jean mom se devuelve mucho por talle.", soporte: "La tabla tenía la cadera 4 cm por debajo de la real. Te dejamos marcadas las prendas con la misma alerta." },
];

function generarTickets(usuarios: UsuarioApp[]): Ticket[] {
  const r = rng("tickets");
  const out: Ticket[] = [];
  const activos = TIENDAS.filter((t) => t.estado !== "pausada");
  for (let i = 0; i < 46; i++) {
    const tema = elegir(r, TEMAS);
    const fecha = i < 4 ? addDays(HOY, -entre(r, 0, 2)) : addDays(HOY, -entre(r, 3, 120));
    // Los primeros cuatro (los más recientes) quedan abiertos, sin respuesta.
    const abierto = i < 4;
    const respuestaHoras = Math.round(Math.max(0.2, normal(r, 3.5, 2.5)) * 10) / 10;
    const autorId = tema.origen === "usuario" ? elegir(r, usuarios.filter((u) => !u.demo)).id : elegir(r, activos).id;
    out.push({
      id: `t${String(i + 1).padStart(3, "0")}`,
      origen: tema.origen,
      autorId,
      asunto: tema.asunto,
      categoria: tema.categoria,
      estado: abierto ? "abierto" : "resuelto",
      fecha,
      respuestaHoras: abierto ? 0 : respuestaHoras,
      mensajes: abierto
        ? [{ de: "cliente", texto: tema.cliente, fecha }]
        : [
            { de: "cliente", texto: tema.cliente, fecha },
            { de: "soporte", texto: tema.soporte, fecha },
          ],
    });
  }
  return out.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function generarPrivacidad(usuarios: UsuarioApp[]): SolicitudPrivacidad[] {
  const r = rng("privacidad");
  const out: SolicitudPrivacidad[] = [];
  const conFoto = usuarios.filter((u) => u.conFoto && !u.demo);
  for (let i = 0; i < 18; i++) {
    const tipo = elegir<SolicitudPrivacidad["tipo"]>(r, ["borrar-foto", "borrar-foto", "borrar-cuenta", "exportar"]);
    const fecha = addDays(HOY, -entre(r, 0, 90));
    // Dos solicitudes recientes quedan pendientes, para resolverlas en la demo.
    const pendiente = i < 2 || (diasEntre(fecha, HOY) < 3 && r() < 0.6);
    out.push({
      id: `pr${i + 1}`,
      usuarioId: elegir(r, conFoto).id,
      tipo,
      fecha,
      estado: pendiente ? "pendiente" : "cumplida",
      cumplida: pendiente ? undefined : minFecha(addDays(fecha, tipo === "borrar-foto" ? 0 : entre(r, 1, 6)), HOY),
    });
  }
  return out.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// ── Salida ───────────────────────────────────────────────────

export const USUARIOS = USUARIOS_SEED;
export const SUSCRIPCIONES_SEED = generarSuscripciones(USUARIOS);
export const VENTAS_SEED = generarVentas(USUARIOS, SUSCRIPCIONES_SEED);
export const PRUEBAS_SEED = generarPruebas(USUARIOS, SUSCRIPCIONES_SEED, VENTAS_SEED);
export const CAMPANAS = generarCampanas();
export const TICKETS_SEED = generarTickets(USUARIOS);
export const PRIVACIDAD_SEED = generarPrivacidad(USUARIOS);

export const comisionDe = (v: Pick<Venta, "precio" | "comisionPct" | "estado">) =>
  v.estado === "devuelta" ? 0 : (v.precio * v.comisionPct) / 100;
