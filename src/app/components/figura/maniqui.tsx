import { useId } from "react";
import { CX, VIEWBOX, Y, cuerpoDe, oscurecer, type Cuerpo } from "./cuerpo";
import { espejo, suave } from "./trazo";
import { DibujoPrenda, HOLGURA_NEUTRA, type Holgura, type PrendaDibujo } from "./prendas-svg";
import { ES_INFERIOR, holgura, type Medidas, type TablaTalles } from "../../lib/talles";
import { cn } from "../ui/utils";

// ─────────────────────────────────────────────────────────────
// Personas de demostración. Ilustradas, sin rostro (estilo figurín):
// son las "fotos de ejemplo" del probador y la modelo de la portada.
// Cuando el grupo tenga las imágenes generadas con IA, se reemplazan.
// ─────────────────────────────────────────────────────────────

export interface Persona {
  id: string;
  nombre: string;
  piel: string;
  pelo: string;
  peinado: "largo" | "corto" | "rulos" | "recogido";
  medidas: Medidas;
}

export const PERSONAS: Persona[] = [
  {
    id: "ana",
    nombre: "Ana",
    piel: "#e9b994",
    pelo: "#4a2c1a",
    peinado: "largo",
    medidas: { altura: 165, peso: 57, pecho: 87, cintura: 67, cadera: 94, genero: "mujer", preferencia: "regular" },
  },
  {
    id: "tomas",
    nombre: "Tomás",
    piel: "#c98f63",
    pelo: "#1c1410",
    peinado: "corto",
    medidas: { altura: 178, peso: 72, pecho: 97, cintura: 81, cadera: 97, genero: "hombre", preferencia: "regular" },
  },
  {
    id: "mia",
    nombre: "Mía",
    piel: "#8a5638",
    pelo: "#140c08",
    peinado: "rulos",
    medidas: { altura: 160, peso: 64, pecho: 94, cintura: 76, cadera: 103, genero: "mujer", preferencia: "regular" },
  },
];

export const personaById = (id: string) => PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];

/** Persona ilustrada para un usuario: su género y sus medidas, con rasgos de una persona demo. */
export function personaPara(medidas: Medidas, id = "yo"): Persona {
  const base = medidas.genero === "hombre" ? PERSONAS[1] : PERSONAS[0];
  return { ...base, id, medidas };
}

export interface Puesta {
  prenda: PrendaDibujo & { tabla?: TablaTalles };
  /** Si viene talle y tabla, la holgura sale del recomendador. */
  talle?: string;
  holgura?: Holgura;
}

const BASE_SUPERIOR: PrendaDibujo = { categoria: "remera", color: "#f2f1ec", estampa: "liso", calce: "regular", nombre: "Remera básica" };
const BASE_INFERIOR: PrendaDibujo = { categoria: "jean", color: "#4f6f99", estampa: "liso", calce: "regular", nombre: "Jean recto" };

function holguraDe(p: Puesta, m: Medidas): Holgura {
  if (p.holgura) return p.holgura;
  if (p.talle && p.prenda.tabla) return holgura(p.prenda.tabla, p.prenda.categoria, p.talle, m);
  return HOLGURA_NEUTRA;
}

