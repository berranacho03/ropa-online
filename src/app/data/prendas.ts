// ─────────────────────────────────────────────────────────────
// Catálogo de prendas de las tiendas asociadas.
//
// Se genera con el PRNG sembrado: cada tienda vende lo que va con su
// estilo, y la tabla de talles de cada prenda se arma con el molde de
// su tienda (sesgo) y el calce de la prenda. Por eso el M de una
// tienda no es el M de otra, que es justamente el problema que
// resuelve la app.
// ─────────────────────────────────────────────────────────────

import { TIENDAS, type Tienda } from "./tiendas";
import { addDays, elegir, entre, rng, HOY } from "./azar";
import {
  tablaPara,
  tallesDe,
  type CalcePrenda,
  type Categoria,
  type TablaTalles,
} from "../lib/talles";

export type EstadoPrenda = "publicada" | "incompleta" | "pausada";
export type Estampa = "liso" | "rayas" | "grafica" | "cuadros";
export type GeneroPrenda = "mujer" | "hombre" | "unisex";

export interface Prenda {
  id: string;
  tiendaId: string;
  nombre: string;
  categoria: Categoria;
  genero: GeneroPrenda;
  precio: number;
  color: string;
  colorNombre: string;
  estampa: Estampa;
  calce: CalcePrenda;
  talles: string[];
  tabla: TablaTalles;
  estado: EstadoPrenda;
  destacada: boolean;
  material: string;
  fechaAlta: string;
}

export const COLORES: { nombre: string; hex: string }[] = [
  { nombre: "Negro", hex: "#1f1f22" },
  { nombre: "Blanco", hex: "#f2f1ec" },
  { nombre: "Gris melange", hex: "#a3a6ad" },
  { nombre: "Azul marino", hex: "#1e2a4a" },
  { nombre: "Celeste", hex: "#8fb8de" },
  { nombre: "Verde oliva", hex: "#6b7041" },
  { nombre: "Beige", hex: "#d6c4a8" },
  { nombre: "Bordó", hex: "#6d1f2f" },
  { nombre: "Terracota", hex: "#c0603a" },
  { nombre: "Mostaza", hex: "#d4a73a" },
  { nombre: "Rosa", hex: "#e8a5b8" },
  { nombre: "Lila", hex: "#b7a3d9" },
  { nombre: "Camel", hex: "#b88a5a" },
  { nombre: "Verde agua", hex: "#7fc4b0" },
  { nombre: "Rojo", hex: "#c62f2f" },
  { nombre: "Chocolate", hex: "#5a3a2a" },
];

const DENIM = [
  { nombre: "Denim claro", hex: "#7c9cc4" },
  { nombre: "Denim medio", hex: "#4f6f99" },
  { nombre: "Denim oscuro", hex: "#2e4466" },
  { nombre: "Negro lavado", hex: "#3a3b40" },
];

type Modelo = { nombre: string; calce?: CalcePrenda; estampa?: Estampa; genero?: GeneroPrenda; denim?: boolean };

