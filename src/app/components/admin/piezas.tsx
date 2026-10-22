/** Piezas chicas del panel de administración: estados, medidas enmascaradas, CSV. */

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Eye, EyeOff, Minus, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Chip } from "../shell";
import { cn } from "../ui/utils";
import type { EstadoTienda } from "../../data/tiendas";
import type { Medidas } from "../../lib/talles";

const fmt1 = (n: number) => n.toFixed(1).replace(".", ",");

// ── Estados ──────────────────────────────────────────────────

const ESTADO_TIENDA: Record<EstadoTienda, { texto: string; clase: string }> = {
  activa: { texto: "Activa", clase: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  onboarding: { texto: "En onboarding", clase: "border-amber-200 bg-amber-50 text-amber-700" },
  pausada: { texto: "Pausada", clase: "border-slate-200 bg-slate-100 text-slate-600" },
};

export function ChipEstadoTienda({ estado }: { estado: EstadoTienda }) {
  const e = ESTADO_TIENDA[estado];
  return <Chip className={e.clase}>{e.texto}</Chip>;
}

export type PlanUsuario = "premium" | "ex" | "gratis";

export const NOMBRE_PLAN: Record<PlanUsuario, string> = {
  premium: "Premium",
  ex: "Ex Premium",
  gratis: "Gratis",
};

export function ChipPlan({ plan }: { plan: PlanUsuario }) {
  const clase =
    plan === "premium"
      ? "border-[var(--brand-300)] bg-[var(--brand-50)] text-[var(--brand-700)]"
      : plan === "ex"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-border bg-muted text-muted-foreground";
  return <Chip className={clase}>{NOMBRE_PLAN[plan]}</Chip>;
}

/** ✓ / ✗ / sin meta, siempre con ícono y texto (nunca sólo color). */
export function ChipCumple({ cumple, compacto = false }: { cumple: boolean | null; compacto?: boolean }) {
  if (cumple === null)
    return (
      <Chip className="border-slate-200 bg-slate-50 text-slate-600">
        <Minus className="h-3 w-3" />
        {compacto ? "Sin meta" : "Sin meta: para discutir"}
      </Chip>
    );
  return cumple ? (
    <Chip className="border-emerald-200 bg-emerald-50 text-emerald-700">
      <Check className="h-3 w-3" />
      Cumple
    </Chip>
  ) : (
    <Chip className="border-red-200 bg-red-50 text-red-700">
      <X className="h-3 w-3" />
      No cumple
    </Chip>
  );
}

/**
 * Devolución por talle antes de sumarse vs. ahora. Bajar es bueno.
 */
export function AntesAhora({ antes, ahora, sinDatos = false }: { antes: number; ahora: number; sinDatos?: boolean }) {
  if (sinDatos)
    return (
      <span className="tabular text-xs text-muted-foreground">
        {fmt1(antes)} % → sin ventas
      </span>
    );
  const dif = ahora - antes;
  const bajo = dif < 0;
  const Flecha = dif === 0 ? Minus : bajo ? ArrowDownRight : ArrowUpRight;
  return (
    <span className="tabular inline-flex items-center gap-1.5 whitespace-nowrap text-sm">
      <span className="text-muted-foreground">{fmt1(antes)}</span>
      <span className="text-muted-foreground">→</span>
      <span className="font-medium text-foreground">{fmt1(ahora)} %</span>
      <span
        className={cn(
          "inline-flex items-center text-xs font-medium",
          bajo ? "text-emerald-700" : "text-red-600"
        )}
      >
        <Flecha className="h-3.5 w-3.5" />
        {fmt1(Math.abs(dif))} pp
      </span>
    </span>
  );
}

// ── Medidas enmascaradas ─────────────────────────────────────

/**
 * Las medidas se muestran como •• hasta que alguien pide verlas y
 * confirma; el acceso queda registrado (privacidad).
 */
export function MedidasOcultas({
  medidas,
  nombre,
  visibles,
  onVer,
  formato = "linea",
}: {
  medidas: Medidas | null;
  nombre: string;
  visibles: boolean;
  onVer: () => void;
  formato?: "linea" | "ficha";
}) {
  const [confirmar, setConfirmar] = useState(false);
  if (!medidas) return <span className="text-xs text-muted-foreground">Sin cargar</span>;

  const items: [string, string][] = [
    ["Altura", `${medidas.altura} cm`],
    ["Peso", `${medidas.peso} kg`],
    ["Pecho", `${medidas.pecho} cm`],
    ["Cintura", `${medidas.cintura} cm`],
    ["Cadera", `${medidas.cadera} cm`],
  ];

  const boton = !visibles && (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setConfirmar(true);
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-[var(--brand-700)] hover:bg-[var(--brand-50)]"
    >
      <Eye className="h-3.5 w-3.5" />
      ver
    </button>
  );

  const dialogo = (
    <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Ver las medidas de {nombre}?</AlertDialogTitle>
          <AlertDialogDescription>
            Las medidas corporales son datos sensibles. El acceso queda registrado por privacidad,
            con tu usuario, la fecha y el motivo de soporte.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onVer();
              toast("Acceso registrado por privacidad", {
                description: `Viste las medidas de ${nombre}.`,
                icon: <ShieldCheck className="h-4 w-4" />,
              });
            }}
          >
            Ver medidas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (formato === "linea")
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {visibles ? (
          <span className="tabular text-xs text-foreground">
            {medidas.pecho}·{medidas.cintura}·{medidas.cadera}
          </span>
        ) : (
          <span className="text-muted-foreground tracking-widest">••</span>
        )}
        {boton}
        {dialogo}
      </span>
    );

  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {items.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
            <dd className="tabular mt-0.5 text-sm text-foreground">{visibles ? v : "•• ••"}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Calce preferido</dt>
          <dd className="mt-0.5 text-sm capitalize text-foreground">{medidas.preferencia}</dd>
        </div>
      </dl>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        {visibles ? (
          <>
            <ShieldCheck className="h-3.5 w-3.5" /> Acceso registrado en esta sesión.
          </>
        ) : (
          <>
            <EyeOff className="h-3.5 w-3.5" /> Enmascaradas por privacidad. {boton}
          </>
        )}
      </div>
      {dialogo}
    </div>
  );
}

// ── CSV ──────────────────────────────────────────────────────

/** Descarga un CSV en el navegador (separador `;`, con BOM para Excel). */
export function descargarCsv(nombre: string, filas: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const texto = "﻿" + filas.map((f) => f.map(esc).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