function Pelo({ persona, capa }: { persona: Persona; capa: "atras" | "adelante" }) {
  const c = persona.pelo;
  const y = Y.cabeza;
  if (persona.peinado === "largo") {
    return capa === "atras" ? (
      <path d={`M${CX - 27},${y - 6} Q${CX - 32},${y + 60} ${CX - 30},${y + 88} L${CX + 30},${y + 88} Q${CX + 32},${y + 60} ${CX + 27},${y - 6} Z`} fill={c} />
    ) : (
      <path d={`M${CX - 26},${y + 2} Q${CX - 28},${y - 34} ${CX},${y - 33} Q${CX + 30},${y - 34} ${CX + 26},${y + 6} Q${CX + 12},${y - 18} ${CX - 8},${y - 14} Q${CX - 20},${y - 10} ${CX - 26},${y + 2} Z`} fill={c} />
    );
  }
  if (persona.peinado === "rulos") {
    if (capa === "adelante") return null;
    const bolas: [number, number, number][] = [
      [-24, -18, 15], [0, -30, 17], [24, -18, 15], [-31, 6, 13], [31, 6, 13], [-28, 28, 12], [28, 28, 12], [-12, -26, 14], [12, -26, 14],
    ];
    return (
      <g fill={c}>
        {bolas.map(([dx, dy, r], i) => (
          <circle key={i} cx={CX + dx} cy={y + dy} r={r} />
        ))}
      </g>
    );
  }
  if (persona.peinado === "recogido") {
    return capa === "atras" ? (
      <circle cx={CX} cy={y - 32} r={13} fill={c} />
    ) : (
      <path d={`M${CX - 25},${y} Q${CX - 26},${y - 32} ${CX},${y - 31} Q${CX + 26},${y - 32} ${CX + 25},${y} Q${CX + 10},${y - 20} ${CX - 25},${y} Z`} fill={c} />
    );
  }
  // corto
  return capa === "atras" ? null : (
    <path d={`M${CX - 25},${y - 2} Q${CX - 27},${y - 33} ${CX},${y - 32} Q${CX + 28},${y - 33} ${CX + 25},${y - 2} Q${CX + 20},${y - 16} ${CX + 4},${y - 18} Q${CX - 16},${y - 18} ${CX - 25},${y - 2} Z`} fill={c} />
  );
}

/** El cuerpo, sin ropa: piel, pelo y zapatillas. */
function Cuerpo({ persona, c }: { persona: Persona; c: Cuerpo }) {
  const piel = persona.piel;
  const sombra = oscurecer(piel, 0.12);
  const torsoIzq: [number, number][] = [
    [CX - 9, Y.cuello - 4],
    [CX - 9, Y.cuello + 8],
    [CX - c.hombro + 4, Y.hombro - 4],
    [CX - c.hombro, Y.hombro + 8],
    [CX - c.pecho, Y.pecho],
    [CX - c.cintura, Y.cintura],
    [CX - c.cadera, Y.cadera],
    [CX - c.cadera * 0.98, Y.entrepierna],
  ];
  const torso = [...torsoIzq, ...espejo(torsoIzq)];
  const pierna = (lado: 1 | -1) => {
    const x = (v: number) => CX + lado * v;
    const pts: [number, number][] = [
      [x(c.cadera - 1), Y.cadera + 4],
      [x(c.cadera * 0.72), Y.rodilla],
      [x(23), Y.tobillo],
      [x(12), Y.tobillo],
      [x(6), Y.rodilla],
      [x(2), Y.entrepierna],
    ];
    return suave(lado === 1 ? pts.reverse() : pts, 6);
  };
  const brazo = (lado: 1 | -1) => {
    const x = (v: number) => CX + lado * v;
    const pts: [number, number][] = [
      [x(c.hombro - 4), Y.hombro - 2],
      [x(c.hombro + 7), Y.hombro + 12],
      [x(c.hombro + 11), 200],
      [x(c.hombro + 12), Y.muneca],
      [x(c.hombro + 1), Y.muneca],
      [x(c.hombro - 1), 200],
      [x(c.pecho - 4), Y.pecho],
    ];
    return suave(lado === 1 ? pts.reverse() : pts, 6);
  };
  return (
    <g>
      <Pelo persona={persona} capa="atras" />
      {[-1, 1].map((l) => (
        <path key={`b${l}`} d={brazo(l as 1 | -1)} fill={piel} stroke={sombra} strokeWidth={1} />
      ))}
      {[-1, 1].map((l) => (
        <ellipse key={`m${l}`} cx={CX + l * (c.hombro + 6.5)} cy={Y.muneca + 10} rx={6.5} ry={11} fill={piel} stroke={sombra} strokeWidth={1} />
      ))}
      {[-1, 1].map((l) => (
        <path key={`p${l}`} d={pierna(l as 1 | -1)} fill={piel} stroke={sombra} strokeWidth={1} />
      ))}
      <path d={suave(torso, 6)} fill={piel} stroke={sombra} strokeWidth={1} />
      <ellipse cx={CX} cy={Y.cabeza} rx={23} ry={28} fill={piel} stroke={sombra} strokeWidth={1} />
      <path d={`M${CX - 9},${Y.cuello - 2} Q${CX},${Y.cuello + 6} ${CX + 9},${Y.cuello - 2}`} fill="none" stroke={sombra} strokeWidth={1.2} />
      <Pelo persona={persona} capa="adelante" />
      {/* Zapatillas */}
      {[-1, 1].map((l) => (
        <g key={`z${l}`}>
          <path
            d={`M${CX + l * 8},${Y.tobillo + 2} L${CX + l * 28},${Y.tobillo + 2} Q${CX + l * 34},${Y.tobillo + 16} ${CX + l * 26},${Y.tobillo + 18} L${CX + l * 7},${Y.tobillo + 18} Q${CX + l * 4},${Y.tobillo + 10} ${CX + l * 8},${Y.tobillo + 2} Z`}
            fill="#fafafa"
            stroke="#c7c5cc"
            strokeWidth={1.2}
          />
          <path d={`M${CX + l * 7},${Y.tobillo + 15} L${CX + l * 28},${Y.tobillo + 15}`} stroke="#c7c5cc" strokeWidth={1.2} />
        </g>
      ))}
    </g>
  );
}

