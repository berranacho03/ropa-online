// ─────────────────────────────────────────────────────────────
// Los looks de la portada: prendas reales del catálogo de ejemplo,
// puestas sobre la modelo (Ana) en el talle que el recomendador le
// da. Cada tramo del scroll es un look.
// ─────────────────────────────────────────────────────────────

import { PRENDAS_SEED, type Prenda } from "../../data/prendas";
import { TIENDAS, TIENDAS_ACTIVAS, tiendaById } from "../../data/tiendas";
import { USUARIOS_SEED } from "../../data/usuarios";
import { recomendar, type Categoria } from "../../lib/talles";
import { PERSONAS, type Puesta } from "../figura/maniqui";

export const MODELO = PERSONAS[0];

export interface ItemLook {
  prenda: Prenda;
  tienda: string;
  talle: string;
  confianza: number;
}

export interface Tramo {
  id: string;
  etiqueta: string;
  titulo: string;
  /** Parte del título resaltada con el color de marca. */
  resaltado?: string;
  bajada: string;
  items: ItemLook[];
  puestas: Puesta[];
}

/** Prenda pedida: por id, y si no está, la primera publicada con ese nombre o categoría. */
type Pedido = { id: string; nombre: string; categoria: Categoria };

const visible = (p: Prenda) =>
  p.estado === "publicada" && tiendaById(p.tiendaId)?.estado === "activa" && p.genero !== "hombre";

function buscar({ id, nombre, categoria }: Pedido): Prenda {
  return (
    PRENDAS_SEED.find((p) => p.id === id && visible(p)) ??
    PRENDAS_SEED.find((p) => p.nombre === nombre && visible(p)) ??
    PRENDAS_SEED.find((p) => p.categoria === categoria && visible(p)) ??
    PRENDAS_SEED[0]
  );
}

function item(pedido: Pedido): ItemLook {
  const prenda = buscar(pedido);
  const r = recomendar(prenda.tabla, prenda.categoria, MODELO.medidas);
  return {
    prenda,
    tienda: tiendaById(prenda.tiendaId)?.nombre ?? "",
    talle: r?.talle ?? prenda.talles[Math.floor(prenda.talles.length / 2)],
    confianza: r?.confianza ?? 80,
  };
}

const CIFRAS = {
  tiendas: TIENDAS_ACTIVAS.length,
  usuarios: USUARIOS_SEED.length,
  prendas: PRENDAS_SEED.filter(visible).length,
  /** % promedio de ventas online que las tiendas devolvían por talle antes de sumarse. */
  devAntes: Math.round(TIENDAS.reduce((a, t) => a + t.devTalleAntes, 0) / TIENDAS.length),
};
export { CIFRAS };

const crudos: (Omit<Tramo, "items" | "puestas"> & { pedidos: Pedido[] })[] = [
  {
    id: "talle",
    etiqueta: "Tu talle, en cada tienda",
    titulo: "¿Cuál es tu talle",
    resaltado: "en esta tienda?",
    bajada:
      "Cada tienda talla distinto: el M de una es el S de otra. Cargás tus medidas una vez y te decimos qué talle te queda en cada prenda.",
    pedidos: [
      { id: "plaza-10", nombre: "Remera boxy", categoria: "remera" },
      { id: "cardo-6", nombre: "Jean mom", categoria: "jean" },
    ],
  },
  {
    id: "probador",
    etiqueta: "Probador virtual",
    titulo: "Probátela",
    resaltado: "antes de comprarla.",
    bajada:
      "Ves la prenda puesta en tu talle: si tira, si te sobra, si es lo que buscabas. Sin probadores, sin filas, sin sorpresas cuando llega el envío.",
    pedidos: [
      { id: "barrio-sur-3", nombre: "Buzo canguro", categoria: "buzo" },
      { id: "norte-8", nombre: "Pantalón cargo", categoria: "pantalon" },
    ],
  },
  {
    id: "tiendas",
    etiqueta: "Para las tiendas",
    titulo: "Menos devoluciones,",
    resaltado: "más ventas.",
    bajada: `Antes de sumarse, las tiendas devolvían en promedio el ${CIFRAS.devAntes} % de sus ventas online por talle. Con el talle correcto desde la primera compra, la venta se queda.`,
    pedidos: [
      { id: "corcho-9", nombre: "Campera puffer", categoria: "campera" },
      { id: "faro-8", nombre: "Jean wide leg", categoria: "jean" },
    ],
  },
  {
    id: "tablas",
    etiqueta: "Tablas reales",
    titulo: "Cada tienda,",
    resaltado: "su tabla de talles.",
    bajada:
      "No usamos un talle estándar: leemos la tabla de cada marca y la cruzamos con tus medidas, zona por zona. Pecho, cintura, cadera y largo.",
    pedidos: [{ id: "musgo-7", nombre: "Vestido midi", categoria: "vestido" }],
  },
  {
    id: "cierre",
    etiqueta: "Ya está pasando",
    titulo: "Vestite con",
    resaltado: "el talle justo.",
    bajada: "Creá tu perfil gratis en dos minutos. Si tenés una tienda, sumate y empezá a vender con menos cambios.",
    pedidos: [
      { id: "brisa-1", nombre: "Camisa de lino", categoria: "camisa" },
      { id: "cuarzo-6", nombre: "Pollera plisada", categoria: "pollera" },
    ],
  },
];

export const TRAMOS: Tramo[] = crudos.map(({ pedidos, ...t }) => {
  const items = pedidos.map(item);
  return {
    ...t,
    items,
    puestas: items.map((i) => ({ prenda: i.prenda, talle: i.talle })),
  };
});

/**
 * Misma modelo, misma categoría, tiendas distintas: el talle cambia.
 * Busca prendas de tiendas distintas con talles recomendados distintos.
 */
function comparativa(categoria: Categoria, cuantas = 3): ItemLook[] {
  const out: ItemLook[] = [];
  const usadas = new Set<string>();
  const candidatas = PRENDAS_SEED.filter((p) => p.categoria === categoria && visible(p)).map((p) =>
    item({ id: p.id, nombre: p.nombre, categoria })
  );
  // Primero, una por talle distinto; después se completa con las que haya.
  for (const c of candidatas) {
    if (out.length >= cuantas) break;
    if (usadas.has(c.prenda.tiendaId) || out.some((o) => o.talle === c.talle)) continue;
    out.push(c);
    usadas.add(c.prenda.tiendaId);
  }
  for (const c of candidatas) {
    if (out.length >= cuantas) break;
    if (usadas.has(c.prenda.tiendaId)) continue;
    out.push(c);
    usadas.add(c.prenda.tiendaId);
  }
  return out;
}

const distintos = (xs: ItemLook[]) => new Set(xs.map((x) => x.talle)).size;

/** La categoría donde más se nota que cada tienda talla distinto. */
export const COMPARATIVA: ItemLook[] = (["remera", "buzo", "campera", "camisa", "vestido", "jean"] as Categoria[])
  .map((c) => comparativa(c))
  .reduce((mejor, x) => (distintos(x) > distintos(mejor) ? x : mejor));
