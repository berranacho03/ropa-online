/**
 * Piezas para que las tablas del admin se lean bien en el celular:
 * fichas apiladas (< md) en lugar de filas anchas, un selector de
 * segmentos para matrices y un contenedor con sombra cuando hay más
 * contenido hacia el costado.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { cn } from "../ui/utils";

/**
 * Envuelve la tabla de escritorio: oculta en el celular. Si en pantallas
 * medianas la tabla no entra, aparecen sombras en los bordes.
 */
export function SoloEscritorio({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="hidden xl:block">
      <ScrollConSombra className={className}>{children}</ScrollConSombra>
    </div>
  );
}

/**
 * Lista de fichas: una columna en el celular, dos columnas entre md y xl
 * (tablet y notebooks angostas con el sidebar), y se oculta desde xl,
 * donde se muestra la tabla.
 */
export function ListaFichas({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul
      className={cn(
        "divide-y divide-border md:grid md:grid-cols-2 md:divide-y-0 xl:hidden",
        "md:[&>li]:border-t md:[&>li]:border-border md:[&>li:nth-child(-n+2)]:border-t-0 md:[&>li:nth-child(odd)]:border-r",
        className
      )}
    >
      {children}
    </ul>
  );
}

/** [etiqueta, valor] o [etiqueta, valor, true] para que ocupe las dos columnas. */
export type DatoFicha = [etiqueta: ReactNode, valor: ReactNode, ancho?: boolean] | null | false | undefined;

/**
 * Un registro en el celular: título y estado/monto arriba, el resto en una
 * grilla de dos columnas de etiqueta/valor.
 */
export function Ficha({
  titulo,
  subtitulo,
  lateral,
  medio,
  datos = [],
  pie,
  to,
  onClick,
  inicio,
  className,
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  /** Lo que va arriba a la derecha: estado, monto, chip. */
  lateral?: ReactNode;
  /** Algo entre la cabecera y la grilla (ej. un texto largo). */
  medio?: ReactNode;
  datos?: DatoFicha[];
  pie?: ReactNode;
  /** Si la ficha entera es un link (no poner otros links adentro). */
  to?: string;
  onClick?: () => void;
  /** Miniatura o avatar a la izquierda del título. */
  inicio?: ReactNode;
  className?: string;
}) {
  const filas = datos.filter(Boolean) as [ReactNode, ReactNode, boolean?][];
  const cuerpo = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {inicio}
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{titulo}</div>
            {subtitulo && <div className="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">{subtitulo}</div>}
          </div>
        </div>
        {lateral && <div className="shrink-0 text-right">{lateral}</div>}
      </div>
      {medio && <div className="mt-2">{medio}</div>}
      {filas.length > 0 && (
        <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
          {filas.map(([k, v, ancho], i) => (
            <div key={i} className={cn("min-w-0", ancho && "col-span-2")}>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 min-w-0 break-words text-sm text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {pie && <div className="mt-2.5">{pie}</div>}
    </>
  );
  const base = "block px-4 py-3";
  return (
    <li className={className}>
      {to ? (
        <Link to={to} className={cn(base, "hover:bg-muted/50")}>
          {cuerpo}
        </Link>
      ) : onClick ? (
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          }}
          className={cn(base, "cursor-pointer hover:bg-muted/50")}
        >
          {cuerpo}
        </div>
      ) : (
        <div className={base}>{cuerpo}</div>
      )}
    </li>
  );
}

/** Botones tipo pastilla para elegir una columna de una matriz. */
export function Segmentos({
  opciones,
  valor,
  onCambio,
  etiqueta,
  className,
}: {
  opciones: { valor: string; texto: ReactNode }[];
  valor: string;
  onCambio: (v: string) => void;
  etiqueta: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className={cn("flex flex-wrap gap-1.5", className)}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onCambio(o.valor)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              activo
                ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {o.texto}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Contenedor con scroll horizontal y sombras en los bordes que avisan que
 * hay más contenido. Para tablas chicas que no vale la pena convertir.
 */
export function ScrollConSombra({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [bordes, setBordes] = useState({ izq: false, der: false });
  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    // Si adentro hay una tabla de shadcn, la que scrollea es su contenedor.
    const el = (raiz.querySelector('[data-slot="table-container"]') as HTMLElement | null) ?? raiz;
    const medir = () =>
      setBordes({ izq: el.scrollLeft > 2, der: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", medir);
      ro.disconnect();
    };
  }, []);
  return (
    <div className="relative">
      <div ref={ref} className={cn("overflow-x-auto", className)}>
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/10 to-transparent transition-opacity",
          bordes.der ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/10 to-transparent transition-opacity",
          bordes.izq ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}

/**
 * Filtros secundarios: en el celular quedan detrás de un botón «Filtros» que
 * abre una hoja desde abajo; en ≥ md se muestran en línea (como `contents`).
 */
export function FiltrosMovil({
  children,
  activos = 0,
  onLimpiar,
}: {
  children: ReactNode;
  /** Cuántos filtros no están en su valor por defecto. */
  activos?: number;
  onLimpiar?: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Button variant="outline" className="shrink-0 md:hidden" onClick={() => setAbierto(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        {activos > 0 && (
          <span className="tabular ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 text-[11px] font-semibold text-white">
            {activos}
          </span>
        )}
      </Button>
      <div className="hidden md:contents">{children}</div>
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl md:hidden">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>La lista se actualiza al cambiar cada filtro.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4 [&>*]:w-full">{children}</div>
          <div className="flex gap-2 p-4">
            {onLimpiar && (
              <Button variant="outline" className="flex-1" onClick={onLimpiar} disabled={activos === 0}>
                Limpiar
              </Button>
            )}
            <Button className="flex-1" onClick={() => setAbierto(false)}>
              Ver resultados
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