/**
 * Maniquí vestido. Si no se le pone una prenda de arriba (o de abajo),
 * usa una remera blanca (o un jean) neutros, para que nunca quede sin ropa.
 */
export function Maniqui({
  persona,
  puestas,
  className,
  sombraPiso = true,
}: {
  persona: Persona;
  puestas: Puesta[];
  className?: string;
  sombraPiso?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const c = cuerpoDe(persona.medidas);
  const hayVestido = puestas.some((p) => p.prenda.categoria === "vestido");
  const haySup = hayVestido || puestas.some((p) => !ES_INFERIOR[p.prenda.categoria] && p.prenda.categoria !== "vestido");
  const hayInf = hayVestido || puestas.some((p) => ES_INFERIOR[p.prenda.categoria]);

  // Orden: abajo primero; camperas encima de todo.
  const orden = (p: Puesta) =>
    ES_INFERIOR[p.prenda.categoria] ? 0 : p.prenda.categoria === "campera" ? 3 : p.prenda.categoria === "vestido" ? 1 : 2;
  const lista: Puesta[] = [
    ...(hayInf ? [] : [{ prenda: BASE_INFERIOR }]),
    ...(haySup ? [] : [{ prenda: BASE_SUPERIOR }]),
    ...puestas,
  ].sort((a, b) => orden(a) - orden(b));
  // Bajo una campera, si no hay remera, va la remera base.
  if (puestas.some((p) => p.prenda.categoria === "campera") && !puestas.some((p) => ["remera", "buzo", "camisa"].includes(p.prenda.categoria))) {
    lista.splice(lista.findIndex((p) => p.prenda.categoria === "campera"), 0, { prenda: BASE_SUPERIOR });
  }

  return (
    <svg viewBox={VIEWBOX} className={cn("h-full w-full", className)} role="img" aria-label={`${persona.nombre} con la prenda puesta`}>
      {sombraPiso && <ellipse cx={CX} cy={Y.tobillo + 20} rx={62} ry={7} fill="#000" opacity={0.12} />}
      <Cuerpo persona={persona} c={c} />
      {lista.map((p, i) => (
        <DibujoPrenda key={i} prenda={p.prenda} cuerpo={c} holgura={holguraDe(p, persona.medidas)} uid={`${uid}-${i}`} />
      ))}
    </svg>
  );
}
