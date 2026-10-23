/**
 * Carga asistida de catálogo (CSV): la usan el portal de tienda y el
 * admin (que carga en nombre de una tienda).
 *
 * Pasos: archivo → columnas → validación → vista previa → publicar.
 */

import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Sparkles,
  Upload,
  Wand2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Chip, Panel } from "./shell";
import { PrendaIlustracion } from "./figura/prenda-ilustracion";
import { cn } from "./ui/utils";
import { useStore } from "../lib/store";
import {
  CATEGORIAS,
  PESOS,
  nombreCategoria,
  tablaPara,
  tallesDe,
  type CalcePrenda,
  type Categoria,
  type TablaTalles,
  type Zona,
} from "../lib/talles";
import { COLORES, tablaCompleta, type Estampa, type GeneroPrenda, type Prenda } from "../data/prendas";
import { HOY } from "../data/seed";
import { money, num } from "../lib/format";

// ── Campos y autodetección ───────────────────────────────────

type Campo =
  | "nombre"
  | "categoria"
  | "color"
  | "precio"
  | "talles"
  | "calce"
  | "genero"
  | "material"
  | "pecho"
  | "cintura"
  | "cadera"
  | "largo";

const CAMPOS: { id: Campo; label: string; requerido?: boolean; ayuda: string }[] = [
  { id: "nombre", label: "Nombre", requerido: true, ayuda: "Remera básica" },
  { id: "categoria", label: "Categoría", requerido: true, ayuda: "remera, jean, vestido…" },
  { id: "precio", label: "Precio", requerido: true, ayuda: "en pesos" },
  { id: "talles", label: "Talles", requerido: true, ayuda: "S|M|L" },
  { id: "color", label: "Color", ayuda: "Negro, Beige…" },
  { id: "calce", label: "Calce", ayuda: "ajustado, regular, oversize" },
  { id: "genero", label: "Género", ayuda: "mujer, hombre, unisex" },
  { id: "material", label: "Material", ayuda: "100 % algodón" },
  { id: "pecho", label: "Medidas · pecho", ayuda: "84-90|90-97" },
  { id: "cintura", label: "Medidas · cintura", ayuda: "66-72|72-79" },
  { id: "cadera", label: "Medidas · cadera", ayuda: "90-96|96-102" },
  { id: "largo", label: "Medidas · altura", ayuda: "155-168|161-176" },
];

const IGNORAR = "__ignorar";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const SINONIMOS: Record<Campo, string[]> = {
  nombre: ["nombre", "producto", "articulo", "prenda", "titulo", "descripcion", "name"],
  categoria: ["categoria", "tipo", "rubro", "category"],
  color: ["color", "colour"],
  precio: ["precio", "pvp", "valor", "price", "importe"],
  talles: ["talles", "talle", "tallas", "talla", "sizes", "size", "curva"],
  calce: ["calce", "fit", "corte", "horma"],
  genero: ["genero", "sexo", "gender", "publico"],
  material: ["material", "tela", "composicion"],
  pecho: ["pecho", "busto", "torax", "contorno pecho", "chest"],
  cintura: ["cintura", "waist"],
  cadera: ["cadera", "hip", "hips"],
  largo: ["largo", "altura", "estatura", "height"],
};

function autodetectar(cabecera: string[]): Record<number, Campo | typeof IGNORAR> {
  const out: Record<number, Campo | typeof IGNORAR> = {};
  const usados = new Set<Campo>();
  cabecera.forEach((h, i) => {
    const n = norm(h);
    let hallado: Campo | undefined;
    for (const c of Object.keys(SINONIMOS) as Campo[]) {
      if (usados.has(c)) continue;
      if (SINONIMOS[c].some((s) => n === s || n.startsWith(s + " ") || n.endsWith(" " + s))) {
        hallado = c;
        break;
      }
    }
    if (hallado) usados.add(hallado);
    out[i] = hallado ?? IGNORAR;
  });
  return out;
}

// ── CSV ──────────────────────────────────────────────────────