const MODELOS: Record<Categoria, Modelo[]> = {
  remera: [
    { nombre: "Remera boxy", calce: "oversize" },
    { nombre: "Remera básica" },
    { nombre: "Remera oversize", calce: "oversize" },
    { nombre: "Remera estampada", estampa: "grafica" },
    { nombre: "Remera de rayas", estampa: "rayas" },
    { nombre: "Remera manga larga" },
    { nombre: "Top corto", calce: "ajustado", genero: "mujer" },
    { nombre: "Musculosa", calce: "ajustado" },
  ],
  buzo: [
    { nombre: "Buzo canguro" },
    { nombre: "Buzo cuello redondo" },
    { nombre: "Hoodie oversize", calce: "oversize" },
    { nombre: "Buzo media cremallera" },
    { nombre: "Buzo frisado estampado", estampa: "grafica" },
  ],
  camisa: [
    { nombre: "Camisa de lino" },
    { nombre: "Camisa oxford", calce: "ajustado" },
    { nombre: "Camisa a cuadros", estampa: "cuadros" },
    { nombre: "Camisa de jean", denim: true },
    { nombre: "Camisa manga corta", calce: "oversize" },
  ],
  campera: [
    { nombre: "Campera puffer", calce: "oversize" },
    { nombre: "Campera de jean", denim: true },
    { nombre: "Rompevientos" },
    { nombre: "Campera de cuero ecológico", calce: "ajustado" },
    { nombre: "Campera bomber" },
    { nombre: "Saco de paño" },
  ],
  vestido: [
    { nombre: "Vestido midi", genero: "mujer" },
    { nombre: "Vestido slip", calce: "ajustado", genero: "mujer" },
    { nombre: "Vestido camisero", genero: "mujer" },
    { nombre: "Vestido corto", calce: "ajustado", genero: "mujer" },
    { nombre: "Vestido largo estampado", estampa: "grafica", genero: "mujer" },
  ],
  jean: [
    { nombre: "Jean mom", denim: true },
    { nombre: "Jean recto", denim: true },
    { nombre: "Jean wide leg", calce: "oversize", denim: true },
    { nombre: "Jean skinny", calce: "ajustado", denim: true },
    { nombre: "Jean baggy", calce: "oversize", denim: true },
    { nombre: "Jean slim", calce: "ajustado", denim: true },
  ],
  pantalon: [
    { nombre: "Pantalón cargo", calce: "oversize" },
    { nombre: "Pantalón sastrero" },
    { nombre: "Jogger" },
    { nombre: "Pantalón de lino" },
    { nombre: "Palazzo", calce: "oversize", genero: "mujer" },
  ],
  short: [
    { nombre: "Short de jean", denim: true },
    { nombre: "Short deportivo" },
    { nombre: "Bermuda cargo", calce: "oversize" },
    { nombre: "Short de lino" },
  ],
  pollera: [
    { nombre: "Pollera midi", genero: "mujer" },
    { nombre: "Minifalda", calce: "ajustado", genero: "mujer" },
    { nombre: "Pollera plisada", genero: "mujer" },
    { nombre: "Pollera de jean", denim: true, genero: "mujer" },
  ],
};

const MEZCLA: Record<Tienda["estilo"], Partial<Record<Categoria, number>>> = {
  urbano: { remera: 3, buzo: 3, campera: 2, jean: 1, pantalon: 2, short: 1 },
  basicos: { remera: 3, buzo: 2, camisa: 2, pantalon: 2, vestido: 1, short: 1 },
  deportivo: { remera: 3, buzo: 3, short: 2, pantalon: 2, campera: 2 },
  fiesta: { vestido: 5, pollera: 2, camisa: 2, remera: 1 },
  vintage: { camisa: 2, campera: 2, jean: 2, remera: 2, pollera: 1, vestido: 1 },
  denim: { jean: 5, short: 2, camisa: 2, campera: 2 },
};

const PRECIO: Record<Categoria, [number, number]> = {
  remera: [690, 1490],
  buzo: [1490, 2890],
  camisa: [1290, 2490],
  campera: [2490, 5990],
  vestido: [1490, 3490],
  jean: [1890, 3490],
  pantalon: [1490, 2990],
  short: [890, 1690],
  pollera: [1190, 2390],
};

const MATERIAL: Record<Categoria, string[]> = {
  remera: ["100 % algodón peinado", "Algodón y elastano", "Jersey de algodón orgánico"],
  buzo: ["Frisa de algodón", "Rústico 80/20", "Algodón y poliéster"],
  camisa: ["Lino", "Popelín de algodón", "Oxford", "Denim liviano"],
  campera: ["Nylon con relleno", "Denim rígido", "Cuero ecológico", "Paño de lana"],
  vestido: ["Satén", "Viscosa", "Lino", "Algodón con elastano"],
  jean: ["Denim rígido 100 % algodón", "Denim elastizado", "Denim 12 oz"],
  pantalon: ["Gabardina", "Lino", "Frisa", "Sarga de algodón"],
  short: ["Denim", "Poliéster técnico", "Gabardina", "Lino"],
  pollera: ["Satén", "Denim", "Crepe", "Viscosa"],
};

function elegirPonderado<T extends string>(r: () => number, pesos: Partial<Record<T, number>>): T {
  const entradas = Object.entries(pesos) as [T, number][];
  const total = entradas.reduce((a, [, w]) => a + w, 0);
  let x = r() * total;
  for (const [k, w] of entradas) {
    x -= w;
    if (x <= 0) return k;
  }
  return entradas[0][0];
}

/** Rompe la tabla de una prenda: le faltan medidas en algunos talles. */
function tablaIncompleta(tabla: TablaTalles, r: () => number): TablaTalles {
  const out: TablaTalles = {};
  const talles = Object.keys(tabla);
  const rotos = new Set([elegir(r, talles), elegir(r, talles)]);
  for (const t of talles) out[t] = rotos.has(t) ? {} : tabla[t];
  return out;
}

