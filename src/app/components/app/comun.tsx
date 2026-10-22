// ─────────────────────────────────────────────────────────────
// Piezas compartidas de la app de usuario: tarjeta de prenda,
// chip de talle, encabezados, barras por zona y controles.
// ─────────────────────────────────────────────────────────────

import { useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Heart, Minus, Plus } from "lucide-react";
import { PrendaIlustracion } from "../figura/prenda-ilustracion";
import { useStore, useYo } from "../../lib/store";
import { money } from "../../lib/format";
import {
  NOMBRE_ZONA,
  recomendar,
  textoZona,
  type DetalleZona,
  type Medidas,
  type Recomendacion,
  type TablaTalles,
  type Veredicto,
} from "../../lib/talles";
import type { Prenda } from "../../data/prendas";
import { Slider } from "../ui/slider";
import { cn } from "../ui/utils";

// ── Recomendación con caché ─────────────────────────────────

const cache = new WeakMap<TablaTalles, Map<string, Recomendacion | null>>();

/** Recomendación de talle de una prenda para unas medidas (memoizada). */
export function recDe(p: Prenda, m: Medidas | null | undefined): Recomendacion | null {
  if (!m) return null;
  let porTabla = cache.get(p.tabla);
  if (!porTabla) {
    porTabla = new Map();
    cache.set(p.tabla, porTabla);
  }
  const k = `${p.categoria}|${m.altura}|${m.peso}|${m.pecho}|${m.cintura}|${m.cadera}|${m.genero}|${m.preferencia}`;
  if (!porTabla.has(k)) porTabla.set(k, recomendar(p.tabla, p.categoria, m));
  return porTabla.get(k) ?? null;
}

/** «Tiene mi talle»: la recomendación cae en un talle ofrecido y con buena confianza. */
export const tieneMiTalle = (p: Prenda, r: Recomendacion | null) =>
  !!r && p.talles.includes(r.talle) && r.confianza >= 70;

/** Prenda pensada para el género del usuario (o unisex). */
export const paraMi = (p: Prenda, m: Medidas | null | undefined) =>
  !m || p.genero === "unisex" || p.genero === m.genero;

// ── Colores por veredicto y confianza ───────────────────────

export const COLOR_VEREDICTO: Record<Veredicto, string> = {
  ideal: "var(--ok)",
  holgado: "#3b82f6",
  justo: "var(--warn)",
  chico: "var(--danger)",
  grande: "var(--danger)",
};

export function tonoConfianza(c: number) {
  if (c >= 85) return "alta";
  if (c >= 70) return "media";
  return "baja";
}

// ── Chip «Tu talle: M · 92 %» ───────────────────────────────

export function ChipTalle({
  rec,
  className,
  corto = false,
}: {
  rec: Recomendacion | null;
  className?: string;
  corto?: boolean;
}) {
  if (!rec) return null;
  const tono = tonoConfianza(rec.confianza);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none shadow-sm backdrop-blur",
        tono === "alta" && "bg-white/95 text-[var(--brand-700)]",
        tono === "media" && "bg-white/95 text-[var(--ink-800)]",
        tono === "baja" && "bg-amber-50/95 text-amber-800",
        className
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: tono === "alta" ? "var(--brand)" : tono === "media" ? "var(--ok)" : "var(--warn)" }}
      />
      {corto ? rec.talle : `Tu talle: ${rec.talle}`}
      <span className="font-medium opacity-60">· {rec.confianza} %</span>
    </span>
  );
}

// ── Favorito ─────────────────────────────────────────────────

export function useFavoritos() {
  const { favoritos, toggleFavorito } = useStore();
  const { usuario } = useYo();
  const lista = usuario ? favoritos[usuario.id] ?? [] : [];
  return {
    lista,
    es: (id: string) => lista.includes(id),
    toggle: (id: string) => usuario && toggleFavorito(usuario.id, id),
  };
}

export function Corazon({ prendaId, className }: { prendaId: string; className?: string }) {
  const fav = useFavoritos();
  const activo = fav.es(prendaId);
  return (
    <button
      type="button"
      aria-label={activo ? "Quitar de favoritos" : "Guardar en favoritos"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        fav.toggle(prendaId);
      }}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-transform active:scale-90",
        className
      )}
    >
      <Heart
        className={cn("h-4 w-4 transition-colors", activo ? "fill-[var(--brand)] text-[var(--brand)]" : "text-[var(--ink-700)]")}
      />
    </button>
  );
}

// ── Tarjeta de prenda ───────────────────────────────────────

