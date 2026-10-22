// ─────────────────────────────────────────────────────────────
// Dibujo de cada categoría de prenda sobre el cuerpo ilustrado.
//
// La holgura (en cm, sale del recomendador) ensancha o achica la
// prenda: un talle grande se ve con aire y pliegues; uno chico,
// tirante y con arrugas de tensión.
// ─────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import type { Categoria, CalcePrenda } from "../../lib/talles";
import type { Estampa } from "../../data/prendas";
import { CX, Y, aclarar, oscurecer, type Cuerpo } from "./cuerpo";
import { espejo, suave } from "./trazo";

export interface Holgura {
  torso: number;
  cintura: number;
  cadera: number;
  /** -1 (corta) a 1 (larga). */
  largo: number;
}

export interface PrendaDibujo {
  categoria: Categoria;
  color: string;
  estampa: Estampa;
  calce: CalcePrenda;
  nombre: string;
}

// px de medio ancho por cm de holgura. Exagerado a propósito (como un
// figurín) para que la diferencia entre talles se vea a simple vista.
const PX = 1.25;

type P = [number, number];

interface Ctx {
  c: Cuerpo;
  h: Holgura;
  p: PrendaDibujo;
  uid: string;
}

/** Relleno con sombreado y estampa. */
function Tela({ d, ctx, sinEstampa = false }: { d: string; ctx: Ctx; sinEstampa?: boolean }) {
  const { p, uid } = ctx;
  const borde = oscurecer(p.color, 0.3);
  return (
    <>
      <path d={d} fill={p.color} stroke={borde} strokeWidth={1.2} strokeLinejoin="round" />
      {!sinEstampa && p.estampa === "rayas" && <path d={d} fill={`url(#rayas-${uid})`} />}
      {!sinEstampa && p.estampa === "cuadros" && <path d={d} fill={`url(#cuadros-${uid})`} />}
      <path d={d} fill={`url(#volumen-${uid})`} />
    </>
  );
}