export const tablaCompleta = (p: Pick<Prenda, "tabla">) =>
  Object.values(p.tabla).length > 0 &&
  Object.values(p.tabla).every((z) => Object.keys(z).length > 0);

function generarTienda(t: Tienda): Prenda[] {
  const r = rng(`prendas:${t.id}`);
  const cantidad =
    t.id === "bruma"
      ? 0
      : t.estado === "onboarding"
        ? entre(r, 4, 6)
        : t.estado === "pausada"
          ? entre(r, 5, 7)
          : entre(r, 8, 12);
  const usados = new Set<string>();
  const prendas: Prenda[] = [];
  for (let i = 0; i < cantidad; i++) {
    const categoria = elegirPonderado(r, MEZCLA[t.estilo]);
    const modelo = elegir(r, MODELOS[categoria]);
    const paleta = modelo.denim ? DENIM : COLORES;
    let color = elegir(r, paleta);
    let intentos = 0;
    while (usados.has(modelo.nombre + color.nombre) && intentos++ < 8) color = elegir(r, paleta);
    usados.add(modelo.nombre + color.nombre);

    const calce: CalcePrenda =
      modelo.calce ?? (r() < 0.15 ? "oversize" : r() < 0.15 ? "ajustado" : "regular");
    const todos = tallesDe(categoria);
    // No todas las tiendas tienen la curva completa.
    const desde = r() < 0.3 ? 1 : 0;
    const hasta = todos.length - (r() < 0.45 ? 1 : 0);
    const talles = todos.slice(desde, hasta);

    let tabla = tablaPara(categoria, calce, t.sesgoTalle, talles);
    let estado: EstadoPrenda = "publicada";
    if (t.estado === "onboarding") {
      if (t.id === "bahia" || r() < 0.5) {
        tabla = tablaIncompleta(tabla, r);
        estado = "incompleta";
      } else estado = "pausada";
    } else if (t.estado === "pausada") {
      estado = "pausada";
      if (t.id === "trigo" && r() < 0.6) tabla = tablaIncompleta(tabla, r);
    } else {
      const x = r();
      if (x < 0.05) {
        tabla = tablaIncompleta(tabla, r);
        estado = "incompleta";
      } else if (x < 0.08) estado = "pausada";
    }

    const [pmin, pmax] = PRECIO[categoria];
    const precio = Math.round((pmin + r() * (pmax - pmin)) / 100) * 100 - 10;

    prendas.push({
      id: `${t.id}-${i + 1}`,
      tiendaId: t.id,
      nombre: modelo.nombre,
      categoria,
      genero: modelo.genero ?? (r() < 0.7 ? "unisex" : r() < 0.5 ? "mujer" : "hombre"),
      precio,
      color: color.hex,
      colorNombre: color.nombre,
      estampa: modelo.estampa ?? "liso",
      calce,
      talles,
      tabla,
      estado,
      destacada: false,
      material: elegir(r, MATERIAL[categoria]),
      fechaAlta: t.fechaAlta > addDays(HOY, -30) ? t.fechaAlta : addDays(t.fechaAlta, entre(r, 0, 40)),
    });
  }
  return prendas;
}

function generar(): Prenda[] {
  const todas = TIENDAS.flatMap(generarTienda);

  // Destacadas: una por categoría, de tiendas distintas, empezando por
  // Tienda Norte. Son las que tienen imágenes del probador y las que
  // aparecen en la portada.
  const orden: Categoria[] = ["remera", "buzo", "campera", "jean", "vestido", "camisa", "pollera", "pantalon", "short", "remera", "buzo", "campera"];
  const tiendasUsadas = new Set<string>();
  for (const cat of orden) {
    const p =
      todas.find((x) => x.estado === "publicada" && x.categoria === cat && !x.destacada && x.tiendaId === "norte" && !tiendasUsadas.has("norte")) ??
      todas.find((x) => x.estado === "publicada" && x.categoria === cat && !x.destacada && !tiendasUsadas.has(x.tiendaId));
    if (p) {
      p.destacada = true;
      tiendasUsadas.add(p.tiendaId);
    }
  }
  return todas;
}

export const PRENDAS_SEED: Prenda[] = generar();

export const nombreCompleto = (p: Pick<Prenda, "nombre" | "colorNombre">) =>
  `${p.nombre} ${p.colorNombre.toLowerCase()}`;
