/**
 * Piezas comunes de los gráficos del admin (catálogo, suscripciones,
 * marketing, probador). Paleta validada con contraste y daltonismo:
 * la serie principal usa el color de marca; las otras dos, ámbar y
 * verde agua. El rojo queda reservado para "no cumple la meta".
 */

import type { ReactNode } from "react";
import { cn } from "../ui/utils";

export const SERIE = {
  a: "var(--brand)",
  b: "#c98a12",
  c: "#1baf7a",
} as const;

/** Estado: no cumple la meta. Siempre acompañado de texto. */
export const MALO = "#dc2626";
/** Línea de meta: tinta, punteada. */
export const META = "var(--ink)";

export const EJE = {
  tick: { fontSize: 11, fill: "var(--muted-foreground)" },
  axisLine: false,
  tickLine: false,
  minTickGap: 10,
} as const;

export const GRILLA = {
  strokeDasharray: "3 3",
  stroke: "var(--border)",
  vertical: false,
} as const;

export const CURSOR_BARRA = { fill: "var(--muted)", opacity: 0.6 };

interface EntradaTooltip {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

/** Tooltip de Recharts con el mismo aspecto que las tarjetas. */
export function CajaTooltip({
  active,
  payload,
  label,
  formato = (v: number) => String(v),
  titulo,
  total,
}: {
  active?: boolean;
  payload?: EntradaTooltip[];
  label?: string | number;
  formato?: (v: number, clave?: string) => string;
  titulo?: (label: string | number | undefined, payload: EntradaTooltip[]) => ReactNode;
  /** Agrega una fila de total (para apilados). */
  total?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const suma = payload.reduce((a, p) => a + (typeof p.value === "number" ? p.value : 0), 0);
  return (
    <div className="min-w-[10rem] rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{titulo ? titulo(label, payload) : label}</p>
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.dataKey ?? p.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="tabular font-medium text-foreground">
              {typeof p.value === "number" ? formato(p.value, String(p.dataKey)) : String(p.value)}
            </span>
          </li>
        ))}
        {total && payload.length > 1 && (
          <li className="mt-1 flex items-center justify-between gap-4 border-t border-border pt-1">
            <span className="text-muted-foreground">Total</span>
            <span className="tabular font-semibold text-foreground">{formato(suma)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

/** Leyenda en HTML, arriba del gráfico. */
export function Leyenda({
  items,
  className,
}: {
  items: { nombre: string; color: string; tipo?: "barra" | "linea" | "meta" }[];
  className?: string;
}) {
  return (
    <ul className={cn("mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      {items.map((i) => (
        <li key={i.nombre} className="flex items-center gap-1.5">
          {i.tipo === "linea" ? (
            <span className="h-0.5 w-4 rounded-full" style={{ background: i.color }} />
          ) : i.tipo === "meta" ? (
            <span className="w-4 border-t-2 border-dashed" style={{ borderColor: i.color }} />
          ) : (
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          )}
          {i.nombre}
        </li>
      ))}
    </ul>
  );
}

/** Pastilla de meta cumplida / no cumplida, con texto (nunca sólo color). */
export function EstadoMeta({ cumple, children }: { cumple: boolean; children?: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
        cumple
          ? "border-[var(--brand-300)] bg-[var(--brand-50)] text-[var(--brand-700)]"
          : "border-red-200 bg-red-50 text-red-700"
      )}
    >
      {cumple ? "✓" : "✗"} {children ?? (cumple ? "Cumple" : "No cumple")}
    </span>
  );
}

export const fmt1 = (n: number, dec = 1) => n.toFixed(dec).replace(".", ",");

/** Eje en miles: 4,5 k · 12 k. */
export const enMiles = (v: number) => {
  const k = v / 1000;
  if (k === 0) return "0";
  return Math.abs(k) >= 10 || Number.isInteger(k) ? `${Math.round(k)} k` : `${k.toFixed(1).replace(".", ",")} k`;
};

/** Dominio [0, techo redondo] para que las marcas del eje caigan en números limpios. */
export const techo = (max: number, divisiones = 4) => {
  if (max <= 0) return [0, divisiones] as [number, number];
  const crudo = max / divisiones;
  const mag = 10 ** Math.floor(Math.log10(crudo));
  const paso = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= crudo)!;
  return [0, paso * divisiones] as [number, number];
};

/** Tarjeta de indicador con meta: mismo aspecto que `Kpi`, con la pastilla de cumplimiento. */
export function KpiMeta({
  etiqueta,
  valor,
  cumple,
  meta,
  detalle,
  icono: Icono,
}: {
  etiqueta: string;
  valor: string;
  cumple: boolean;
  meta: string;
  detalle?: string;
  icono?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
        {Icono && (
          <span
            className={cn(
              "rounded-lg p-1.5",
              cumple ? "bg-[var(--brand-100)] text-[var(--brand-700)]" : "bg-red-50 text-red-700"
            )}
          >
            <Icono className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="tabular mt-2 text-2xl font-semibold tracking-tight text-foreground">{valor}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <EstadoMeta cumple={cumple}>{meta}</EstadoMeta>
        {detalle && <span className="text-xs text-muted-foreground">{detalle}</span>}
      </div>
    </div>
  );
}
