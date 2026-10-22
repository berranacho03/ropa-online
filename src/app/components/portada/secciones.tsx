import { Link } from "react-router";
import { ArrowRight, BadgePercent, Check, PackageCheck, Ruler, Shirt, Sparkles, Store, TrendingUp } from "lucide-react";
import { Imagotipo } from "../logo";
import { Maniqui } from "../figura/maniqui";
import { money, num } from "../../lib/format";
import { SUPUESTOS_DEFECTO } from "../../data/seed";
import { NOMBRE_ZONA } from "../../lib/talles";
import { cn } from "../ui/utils";
import { MARCA } from "../../lib/marca";
import { CIFRAS, MODELO, TRAMOS } from "./looks";
import { ChipPrenda } from "./escena";

function Encabezado({ etiqueta, titulo, bajada, claro = false }: { etiqueta: string; titulo: string; bajada?: string; claro?: boolean }) {
  return (
    <div className="max-w-2xl">
      <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", claro ? "text-[var(--brand-300)]" : "text-[var(--brand)]")}>{etiqueta}</p>
      <h2 className={cn("font-display mt-3 text-4xl font-bold leading-[1.05] sm:text-5xl", claro ? "text-white" : "text-[var(--ink)]")}>{titulo}</h2>
      {bajada && <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", claro ? "text-white/60" : "text-[var(--ink-500)]")}>{bajada}</p>}
    </div>
  );
}

// ── Cómo funciona ────────────────────────────────────────────

function Medidas() {
  const m = MODELO.medidas;
  const filas: [string, number][] = [
    ["Altura", m.altura],
    [NOMBRE_ZONA.pecho, m.pecho],
    [NOMBRE_ZONA.cintura, m.cintura],
    [NOMBRE_ZONA.cadera, m.cadera],
  ];
  return (
    <div className="w-full space-y-2">
      {filas.map(([z, v]) => (
        <div key={z} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-black/5">
          <span className="text-[var(--ink-500)]">{z}</span>
          <span className="font-semibold tabular-nums text-[var(--ink)]">{v} cm</span>
        </div>
      ))}
    </div>
  );
}

export function ComoFunciona() {
  const look = TRAMOS[1];
  const pasos = [
    {
      icono: Ruler,
      titulo: "Cargás tus medidas",
      texto: "Altura, pecho, cintura y cadera. Si no tenés cinta, las estimamos con tu altura y tu peso.",
      visual: <Medidas />,
    },
    {
      icono: Shirt,
      titulo: "Ves tu talle en cada prenda",
      texto: "En todas las tiendas asociadas, con qué tan seguros estamos y cómo te queda en cada zona.",
      visual: (
        <div className="w-full space-y-2">
          {look.items.map((it) => (
            <ChipPrenda key={it.prenda.id} item={it} className="w-full" />
          ))}
        </div>
      ),
    },
    {
      icono: Sparkles,
      titulo: "Te la probás y comprás",
      texto: "Con el probador virtual la ves puesta antes de pagar. Comprás en la tienda, con el talle justo.",
      visual: (
        <div className="relative mx-auto h-52 w-24">
          <Maniqui persona={MODELO} puestas={TRAMOS[4].puestas} />
        </div>
      ),
    },
  ];
  return (
    <section className="bg-[var(--brand-50)] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <Encabezado
          etiqueta="Cómo funciona"
          titulo="Tres pasos y chau a las devoluciones."
          bajada="Las medidas las cargás una vez. Después, cada prenda de cada tienda te dice qué talle llevar."
        />
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {pasos.map((p, k) => (
            <li key={p.titulo} className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="flex h-56 items-center justify-center bg-gradient-to-b from-[var(--brand-100)] to-[var(--brand-50)] px-8">{p.visual}</div>
              <div className="flex-1 p-6">
                <div className="flex items-center gap-3">
                  <span className="font-display flex size-9 items-center justify-center rounded-full bg-[var(--ink)] text-sm font-bold text-white">{k + 1}</span>
                  <p.icono className="size-5 text-[var(--brand)]" />
                </div>
                <h3 className="font-display mt-4 text-xl font-bold text-[var(--ink)]">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-500)]">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── Para tiendas ─────────────────────────────────────────────

export function ParaTiendas() {
  const beneficios = [
    { icono: PackageCheck, titulo: "Menos devoluciones por talle", texto: `Antes de sumarse, las tiendas devolvían en promedio el ${CIFRAS.devAntes} % de sus ventas online por talle.` },
    { icono: TrendingUp, titulo: "Más ventas que se quedan", texto: "Quien sabe su talle compra con confianza y vuelve. Ves en tu panel cuánto vendiste por la app." },
    { icono: BadgePercent, titulo: "Pagás sólo si vendés", texto: `Sin costo fijo: una comisión del ${SUPUESTOS_DEFECTO.comisionDefecto} % por cada venta que te derivamos.` },
    { icono: Store, titulo: "Tu tabla de talles, tu catálogo", texto: "Cargás tus prendas y tu tabla una vez. Nosotros la cruzamos con las medidas de cada cliente." },
  ];
  return (
    <section className="portal-tienda relative overflow-hidden bg-[var(--ink)] px-4 py-20 text-white sm:px-8 lg:px-12 lg:py-28">
      <div
        className="absolute -right-40 top-0 h-[36rem] w-[36rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)" }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div className="flex flex-col justify-between gap-8">
          <Encabezado
            claro
            etiqueta="Para tiendas"
            titulo="Vendé con el talle justo desde la primera compra."
            bajada={`${num(CIFRAS.tiendas)} tiendas uruguayas ya muestran el talle recomendado en sus prendas.`}
          />
          <div>
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--brand-600)]"
            >
              Soy una tienda
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {beneficios.map((b) => (
            <li key={b.titulo} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand)]/20 text-[var(--brand-300)]">
                <b.icono className="size-5" />
              </span>
              <h3 className="font-display mt-5 text-lg font-bold">{b.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{b.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Planes ───────────────────────────────────────────────────

export function Planes() {
  const { precioMensual, precioAnual, pruebasCortesia } = SUPUESTOS_DEFECTO;
  const ahorro = Math.round((1 - precioAnual / (precioMensual * 12)) * 100);
  const planes = [
    {
      nombre: "Gratis",
      precio: money(0),
      periodo: "para siempre",
      items: [
        "Tu talle recomendado en todas las tiendas",
        "Detalle de cómo te queda en cada zona",
        "Favoritos y comparación entre tiendas",
        `${pruebasCortesia === 1 ? "Una prueba" : `${pruebasCortesia} pruebas`} de cortesía en el probador`,
      ],
      destacado: false,
    },
    {
      nombre: "Premium",
      precio: money(precioMensual),
      periodo: "por mes",
      nota: `o ${money(precioAnual)} por año (ahorrás ${ahorro} %)`,
      items: ["Todo lo del plan gratis", "Probador virtual en todas las prendas", "Probate tu propia foto", "Combiná prendas de distintas tiendas"],
      destacado: true,
    },
  ];
  return (
    <section className="bg-white px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="flex justify-center text-center [&>div]:mx-auto">
          <Encabezado etiqueta="Planes" titulo="El talle es gratis. Probártela, Premium." />
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {planes.map((p) => (
            <div
              key={p.nombre}
              className={cn(
                "relative flex flex-col rounded-3xl p-7 lg:p-9",
                p.destacado ? "bg-[var(--ink)] text-white shadow-[0_30px_60px_-20px_var(--brand)]" : "bg-[var(--brand-50)] text-[var(--ink)] ring-1 ring-[var(--brand-100)]"
              )}
            >
              {p.destacado && (
                <span className="absolute right-6 top-6 rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-semibold">Probador virtual</span>
              )}
              <p className="font-display text-lg font-bold">{p.nombre}</p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold tabular-nums">{p.precio}</span>
                <span className={p.destacado ? "text-white/60" : "text-[var(--ink-500)]"}>{p.periodo}</span>
              </p>
              <p className={cn("mt-1 h-5 text-sm", p.destacado ? "text-[var(--brand-300)]" : "text-transparent")}>{p.nota ?? "·"}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {p.items.map((it) => (
                  <li key={it} className="flex gap-3">
                    <Check className={cn("mt-0.5 size-4 shrink-0", p.destacado ? "text-[var(--brand-300)]" : "text-[var(--brand)]")} strokeWidth={2.5} />
                    {it}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className={cn(
                  "mt-8 rounded-full py-3 text-center font-medium transition-colors",
                  p.destacado ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-600)]" : "bg-white text-[var(--ink)] ring-1 ring-black/10 hover:bg-[var(--brand-100)]"
                )}
              >
                {p.destacado ? "Probar Premium" : "Empezar gratis"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Cierre ───────────────────────────────────────────────────

export function Cierre() {
  return (
    <section className="relative overflow-hidden bg-[var(--ink)] px-4 pt-24 text-white sm:px-8 lg:px-12">
      <div className="ropa-grid absolute inset-0 opacity-60" style={{ maskImage: "linear-gradient(180deg, black, transparent)", WebkitMaskImage: "linear-gradient(180deg, black, transparent)" }} />
      <div
        className="absolute left-1/2 top-0 h-[30rem] w-[50rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)" }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="font-display text-5xl font-bold leading-[1.02] sm:text-6xl">
          Tu talle te está <span className="text-[var(--brand-300)]">esperando.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg text-white/60">Creá tu perfil en dos minutos y mirá qué talle te queda en cada tienda.</p>
        <Link
          to="/login"
          className="group mt-9 inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-8 py-4 text-lg font-medium shadow-[0_10px_40px_-10px_var(--brand)] transition-colors hover:bg-[var(--brand-600)]"
        >
          Crear mi perfil
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <footer className="relative mx-auto mt-24 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 py-8 text-sm text-white/45 sm:flex-row">
        <Imagotipo size={24} claro />
        <p>© 2026 {MARCA.nombre} · Datos de ejemplo</p>
      </footer>
    </section>
  );
}
