import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Check, ShoppingBag, Sparkles, Undo2 } from "lucide-react";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import { AppHeader, VacioApp } from "../../components/app/comun";
import { Button } from "../../components/ui/button";
import { useStore, useYo } from "../../lib/store";
import { HOY, type Feedback, type Venta } from "../../data/seed";
import { money, fecha } from "../../lib/format";
import { cn } from "../../components/ui/utils";

const RESPUESTAS: { id: Feedback; label: string; texto: string }[] = [
  { id: "bien", label: "Perfecto", texto: "Me quedó bien" },
  { id: "chico", label: "Chico", texto: "Me quedó chico" },
  { id: "grande", label: "Grande", texto: "Me quedó grande" },
];

export function MisCompras() {
  const { ventas, prendas, tiendas, darFeedback } = useStore();
  const { usuario } = useYo();
  const [editando, setEditando] = useState<string | null>(null);

  const mias = useMemo(
    () =>
      usuario
        ? ventas
            .map((v, i) => ({ v, i }))
            .filter(({ v }) => v.usuarioId === usuario.id)
            .sort((a, b) => b.v.fecha.localeCompare(a.v.fecha) || b.i - a.i)
            .map(({ v }) => v)
        : [],
    [ventas, usuario]
  );
  if (!usuario) return null;

  const total = mias.filter((v) => v.estado === "confirmada").reduce((a, v) => a + v.precio, 0);
  const respondidas = mias.filter((v) => v.feedback);
  const bien = respondidas.filter((v) => v.feedback === "bien").length;
  const pendientes = mias.filter((v) => !v.feedback && v.estado === "confirmada").length;

  function responder(v: Venta, f: Feedback) {
    darFeedback(v.id, f);
    setEditando(null);
    toast.success("¡Gracias!", {
      description: f === "bien" ? "Nos alegra que te haya quedado bien." : "Con esto afinamos tus próximas recomendaciones.",
    });
  }

  return (
    <div className="pb-8">
      <AppHeader titulo="Mis compras" bajada="Lo que compraste en las tiendas desde la app" />

      {mias.length === 0 ? (
        <VacioApp
          icono={ShoppingBag}
          titulo="Todavía no compraste nada"
          texto="Cuando compres una prenda desde la app, la vas a ver acá."
          accion={
            <Button asChild className="rounded-xl">
              <Link to="/app/explorar">Explorar prendas</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="mx-4 mt-4 grid grid-cols-3 divide-x divide-white/15 rounded-2xl bg-[var(--ink)] py-3.5 text-center text-white">
            <div>
              <p className="font-display text-xl font-bold">{mias.length}</p>
              <p className="text-[11px] text-white/60">compras</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold">{respondidas.length ? `${Math.round((bien / respondidas.length) * 100)} %` : "—"}</p>
              <p className="text-[11px] text-white/60">te quedaron bien</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold">{money(total).replace("$ ", "$")}</p>
              <p className="text-[11px] text-white/60">en compras</p>
            </div>
          </div>
          {pendientes > 0 && (
            <p className="mx-4 mt-3 rounded-xl bg-[var(--brand-50)] px-3 py-2 text-xs text-[var(--brand-700)]">
              Tenés {pendientes} {pendientes === 1 ? "compra" : "compras"} sin contarnos cómo te quedó. Tu respuesta mejora el algoritmo para todos.
            </p>
          )}

          <div className="space-y-3 px-4 pt-4">
            {mias.map((v) => {
              const p = prendas.find((x) => x.id === v.prendaId);
              const t = tiendas.find((x) => x.id === v.tiendaId);
              if (!p) return null;
              const preguntar = v.estado === "confirmada" && (!v.feedback || editando === v.id);
              return (
                <div key={v.id} className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
                  <Link to={`/app/prenda/${p.id}`} className="flex gap-3 p-3">
                    <PrendaIlustracion prenda={p} className="h-[84px] w-[68px] shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-bold">{p.nombre}</p>
                        <p className="shrink-0 text-sm font-bold tabular">{money(v.precio)}</p>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {t?.nombre} · {v.fecha === HOY ? "hoy" : fecha(v.fecha)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-[var(--ink)] px-2 py-0.5 text-[10.5px] font-bold text-white">Talle {v.talle}</span>
                        {v.siguio ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--brand-50)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--brand-700)]">
                            <Check className="h-3 w-3" /> El recomendado
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-800">
                            Te recomendamos {v.talleRecomendado}
                          </span>
                        )}
                        {v.conPrueba && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10.5px] font-medium">
                            <Sparkles className="h-3 w-3" /> Probada
                          </span>
                        )}
                        {v.estado === "devuelta" && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--danger)]">
                            <Undo2 className="h-3 w-3" /> Devuelta{v.motivoDevolucion === "talle" ? " por talle" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {preguntar ? (
                    <div className="border-t border-border bg-[var(--surface)] px-3 py-3">
                      <p className="text-[13px] font-semibold">¿Te quedó bien el talle?</p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {RESPUESTAS.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => responder(v, r.id)}
                            className={cn(
                              "rounded-xl bg-card py-2 text-[13px] font-semibold ring-1 ring-border transition-all hover:ring-[var(--brand)] active:scale-95",
                              v.feedback === r.id && "ring-2 ring-[var(--brand)]"
                            )}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : v.feedback ? (
                    <div className="flex items-center justify-between border-t border-border px-3 py-2.5 text-[13px]">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: v.feedback === "bien" ? "var(--ok)" : "var(--warn)" }}
                        />
                        {RESPUESTAS.find((r) => r.id === v.feedback)?.texto}
                      </span>
                      <button type="button" onClick={() => setEditando(v.id)} className="text-xs font-semibold text-[var(--brand)]">
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <p className="border-t border-border px-3 py-2.5 text-xs text-muted-foreground">
                      La tienda registró la devolución{v.motivoDevolucion === "talle" ? " por talle" : ""}.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
