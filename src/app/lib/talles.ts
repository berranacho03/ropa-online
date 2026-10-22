// ─────────────────────────────────────────────────────────────
// Recomendador de talles.
//
// Es un cálculo determinístico y explicable, no un número inventado:
//   1. Cada prenda trae la tabla de talles que cargó su tienda: para
//      cada talle, el rango de medidas del cuerpo que le queda bien.
//   2. Según la categoría pesa cada zona (remera: pecho; jean:
//      cintura y cadera).
//   3. La preferencia de calce del usuario mueve el punto ideal
//      dentro de cada rango.
//   4. Gana el talle de menor costo; la confianza sale de cuánto le
//      gana al segundo y de qué tan adentro de los rangos queda.
// ─────────────────────────────────────────────────────────────

export type Categoria =
  | "remera"
  | "buzo"
  | "camisa"
  | "campera"
  | "vestido"
  | "jean"
  | "pantalon"
  | "short"
  | "pollera";

export type Zona = "pecho" | "cintura" | "cadera" | "altura";

export type Rango = [number, number];

/** Tabla de talles: para cada talle, el rango de cada zona en cm. */
export type TablaTalles = Record<string, Partial<Record<Zona, Rango>>>;

export type PreferenciaCalce = "ajustado" | "regular" | "holgado";
export type CalcePrenda = "ajustado" | "regular" | "oversize";
export type Genero = "mujer" | "hombre";

export interface Medidas {
  altura: number;
  peso: number;
  pecho: number;
  cintura: number;
  cadera: number;
  genero: Genero;
  preferencia: PreferenciaCalce;
}

export const CATEGORIAS: { id: Categoria; nombre: string; plural: string }[] = [
  { id: "remera", nombre: "Remera", plural: "Remeras" },
  { id: "buzo", nombre: "Buzo", plural: "Buzos" },
  { id: "camisa", nombre: "Camisa", plural: "Camisas" },
  { id: "campera", nombre: "Campera", plural: "Camperas" },
  { id: "vestido", nombre: "Vestido", plural: "Vestidos" },
  { id: "jean", nombre: "Jean", plural: "Jeans" },
  { id: "pantalon", nombre: "Pantalón", plural: "Pantalones" },
  { id: "short", nombre: "Short", plural: "Shorts" },
  { id: "pollera", nombre: "Pollera", plural: "Polleras" },
];

export const nombreCategoria = (c: Categoria) =>
  CATEGORIAS.find((x) => x.id === c)?.nombre ?? c;

/** Las zonas que mira cada categoría, con su peso. */
export const PESOS: Record<Categoria, Partial<Record<Zona, number>>> = {
  remera: { pecho: 1, cintura: 0.4, altura: 0.3 },
  buzo: { pecho: 1, cintura: 0.3, altura: 0.3 },
  camisa: { pecho: 1, cintura: 0.6, altura: 0.3 },
  campera: { pecho: 1, cintura: 0.3, altura: 0.4 },
  vestido: { pecho: 0.8, cintura: 1, cadera: 0.8, altura: 0.3 },
  jean: { cintura: 1, cadera: 0.9, altura: 0.4 },
  pantalon: { cintura: 1, cadera: 0.7, altura: 0.3 },
  short: { cintura: 1, cadera: 0.8 },
  pollera: { cintura: 1, cadera: 0.8 },
};

export const ES_INFERIOR: Record<Categoria, boolean> = {
  remera: false,
  buzo: false,
  camisa: false,
  campera: false,
  vestido: false,
  jean: true,
  pantalon: true,
  short: true,
  pollera: true,
};

export const NOMBRE_ZONA: Record<Zona, string> = {
  pecho: "Pecho",
  cintura: "Cintura",
  cadera: "Cadera",
  altura: "Largo",
};

// ── Tablas estándar ──────────────────────────────────────────
// Rangos de cuerpo de referencia. Cada tienda los corre según su
// propio molde (sesgo) y según el calce de la prenda.

const LETRAS = ["XS", "S", "M", "L", "XL", "XXL"];
const NUMEROS = ["34", "36", "38", "40", "42", "44", "46"];

const STD_LETRAS: Record<Zona, Rango[]> = {
  pecho: [[78, 84], [84, 90], [90, 97], [97, 104], [104, 112], [112, 120]],
  cintura: [[60, 66], [66, 72], [72, 79], [79, 87], [87, 95], [95, 104]],
  cadera: [[84, 90], [90, 96], [96, 102], [102, 108], [108, 115], [115, 122]],
  altura: [[148, 162], [155, 168], [161, 176], [167, 182], [171, 188], [173, 194]],
};

