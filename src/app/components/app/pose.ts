// ─────────────────────────────────────────────────────────────
// Seguimiento del cuerpo para el probador en vivo.
//
// Usa el detector de pose de MediaPipe en el navegador (nada sale
// del dispositivo). La librería se carga con import dinámico sólo al
// entrar al modo en vivo, para no agrandar la carga inicial de la app.
//
// La prenda se dibuja en las coordenadas del maniquí (viewBox de
// 240 × 540, ver figura/cuerpo.ts). Acá se calcula la transformación
// que lleva ese maniquí al cuerpo detectado en el video.
// ─────────────────────────────────────────────────────────────

import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import { CX, Y, type Cuerpo } from "../figura/cuerpo";
import type { Categoria } from "../../lib/talles";

const VERSION = "1.1.1"; // la misma que está en package.json
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODELO =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export type Detector = PoseLandmarker;

/** Carga el detector. Prueba con la GPU y, si falla, con la CPU. */
export async function cargarDetector(): Promise<Detector> {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const archivos = await FilesetResolver.forVisionTasks(WASM);
  const crear = (delegate: "GPU" | "CPU") =>
    PoseLandmarker.createFromOptions(archivos, {
      baseOptions: { modelAssetPath: MODELO, delegate },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  try {
    return await crear("GPU");
  } catch {
    return await crear("CPU");
  }
}

// Índices de MediaPipe Pose.
const L = {
  hombroI: 11,
  hombroD: 12,
  caderaI: 23,
  caderaD: 24,
  rodillaI: 25,
  rodillaD: 26,
  tobilloI: 27,
  tobilloD: 28,
} as const;

/**
 * Factores de ancho: los puntos del detector están en las
 * articulaciones, no en el borde del cuerpo. Los hombros quedan casi
 * en el borde; las caderas, bastante más adentro.
 */
const FACTOR_HOMBRO = 1.18;
const FACTOR_CADERA = 1.6;
const VISIBLE = 0.5;

/** Transformación del maniquí al video: origen, rotación y escalas. */
export interface Ajuste {
  /** Punto del video (en px del contenedor) donde va el ancla. */
  x: number;
  y: number;
  /** Ancla en coordenadas del maniquí. */
  ax: number;
  ay: number;
  /** Rotación en grados. */
  rot: number;
  sx: number;
  sy: number;
}

type P = { x: number; y: number };

/**
 * Pasa un punto normalizado del video a px del contenedor, teniendo en
 * cuenta el recorte de `object-cover` y el espejado.
 */
export function aPantalla(
  lm: NormalizedLandmark,
  video: { ancho: number; alto: number },
  caja: { ancho: number; alto: number },
  espejo: boolean
): P {
  const k = Math.max(caja.ancho / video.ancho, caja.alto / video.alto);
  const dw = video.ancho * k;
  const dh = video.alto * k;
  const x = (caja.ancho - dw) / 2 + lm.x * dw;
  const y = (caja.alto - dh) / 2 + lm.y * dh;
  return { x: espejo ? caja.ancho - x : x, y };
}

const medio = (a: P, b: P): P => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
/** Ángulo de la línea entre dos puntos, de izquierda a derecha en pantalla. */
const angulo = (a: P, b: P) => {
  const [i, d] = a.x <= b.x ? [a, b] : [b, a];
  return (Math.atan2(d.y - i.y, d.x - i.x) * 180) / Math.PI;
};

export type Falta = "torso" | "cadera" | null;

/**
 * Calcula dónde va la prenda. Devuelve `null` (y qué falta) si no se
 * ven los puntos mínimos: hombros para las prendas de arriba y
 * vestidos, caderas para las de abajo.
 */
export function ajustePara(
  lms: NormalizedLandmark[],
  categoria: Categoria,
  inferior: boolean,
  cuerpo: Cuerpo,
  pantalla: (lm: NormalizedLandmark) => P
): { ajuste: Ajuste | null; falta: Falta } {
  const ve = (i: number) => (lms[i]?.visibility ?? 0) >= VISIBLE;
  const p = (i: number) => pantalla(lms[i]);

  if (!inferior) {
    if (!ve(L.hombroI) || !ve(L.hombroD)) return { ajuste: null, falta: "torso" };
    const hi = p(L.hombroI);
    const hd = p(L.hombroD);
    const h = medio(hi, hd);
    const ancho = dist(hi, hd);
    if (ancho < 8) return { ajuste: null, falta: "torso" };
    const sx = (ancho * FACTOR_HOMBRO) / (2 * cuerpo.hombro);
    let sy = sx;
    let rot = angulo(hi, hd);
    if (ve(L.caderaI) && ve(L.caderaD)) {
      const ci = p(L.caderaI);
      const cd = p(L.caderaD);
      const c = medio(ci, cd);
      const largo = dist(h, c);
      // El largo del torso manda en vertical, sin deformar de más.
      sy = Math.max(sx * 0.7, Math.min(sx * 1.5, largo / (Y.cadera - Y.hombro)));
      rot = (rot + angulo(ci, cd)) / 2;
    }
    // El punto del hombro del detector queda un poco por debajo del borde
    // superior del hombro: el ancla baja unos px para que el cuello calce.
    return { ajuste: { x: h.x, y: h.y, ax: CX, ay: Y.hombro + 6, rot, sx, sy }, falta: null };
  }

  if (!ve(L.caderaI) || !ve(L.caderaD)) return { ajuste: null, falta: "cadera" };
  const ci = p(L.caderaI);
  const cd = p(L.caderaD);
  const c = medio(ci, cd);
  const ancho = dist(ci, cd);
  if (ancho < 6) return { ajuste: null, falta: "cadera" };
  const sx = (ancho * FACTOR_CADERA) / (2 * cuerpo.cadera);
  let sy = sx;
  const corta = categoria === "short" || categoria === "pollera";
  const rodillas = ve(L.rodillaI) && ve(L.rodillaD);
  const tobillos = ve(L.tobilloI) && ve(L.tobilloD);
  // Largo de pierna medido en cada lado (así no se acorta con las piernas abiertas).
  const pierna = (i: number, d: number) => (dist(ci, p(i)) + dist(cd, p(d))) / 2;
  if (!corta && tobillos) {
    sy = pierna(L.tobilloI, L.tobilloD) / (Y.tobillo - Y.cadera);
  } else if (rodillas) {
    sy = pierna(L.rodillaI, L.rodillaD) / (Y.rodilla - Y.cadera);
  }
  sy = Math.max(sx * 0.6, Math.min(sx * 1.6, sy));
  return { ajuste: { x: c.x, y: c.y, ax: CX, ay: Y.cadera, rot: angulo(ci, cd), sx, sy }, falta: null };
}

/** Suavizado exponencial para que la prenda no tiemble. */
export function suavizar(prev: Ajuste | null, nuevo: Ajuste, alfa = 0.35): Ajuste {
  if (!prev) return nuevo;
  const m = (a: number, b: number) => a + (b - a) * alfa;
  return {
    x: m(prev.x, nuevo.x),
    y: m(prev.y, nuevo.y),
    ax: nuevo.ax,
    ay: nuevo.ay,
    rot: m(prev.rot, nuevo.rot),
    sx: m(prev.sx, nuevo.sx),
    sy: m(prev.sy, nuevo.sy),
  };
}

/** Atributo `transform` de SVG para el ajuste, con escala y corrimiento extra. */
export function transformDe(a: Ajuste, extra: { escala: number; dx: number; dy: number }) {
  const f = (n: number) => n.toFixed(3);
  return (
    `translate(${f(a.x + extra.dx)} ${f(a.y + extra.dy)}) rotate(${f(a.rot)}) ` +
    `scale(${f(a.sx * extra.escala)} ${f(a.sy * extra.escala)}) translate(${f(-a.ax)} ${f(-a.ay)})`
  );
}