export function DefsPrenda({ p, uid }: { p: PrendaDibujo; uid: string }) {
  const linea = oscurecer(p.color, 0.45);
  const claro = aclarar(p.color, 0.55);
  return (
    <defs>
      <linearGradient id={`volumen-${uid}`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#000" stopOpacity="0.22" />
        <stop offset="0.22" stopColor="#000" stopOpacity="0.02" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="0.78" stopColor="#000" stopOpacity="0.02" />
        <stop offset="1" stopColor="#000" stopOpacity="0.24" />
      </linearGradient>
      <pattern id={`rayas-${uid}`} width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="5" fill={p.color === "#f2f1ec" ? "#1e2a4a" : claro} opacity="0.85" />
      </pattern>
      <pattern id={`cuadros-${uid}`} width="18" height="18" patternUnits="userSpaceOnUse">
        <rect width="18" height="6" fill={linea} opacity="0.35" />
        <rect width="6" height="18" fill={linea} opacity="0.35" />
        <rect x="11" width="1.5" height="18" fill={claro} opacity="0.5" />
      </pattern>
    </defs>
  );
}

const corte = (n: number) => Math.max(-5, n);

// ── Superiores ───────────────────────────────────────────────

function superior(ctx: Ctx): ReactNode {
  const { c, h, p } = ctx;
  const cat = p.categoria;
  const nombre = p.nombre.toLowerCase();
  const over = p.calce === "oversize";
  const e = corte(h.torso) * PX;
  const ew = corte(h.cintura) * PX;

  const hombro = c.hombro + e * 0.45 + (over ? 6 : 0);
  const pecho = c.pecho + e;
  const cintura = Math.max(c.cintura + ew, pecho * (p.calce === "ajustado" ? 0.8 : 0.9));
  const corto = nombre.includes("top corto");
  const ruedo = Math.max(c.cadera * 0.96, cintura) + (over ? e * 0.4 + 4 : e * 0.25);
  const yRuedo = corto
    ? Y.cintura - 8
    : (cat === "campera" ? 262 : cat === "camisa" ? 268 : 258) + h.largo * 22 + (over ? 4 : 0);
  const yHombro = Y.hombro + (over ? 6 : 0);
  const mangaLarga =
    cat === "buzo" || cat === "campera" || nombre.includes("manga larga") || (cat === "camisa" && !nombre.includes("manga corta"));
  const sinMangas = nombre.includes("musculosa");

  // Torso: lado izquierdo y espejo.
  const izq: P[] = [
    [CX - 13, Y.cuello + 8],
    [CX - hombro + 4, yHombro - 4],
    [CX - hombro, yHombro + 6],
    [CX - pecho, Y.pecho],
    [CX - cintura, Y.cintura - 10],
    [CX - ruedo, yRuedo],
  ];
  const torso: P[] = [...izq, ...espejo(izq)];
  const elementos: ReactNode[] = [];

  // Mangas
  const manga = (lado: 1 | -1) => {
    if (sinMangas) return null;
    const x = (v: number) => CX + lado * v;
    const holg = Math.max(0, e) * 0.35 + (over ? 3 : 0);
    const pts: P[] = mangaLarga
      ? [
          [x(hombro - 6), yHombro - 4],
          [x(hombro + 6 + holg), yHombro + 10],
          [x(c.hombro + 12 + holg), 200],
          [x(c.hombro + 14 + holg * 0.6), Y.muneca - 4 + h.largo * 6],
          [x(c.hombro - 1 - holg * 0.4), Y.muneca - 2 + h.largo * 6],
          [x(c.hombro - 2), 200],
          [x(pecho - 6), Y.pecho - 2],
        ]
      : [
          [x(hombro - 6), yHombro - 4],
          [x(hombro + 7 + holg), yHombro + 8],
          [x(c.hombro + 12 + holg), 166 + (over ? 10 : 0)],
          [x(c.hombro - 3 - holg * 0.3), 170 + (over ? 10 : 0)],
          [x(pecho - 6), Y.pecho - 4],
        ];
    if (lado === 1) pts.reverse();
    return <Tela key={`m${lado}`} d={suave(pts, 5)} ctx={ctx} />;
  };
  elementos.push(manga(-1), manga(1));

  // Capucha detrás del cuello
  const capucha = cat === "buzo" && (nombre.includes("canguro") || nombre.includes("hoodie"));
  if (capucha) {
    elementos.unshift(
      <path
        key="capucha"
        d={`M${CX - 26},${Y.cuello + 14} Q${CX - 30},${Y.cuello - 14} ${CX},${Y.cuello - 6} Q${CX + 30},${Y.cuello - 14} ${CX + 26},${Y.cuello + 14} Z`}
        fill={oscurecer(p.color, 0.12)}
        stroke={oscurecer(p.color, 0.3)}
        strokeWidth={1.2}
      />
    );
  }

  const dTorso = suave(torso, 6);
  if (cat === "campera") {
    // Campera abierta: se ve la remera base al medio.
    elementos.push(<Tela key="torso" d={dTorso} ctx={ctx} />);
    elementos.push(
      <path
        key="abertura"
        d={`M${CX - 7},${Y.cuello + 12} L${CX - 4},${yRuedo} L${CX + 4},${yRuedo} L${CX + 7},${Y.cuello + 12} Z`}
        fill="#f2f1ec"
        stroke={oscurecer(p.color, 0.35)}
        strokeWidth={1}
      />
    );
    if (nombre.includes("puffer")) {
      for (let y = Y.pecho - 15; y < yRuedo - 6; y += 22) {
        elementos.push(
          <path key={`q${y}`} d={`M${CX - pecho + 4},${y} Q${CX - 30},${y + 4} ${CX - 8},${y}`} stroke={oscurecer(p.color, 0.3)} strokeWidth={1.2} fill="none" />,
          <path key={`qd${y}`} d={`M${CX + 8},${y} Q${CX + 30},${y + 4} ${CX + pecho - 4},${y}`} stroke={oscurecer(p.color, 0.3)} strokeWidth={1.2} fill="none" />
        );
      }
    }
    // Cuello solapa
    elementos.push(
      <path
        key="solapa"
        d={`M${CX - 14},${Y.cuello + 6} L${CX - 22},${Y.cuello + 22} L${CX - 7},${Y.cuello + 34} Z M${CX + 14},${Y.cuello + 6} L${CX + 22},${Y.cuello + 22} L${CX + 7},${Y.cuello + 34} Z`}
        fill={oscurecer(p.color, 0.1)}
        stroke={oscurecer(p.color, 0.35)}
        strokeWidth={1}
      />
    );
  } else {
    elementos.push(<Tela key="torso" d={dTorso} ctx={ctx} />);
  }

  // Detalles
  const linea = oscurecer(p.color, 0.35);
  // Escote
  if (cat !== "camisa" && cat !== "campera") {
    elementos.push(
      <path key="escote" d={`M${CX - 13},${Y.cuello + 8} Q${CX},${Y.cuello + (sinMangas ? 26 : 18)} ${CX + 13},${Y.cuello + 8}`} fill="none" stroke={linea} strokeWidth={2.2} />
    );
  }
  if (cat === "camisa") {
    elementos.push(
      <path key="cuello" d={`M${CX - 14},${Y.cuello + 4} L${CX - 4},${Y.cuello + 22} L${CX},${Y.cuello + 10} L${CX + 4},${Y.cuello + 22} L${CX + 14},${Y.cuello + 4}`} fill={aclarar(p.color, 0.15)} stroke={linea} strokeWidth={1.2} strokeLinejoin="round" />
    );
    for (let y = Y.cuello + 30; y < yRuedo - 6; y += 22) elementos.push(<circle key={`b${y}`} cx={CX} cy={y} r={1.8} fill={linea} />);
    elementos.push(<line key="tapa" x1={CX} y1={Y.cuello + 22} x2={CX} y2={yRuedo} stroke={linea} strokeWidth={0.8} />);
  }
  if (cat === "buzo") {
    elementos.push(
      <path key="puno" d={`M${CX - ruedo + 1},${yRuedo - 9} L${CX + ruedo - 1},${yRuedo - 9}`} stroke={linea} strokeWidth={1.2} />
    );
    if (nombre.includes("cremallera")) elementos.push(<line key="cierre" x1={CX} y1={Y.cuello + 10} x2={CX} y2={Y.pecho + 12} stroke={linea} strokeWidth={2} />);
    if (capucha) {
      elementos.push(
        <path key="bolsillo" d={`M${CX - 30},${yRuedo - 12} L${CX - 24},${yRuedo - 46} L${CX + 24},${yRuedo - 46} L${CX + 30},${yRuedo - 12}`} fill="none" stroke={linea} strokeWidth={1.2} />,
        <path key="cordon" d={`M${CX - 6},${Y.cuello + 14} L${CX - 7},${Y.cuello + 40} M${CX + 6},${Y.cuello + 14} L${CX + 7},${Y.cuello + 40}`} stroke={aclarar(p.color, 0.6)} strokeWidth={1.6} />
      );
    }
  }
  if (p.estampa === "grafica") {
    const g = esClaroColor(p.color) ? "#1d1b22" : "#f2f1ec";
    elementos.push(
      <g key="grafica" opacity={0.92}>
        <circle cx={CX} cy={Y.pecho + 10} r={15} fill="none" stroke={g} strokeWidth={2.5} />
        <path d={`M${CX - 7},${Y.pecho + 14} L${CX},${Y.pecho} L${CX + 7},${Y.pecho + 14} Z`} fill={g} />
      </g>
    );
  }
  elementos.push(...arrugas(ctx, pecho, Y.pecho + 6, yRuedo));
  return <g>{elementos}</g>;
}

function esClaroColor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 160;
}

