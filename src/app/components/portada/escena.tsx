import { useCallback, useRef } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { Maniqui } from "../figura/maniqui";
import { PrendaIlustracion } from "../figura/prenda-ilustracion";
import { ES_INFERIOR } from "../../lib/talles";
import { money, num } from "../../lib/format";
import { SUPUESTOS_DEFECTO } from "../../data/seed";
import { cn } from "../ui/utils";
import { CIFRAS, COMPARATIVA, MODELO, TRAMOS, type ItemLook, type Tramo } from "./looks";
import { useScrub } from "./use-scrub";

const N = TRAMOS.length;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (x: number) => x * x * (3 - 2 * x);
const dosDig = (i: number) => String(i + 1).padStart(2, "0");

// ── Piezas compartidas con la versión estática ───────────────

/** Etiqueta de producto flotante: prenda, tienda y el talle recomendado. */
export function ChipPrenda({ item, className }: { item: ItemLook; className?: string }) {
  const { prenda, tienda, talle, confianza } = item;
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-2xl bg-white/95 p-2 pl-2.5 pr-3 sm:p-1.5 text-[var(--ink)] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] ring-1 ring-black/5 backdrop-blur lg:gap-3 lg:p-2 lg:pr-4",
        className
      )}
    >
      <PrendaIlustracion prenda={prenda} className="hidden h-11 w-9 shrink-0 rounded-xl sm:flex lg:h-14 lg:w-11" />
      <div className="min-w-0">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight lg:truncate lg:text-sm">{prenda.nombre}</p>
        <p className="truncate text-[10px] leading-tight text-[var(--ink-500)] lg:mt-0.5 lg:text-xs">
          {tienda}
          <span className="hidden lg:inline"> · {money(prenda.precio)}</span>
        </p>
        <div className="mt-1 flex items-center gap-1.5 lg:mt-1.5">
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white lg:px-2 lg:text-xs">
            Tu talle: {talle}
            <Check className="size-3" strokeWidth={3} />
          </span>
          <span className="hidden text-[11px] tabular-nums text-[var(--ink-500)] sm:inline">{confianza} %</span>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/75">
      {children}
    </span>
  );
}

function Llamados({ chico = false }: { chico?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      <Link
        to="/login"
        className={cn(
          "group inline-flex items-center gap-2 rounded-full bg-[var(--brand)] font-medium text-white shadow-[0_10px_30px_-10px_var(--brand)] transition-colors hover:bg-[var(--brand-600)]",
          chico ? "px-4 py-2 text-sm" : "px-6 py-3"
        )}
      >
        Crear mi perfil
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
      <Link
        to="/login"
        className={cn(
          "inline-flex items-center rounded-full border border-white/20 font-medium text-white transition-colors hover:bg-white/10",
          chico ? "px-4 py-2 text-sm" : "px-6 py-3"
        )}
      >
        Soy una tienda
      </Link>
    </div>
  );
}

/** Lo que acompaña al texto de cada tramo. */
function Extra({ tramo }: { tramo: Tramo }) {
  switch (tramo.id) {
    case "talle":
      return <Llamados chico />;
    case "probador":
      return (
        <div className="flex flex-wrap gap-2">
          <Pill>Incluido en Premium · {money(SUPUESTOS_DEFECTO.precioMensual)} por mes</Pill>
          <Pill>El talle, gratis siempre</Pill>
        </div>
      );
    case "tiendas":
      return (
        <div className="flex flex-wrap gap-2">
          <Pill>Sin costo fijo</Pill>
          <Pill>{SUPUESTOS_DEFECTO.comisionDefecto} % sólo por venta derivada</Pill>
        </div>
      );
    case "tablas":
      return (
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-sm">
          <p className="border-b border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
            {MODELO.nombre}, mismas medidas
          </p>
          {COMPARATIVA.map((c) => (
            <div key={c.prenda.id} className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-2 last:border-0">
              <span className="min-w-0 truncate text-white/75">
                {c.prenda.nombre} <span className="text-white/40">· {c.tienda}</span>
              </span>
              <span className="font-display w-10 shrink-0 rounded-md bg-[var(--brand)]/20 py-0.5 text-center font-bold text-[var(--brand-300)]">
                {c.talle}
              </span>
            </div>
          ))}
        </div>
      );
    case "cierre":
      return (
        <div className="space-y-5">
          <dl className="flex gap-6 lg:gap-8">
            {[
              [num(CIFRAS.tiendas), "tiendas activas"],
              [num(CIFRAS.usuarios), "usuarios"],
              [num(CIFRAS.prendas), "prendas con talle"],
            ].map(([v, e]) => (
              <div key={e}>
                <dt className="sr-only">{e}</dt>
                <dd className="font-display text-2xl font-bold tabular-nums lg:text-4xl">{v}</dd>
                <dd className="text-[11px] text-white/50 lg:text-xs">{e}</dd>
              </div>
            ))}
          </dl>
          <Llamados />
        </div>
      );
    default:
      return null;
  }
}

