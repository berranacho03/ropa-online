/** Piezas de composición compartidas por todas las pantallas. */

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "./ui/utils";

/** Encabezado de página: título, bajada y acciones a la derecha. */
export function PageHeader({
  titulo,
  bajada,
  acciones,
  children,
}: {
  titulo: string;
  bajada?: string;
  acciones?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-card">
      <div className="px-4 py-5 lg:px-8 lg:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
              {titulo}
            </h1>
            {bajada && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{bajada}</p>
            )}
          </div>
          {acciones && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{acciones}</div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Contenedor del cuerpo de una página. */
export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-6 lg:px-8", className)}>{children}</div>
  );
}

/** Tarjeta de indicador. La variación es opcional y se colorea sola. */
export function Kpi({
  etiqueta,
  valor,
  detalle,
  variacion,
  /** true cuando subir es malo (gasto, quiebres). */
  invertido = false,
  icono: Icono,
  acento,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  variacion?: number;
  invertido?: boolean;
  icono?: React.ComponentType<{ className?: string }>;
  acento?: "verde" | "ambar" | "rojo" | "neutro";
}) {
  const bueno = variacion === undefined ? null : invertido ? variacion <= 0 : variacion >= 0;
  const Flecha =
    variacion === undefined || variacion === 0
      ? Minus
      : variacion > 0
        ? ArrowUpRight
        : ArrowDownRight;

  const acentoClase = {
    verde: "text-[var(--brand-700)] bg-[var(--brand-100)]",
    ambar: "text-amber-700 bg-amber-50",
    rojo: "text-red-700 bg-red-50",
    neutro: "text-slate-600 bg-slate-100",
  }[acento ?? "neutro"];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {etiqueta}
        </p>
        {Icono && (
          <span className={cn("rounded-lg p-1.5", acentoClase)}>
            <Icono className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="tabular mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {valor}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {variacion !== undefined && (
          <span
            className={cn(
              "tabular inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-medium",
              bueno === null
                ? "text-muted-foreground"
                : bueno
                  ? "text-[var(--brand-700)]"
                  : "text-red-600"
            )}
          >
            <Flecha className="h-3.5 w-3.5" />
            {Math.abs(variacion).toFixed(1).replace(".", ",")} %
          </span>
        )}
        {detalle && <span className="text-xs text-muted-foreground">{detalle}</span>}
      </div>
    </div>
  );
}

/** Tarjeta con título y cuerpo, el bloque base de las páginas. */
export function Panel({
  titulo,
  bajada,
  acciones,
  children,
  className,
  bodyClassName,
}: {
  titulo?: string;
  bajada?: string;
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {titulo && <h2 className="text-sm font-semibold text-foreground">{titulo}</h2>}
            {bajada && <p className="mt-0.5 text-xs text-muted-foreground">{bajada}</p>}
          </div>
          {acciones && <div className="flex items-center gap-2">{acciones}</div>}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Estado vacío consistente para listas filtradas sin resultados. */
export function Vacio({
  icono: Icono,
  titulo,
  detalle,
  accion,
}: {
  icono: React.ComponentType<{ className?: string }>;
  titulo: string;
  detalle?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="rounded-full bg-muted p-3">
        <Icono className="h-6 w-6 text-muted-foreground" />
      </span>
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      {detalle && <p className="max-w-sm text-sm text-muted-foreground">{detalle}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}

/** Barra de progreso con color según cuán lleno esté. */
export function Barra({
  valor,
  max,
  /** Colorea en ámbar/rojo al acercarse al máximo. */
  alertaAlLlenar = false,
  className,
}: {
  valor: number;
  max: number;
  alertaAlLlenar?: boolean;
  className?: string;
}) {
  const p = max > 0 ? Math.min(100, (valor / max) * 100) : 0;
  const color = !alertaAlLlenar
    ? "bg-[var(--brand)]"
    : p > 100 - 0.001 || p >= 100
      ? "bg-red-500"
      : p >= 85
        ? "bg-amber-500"
        : "bg-[var(--brand)]";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${p}%` }} />
    </div>
  );
}

/** Etiqueta de estado, con paleta pasada por el llamador. */
export function Chip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Fila etiqueta/valor para fichas de detalle. */
export function Dato({
  etiqueta,
  children,
  className,
}: {
  etiqueta: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 truncate text-sm text-foreground">{children}</dd>
    </div>
  );
}