/** Arrugas de tensión (talle chico) o pliegues (talle grande). */
function arrugas(ctx: Ctx, ancho: number, y0: number, y1: number): ReactNode[] {
  const { h, p } = ctx;
  const t = Math.min(h.torso, h.cintura, h.cadera);
  const linea = oscurecer(p.color, 0.4);
  const out: ReactNode[] = [];
  if (t < 0) {
    // Tirante: diagonales hacia el centro.
    const n = t < -3 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const y = y0 + 10 + i * 14;
      out.push(
        <path key={`ti${i}`} d={`M${CX - ancho + 5},${y} L${CX - ancho + 20},${y + 8}`} stroke={linea} strokeWidth={1.3} opacity={0.6} strokeLinecap="round" />,
        <path key={`td${i}`} d={`M${CX + ancho - 5},${y} L${CX + ancho - 20},${y + 8}`} stroke={linea} strokeWidth={1.3} opacity={0.6} strokeLinecap="round" />
      );
    }
  } else if (h.torso > 12 || p.calce === "oversize") {
    // Holgado: pliegues verticales.
    for (const dx of [-0.55, 0.5]) {
      out.push(
        <path key={`p${dx}`} d={`M${CX + ancho * dx},${y0 + 30} Q${CX + ancho * dx - 3},${(y0 + y1) / 2 + 10} ${CX + ancho * dx + 1},${y1 - 6}`} stroke={linea} strokeWidth={1.1} opacity={0.45} fill="none" strokeLinecap="round" />
      );
    }
  }
  return out;
}