function parsearCsv(texto: string): string[][] {
  const limpio = texto.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const primera = limpio.split("\n")[0] ?? "";
  const sep = (primera.match(/;/g)?.length ?? 0) > (primera.match(/,/g)?.length ?? 0) ? ";" : ",";
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let comillas = false;
  for (let i = 0; i < limpio.length; i++) {
    const ch = limpio[i];
    if (comillas) {
      if (ch === '"' && limpio[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (ch === '"') comillas = false;
      else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === sep) {
      fila.push(campo.trim());
      campo = "";
    } else if (ch === "\n") {
      fila.push(campo.trim());
      if (fila.some((c) => c !== "")) filas.push(fila);
      fila = [];
      campo = "";
    } else campo += ch;
  }
  fila.push(campo.trim());
  if (fila.some((c) => c !== "")) filas.push(fila);
  return filas;
}

const ZONA_DE_CAMPO: Partial<Record<Campo, Zona>> = { pecho: "pecho", cintura: "cintura", cadera: "cadera", largo: "altura" };

/** Arma el texto de una zona para la planilla de ejemplo. */
const rangos = (tabla: TablaTalles, talles: string[], z: Zona, omitir: string[] = []) =>
  talles.map((t) => (omitir.includes(t) || !tabla[t]?.[z] ? "" : `${tabla[t][z]![0]}-${tabla[t][z]![1]}`)).join("|");

/** Planilla de ejemplo: básicos de una tienda chica, con algunos problemas a propósito. */
export function planillaEjemplo(): string {
  type Def = {
    nombre: string;
    cat: Categoria;
    color: string;
    precio: string;
    talles: string[];
    calce: CalcePrenda;
    material: string;
    sinMedidas?: boolean;
    faltan?: string[];
  };
  const defs: Def[] = [
    { nombre: "Remera básica", cat: "remera", color: "Blanco", precio: "890", talles: ["S", "M", "L", "XL"], calce: "regular", material: "100 % algodón peinado" },
    { nombre: "Remera de rayas", cat: "remera", color: "Azul marino", precio: "990", talles: ["XS", "S", "M", "L"], calce: "regular", material: "Jersey de algodón" },
    { nombre: "Buzo cuello redondo", cat: "buzo", color: "Gris melange", precio: "1890", talles: ["S", "M", "L", "XL"], calce: "regular", material: "Frisa de algodón", sinMedidas: true },
    { nombre: "Camisa de lino", cat: "camisa", color: "Beige", precio: "1690", talles: ["S", "M", "L"], calce: "regular", material: "Lino", faltan: ["L"] },
    { nombre: "Pantalón de lino", cat: "pantalon", color: "Camel", precio: "1990", talles: ["36", "38", "40", "42"], calce: "regular", material: "Lino" },
    { nombre: "Vestido midi", cat: "vestido", color: "Verde oliva", precio: "2290", talles: ["XS", "S", "M", "L"], calce: "regular", material: "Viscosa", sinMedidas: true },
    { nombre: "Short de lino", cat: "short", color: "Blanco", precio: "1190", talles: ["S", "M", "L"], calce: "regular", material: "Lino" },
    { nombre: "Hoodie oversize", cat: "buzo", color: "Lila", precio: "2190", talles: ["S", "M", "L", "XL"], calce: "oversize", material: "Frisa de algodón" },
    { nombre: "Pollera plisada", cat: "pollera", color: "Terracota", precio: "a confirmar", talles: ["S", "M", "L"], calce: "regular", material: "Crepe" },
  ];
  const cab = "nombre;categoria;color;precio;talles;calce;material;pecho;cintura;cadera;largo";
  const lineas = defs.map((d) => {
    const tabla = tablaPara(d.cat, d.calce, 1, d.talles);
    const z = (zona: Zona) => (d.sinMedidas ? "" : rangos(tabla, d.talles, zona, d.faltan));
    return [
      d.nombre,
      nombreCategoria(d.cat).toLowerCase(),
      d.color,
      d.precio,
      d.talles.join("|"),
      d.calce,
      d.material,
      z("pecho"),
      z("cintura"),
      z("cadera"),
      z("altura"),
    ].join(";");
  });
  return [cab, ...lineas].join("\n") + "\n";
}

// ── Validación ───────────────────────────────────────────────

const CAT_POR_NOMBRE = new Map<string, Categoria>();
for (const c of CATEGORIAS) {
  CAT_POR_NOMBRE.set(norm(c.id), c.id);
  CAT_POR_NOMBRE.set(norm(c.nombre), c.id);
  CAT_POR_NOMBRE.set(norm(c.plural), c.id);
}
CAT_POR_NOMBRE.set("falda", "pollera");
CAT_POR_NOMBRE.set("camiseta", "remera");
CAT_POR_NOMBRE.set("musculosa", "remera");
CAT_POR_NOMBRE.set("hoodie", "buzo");
CAT_POR_NOMBRE.set("bermuda", "short");

interface Fila {
  linea: number;
  nombre: string;
  categoria?: Categoria;
  colorNombre: string;
  color: string;
  precio?: number;
  talles: string[];
  calce: CalcePrenda;
  genero: GeneroPrenda;
  material: string;
  tabla: TablaTalles;
  /** Talles a los que les falta alguna medida de su categoría. */
  sinMedidas: string[];
  errores: string[];
  avisos: string[];
}

function construirFila(celdas: string[], linea: number, mapeo: Record<number, string>, conPlantilla: boolean): Fila {
  const val = (c: Campo) => {
    const i = Object.entries(mapeo).find(([, v]) => v === c)?.[0];
    return i === undefined ? "" : (celdas[Number(i)] ?? "").trim();
  };
  const errores: string[] = [];
  const avisos: string[] = [];

  const nombre = val("nombre");
  if (!nombre) errores.push("Falta el nombre");

  const catTxt = val("categoria");
  const categoria = CAT_POR_NOMBRE.get(norm(catTxt)) ?? CAT_POR_NOMBRE.get(norm(catTxt).replace(/s$/, ""));
  if (!categoria) errores.push(catTxt ? `La categoría «${catTxt}» no existe` : "Falta la categoría");

  const precioTxt = val("precio");
  const precioNum = Number(precioTxt.replace(/[$\s.]/g, "").replace(",", "."));
  const precio = precioTxt && Number.isFinite(precioNum) && precioNum > 0 ? Math.round(precioNum) : undefined;
  if (!precio) errores.push(precioTxt ? `Precio inválido («${precioTxt}»)` : "Falta el precio");

  const colorTxt = val("color");
  const colorHit = COLORES.find((c) => norm(c.nombre) === norm(colorTxt));
  if (colorTxt && !colorHit) avisos.push(`Color «${colorTxt}» fuera de la paleta: se muestra gris`);
  const colorNombre = colorHit?.nombre ?? (colorTxt || "Gris melange");
  const color = colorHit?.hex ?? "#a3a6ad";

  const calceTxt = norm(val("calce"));
  const calce: CalcePrenda =
    calceTxt.startsWith("ajust") || calceTxt === "slim"
      ? "ajustado"
      : calceTxt.startsWith("over") || calceTxt.startsWith("holg")
        ? "oversize"
        : norm(nombre).includes("oversize")
          ? "oversize"
          : "regular";

  const genTxt = norm(val("genero"));
  const genero: GeneroPrenda =
    genTxt.startsWith("muj") || genTxt === "f"
      ? "mujer"
      : genTxt.startsWith("homb") || genTxt === "m"
        ? "hombre"
        : genTxt === "unisex"
          ? "unisex"
          : categoria === "vestido" || categoria === "pollera"
            ? "mujer"
            : "unisex";

  const talles = val("talles")
    .split(/[|/,\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
  if (talles.length === 0) errores.push("Faltan los talles");
  if (categoria) {
    const validos = tallesDe(categoria);
    const malos = talles.filter((t) => !validos.includes(t));
    if (malos.length) errores.push(`Talle ${malos.join(", ")} no existe para ${nombreCategoria(categoria).toLowerCase()} (${validos[0]}–${validos[validos.length - 1]})`);
  }

  // Tabla de talles a partir de las columnas de medidas.
  const tabla: TablaTalles = {};
  const zonas = categoria ? (Object.keys(PESOS[categoria]) as Zona[]) : [];
  for (const t of talles) tabla[t] = {};
  for (const campo of ["pecho", "cintura", "cadera", "largo"] as Campo[]) {
    const zona = ZONA_DE_CAMPO[campo]!;
    const txt = val(campo);
    if (!txt) continue;
    const partes = txt.split("|");
    if (partes.length !== talles.length && partes.some((p) => p.trim()))
      avisos.push(`${campo === "largo" ? "Altura" : campo[0].toUpperCase() + campo.slice(1)}: ${partes.length} rangos para ${talles.length} talles`);
    talles.forEach((t, k) => {
      const m = (partes[k] ?? "").trim().match(/^(\d+(?:[.,]\d+)?)\s*[-–a]\s*(\d+(?:[.,]\d+)?)$/);
      if (!m) return;
      const a = Number(m[1].replace(",", "."));
      const b = Number(m[2].replace(",", "."));
      if (b <= a) {
        avisos.push(`Talle ${t}: rango de ${campo} invertido`);
        return;
      }
      if (zonas.includes(zona)) tabla[t][zona] = [a, b];
    });
  }

  let sinMedidas = categoria ? talles.filter((t) => zonas.some((z) => !tabla[t]?.[z])) : [];
  if (conPlantilla && categoria && sinMedidas.length) {
    const std = tablaPara(categoria, calce, 0, talles);
    for (const t of sinMedidas) tabla[t] = { ...std[t], ...tabla[t] };
    sinMedidas = talles.filter((t) => zonas.some((z) => !tabla[t]?.[z]));
  }

  return {
    linea,
    nombre,
    categoria,
    colorNombre,
    color,
    precio,
    talles,
    calce,
    genero,
    material: val("material") || "Sin especificar",
    tabla,
    sinMedidas,
    errores,
    avisos,
  };
}

const estampaDe = (nombre: string): Estampa => {
  const n = norm(nombre);
  if (n.includes("raya")) return "rayas";
  if (n.includes("cuadro")) return "cuadros";
  if (n.includes("estampad") || n.includes("grafica")) return "grafica";
  return "liso";
};

// ── Componente ───────────────────────────────────────────────

const PASOS = ["Archivo", "Columnas", "Validación", "Vista previa", "Publicar"];

export function CargaCatalogo({ tiendaId, onPublicado }: { tiendaId: string; onPublicado?: (n: number) => void }) {
  const { tiendas, guardarPrenda } = useStore();
  const tienda = tiendas.find((t) => t.id === tiendaId);
  const enAdmin = useLocation().pathname.startsWith("/admin");

  const [paso, setPaso] = useState(0);
  const [archivo, setArchivo] = useState<string | null>(null);
  const [celdas, setCeldas] = useState<string[][]>([]);
  const [mapeo, setMapeo] = useState<Record<number, string>>({});
  const [conPlantilla, setConPlantilla] = useState<Set<number>>(new Set());
  const [publicadas, setPublicadas] = useState<{ ok: number; incompletas: number } | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const cabecera = celdas[0] ?? [];
  const datos = celdas.slice(1);

  const filas = useMemo(
    () => datos.map((c, i) => construirFila(c, i + 2, mapeo, conPlantilla.has(i))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celdas, mapeo, conPlantilla]
  );
  const validas = filas.filter((f) => f.errores.length === 0);
  const conError = filas.filter((f) => f.errores.length > 0);
  const incompletas = validas.filter((f) => f.sinMedidas.length > 0);

  const asignados = Object.values(mapeo).filter((v) => v !== IGNORAR);
  const faltanRequeridos = CAMPOS.filter((c) => c.requerido && !asignados.includes(c.id));
  const duplicados = asignados.filter((v, i) => asignados.indexOf(v) !== i);

  const cargarTexto = (texto: string, nombre: string) => {
    const t = parsearCsv(texto);
    if (t.length < 2) {
      toast.error("No pudimos leer filas en ese archivo", { description: "Tiene que ser un CSV con una fila de encabezados y al menos una prenda." });
      return;
    }
    setCeldas(t);
    setArchivo(nombre);
    setMapeo(autodetectar(t[0]));
    setConPlantilla(new Set());
    setPublicadas(null);
    setPaso(1);
  };

  const leerArchivo = (f?: File | null) => {
    if (!f) return;
    if (!/\.(csv|txt)$/i.test(f.name)) {
      toast.error("Subí la planilla como CSV", { description: "En Excel o Google Sheets: Archivo → Descargar → CSV." });
      return;
    }
    const r = new FileReader();
    r.onload = () => cargarTexto(String(r.result ?? ""), f.name);
    r.readAsText(f);
  };

  const descargarPlantilla = () => {
    const blob = new Blob(["﻿" + planillaEjemplo()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-catalogo-ropa.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const completarTodas = () => {
    const s = new Set(conPlantilla);
    filas.forEach((f, i) => f.errores.length === 0 && f.sinMedidas.length > 0 && s.add(i));
    setConPlantilla(s);
    toast.success("Tablas completadas con la plantilla estándar", { description: "Revisalas después en Tablas de talles si tu molde es distinto." });
  };

  const publicar = () => {
    const base = Date.now();
    let ok = 0;
    let inc = 0;
    validas.forEach((f, i) => {
      const completa = tablaCompleta({ tabla: f.tabla }) && f.sinMedidas.length === 0;
      const p: Prenda = {
        id: `${tiendaId}-c${base}-${i}`,
        tiendaId,
        nombre: f.nombre,
        categoria: f.categoria!,
        genero: f.genero,
        precio: f.precio!,
        color: f.color,
        colorNombre: f.colorNombre,
        estampa: estampaDe(f.nombre),
        calce: f.calce,
        talles: f.talles,
        tabla: f.tabla,
        estado: completa ? "publicada" : "incompleta",
        destacada: false,
        material: f.material,
        fechaAlta: HOY,
      };
      guardarPrenda(p);
      if (completa) ok++;
      else inc++;
    });
    setPublicadas({ ok, incompletas: inc });
    onPublicado?.(ok + inc);
    toast.success(`${num(ok + inc)} prendas cargadas${tienda ? ` en ${tienda.nombre}` : ""}`, {
      description: inc ? `${num(inc)} quedan con la tabla incompleta.` : "Todas con su tabla de talles completa.",
    });
  };

  const reiniciar = () => {
    setPaso(0);
    setCeldas([]);
    setArchivo(null);
    setPublicadas(null);
  };

  const ejemploDe = (i: number) =>
    datos
      .slice(0, 2)
      .map((d) => d[i])
      .filter((x) => x && x.replace(/\|/g, "").trim())
      .join(" · ") || "—";

  const selectorCampo = (i: number, cls: string) => {
    const v = mapeo[i] ?? IGNORAR;
    const dup = v !== IGNORAR && duplicados.includes(v);
    return (
      <Select value={v} onValueChange={(nv) => setMapeo({ ...mapeo, [i]: nv })}>
        <SelectTrigger className={cn(cls, dup && "border-red-400", v === IGNORAR && "text-muted-foreground")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={IGNORAR}>No importar</SelectItem>
          {CAMPOS.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.label}
              {c.requerido ? " *" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const tallesFila = (f: (typeof filas)[number]) => (
    <div className="flex flex-wrap gap-1">
      {f.talles.map((t) => (
        <span
          key={t}
          className={cn("rounded border px-1.5 text-xs", f.sinMedidas.includes(t) ? "border-dashed border-amber-400 text-amber-700" : "border-border")}
        >
          {t}
        </span>
      ))}
    </div>
  );

  const estadoFila = (f: (typeof filas)[number], i: number) => (
    <>
      {f.errores.length > 0 ? (
        <p className="flex items-start gap-1.5 text-sm text-red-700">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {f.errores.join(" · ")}
        </p>
      ) : f.sinMedidas.length > 0 ? (
        <p className="flex items-start gap-1.5 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {f.sinMedidas.length === f.talles.length ? "Sin medidas" : `Sin medidas en ${f.sinMedidas.join(", ")}`}
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-sm text-[var(--brand-700)]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {conPlantilla.has(i) ? "Completada con la plantilla" : "Lista"}
        </p>
      )}
      {f.avisos.length > 0 && <p className="mt-0.5 text-xs text-muted-foreground">{f.avisos.join(" · ")}</p>}
    </>
  );

  const puedeSeguir =
    paso === 0 ? celdas.length > 1 : paso === 1 ? faltanRequeridos.length === 0 && duplicados.length === 0 : paso === 2 ? validas.length > 0 : true;

  return (
    <div className="space-y-6">
      {/* Pasos */}
      <ol className="flex flex-wrap items-center gap-2">
        {PASOS.map((p, i) => {
          const hecho = i < paso || (publicadas && i === 4);
          const actual = i === paso && !publicadas;
          return (
            <li key={p} className="flex items-center gap-2">
              <button
                disabled={i > paso || !!publicadas}
                onClick={() => setPaso(i)}
                aria-label={p}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-1.5 py-1.5 text-sm transition-colors sm:px-3",
                  actual && "px-3",
                  actual && "border-[var(--brand)] bg-[var(--brand-50)] font-medium text-[var(--brand-700)]",
                  hecho && "border-transparent bg-[var(--brand-100)] text-[var(--brand-700)]",
                  !actual && !hecho && "border-border text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                    hecho || actual ? "bg-[var(--brand)] text-white" : "bg-muted"
                  )}
                >
                  {hecho ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={cn(!actual && "sr-only sm:not-sr-only")}>{p}</span>
              </button>
              {i < PASOS.length - 1 && <span className="hidden h-px w-6 bg-border sm:block" />}
            </li>
          );
        })}
      </ol>

      {/* 1 · Archivo */}
      {paso === 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              leerArchivo(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card px-6 py-14 text-center transition-colors",
              arrastrando ? "border-[var(--brand)] bg-[var(--brand-50)]" : "border-border"
            )}
          >
            <span className="rounded-full bg-[var(--brand-100)] p-3">
              <Upload className="h-6 w-6 text-[var(--brand-700)]" />
            </span>
            <p className="font-medium">Arrastrá tu planilla acá</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Un CSV exportado de Excel, Google Sheets o tu e-commerce, separado por comas o punto y coma. Una fila por prenda.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => input.current?.click()}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Elegir archivo
              </Button>
              <Button onClick={() => cargarTexto(planillaEjemplo(), "planilla-de-ejemplo.csv")}>
                <Sparkles className="mr-2 h-4 w-4" /> Usar planilla de ejemplo
              </Button>
            </div>
            <input
              ref={input}
              type="file"
              accept=".csv,text/csv,.txt"
              className="hidden"
              onChange={(e) => {
                leerArchivo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          <Panel titulo="Qué columnas necesitamos" bajada="Los nombres no tienen que coincidir: en el paso siguiente los asignás.">
            <ul className="space-y-1.5 text-sm">
              {CAMPOS.map((c) => (
                <li key={c.id} className="flex items-baseline justify-between gap-3">
                  <span>
                    {c.label}
                    {c.requerido && <span className="ml-1 text-[var(--brand-700)]">*</span>}
                  </span>
                  <code className="truncate text-xs text-muted-foreground">{c.ayuda}</code>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Las medidas son del cuerpo que entra en cada talle, en cm, en el mismo orden que los talles. Si no las tenés, las completamos con la plantilla de la categoría.
            </p>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={descargarPlantilla}>
              <Download className="mr-2 h-4 w-4" /> Descargar plantilla
            </Button>
          </Panel>
        </div>
      )}

      {/* 2 · Columnas */}
      {paso === 1 && (
        <Panel
          titulo="Asigná cada columna a un campo"
          bajada={`${archivo} · ${num(datos.length)} filas. Las detectamos por el nombre: revisá que estén bien.`}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border md:hidden">
            {cabecera.map((h, i) => (
              <li key={i} className="space-y-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{h || <span className="text-muted-foreground">(sin nombre)</span>}</p>
                  <p className="truncate text-xs text-muted-foreground">Ej.: {ejemploDe(i)}</p>
                </div>
                {selectorCampo(i, "h-10 w-full")}
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Columna en tu archivo</TableHead>
                <TableHead>Ejemplo</TableHead>
                <TableHead className="w-64 pr-4">Campo en ROPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cabecera.map((h, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4 font-medium">{h || <span className="text-muted-foreground">(sin nombre)</span>}</TableCell>
                    <TableCell className="max-w-[18rem] truncate text-xs text-muted-foreground">{ejemploDe(i)}</TableCell>
                    <TableCell className="pr-4">{selectorCampo(i, "h-9")}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          </div>
          {(faltanRequeridos.length > 0 || duplicados.length > 0) && (
            <div className="flex items-start gap-2 border-t border-border bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {faltanRequeridos.length > 0 && <>Falta asignar: {faltanRequeridos.map((c) => c.label).join(", ")}. </>}
                {duplicados.length > 0 && <>Hay campos asignados a más de una columna.</>}
              </span>
            </div>
          )}
        </Panel>
      )}

      {/* 3 · Validación */}
      {paso === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Resumen icono={CheckCircle2} tono="ok" valor={validas.length - incompletas.length} texto="listas, con su tabla completa" />
            <Resumen icono={AlertTriangle} tono="aviso" valor={incompletas.length} texto="con talles sin medidas" />
            <Resumen icono={XCircle} tono="error" valor={conError.length} texto="con errores: no se cargan" />
          </div>
          {incompletas.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--brand-100)] bg-[var(--brand-50)] p-4 sm:flex-row sm:items-center">
              <Wand2 className="h-5 w-5 shrink-0 text-[var(--brand-700)]" />
              <p className="flex-1 text-sm">
                <span className="font-medium">{num(incompletas.length)} prendas tienen talles sin medidas.</span> Podemos completarlas con la tabla estándar de
                su categoría y su calce; después las ajustás a tu molde en Tablas de talles.
              </p>
              <Button size="sm" onClick={completarTodas}>
                Completar con la plantilla
              </Button>
            </div>
          )}
          <Panel bodyClassName="p-0" titulo="Fila por fila">
            <ul className="divide-y divide-border md:hidden">
              {filas.map((f, i) => (
                <li key={i} className={cn("px-4 py-3", f.errores.length > 0 && "bg-red-50/50")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{f.nombre || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        Fila {f.linea} · {f.categoria ? nombreCategoria(f.categoria) : "sin categoría"}
                        {f.colorNombre ? ` · ${f.colorNombre}` : ""}
                      </p>
                    </div>
                    {f.precio ? <p className="tabular shrink-0 text-sm font-semibold">{money(f.precio)}</p> : null}
                  </div>
                  <div className="mt-2">{tallesFila(f)}</div>
                  <div className="mt-2">{estadoFila(f, i)}</div>
                  {f.errores.length === 0 && f.sinMedidas.length > 0 && (
                    <Button size="sm" variant="outline" className="mt-2 h-9 w-full" onClick={() => setConPlantilla(new Set(conPlantilla).add(i))}>
                      <Wand2 className="mr-1.5 h-3.5 w-3.5" /> Completar con la plantilla
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 pl-4">Fila</TableHead>
                  <TableHead>Prenda</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Talles</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="pr-4 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((f, i) => (
                  <TableRow key={i} className={f.errores.length ? "bg-red-50/40" : undefined}>
                    <TableCell className="tabular pl-4 text-muted-foreground">{f.linea}</TableCell>
                    <TableCell>
                      <p className="font-medium">{f.nombre || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.colorNombre}
                        {f.precio ? ` · ${money(f.precio)}` : ""}
                      </p>
                    </TableCell>
                    <TableCell>{f.categoria ? nombreCategoria(f.categoria) : "—"}</TableCell>
                    <TableCell>{tallesFila(f)}</TableCell>
                    <TableCell className="min-w-[10rem] max-w-[22rem] whitespace-normal">{estadoFila(f, i)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      {f.errores.length === 0 && f.sinMedidas.length > 0 && (
                        <Button size="sm" variant="outline" onClick={() => setConPlantilla(new Set(conPlantilla).add(i))}>
                          <Wand2 className="mr-1.5 h-3.5 w-3.5" /> Completar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </Panel>
          {conError.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Las filas con errores no se cargan. Corregilas en tu planilla y volvé a subirla cuando quieras: las demás ya quedan cargadas.
            </p>
          )}
        </div>
      )}

      {/* 4 · Vista previa */}
      {paso === 3 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Así se van a ver tus prendas en la app.</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {validas.map((f) => (
              <div key={f.linea} className="overflow-hidden rounded-xl border border-border bg-card">
                <PrendaIlustracion
                  prenda={{ categoria: f.categoria!, color: f.color, estampa: estampaDe(f.nombre), calce: f.calce, nombre: f.nombre }}
                  className="aspect-[4/5]"
                />
                <div className="space-y-1.5 p-3">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium leading-snug sm:truncate">{f.nombre}</p>
                      <p className="truncate text-xs text-muted-foreground">{tienda?.nombre} · {f.colorNombre}</p>
                    </div>
                    <p className="tabular shrink-0 text-sm font-semibold">{money(f.precio!)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {f.talles.map((t) => (
                      <span key={t} className="rounded border border-border px-1.5 text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                  {f.sinMedidas.length > 0 ? (
                    <Chip className="border-amber-200 bg-amber-50 text-amber-800">Tabla incompleta</Chip>
                  ) : (
                    <Chip className="border-[var(--brand-300)] bg-[var(--brand-50)] text-[var(--brand-700)]">
                      <span className="sm:hidden">Recomienda talle</span>
                      <span className="hidden sm:inline">Con recomendación de talle</span>
                    </Chip>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5 · Publicar */}
      {paso === 4 && !publicadas && (
        <Panel titulo="Todo listo para cargar">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--brand-700)]" />
              <span>
                <strong>{num(validas.length - incompletas.length)}</strong> prendas se publican con su tabla de talles
                {tienda?.estado === "onboarding" ? " (se ven en la app cuando publiques tu tienda)" : ""}.
              </span>
            </li>
            {incompletas.length > 0 && (
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>
                  <strong>{num(incompletas.length)}</strong> quedan como «tabla incompleta» hasta que completes sus medidas.
                </span>
              </li>
            )}
            {conError.length > 0 && (
              <li className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>
                  <strong>{num(conError.length)}</strong> filas con errores no se cargan.
                </span>
              </li>
            )}
          </ul>
          <Button className="mt-5" onClick={publicar}>
            <Upload className="mr-2 h-4 w-4" /> Cargar {num(validas.length)} prendas{tienda ? ` en ${tienda.nombre}` : ""}
          </Button>
        </Panel>
      )}

      {publicadas && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <span className="rounded-full bg-[var(--brand-100)] p-3">
            <CheckCircle2 className="h-7 w-7 text-[var(--brand-700)]" />
          </span>
          <p className="text-lg font-semibold">{num(publicadas.ok + publicadas.incompletas)} prendas cargadas</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {num(publicadas.ok)} con su tabla completa
            {publicadas.incompletas ? ` y ${num(publicadas.incompletas)} con la tabla incompleta` : ""}.
            {tienda?.estado === "onboarding"
              ? " Ya podés volver al alta y publicar tu tienda."
              : tienda?.estado === "activa"
                ? " Las completas ya aparecen en la app."
                : ""}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {!enAdmin && tienda?.estado === "onboarding" && (
              <Button asChild>
                <Link to="/tienda">Volver al alta</Link>
              </Button>
            )}
            {!enAdmin && publicadas.incompletas > 0 && (
              <Button asChild variant={tienda?.estado === "onboarding" ? "outline" : "default"}>
                <Link to="/tienda/talles">Completar tablas</Link>
              </Button>
            )}
            {!enAdmin && (
              <Button asChild variant="outline">
                <Link to="/tienda/prendas">Ver mis prendas</Link>
              </Button>
            )}
            <Button variant="ghost" onClick={reiniciar}>
              Cargar otra planilla
            </Button>
          </div>
        </div>
      )}

      {/* Navegación */}
      {paso > 0 && !publicadas && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-background pt-4 max-md:sticky max-md:bottom-0 max-md:z-10 max-md:-mx-4 max-md:px-4 max-md:pb-4">
          <Button variant="ghost" onClick={() => setPaso(paso - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
          </Button>
          {paso < 4 && (
            <Button disabled={!puedeSeguir} onClick={() => setPaso(paso + 1)}>
              {paso === 3 ? "Seguir" : "Siguiente"} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Resumen({
  icono: Icono,
  tono,
  valor,
  texto,
}: {
  icono: React.ComponentType<{ className?: string }>;
  tono: "ok" | "aviso" | "error";
  valor: number;
  texto: string;
}) {
  const c = {
    ok: "text-[var(--brand-700)] bg-[var(--brand-50)]",
    aviso: "text-amber-700 bg-amber-50",
    error: "text-red-700 bg-red-50",
  }[tono];
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
      <span className={cn("rounded-lg p-1.5 sm:p-2", c)}>
        <Icono className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <div className="min-w-0">
        <p className="tabular text-2xl font-semibold leading-none">{num(valor)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{texto}</p>
      </div>
    </div>
  );
}
