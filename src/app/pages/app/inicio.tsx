import { useMemo } from "react";
import { Link } from "react-router";
import { ArrowRight, Crown, Search, Sparkles } from "lucide-react";
import { Imagotipo } from "../../components/logo";
import { Maniqui, PERSONAS, personaPara } from "../../components/figura/maniqui";
import {
  Avatar,
  Carrusel,
  GrillaPrendas,
  PrendaCard,
  Seccion,
  paraMi,
  recDe,
  tieneMiTalle,
  useCortesia,
} from "../../components/app/comun";
import { useStore, usePrendasVisibles, useYo } from "../../lib/store";
import { CATEGORIAS } from "../../lib/talles";
import { HOY } from "../../data/seed";
import { money, relativo } from "../../lib/format";

export function AppInicio() {
  const { usuario, premium } = useYo();
  const { tiendas, supuestos } = useStore();
  const prendas = usePrendasVisibles();
  const { restantes } = useCortesia();
  const m = usuario?.medidas;

  const mias = useMemo(() => prendas.filter((p) => paraMi(p, m)), [prendas, m]);

  // «Para vos»: las que mejor te quedan, mezclando tiendas.
  const paraVos = useMemo(() => {
    const conRec = mias
      .map((p) => ({ p, r: recDe(p, m) }))
      .filter((x) => tieneMiTalle(x.p, x.r))
      .sort((a, b) => b.r!.confianza - a.r!.confianza || a.p.id.localeCompare(b.p.id));
    const vistas = new Set<string>();
    const out = [];
    for (const x of conRec) {
      if (vistas.has(x.p.tiendaId)) continue;
      vistas.add(x.p.tiendaId);
      out.push(x.p);
      if (out.length >= 10) break;
    }
    return out;
  }, [mias, m]);

  const enTuTalle = useMemo(() => mias.filter((p) => tieneMiTalle(p, recDe(p, m))).length, [mias, m]);

  const novedades = useMemo(
    () =>
      tiendas
        .filter((t) => t.estado === "activa")
        .sort((a, b) => b.fechaAlta.localeCompare(a.fechaAlta))
        .slice(0, 6)
        .map((t) => ({ t, n: prendas.filter((p) => p.tiendaId === t.id).length })),
    [tiendas, prendas]
  );

  const destacadas = useMemo(() => mias.filter((p) => p.destacada).slice(0, 6), [mias]);
  const banner = destacadas[0] ?? mias[0];

  if (!usuario || !m) return null;
  const primerNombre = usuario.nombre.split(" ")[0];
  const persona = personaPara(m);

  return (
    <div className="pb-8">
      {/* Saludo */}
      <header className="px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <Imagotipo size={26} />
          <Link to="/app/perfil" aria-label="Mi perfil" className="relative">
            <Avatar nombre={usuario.nombre} size={36} />
            {premium && (
              <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-amber-400 ring-2 ring-background">
                <Crown className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </Link>
        </div>
        <h1 className="mt-5 font-display text-[30px] font-bold leading-[1.05] tracking-tight">
          Hola, {primerNombre}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hoy hay <b className="text-foreground">{enTuTalle} prendas</b> con tu talle en {tiendas.filter((t) => t.estado === "activa").length} tiendas.
        </p>
        <Link
          to="/app/explorar"
          className="mt-4 flex h-12 items-center gap-2.5 rounded-2xl bg-card px-4 text-sm text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-border"
        >
          <Search className="h-4 w-4" />
          Buscá remeras, jeans, tiendas…
        </Link>
      </header>

      {/* Banner del probador o de Premium */}
      <div className="px-4">
        <Link
          to={premium || restantes > 0 ? "/app/probador" : "/app/premium"}
          className="relative flex h-[168px] overflow-hidden rounded-3xl p-5 text-white"
          style={{ background: "linear-gradient(125deg, var(--brand-700) 0%, var(--brand) 55%, var(--brand-300) 130%)" }}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative z-10 flex max-w-[60%] flex-col">
            {premium ? (
              <>
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-semibold">
                  <Sparkles className="h-3 w-3" /> Probador virtual
                </span>
                <p className="mt-2 font-display text-[21px] font-bold leading-[1.1]">Probátela antes de comprarla</p>
                <p className="mt-1 text-xs text-white/80">Elegí una prenda y mirá cómo te queda cada talle.</p>
              </>
            ) : (
              <>
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10.5px] font-bold text-amber-950">
                  <Crown className="h-3 w-3" /> Premium
                </span>
                <p className="mt-2 font-display text-[21px] font-bold leading-[1.1]">
                  {restantes > 0 ? "Tenés una prueba gratis" : "Probátela antes de comprarla"}
                </p>
                <p className="mt-1 text-xs text-white/80">
                  {restantes > 0 ? "Probá el probador virtual sin pagar nada." : `Probador ilimitado desde ${money(supuestos.precioMensual)} por mes.`}
                </p>
              </>
            )}
            <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-semibold">
              {premium || restantes > 0 ? "Ir al probador" : "Ver Premium"} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
          {banner && (
            <div className="absolute -bottom-16 right-2 h-[260px] w-[130px]">
              <Maniqui persona={premium ? persona : PERSONAS[2]} puestas={[{ prenda: banner, talle: recDe(banner, m)?.talle }]} sombraPiso={false} />
            </div>
          )}
        </Link>
      </div>

      {/* Categorías */}
      <div className="mt-5 px-4">
        <Carrusel>
          {CATEGORIAS.filter((c) => mias.some((p) => p.categoria === c.id)).map((c) => (
            <Link
              key={c.id}
              to={`/app/explorar?cat=${c.id}`}
              className="shrink-0 rounded-full bg-card px-4 py-2 text-[13px] font-semibold ring-1 ring-border transition-colors hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
            >
              {c.plural}
            </Link>
          ))}
        </Carrusel>
      </div>

      <Seccion titulo="Para vos" bajada="Las que mejor te calzan, con tu talle ya calculado" link="/app/explorar?mitalle=1" className="mt-7">
        <Carrusel>
          {paraVos.map((p) => (
            <PrendaCard key={p.id} prenda={p} className="w-[156px] shrink-0 snap-start" />
          ))}
        </Carrusel>
      </Seccion>

      <Seccion titulo="Novedades de tiendas" bajada="Se sumaron hace poco" className="mt-8">
        <Carrusel>
          {novedades.map(({ t, n }) => (
            <Link
              key={t.id}
              to={`/app/tiendas/${t.id}`}
              className="w-[200px] shrink-0 snap-start overflow-hidden rounded-2xl bg-card ring-1 ring-border"
            >
              <div
                className="relative h-20"
                style={{ background: `linear-gradient(135deg, ${t.color} 0%, color-mix(in srgb, ${t.color} 55%, white) 100%)` }}
              >
                <span className="absolute -bottom-5 left-3 grid h-11 w-11 place-items-center rounded-xl bg-white font-display text-lg font-bold shadow" style={{ color: t.color }}>
                  {t.nombre[0]}
                </span>
                {t.fechaAlta >= "2026-09-01" && (
                  <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[var(--ink-800)]">
                    Nueva
                  </span>
                )}
              </div>
              <div className="px-3 pb-3 pt-6">
                <p className="truncate text-sm font-bold">{t.nombre}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {t.ciudad} · {n} prendas · {relativo(t.fechaAlta, HOY)}
                </p>
              </div>
            </Link>
          ))}
        </Carrusel>
      </Seccion>

      {destacadas.length > 0 && (
        <Seccion titulo="Destacadas" bajada="Lo más buscado de la semana" link="/app/explorar" className="mt-8">
          <GrillaPrendas prendas={destacadas} />
        </Seccion>
      )}
    </div>
  );
}