// ── Inferiores ───────────────────────────────────────────────

function inferior(ctx: Ctx): ReactNode {
  const { c, h, p } = ctx;
  const cat = p.categoria;
  const nombre = p.nombre.toLowerCase();
  const ec = corte(h.cintura) * PX;
  const eh = corte(h.cadera) * PX;
  const cintura = c.cintura + ec * 0.8 + 2;
  const cadera = c.cadera + eh + 2;
  const linea = oscurecer(p.color, 0.38);
  const yTop = Y.cintura;
  const el: ReactNode[] = [];

  if (cat === "pollera") {
    const largo = nombre.includes("mini") ? 300 : nombre.includes("midi") ? 400 : 370;
    const vuelo = nombre.includes("plisada") ? 22 : nombre.includes("midi") ? 16 : 8;
    const izq: P[] = [
      [CX - cintura, yTop],
      [CX - cadera, Y.cadera],
      [CX - cadera - vuelo, largo + h.largo * 10],
    ];
    const pts = [...izq, ...espejo(izq)];
    el.push(<Tela key="pollera" d={suave(pts, 4)} ctx={ctx} />);
    el.push(<path key="cint" d={`M${CX - cintura},${yTop + 8} L${CX + cintura},${yTop + 8}`} stroke={linea} strokeWidth={1.2} />);
    if (nombre.includes("plisada")) {
      for (let i = -3; i <= 3; i++) {
        el.push(<path key={`pl${i}`} d={`M${CX + i * (cintura / 4)},${yTop + 10} L${CX + i * ((cadera + vuelo) / 4)},${largo - 2}`} stroke={linea} strokeWidth={1} opacity={0.6} />);
      }
    }
    if (nombre.includes("jean")) el.push(costurasJean(cintura, yTop, linea));
    return <g>{el}</g>;
  }

  const esShort = cat === "short";
  const yRuedo = esShort ? (nombre.includes("bermuda") ? 338 : 310) : Y.tobillo + 4 + h.largo * 10;
  const ancho =
    p.calce === "oversize" ? 15 : p.calce === "ajustado" ? 1 : nombre.includes("recto") || nombre.includes("mom") ? 6 : 4;
  const muslo = Math.max(0, eh) * 0.5;

  // Pierna izquierda (de afuera hacia adentro) y derecha espejada.
  const pierna: P[] = esShort
    ? [
        [CX - cintura, yTop],
        [CX - cadera, Y.cadera],
        [CX - cadera - 3 - ancho * 0.3, yRuedo],
        [CX - 4, yRuedo + 2],
        [CX, Y.entrepierna + 4],
      ]
    : [
        [CX - cintura, yTop],
        [CX - cadera, Y.cadera],
        [CX - c.cadera * 0.74 - muslo - ancho * 0.5, Y.rodilla],
        [CX - 26 - ancho, yRuedo],
        [CX - 9 + ancho * 0.25, yRuedo],
        [CX - 5 + muslo * 0.3, Y.rodilla],
        [CX, Y.entrepierna + 4],
      ];
  const der = espejo(pierna);
  const contorno: P[] = [...pierna, ...der];
  el.push(<Tela key="pant" d={suave(contorno, 4)} ctx={ctx} sinEstampa />);

  // Separación entre piernas
  el.push(<path key="entre" d={`M${CX},${Y.entrepierna - 30} L${CX},${Y.entrepierna + 4}`} stroke={linea} strokeWidth={1.1} />);
  // Cintura
  el.push(<path key="cint" d={`M${CX - cintura},${yTop + 9} L${CX + cintura},${yTop + 9}`} stroke={linea} strokeWidth={1.2} />);

  if (cat === "jean" || nombre.includes("jean")) el.push(costurasJean(cintura, yTop, linea));
  if (nombre.includes("cargo")) {
    const yb = esShort ? 280 : 320;
    el.push(
      <rect key="bi" x={CX - cadera - 1} y={yb} width={16} height={22} rx={2} fill="none" stroke={linea} strokeWidth={1.2} />,
      <rect key="bd" x={CX + cadera - 15} y={yb} width={16} height={22} rx={2} fill="none" stroke={linea} strokeWidth={1.2} />
    );
  }
  if (nombre.includes("jogger")) {
    el.push(
      <path key="pi" d={`M${CX - 26 - ancho},${yRuedo - 8} L${CX - 9 + ancho * 0.25},${yRuedo - 8} M${CX + 9 - ancho * 0.25},${yRuedo - 8} L${CX + 26 + ancho},${yRuedo - 8}`} stroke={linea} strokeWidth={1.2} />
    );
  }
  if (nombre.includes("deportivo")) {
    el.push(<path key="franja" d={`M${CX - cadera + 2},${Y.cadera} L${CX - cadera - 1},${yRuedo - 2} M${CX + cadera - 2},${Y.cadera} L${CX + cadera + 1},${yRuedo - 2}`} stroke="#f2f1ec" strokeWidth={3} />);
  }
  // Tensión o pliegues en la cadera
  if (h.cadera < 0 || h.cintura < 0) {
    el.push(
      <path key="tz" d={`M${CX - 14},${Y.entrepierna - 10} L${CX - 4},${Y.entrepierna - 2} M${CX + 14},${Y.entrepierna - 10} L${CX + 4},${Y.entrepierna - 2} M${CX - 18},${Y.entrepierna} L${CX - 6},${Y.entrepierna + 8} M${CX + 18},${Y.entrepierna} L${CX + 6},${Y.entrepierna + 8}`} stroke={linea} strokeWidth={1.2} opacity={0.6} strokeLinecap="round" />
    );
  } else if (!esShort && (h.cadera > 12 || p.calce === "oversize")) {
    el.push(
      <path key="pz" d={`M${CX - cadera + 10},${Y.cadera + 20} Q${CX - cadera + 6},${Y.rodilla - 30} ${CX - cadera + 10},${Y.rodilla + 20} M${CX + cadera - 10},${Y.cadera + 20} Q${CX + cadera - 6},${Y.rodilla - 30} ${CX + cadera - 10},${Y.rodilla + 20}`} stroke={linea} strokeWidth={1} opacity={0.45} fill="none" />
    );
  }
  return <g>{el}</g>;
}