const STD_NUMEROS: Partial<Record<Zona, Rango[]>> = {
  cintura: [[60, 64], [64, 68], [68, 72], [72, 77], [77, 82], [82, 88], [88, 94]],
  cadera: [[84, 88], [88, 92], [92, 96], [96, 101], [101, 106], [106, 112], [112, 118]],
  altura: [[148, 196], [148, 196], [148, 196], [148, 196], [148, 196], [148, 196], [148, 196]],
};

export const usaNumeros = (c: Categoria) => c === "jean" || c === "pantalon";

/** Los talles que se ofrecen en una categoría. */
export const tallesDe = (c: Categoria) => (usaNumeros(c) ? NUMEROS : LETRAS);

/** Cuánto corre el calce de la prenda los rangos de torso, en cm. */
const CORRIMIENTO_CALCE: Record<CalcePrenda, number> = {
  ajustado: -2,
  regular: 0,
  oversize: 5,
};

/**
 * Arma la tabla de talles de una prenda a partir de la estándar, el
 * molde de su tienda y el calce de la prenda. Es la tabla que la tienda
 * "cargó" en el sistema.
 */
export function tablaPara(
  categoria: Categoria,
  calce: CalcePrenda,
  sesgo: number,
  talles: string[] = tallesDe(categoria)
): TablaTalles {
  const numeros = usaNumeros(categoria);
  const std = numeros ? STD_NUMEROS : STD_LETRAS;
  const lista = numeros ? NUMEROS : LETRAS;
  const zonas = Object.keys(PESOS[categoria]) as Zona[];
  const tabla: TablaTalles = {};
  for (const t of talles) {
    const i = lista.indexOf(t);
    if (i < 0) continue;
    tabla[t] = {};
    for (const z of zonas) {
      const r = std[z]?.[i];
      if (!r) continue;
      const corr = z === "altura" ? 0 : sesgo + (z === "pecho" ? CORRIMIENTO_CALCE[calce] : CORRIMIENTO_CALCE[calce] / 2);
      tabla[t][z] = [r[0] + corr, r[1] + corr];
    }
  }
  return tabla;
}

// ── Recomendación ────────────────────────────────────────────

/** Dónde queremos que caiga la medida del cuerpo dentro del rango.
 *  Quien prefiere holgado quiere quedar en la parte baja del rango. */
const OBJETIVO: Record<PreferenciaCalce, number> = {
  ajustado: 0.68,
  regular: 0.5,
  holgado: 0.3,
};

export type Veredicto = "grande" | "holgado" | "ideal" | "justo" | "chico";

export interface DetalleZona {
  zona: Zona;
  medida: number;
  rango: Rango;
  /** Posición de la medida dentro del rango: 0 = mínimo, 1 = máximo. */
  posicion: number;
  veredicto: Veredicto;
}

export interface Recomendacion {
  talle: string;
  /** 0 a 100. */
  confianza: number;
  zonas: DetalleZona[];
  /** Talles ordenados de mejor a peor, con su costo. */
  ranking: { talle: string; costo: number }[];
  /** El talle de al lado, para comparar ("si te gusta más suelto…"). */
  alternativa?: { talle: string; motivo: "mas-suelto" | "mas-ajustado" };
}

const medidaDe = (m: Medidas, z: Zona) => m[z];

export function veredictoDe(pos: number): Veredicto {
  if (pos > 1.02) return "chico";
  if (pos > 0.78) return "justo";
  if (pos >= 0.22) return "ideal";
  if (pos >= -0.02) return "holgado";
  return "grande";
}

export const TEXTO_VEREDICTO: Record<Veredicto, string> = {
  grande: "te queda grande",
  holgado: "holgado",
  ideal: "ideal",
  justo: "justo",
  chico: "te queda chico",
};

/** Para el largo, "chico" significa corto. */
export function textoZona(z: Zona, v: Veredicto) {
  if (z !== "altura") return TEXTO_VEREDICTO[v];
  return { grande: "largo de más", holgado: "un poco largo", ideal: "ideal", justo: "un poco corto", chico: "corto" }[v];
}

function costoTalle(
  tabla: TablaTalles[string],
  categoria: Categoria,
  m: Medidas
): { costo: number; zonas: DetalleZona[] } {
  const pesos = PESOS[categoria];
  const objetivo = OBJETIVO[m.preferencia];
  let costo = 0;
  let pesoTotal = 0;
  const zonas: DetalleZona[] = [];
  for (const [z, w] of Object.entries(pesos) as [Zona, number][]) {
    const r = tabla[z];
    if (!r) continue;
    const medida = medidaDe(m, z);
    const ancho = Math.max(1, r[1] - r[0]);
    const pos = (medida - r[0]) / ancho;
    // El largo no depende de la preferencia de calce.
    const obj = z === "altura" ? 0.5 : objetivo;
    let c = Math.abs(pos - obj);
    if (pos > 1) c += (pos - 1) * 2.5;
    if (pos < 0) c += -pos * 1.5; // grande molesta menos que chico
    costo += c * w;
    pesoTotal += w;
    zonas.push({ zona: z, medida, rango: r, posicion: pos, veredicto: veredictoDe(pos) });
  }
  return { costo: pesoTotal ? costo / pesoTotal : 99, zonas };
}

