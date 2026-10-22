import { useMemo } from "react";
import { Link } from "react-router";
import { AlertTriangle, ArrowRight, Check, Lightbulb, Minus, X } from "lucide-react";
import { PageBody, PageHeader } from "../../components/shell";
import { ChipCumple } from "../../components/admin/piezas";
import { CORTO, PLAN_B } from "../../components/admin/hipotesis-textos";
import { cn } from "../../components/ui/utils";
import { useStore } from "../../lib/store";
import { hipotesis, type Hipotesis, type TipoRiesgo } from "../../lib/metricas";
import { HOY } from "../../data/seed";
import { fechaLarga } from "../../lib/format";

const TIPOS: { tipo: TipoRiesgo; pregunta: string; detalle: string }[] = [
  { tipo: "Factibilidad", pregunta: "¿Lo podemos construir?", detalle: "Que la tecnología y las tiendas acompañen." },
  { tipo: "Viabilidad", pregunta: "¿Es un negocio?", detalle: "Que los ingresos cubran costos y adquisición." },
  { tipo: "Deseabilidad", pregunta: "¿Lo quieren los usuarios?", detalle: "Que lo usen, suban su foto y vuelvan." },
];

const tono = (c: boolean | null) =>
  c === null ? "border-l-slate-300" : c ? "border-l-emerald-500" : "border-l-red-500";

function Tarjeta({ h }: { h: Hipotesis }) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-l-4 border-border bg-card p-5",
        tono(h.cumple)
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {h.id} · {CORTO[h.id] ?? h.tipo}
        </span>
        <ChipCumple cumple={h.cumple} />
      </div>
      <p className="font-display mt-3 text-lg leading-snug text-foreground">{h.hipotesis}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p
          className={cn(
            "tabular font-display min-w-0 text-4xl font-semibold tracking-tight",
            h.cumple === false ? "text-red-600" : "text-foreground"
          )}
        >
          {h.valor}
        </p>
        <div className="shrink-0 pb-1 text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Meta</p>
          <p className="tabular text-sm font-medium text-foreground">{h.meta}</p>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{h.metrica}</p>
      <Link
        to={h.ruta}
        className="mt-auto inline-flex items-center gap-1 self-start pt-4 text-sm font-medium text-[var(--brand-700)] hover:underline"
      >
        Ver el detalle <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}

export function AdminHipotesis() {
  const store = useStore();
  const hips = useMemo(() => hipotesis(store), [store]);

  const conMeta = hips.filter((h) => h.cumple !== null);
  const cumplen = conMeta.filter((h) => h.cumple);
  const fallan = conMeta.filter((h) => h.cumple === false);
  const sinMeta = hips.filter((h) => h.cumple === null);

  return (
    <>
      <PageHeader
        titulo="Hipótesis y riesgos"
        bajada={`Las hipótesis del Canvas y del análisis de riesgos, medidas en vivo con los datos de la plataforma al ${fechaLarga(HOY)}. Lo que se hace en la app y en las tiendas durante la sesión se refleja acá.`}
      />
      <PageBody className="space-y-8">
        {/* Resumen */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-[var(--ink)] p-6 text-white lg:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wide text-white/60">Resultado</p>
            <p className="font-display mt-2 text-5xl font-semibold tracking-tight">
              {cumplen.length} <span className="text-white/50">de</span> {conMeta.length}
            </p>
            <p className="mt-1 text-sm text-white/75">hipótesis con meta se cumplen</p>
            <div className="mt-5 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {hips.map((h) => (
                <span
                  key={h.id}
                  title={`${h.id}: ${CORTO[h.id]}`}
                  className={cn(
                    "h-full flex-1",
                    h.cumple === null ? "bg-white/25" : h.cumple ? "bg-emerald-400" : "bg-red-400"
                  )}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70">
              <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-400" /> {cumplen.length} cumplen</span>
              <span className="inline-flex items-center gap-1"><X className="h-3.5 w-3.5 text-red-400" /> {fallan.length} no cumplen</span>
              <span className="inline-flex items-center gap-1"><Minus className="h-3.5 w-3.5" /> {sinMeta.length} para discutir</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-2">
            {TIPOS.map(({ tipo, pregunta }) => {
              const del = hips.filter((h) => h.tipo === tipo);
              const cm = del.filter((h) => h.cumple !== null);
              const ok = cm.filter((h) => h.cumple).length;
              return (
                <button
                  type="button"
                  key={tipo}
                  onClick={() => {
                    document.getElementById(tipo)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-[var(--brand-300)]"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-700)]">{tipo}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{pregunta}</p>
                  <p className="tabular font-display mt-3 text-3xl font-semibold">
                    {ok}/{cm.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    cumplen{del.length > cm.length ? ` · ${del.length - cm.length} sin meta` : ""}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1">
                    {del.map((h) => (
                      <li
                        key={h.id}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                          h.cumple === null
                            ? "bg-slate-100 text-slate-600"
                            : h.cumple
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                        )}
                      >
                        {h.id} {h.cumple === null ? "–" : h.cumple ? "✓" : "✗"}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </section>

        {/* Riesgos abiertos */}
        {fallan.length > 0 && (
          <section className="rounded-xl border border-red-200 bg-red-50/50 p-5 lg:p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-base font-semibold text-foreground">
                {fallan.length === 1 ? "Un riesgo abierto" : `${fallan.length} riesgos abiertos`}: qué haríamos
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {fallan.map((h) => {
                const plan = PLAN_B[h.id];
                return (
                  <div key={h.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {h.id} · {CORTO[h.id]}
                      </p>
                      <p className="tabular shrink-0 text-sm">
                        <span className="font-semibold text-red-600">{h.valor}</span>
                        <span className="text-muted-foreground"> · meta {h.meta}</span>
                      </p>
                    </div>
                    {plan && (
                      <>
                        <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[var(--brand-700)]">
                          <Lightbulb className="h-4 w-4" /> {plan.titulo}
                        </p>
                        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                          {plan.pasos.map((p) => (
                            <li key={p} className="flex gap-2">
                              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--ink-500)]" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    <Link to={h.ruta} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-700)] hover:underline">
                      Ver los datos <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Por tipo */}
        {TIPOS.map(({ tipo, pregunta, detalle }) => (
          <section key={tipo} id={tipo} className="scroll-mt-20">
            <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">{tipo}</h2>
              <p className="text-sm text-muted-foreground">
                {pregunta} {detalle}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {hips
                .filter((h) => h.tipo === tipo)
                .map((h) => (
                  <Tarjeta key={h.id} h={h} />
                ))}
            </div>
          </section>
        ))}

        <p className="text-xs text-muted-foreground">
          Los números salen de datos de ejemplo calibrados para la demo. «Sin meta» marca las hipótesis
          que los documentos dejan sin número: son datos para discutir en la presentación.
        </p>
      </PageBody>
    </>
  );
}