function costurasJean(cintura: number, yTop: number, linea: string) {
  const costura = "#d9a441";
  return (
    <g key="jean">
      <path d={`M${CX - cintura + 4},${yTop + 14} Q${CX - cintura + 14},${yTop + 30} ${CX - cintura + 26},${yTop + 14}`} fill="none" stroke={linea} strokeWidth={1.1} />
      <path d={`M${CX + cintura - 4},${yTop + 14} Q${CX + cintura - 14},${yTop + 30} ${CX + cintura - 26},${yTop + 14}`} fill="none" stroke={linea} strokeWidth={1.1} />
      <path d={`M${CX + 2},${yTop + 10} Q${CX + 9},${yTop + 40} ${CX + 1},${yTop + 54}`} fill="none" stroke={costura} strokeWidth={1} strokeDasharray="2 2" />
      <circle cx={CX} cy={yTop + 5} r={2} fill="#c9a24a" />
    </g>
  );
}

// ── Vestido ──────────────────────────────────────────────────

function vestido(ctx: Ctx): ReactNode {
  const { c, h, p } = ctx;
  const nombre = p.nombre.toLowerCase();
  const e = corte(h.torso) * PX;
  const ew = corte(h.cintura) * PX;
  const eh = corte(h.cadera) * PX;
  const largo = nombre.includes("largo") ? 470 : nombre.includes("midi") || nombre.includes("camisero") ? 405 : 320;
  const vuelo = nombre.includes("slip") ? 4 : nombre.includes("corto") ? 10 : 20;
  const conMangas = nombre.includes("camisero");
  const pecho = c.pecho + e;
  const cintura = c.cintura + ew + 1;
  const cadera = c.cadera + eh + 2;
  const yTope = conMangas ? Y.cuello + 8 : Y.hombro + 14;
  const izq: P[] = conMangas
    ? [
        [CX - 13, Y.cuello + 8],
        [CX - c.hombro + 2, Y.hombro - 4],
        [CX - c.hombro - 1, Y.hombro + 6],
        [CX - pecho, Y.pecho],
        [CX - cintura, Y.cintura],
        [CX - cadera, Y.cadera],
        [CX - cadera - vuelo, largo + h.largo * 12],
      ]
    : [
        [CX - pecho * 0.62, yTope],
        [CX - pecho, Y.pecho],
        [CX - cintura, Y.cintura],
        [CX - cadera, Y.cadera],
        [CX - cadera - vuelo, largo + h.largo * 12],
      ];
  const el: ReactNode[] = [];
  const linea = oscurecer(p.color, 0.35);
  if (!conMangas) {
    // Breteles
    el.push(
      <path key="bret" d={`M${CX - pecho * 0.55},${yTope + 2} L${CX - c.hombro + 12},${Y.hombro - 2} M${CX + pecho * 0.55},${yTope + 2} L${CX + c.hombro - 12},${Y.hombro - 2}`} stroke={oscurecer(p.color, 0.15)} strokeWidth={2.4} strokeLinecap="round" />
    );
  } else {
    for (const lado of [-1, 1] as const) {
      const x = (v: number) => CX + lado * v;
      const pts: P[] = [
        [x(c.hombro - 6), Y.hombro - 4],
        [x(c.hombro + 8), Y.hombro + 8],
        [x(c.hombro + 11), 164],
        [x(c.hombro - 3), 168],
        [x(pecho - 6), Y.pecho - 4],
      ];
      el.push(<Tela key={`m${lado}`} d={suave(lado === 1 ? pts.reverse() : pts, 5)} ctx={ctx} />);
    }
  }
  el.push(<Tela key="vest" d={suave([...izq, ...espejo(izq)], 5)} ctx={ctx} />);
  el.push(<path key="talle" d={`M${CX - cintura},${Y.cintura} Q${CX},${Y.cintura + 4} ${CX + cintura},${Y.cintura}`} fill="none" stroke={linea} strokeWidth={1.2} />);
  if (conMangas) {
    el.push(
      <path key="cuello" d={`M${CX - 14},${Y.cuello + 4} L${CX - 4},${Y.cuello + 20} L${CX},${Y.cuello + 10} L${CX + 4},${Y.cuello + 20} L${CX + 14},${Y.cuello + 4}`} fill={aclarar(p.color, 0.15)} stroke={linea} strokeWidth={1.2} strokeLinejoin="round" />
    );
    for (let y = Y.cuello + 28; y < Y.cintura; y += 20) el.push(<circle key={`b${y}`} cx={CX} cy={y} r={1.8} fill={linea} />);
  } else {
    el.push(<path key="escote" d={`M${CX - pecho * 0.62},${yTope} Q${CX},${yTope + 14} ${CX + pecho * 0.62},${yTope}`} fill="none" stroke={linea} strokeWidth={1.4} />);
  }
  if (p.estampa === "grafica") {
    // Estampado floral simple
    const flor = aclarar(p.color, 0.6);
    for (let i = 0; i < 9; i++) {
      const x = CX + ((i % 3) - 1) * 26 + (i % 2 ? 6 : -6);
      const y = Y.cintura + 30 + Math.floor(i / 3) * ((largo - Y.cintura - 40) / 3);
      el.push(<circle key={`f${i}`} cx={x} cy={y} r={4} fill={flor} opacity={0.8} />);
    }
  }
  el.push(...arrugas(ctx, pecho, Y.pecho, Y.cintura + 30));
  return <g>{el}</g>;
}

// ── Entrada ──────────────────────────────────────────────────

export function DibujoPrenda({
  prenda,
  cuerpo,
  holgura,
  uid,
}: {
  prenda: PrendaDibujo;
  cuerpo: Cuerpo;
  holgura: Holgura;
  uid: string;
}) {
  const ctx: Ctx = { c: cuerpo, h: holgura, p: prenda, uid };
  const cat = prenda.categoria;
  return (
    <g>
      <DefsPrenda p={prenda} uid={uid} />
      {cat === "vestido"
        ? vestido(ctx)
        : ["jean", "pantalon", "short", "pollera"].includes(cat)
          ? inferior(ctx)
          : superior(ctx)}
    </g>
  );
}

export const HOLGURA_NEUTRA: Holgura = { torso: 6, cintura: 5, cadera: 5, largo: 0 };
