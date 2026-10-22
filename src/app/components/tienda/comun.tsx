/** Piezas y cálculos compartidos por las pantallas del portal de tienda. */

import { useMemo } from "react";
import { Store as StoreIcon } from "lucide-react";
import { useMiTienda, useStore } from "../../lib/store";
import { tablaCompleta, type EstadoPrenda, type Prenda } from "../../data/prendas";
import type { Prueba, Venta } from "../../data/seed";
import type { Tienda } from "../../data/tiendas";
import { hash } from "../../data/azar";
import { Chip, PageBody, PageHeader, Vacio } from "../shell";
import { cn } from "../ui/utils";

// ── Colores de gráficos ──────────────────────────────────────
// Serie principal: el acento del portal. Devoluciones: naranja
// (validado contra el turquesa para daltonismo).
export const C_SERIE = "var(--brand)";
export const C_SERIE_SUAVE = "var(--brand-300)";
export const C_DEVOL = "#d9622b";
export const C_GRILLA = "#e6e8ea";
export const TICK = { fontSize: 11, fill: "#6b7280" };
export const TOOLTIP_ESTILO = { borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 13 };

/** Umbral a partir del cual una prenda tiene "muchas" devoluciones por talle. */
export const UMBRAL_DEV = 25;
/** Ventas mínimas para que la tasa de una prenda signifique algo. */
export const MIN_VENTAS = 4;

/** Envoltorio: si la sesión no tiene tienda, avisa en vez de romper. */
export function ConTienda({ titulo, children }: { titulo: string; children: (t: Tienda) => React.ReactNode }) {
  const tienda = useMiTienda();
  if (!tienda)
    return (
      <>
        <PageHeader titulo={titulo} />
        <PageBody>
          <Vacio icono={StoreIcon} titulo="No hay una tienda asociada a esta cuenta" detalle="Entrá con una cuenta de tienda para ver esta pantalla." />
        </PageBody>
      </>
    );
  return <>{children(tienda)}</>;
}

/** Prendas, ventas y pruebas de una tienda. */
export function useDatosTienda(tiendaId: string) {
  const { prendas, ventas, pruebas } = useStore();
  return useMemo(() => {
    const ps = prendas.filter((p) => p.tiendaId === tiendaId);
    const ids = new Set(ps.map((p) => p.id));
    return {
      prendas: ps,
      ventas: ventas.filter((v) => v.tiendaId === tiendaId).sort((a, b) => b.fecha.localeCompare(a.fecha)),
      pruebas: pruebas.filter((p) => ids.has(p.prendaId)),
    };
  }, [prendas, ventas, pruebas, tiendaId]);
}

export interface StatsPrenda {
  recomendada: number;
  probada: number;
  comprada: number;
  devuelta: number;
  devTalle: number;
  /** % de ventas devueltas por talle. */
  pctDevTalle: number;
}

/** Embudo de cada prenda. "Recomendada" se aproxima: cada compra viene de ~8–12 recomendaciones. */
export function statsPorPrenda(prendas: Prenda[], ventas: Venta[], pruebas: Prueba[]) {
  const m = new Map<string, StatsPrenda>();
  for (const p of prendas) m.set(p.id, { recomendada: 0, probada: 0, comprada: 0, devuelta: 0, devTalle: 0, pctDevTalle: 0 });
  for (const v of ventas) {
    const s = m.get(v.prendaId);
    if (!s) continue;
    s.comprada++;
    if (v.estado === "devuelta") s.devuelta++;
    if (v.motivoDevolucion === "talle") s.devTalle++;
  }
  for (const pr of pruebas) {
    const s = m.get(pr.prendaId);
    if (s) s.probada++;
  }
  for (const p of prendas) {
    const s = m.get(p.id)!;
    const k = 8 + (hash(p.id) % 5);
    s.recomendada = s.comprada > 0 ? s.comprada * k + s.probada * 2 + (hash(p.id + "r") % 23) : s.probada * 3;
    s.pctDevTalle = s.comprada ? (s.devTalle / s.comprada) * 100 : 0;
  }
  return m;
}

export const conMuchasDevoluciones = (s?: StatsPrenda) => !!s && s.comprada >= MIN_VENTAS && s.pctDevTalle >= UMBRAL_DEV;

export const ESTADO_PRENDA: Record<EstadoPrenda, { label: string; clase: string }> = {
  publicada: { label: "Publicada", clase: "border-[var(--brand-300)] bg-[var(--brand-50)] text-[var(--brand-700)]" },
  incompleta: { label: "Tabla incompleta", clase: "border-amber-200 bg-amber-50 text-amber-800" },
  pausada: { label: "Pausada", clase: "border-slate-200 bg-slate-100 text-slate-600" },
};

export function ChipEstadoPrenda({ estado, className }: { estado: EstadoPrenda; className?: string }) {
  const e = ESTADO_PRENDA[estado];
  return <Chip className={cn(e.clase, className)}>{e.label}</Chip>;
}

/** Estado al que pasa una prenda cuando cambia su tabla. */
export function estadoTrasTabla(p: Pick<Prenda, "estado">, tabla: Prenda["tabla"]): EstadoPrenda {
  if (!tablaCompleta({ tabla })) return "incompleta";
  return p.estado === "incompleta" ? "publicada" : p.estado;
}

/** Talles de la tabla a los que les falta alguna zona de su categoría. */
export function tallesSinMedidas(p: Pick<Prenda, "tabla" | "talles">, zonas: string[]) {
  return p.talles.filter((t) => {
    const fila = p.tabla[t] ?? {};
    return zonas.some((z) => !(fila as Record<string, unknown>)[z]);
  });
}