export function PrendaCard({ prenda, className }: { prenda: Prenda; className?: string }) {
  const { tiendas } = useStore();
  const { usuario } = useYo();
  const rec = recDe(prenda, usuario?.medidas);
  const tienda = tiendas.find((t) => t.id === prenda.tiendaId);
  return (
    <Link to={`/app/prenda/${prenda.id}`} className={cn("group block min-w-0", className)}>
      <div className="relative">
        <PrendaIlustracion
          prenda={prenda}
          className="aspect-[4/5] rounded-2xl transition-transform duration-300 group-hover:scale-[1.015]"
        />
        <Corazon prendaId={prenda.id} className="absolute right-2 top-2" />
        {rec && <ChipTalle rec={rec} className="absolute bottom-2 left-2" />}
      </div>
      <div className="mt-2 px-0.5">
        <p className="truncate text-[13px] font-semibold leading-tight text-foreground">{prenda.nombre}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {tienda?.nombre} · {prenda.colorNombre}
        </p>
        <p className="mt-1 text-[13px] font-bold tabular">{money(prenda.precio)}</p>
      </div>
    </Link>
  );
}

/** Grilla de dos columnas de tarjetas. */
export function GrillaPrendas({ prendas }: { prendas: Prenda[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5">
      {prendas.map((p) => (
        <PrendaCard key={p.id} prenda={p} />
      ))}
    </div>
  );
}

/** Fila con scroll horizontal. */
export function Carrusel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("[scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1", className)}>
      {children}
    </div>
  );
}

// ── Encabezados ─────────────────────────────────────────────

/** Barra superior de una pantalla interna, con botón de volver. */
export function AppHeader({
  titulo,
  atras,
  acciones,
  bajada,
}: {
  titulo: string;
  /** Ruta a la que vuelve; true = historial. */
  atras?: string | boolean;
  acciones?: ReactNode;
  bajada?: string;
}) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 px-4 pb-3 pt-3 backdrop-blur-md">
      <div className="flex min-h-9 items-center gap-2">
        {atras && (
          <button
            type="button"
            onClick={() => (typeof atras === "string" ? navigate(atras) : navigate(-1))}
            className="-ml-1.5 grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"
            aria-label="Volver"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[22px] font-bold leading-tight tracking-tight">{titulo}</h1>
        </div>
        {acciones}
      </div>
      {bajada && <p className="mt-0.5 text-[13px] text-muted-foreground">{bajada}</p>}
    </header>
  );
}

