/**
 * Gráficos compartidos del panel de administración.
 *
 * Series mensuales (líneas o barras, apiladas o no) con un solo eje,
 * tooltip con todas las series del mes y leyenda propia arriba.
 * Los colores salen de las variables del tema, así el portal de tienda
 * (que redefine --brand) los puede reutilizar tal cual.
 */

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mesCorto } from "../../lib/format";

/** Paleta de series: marca, tinta, marca clara, ámbar. Orden fijo. */
export const COLOR_SERIE = ["var(--brand)", "var(--ink-700)", "var(--brand-300)", "#c98a12"];

export interface Serie {
  clave: string;
  nombre: string;
  color?: string;
}

const EJE = { fontSize: 11, fill: "var(--ink-500)" };

function TooltipMes({
  active,
  payload,
  label,
  formato,
  total,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; dataKey: string }[];
  label?: string;
  formato: (n: number) => string;
  total?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const suma = payload.reduce((a, p) => a + (Number(p.value) || 0), 0);
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {[...payload].reverse().map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: p.color }} />
          <span className="flex-1">{p.name}</span>
          <span className="tabular font-medium text-foreground">{formato(p.value)}</span>
        </p>
      ))}
      {total && payload.length > 1 && (
        <p className="mt-1 flex justify-between gap-4 border-t border-border pt-1 text-muted-foreground">
          <span>Total</span>
          <span className="tabular font-medium text-foreground">{formato(suma)}</span>
        </p>
      )}
    </div>
  );
}

/** Leyenda compacta para poner encima del gráfico. */
export function Leyenda({ series }: { series: Serie[] }) {
  return (
    <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {series.map((s, i) => (
        <span key={s.clave} className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ background: s.color ?? COLOR_SERIE[i] }}
          />
          {s.nombre}
        </span>
      ))}
    </div>
  );
}

/**
 * Serie mensual. `datos` trae `mes` en formato `2026-09`; el eje lo
 * muestra como `set 26`.
 */
export function GraficoMensual({
  datos,
  series,
  tipo = "linea",
  apilado = false,
  formato = (n) => String(Math.round(n)),
  formatoEje,
  alto = 240,
  referencia,
  leyenda = true,
  extra,
  dominio,
}: {
  datos: Record<string, number | string>[];
  series: Serie[];
  tipo?: "linea" | "barra";
  apilado?: boolean;
  formato?: (n: number) => string;
  formatoEje?: (n: number) => string;
  alto?: number;
  referencia?: { valor: number; etiqueta: string };
  leyenda?: boolean;
  extra?: ReactNode;
  /** Rango fijo del eje Y (por defecto arranca en 0). */
  dominio?: [number, number];
}) {
  const filas = datos.map((d) => ({ ...d, _mes: mesCorto(String(d.mes)) }));
  const color = (i: number) => series[i].color ?? COLOR_SERIE[i];
  const comunes = (
    <>
      <CartesianGrid stroke="var(--border)" vertical={false} />
      <XAxis dataKey="_mes" tick={EJE} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={8} />
      <YAxis
        tick={EJE}
        axisLine={false}
        tickLine={false}
        width={formatoEje ? 52 : 40}
        domain={dominio ?? [0, "auto"]}
        allowDataOverflow={!!dominio}
        tickFormatter={formatoEje ?? ((v: number) => String(v))}
      />
      <Tooltip
        cursor={tipo === "barra" ? { fill: "var(--brand-50)" } : { stroke: "var(--ink-500)", strokeDasharray: "3 3" }}
        content={<TooltipMes formato={formato} total={apilado} />}
      />
      {referencia && (
        <ReferenceLine
          y={referencia.valor}
          stroke="var(--ink-500)"
          strokeDasharray="4 4"
          label={{ value: referencia.etiqueta, position: "insideTopRight", fontSize: 11, fill: "var(--ink-500)" }}
        />
      )}
    </>
  );

  return (
    <div>
      {leyenda && series.length > 1 && <Leyenda series={series} />}
      {extra}
      <ResponsiveContainer width="100%" height={alto}>
        {tipo === "linea" ? (
          <LineChart data={filas} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {comunes}
            {series.map((s, i) => (
              <Line
                key={s.clave}
                type="linear"
                dataKey={s.clave}
                name={s.nombre}
                stroke={color(i)}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart data={filas} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
            {comunes}
            {series.map((s, i) => (
              <Bar
                key={s.clave}
                dataKey={s.clave}
                name={s.nombre}
                stackId={apilado ? "a" : undefined}
                fill={color(i)}
                stroke="var(--card)"
                strokeWidth={apilado ? 1 : 0}
                radius={!apilado || i === series.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={36}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Fila de comparación con barra horizontal: etiqueta, valor y cantidad
 * de casos. Opcionalmente marca una meta sobre la barra.
 */
export function FilaBarra({
  etiqueta,
  detalle,
  valor,
  max = 100,
  texto,
  n,
  meta,
  tono = "marca",
}: {
  etiqueta: ReactNode;
  detalle?: ReactNode;
  valor: number;
  max?: number;
  texto: string;
  n?: number;
  meta?: number;
  tono?: "marca" | "mal" | "neutro";
}) {
  const ancho = max > 0 ? Math.max(0, Math.min(100, (valor / max) * 100)) : 0;
  const color =
    tono === "mal" ? "bg-red-500" : tono === "neutro" ? "bg-[var(--ink-500)]" : "bg-[var(--brand)]";
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-foreground">
          {etiqueta}
          {detalle && <span className="ml-1.5 text-xs text-muted-foreground">{detalle}</span>}
        </span>
        <span className="tabular shrink-0 font-medium text-foreground">
          {texto}
          {n !== undefined && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">n={n}</span>
          )}
        </span>
      </div>
      <div className="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${ancho}%` }} />
        {meta !== undefined && (
          <span
            className="absolute top-[-2px] h-3 w-0.5 bg-[var(--ink)]"
            style={{ left: `${Math.min(100, (meta / max) * 100)}%` }}
            title={`Meta ${meta} %`}
          />
        )}
      </div>
    </div>
  );
}