export function recomendar(
  tabla: TablaTalles,
  categoria: Categoria,
  m: Medidas
): Recomendacion | null {
  const filas = Object.entries(tabla).map(([talle, t]) => ({
    talle,
    ...costoTalle(t, categoria, m),
  }));
  if (filas.length === 0) return null;
  const ranking = [...filas].sort((a, b) => a.costo - b.costo);
  const mejor = ranking[0];
  const segundo = ranking[1];

  const margen = segundo ? Math.min(1, (segundo.costo - mejor.costo) / 0.55) : 1;
  const ajuste = 1 - Math.min(1, mejor.costo / 1.1) * 0.7;
  const confianza = Math.round(Math.max(52, Math.min(98, 50 + 48 * (0.55 * margen + 0.45 * ajuste))));

  // Talle vecino: ¿el usuario está más cerca de querer uno más suelto o más ajustado?
  const orden = Object.keys(tabla);
  const i = orden.indexOf(mejor.talle);
  const posMedia =
    mejor.zonas.filter((z) => z.zona !== "altura").reduce((a, z) => a + z.posicion, 0) /
    Math.max(1, mejor.zonas.filter((z) => z.zona !== "altura").length);
  let alternativa: Recomendacion["alternativa"];
  if (posMedia > 0.5 && orden[i + 1]) alternativa = { talle: orden[i + 1], motivo: "mas-suelto" };
  else if (posMedia <= 0.5 && orden[i - 1]) alternativa = { talle: orden[i - 1], motivo: "mas-ajustado" };
  else if (orden[i + 1]) alternativa = { talle: orden[i + 1], motivo: "mas-suelto" };

  return {
    talle: mejor.talle,
    confianza,
    zonas: mejor.zonas,
    ranking: ranking.map((r) => ({ talle: r.talle, costo: r.costo })),
    alternativa,
  };
}

/** Detalle por zona de un talle cualquiera (para comparar talles). */
export function evaluarTalle(
  tabla: TablaTalles,
  categoria: Categoria,
  talle: string,
  m: Medidas
): DetalleZona[] {
  const t = tabla[talle];
  return t ? costoTalle(t, categoria, m).zonas : [];
}

/**
 * Holgura de la prenda sobre el cuerpo, en cm, para dibujarla en el
 * probador: positivo es aire, negativo es tela tirante.
 */
export function holgura(
  tabla: TablaTalles,
  categoria: Categoria,
  talle: string,
  m: Medidas
): { torso: number; cintura: number; cadera: number; largo: number } {
  const t = tabla[talle] ?? {};
  const aire = (z: Zona, base: number) => {
    const r = t[z];
    if (!r) return base;
    return Math.max(-5, Math.min(22, r[1] - medidaDe(m, z) + base));
  };
  const alt = t.altura;
  const largo = alt ? Math.max(-1, Math.min(1, ((alt[0] + alt[1]) / 2 - m.altura) / 14)) : 0;
  return {
    torso: aire("pecho", 4),
    cintura: aire("cintura", 3),
    cadera: aire("cadera", 3),
    largo,
  };
}

// ── Estimación de medidas ────────────────────────────────────

export type Contextura = "delgada" | "media" | "robusta";

/**
 * "No sé mis medidas": las estima a partir de altura, peso y contextura.
 * Es una aproximación por índice de masa corporal; la app avisa que
 * medirse da una recomendación más precisa.
 */
export function estimarMedidas(
  altura: number,
  peso: number,
  genero: Genero,
  contextura: Contextura
): Pick<Medidas, "pecho" | "cintura" | "cadera"> {
  const imc = peso / (altura / 100) ** 2;
  const k = { delgada: -2, media: 0, robusta: 2.5 }[contextura];
  const d = imc - 22 + k;
  if (genero === "mujer") {
    return {
      pecho: Math.round(86 + d * 2.1 + (altura - 165) * 0.15),
      cintura: Math.round(68 + d * 2.4 + (altura - 165) * 0.1),
      cadera: Math.round(95 + d * 2.0 + (altura - 165) * 0.15),
    };
  }
  return {
    pecho: Math.round(96 + d * 2.2 + (altura - 176) * 0.2),
    cintura: Math.round(82 + d * 2.6 + (altura - 176) * 0.12),
    cadera: Math.round(97 + d * 1.8 + (altura - 176) * 0.12),
  };
}