/** Título de sección con link opcional a «Ver todo». */
export function Seccion({
  titulo,
  bajada,
  link,
  linkTexto = "Ver todo",
  children,
  className,
}: {
  titulo: string;
  bajada?: string;
  link?: string;
  linkTexto?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-4", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold leading-tight tracking-tight">{titulo}</h2>
          {bajada && <p className="text-xs text-muted-foreground">{bajada}</p>}
        </div>
        {link && (
          <Link to={link} className="flex shrink-0 items-center text-xs font-semibold text-[var(--brand)]">
            {linkTexto}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Fila de menú (perfil, privacidad). */
export function FilaMenu({
  icono: Icono,
  titulo,
  detalle,
  to,
  onClick,
  extra,
  peligro,
}: {
  icono: React.ComponentType<{ className?: string }>;
  titulo: string;
  detalle?: string;
  to?: string;
  onClick?: () => void;
  extra?: ReactNode;
  peligro?: boolean;
}) {
  const contenido = (
    <>
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
          peligro ? "bg-red-50 text-[var(--danger)]" : "bg-[var(--brand-50)] text-[var(--brand)]"
        )}
      >
        <Icono className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className={cn("block text-sm font-semibold", peligro && "text-[var(--danger)]")}>{titulo}</span>
        {detalle && <span className="block truncate text-xs text-muted-foreground">{detalle}</span>}
      </span>
      {extra}
      {!peligro && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </>
  );
  const cls = "flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02]";
  return to ? (
    <Link to={to} className={cls}>
      {contenido}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {contenido}
    </button>
  );
}

// ── Detalle por zona ────────────────────────────────────────

/**
 * Barra que muestra dónde cae tu medida dentro del rango del talle.
 * El rango del talle ocupa el tramo central; los costados son
 * «te queda grande» (izquierda) y «te queda chico» (derecha).
 */
export function BarraZona({ z }: { z: DetalleZona }) {
  const pos = Math.max(-0.45, Math.min(1.45, z.posicion));
  const left = 20 + pos * 60;
  const color = COLOR_VEREDICTO[z.veredicto];
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold">
          {NOMBRE_ZONA[z.zona]} <span className="font-normal text-muted-foreground tabular">· vos {z.medida} cm</span>
        </span>
        <span className="text-[13px] font-semibold" style={{ color }}>
          {capitalizar(textoZona(z.zona, z.veredicto))}
        </span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-[var(--surface-border)]">
        <div className="absolute inset-y-0 left-[20%] right-[20%] rounded-full bg-[var(--brand-100)]" />
        <div className="absolute inset-y-0 left-[38%] right-[38%] rounded-full bg-[var(--brand-300)]/60" />
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow transition-[left] duration-300"
          style={{ left: `${left}%`, background: color }}
        />
      </div>
      <div className="relative mt-1 h-3.5 text-[10px] text-muted-foreground tabular">
        <span className="absolute left-[20%] -translate-x-1/2">{z.rango[0]}</span>
        <span className="absolute left-[80%] -translate-x-1/2">{z.rango[1]}</span>
      </div>
    </div>
  );
}

/** Resumen de una línea: «pecho: justo · cintura: ideal · largo: un poco corto». */
export function resumenZonas(zonas: DetalleZona[]) {
  return zonas.map((z) => `${NOMBRE_ZONA[z.zona].toLowerCase()}: ${textoZona(z.zona, z.veredicto)}`).join(" · ");
}

export const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Controles ───────────────────────────────────────────────

export function Segmentado<T extends string>({
  opciones,
  valor,
  onChange,
  className,
}: {
  opciones: { id: T; label: ReactNode }[];
  valor: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex rounded-xl bg-black/[0.05] p-1", className)}>
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-semibold transition-all",
            valor === o.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Medida con slider y botones ±. */
export function CampoMedida({
  label,
  valor,
  onChange,
  min,
  max,
  unidad = "cm",
  ayuda,
}: {
  label: string;
  valor: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unidad?: string;
  ayuda?: string;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, Math.round(v))));
  return (
    <div className="rounded-2xl bg-card p-3.5 shadow-[0_1px_0_rgba(0,0,0,0.03)] ring-1 ring-border">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold">{label}</p>
          {ayuda && <p className="text-[11px] leading-snug text-muted-foreground">{ayuda}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => set(valor - 1)}
            className="grid h-7 w-7 place-items-center rounded-full bg-black/[0.05] hover:bg-black/10"
            aria-label={`Bajar ${label}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-16 text-center font-display text-xl font-bold tabular">
            {valor}
            <span className="ml-0.5 text-xs font-medium text-muted-foreground">{unidad}</span>
          </span>
          <button
            type="button"
            onClick={() => set(valor + 1)}
            className="grid h-7 w-7 place-items-center rounded-full bg-black/[0.05] hover:bg-black/10"
            aria-label={`Subir ${label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <Slider className="mt-3" min={min} max={max} step={1} value={[valor]} onValueChange={([v]) => set(v)} />
    </div>
  );
}

/** Avatar con iniciales sobre el color de marca. */
export function Avatar({ nombre, size = 40, className }: { nombre: string; size?: number; className?: string }) {
  const ini = useMemo(
    () =>
      nombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase())
        .join(""),
    [nombre]
  );
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full font-display font-bold text-white", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-700) 100%)",
      }}
    >
      {ini}
    </span>
  );
}

// ── Probador: pruebas de cortesía ───────────────────────────

/** Cuántas pruebas le quedan a un usuario gratuito. */
export function useCortesia() {
  const { pruebas, supuestos } = useStore();
  const { usuario, premium } = useYo();
  const usadas = usuario ? pruebas.filter((p) => p.usuarioId === usuario.id && p.cortesia).length : 0;
  const restantes = Math.max(0, supuestos.pruebasCortesia - usadas);
  return { premium, usadas, restantes, puedeProbar: premium || restantes > 0 };
}

/** Nombre de la tienda de una prenda. */
export function useTiendaDe(p: Prenda | undefined) {
  const { tiendas } = useStore();
  return p ? tiendas.find((t) => t.id === p.tiendaId) : undefined;
}

/** Estado vacío de la app, más liviano que el del panel. */
export function VacioApp({
  icono: Icono,
  titulo,
  texto,
  accion,
}: {
  icono: React.ComponentType<{ className?: string }>;
  titulo: string;
  texto?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand)]">
        <Icono className="h-6 w-6" />
      </span>
      <p className="mt-4 font-display text-lg font-bold">{titulo}</p>
      {texto && <p className="mt-1 text-sm text-muted-foreground">{texto}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}