export function TextoTramo({ tramo, i, h1 = false }: { tramo: Tramo; i: number; h1?: boolean }) {
  const Titulo = h1 ? "h1" : "h2";
  return (
    <div className="space-y-3 lg:space-y-5">
      <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-300)] lg:text-xs">
        <span className="tabular-nums">{dosDig(i)}</span>
        <span className="h-px w-6 bg-[var(--brand-300)]/50" />
        {tramo.etiqueta}
      </p>
      <Titulo className="font-display text-[2rem] font-bold leading-[1.02] text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem]">
        {tramo.titulo}{" "}
        {tramo.resaltado && (
          <span className="bg-gradient-to-r from-[var(--brand-300)] to-white bg-clip-text text-transparent">{tramo.resaltado}</span>
        )}
      </Titulo>
      <p className="max-w-md text-sm leading-relaxed text-white/60 lg:max-w-[25rem] lg:text-lg">{tramo.bajada}</p>
      <div className="pt-1 lg:pt-2">
        <Extra tramo={tramo} />
      </div>
    </div>
  );
}

/** Altura (0 a 1) del punto de la prenda donde se engancha la etiqueta. */
const anclaY = (it: ItemLook) =>
  ES_INFERIOR[it.prenda.categoria] ? 0.63 : it.prenda.categoria === "vestido" ? 0.42 : 0.3;

/** Arco tipo espejo de probador, detrás de la persona. */
function Espejo() {
  return (
    <>
      <div
        className="absolute -inset-x-[22%] bottom-[3%] top-[-2%] rounded-t-full border border-white/10"
        style={{ maskImage: "linear-gradient(180deg, black 70%, transparent)", WebkitMaskImage: "linear-gradient(180deg, black 70%, transparent)", background: "linear-gradient(180deg, color-mix(in srgb, var(--brand) 32%, transparent) 0%, color-mix(in srgb, var(--brand) 6%, transparent) 70%, transparent 100%)" }}
      />
      <div
        className="absolute -inset-x-[12%] bottom-[3%] top-[4%] rounded-t-full border border-white/[0.06]"
        style={{ maskImage: "linear-gradient(180deg, black 70%, transparent)", WebkitMaskImage: "linear-gradient(180deg, black 70%, transparent)", background: "radial-gradient(60% 45% at 50% 30%, rgba(255,255,255,0.10), transparent 70%)" }}
      />
      {/* Cinta métrica al costado */}
      <div className="absolute bottom-[8%] left-[-15%] top-[12%] hidden w-3 flex-col justify-between lg:flex" aria-hidden>
        {Array.from({ length: 21 }, (_, k) => (
          <span key={k} className={cn("h-px bg-white/25", k % 5 === 0 ? "w-3 bg-white/45" : "w-1.5")} />
        ))}
      </div>
      <div className="absolute -inset-x-[30%] bottom-[1%] h-10 rounded-[100%] bg-[var(--brand)]/25 blur-2xl" />
    </>
  );
}

// ── Escena con scroll ────────────────────────────────────────

export function EscenaScroll() {
  const seccion = useRef<HTMLElement>(null);
  const capas = useRef<(HTMLDivElement | null)[]>([]);
  const textos = useRef<(HTMLDivElement | null)[]>([]);
  const chips = useRef<(HTMLDivElement | null)[]>([]);
  const puntos = useRef<(HTMLSpanElement | null)[]>([]);
  const linea = useRef<HTMLDivElement>(null);
  const numero = useRef<HTMLSpanElement>(null);
  const barra = useRef<HTMLDivElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const contador = useRef<HTMLSpanElement>(null);
  const ultimo = useRef(-1);

  const frame = useCallback((p: number) => {
    const t = p * (N - 1);
    const i = Math.min(Math.floor(t), N - 1);
    const f = t - i;
    // Cada tramo: primero el look se queda quieto, después cae el siguiente.
    const r = i >= N - 1 ? 0 : suave(clamp((f - 0.3) / 0.58));
    const c = i + r;

    capas.current.forEach((el, k) => {
      if (!el) return;
      if (k === i) {
        el.style.visibility = "visible";
        el.style.clipPath = `inset(${(r * 100).toFixed(2)}% 0 0 0)`;
      } else if (k === i + 1 && r > 0) {
        el.style.visibility = "visible";
        el.style.clipPath = `inset(0 0 ${(100 - r * 100).toFixed(2)}% 0)`;
      } else {
        el.style.visibility = "hidden";
      }
    });

    if (linea.current) {
      linea.current.style.top = `${r * 100}%`;
      linea.current.style.opacity = String(clamp(Math.min(r, 1 - r) * 10));
    }

    textos.current.forEach((el, k) => {
      if (!el) return;
      const d = c - k;
      const o = clamp(1 - Math.max(0, Math.abs(d) - 0.04) * 2.8);
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translate3d(0, ${(-d * 56).toFixed(1)}px, 0)`;
      el.style.pointerEvents = o > 0.6 ? "auto" : "none";
      el.style.visibility = o === 0 ? "hidden" : "visible";
    });

    chips.current.forEach((el, n) => {
      if (!el) return;
      const k = Number(el.dataset.tramo);
      const orden = Number(el.dataset.orden);
      // La etiqueta aparece cuando el barrido ya pasó por su prenda.
      const d = c - k - (orden ? 0.06 : 0);
      const o = clamp(1 - Math.max(0, Math.abs(d + 0.08) - 0.1) * 4.5);
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translate3d(0, -50%, 0) scale(${(0.92 + o * 0.08).toFixed(3)})`;
      el.style.visibility = o === 0 ? "hidden" : "visible";
      void n;
    });

    const activo = Math.round(c);
    if (activo !== ultimo.current) {
      ultimo.current = activo;
      puntos.current.forEach((el, k) => el?.setAttribute("data-on", String(k === activo)));
      if (numero.current) numero.current.textContent = dosDig(activo);
      if (contador.current) contador.current.textContent = dosDig(activo);
    }
    if (barra.current) barra.current.style.transform = `scaleX(${p})`;
    if (pista.current) pista.current.style.opacity = String(clamp(1 - p * 14));
    seccion.current?.style.setProperty("--p", p.toFixed(4));
  }, []);

  useScrub(seccion, frame);

  return (
    <section
      ref={seccion}
      className="relative"
      style={{ height: `${(N - 1) * 125 + 100}vh` }}
      aria-label="Cómo cambia tu talle en cada look"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Fondo */}
        <div
          className="ropa-grid absolute inset-0 opacity-70"
          style={{ maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 75%)" }}
        />
        <div
          className="absolute left-1/2 top-[38%] h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-3xl"
          style={{
            background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)",
            transform: "translate(calc(-50% + (var(--p, 0) - 0.5) * 18vw), -50%)",
          }}
        />

        <div className="relative mx-auto grid h-full max-w-7xl grid-rows-[auto_minmax(0,1fr)] items-center gap-5 px-4 pb-10 pt-[4.5rem] sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,0.85fr)] lg:grid-rows-1 lg:gap-12 lg:px-12 lg:pb-0 lg:pt-10">
          {/* Textos: apilados en la misma celda */}
          <div className="order-2 grid self-start lg:order-1 lg:self-center">
            {TRAMOS.map((t, k) => (
              <div
                key={t.id}
                ref={(el) => {
                  textos.current[k] = el;
                }}
                className="[grid-area:1/1] will-change-transform"
                style={{ opacity: k === 0 ? 1 : 0, visibility: k === 0 ? "visible" : "hidden" }}
              >
                <TextoTramo tramo={t} i={k} h1={k === 0} />
              </div>
            ))}
          </div>

          {/* Persona */}
          <div className="order-1 flex justify-center lg:order-2">
            <div className="relative aspect-[240/540] h-[44svh] lg:h-[min(76vh,660px)]">
              <span
                ref={numero}
                aria-hidden
                className="font-display pointer-events-none absolute left-1/2 top-[-6%] -translate-x-1/2 select-none text-[9rem] font-bold leading-none text-transparent lg:text-[17rem]"
                style={{ color: "rgba(255,255,255,0.035)" }}
              >
                01
              </span>
              <Espejo />
              {TRAMOS.map((t, k) => (
                <div
                  key={t.id}
                  ref={(el) => {
                    capas.current[k] = el;
                  }}
                  className="absolute inset-0"
                  style={{ visibility: k === 0 ? "visible" : "hidden" }}
                >
                  <Maniqui persona={MODELO} puestas={t.puestas} sombraPiso={false} />
                </div>
              ))}
              {/* Línea de luz del barrido */}
              <div ref={linea} className="pointer-events-none absolute -inset-x-[24%] top-0 h-0 opacity-0" aria-hidden>
                <div
                  className="absolute inset-x-[6%] bottom-0 h-28"
                  style={{ background: "radial-gradient(50% 100% at 50% 100%, color-mix(in srgb, var(--brand-300) 30%, transparent), transparent 100%)" }}
                />
                <div
                  className="absolute inset-x-0 -top-px h-[2px]"
                  style={{
                    background: "linear-gradient(90deg, transparent, var(--brand-300) 20%, #fff 50%, var(--brand-300) 80%, transparent)",
                    boxShadow: "0 0 18px 3px color-mix(in srgb, var(--brand) 80%, transparent), 0 0 4px 1px rgba(255,255,255,0.7)",
                  }}
                />
                <span className="absolute -top-[5px] left-[18%] size-2.5 rotate-45 bg-white shadow-[0_0_12px_4px_var(--brand-300)]" />
                <span className="absolute -top-[5px] right-[18%] size-2.5 rotate-45 bg-white shadow-[0_0_12px_4px_var(--brand-300)]" />
              </div>

              {/* Etiquetas */}
              {TRAMOS.flatMap((t, k) =>
                t.items.map((it, orden) => {
                  const izq = orden === 1;
                  return (
                    <div
                      key={`${t.id}-${orden}`}
                      ref={(el) => {
                        chips.current[k * 2 + orden] = el;
                      }}
                      data-tramo={k}
                      data-orden={orden}
                      className={cn(
                        "absolute z-10 flex items-center will-change-transform",
                        izq ? "max-lg:right-[56%] max-lg:flex-row-reverse lg:left-[58%]" : "left-[58%]"
                      )}
                      style={{ top: `${anclaY(it) * 100}%`, opacity: 0, visibility: "hidden" }}
                    >
                      <span className="relative size-2.5 shrink-0 rounded-full bg-white ring-4 ring-[var(--brand)]/40" />
                      <span className="h-px w-2 shrink-0 bg-gradient-to-r from-white/70 to-white/20 lg:w-28" />
                      <ChipPrenda item={it} className="w-[8.75rem] lg:w-64" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="hidden lg:order-3 lg:block" />
        </div>

        {/* Progreso */}
        <div className="absolute right-3 top-[24svh] flex flex-col items-center gap-2.5 lg:right-8 lg:top-1/2 lg:-translate-y-1/2 lg:gap-3.5">
          <span ref={contador} className="hidden text-xs font-semibold tabular-nums text-white lg:block">
            01
          </span>
          {TRAMOS.map((t, k) => (
            <span
              key={t.id}
              ref={(el) => {
                puntos.current[k] = el;
              }}
              data-on={k === 0}
              title={t.etiqueta}
              className="block h-1.5 w-1.5 rounded-full bg-white/25 transition-all duration-300 data-[on=true]:h-6 data-[on=true]:bg-[var(--brand-300)] lg:h-2 lg:w-2 lg:data-[on=true]:h-8"
            />
          ))}
          <span className="hidden text-xs tabular-nums text-white/35 lg:block">{dosDig(N - 1)}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/5">
          <div ref={barra} className="h-full origin-left bg-gradient-to-r from-[var(--brand)] to-[var(--brand-300)]" style={{ transform: "scaleX(0)" }} />
        </div>
        <div
          ref={pista}
          className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-white/45 lg:flex"
        >
          Scrolleá y cambiá de look
          <ChevronDown className="size-4 animate-bounce" />
        </div>
      </div>
    </section>
  );
}

// ── Sin animación (prefers-reduced-motion) ───────────────────

export function LooksEstaticos() {
  return (
    <section className="relative" aria-label="Looks">
      {TRAMOS.map((t, k) => (
        <div
          key={t.id}
          className="relative mx-auto grid max-w-6xl items-center gap-8 border-b border-white/5 px-4 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:px-12 lg:py-24"
        >
          <div className="order-2 lg:order-1">
            <TextoTramo tramo={t} i={k} h1={k === 0} />
          </div>
          <div className="order-1 flex flex-col items-center gap-4 lg:order-2">
            <div className="relative aspect-[240/540] h-[22rem] lg:h-[30rem]">
              <Espejo />
              <div className="absolute inset-0">
                <Maniqui persona={MODELO} puestas={t.puestas} sombraPiso={false} />
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {t.items.map((it) => (
                <ChipPrenda key={it.prenda.id} item={it} className="w-56" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
