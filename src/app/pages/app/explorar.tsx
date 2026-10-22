import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { SearchX, SlidersHorizontal, Search, X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { Slider } from "../../components/ui/slider";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Carrusel, GrillaPrendas, VacioApp, paraMi, recDe, tieneMiTalle } from "../../components/app/comun";
import { useStore, usePrendasVisibles, useYo } from "../../lib/store";
import { CATEGORIAS, type Categoria } from "../../lib/talles";
import { money } from "../../lib/format";
import { cn } from "../../components/ui/utils";

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Orden = "relevancia" | "confianza" | "precio-asc" | "precio-desc" | "nuevas";

export function Explorar() {
  const [params, setParams] = useSearchParams();
  const { usuario } = useYo();
  const { tiendas } = useStore();
  const prendas = usePrendasVisibles();
  const m = usuario?.medidas;

  const q = params.get("q") ?? "";
  const cat = (params.get("cat") ?? "") as Categoria | "";
  const tienda = params.get("tienda") ?? "";
  const miTalle = params.get("mitalle") === "1";
  const todas = params.get("todas") === "1";

  const precioMax = useMemo(() => Math.max(...prendas.map((p) => p.precio)), [prendas]);
  const [tope, setTope] = useState(precioMax);
  const [orden, setOrden] = useState<Orden>("relevancia");
  const [verFiltros, setVerFiltros] = useState(false);
  const [limite, setLimite] = useState(24);

  const set = (k: string, v: string | null) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v);
    else n.delete(k);
    setParams(n, { replace: true });
    setLimite(24);
  };

  const tiendasConPrendas = useMemo(
    () => tiendas.filter((t) => prendas.some((p) => p.tiendaId === t.id)).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [tiendas, prendas]
  );

  const resultado = useMemo(() => {
    const nq = sinTildes(q.trim());
    const nombreTienda = new Map(tiendas.map((t) => [t.id, sinTildes(t.nombre)]));
    const lista = prendas
      .filter((p) => todas || paraMi(p, m))
      .filter((p) => !cat || p.categoria === cat)
      .filter((p) => !tienda || p.tiendaId === tienda)
      .filter((p) => p.precio <= tope)
      .filter(
        (p) =>
          !nq ||
          sinTildes(`${p.nombre} ${p.colorNombre} ${p.material}`).includes(nq) ||
          nombreTienda.get(p.tiendaId)?.includes(nq)
      )
      .map((p) => ({ p, r: recDe(p, m) }))
      .filter((x) => !miTalle || tieneMiTalle(x.p, x.r));
    const ord: Record<Orden, (a: (typeof lista)[0], b: (typeof lista)[0]) => number> = {
      relevancia: (a, b) => Number(b.p.destacada) - Number(a.p.destacada) || (b.r?.confianza ?? 0) - (a.r?.confianza ?? 0) || a.p.id.localeCompare(b.p.id),
      confianza: (a, b) => (b.r?.confianza ?? 0) - (a.r?.confianza ?? 0),
      "precio-asc": (a, b) => a.p.precio - b.p.precio,
      "precio-desc": (a, b) => b.p.precio - a.p.precio,
      nuevas: (a, b) => b.p.fechaAlta.localeCompare(a.p.fechaAlta),
    };
    return lista.sort(ord[orden]).map((x) => x.p);
  }, [prendas, tiendas, q, cat, tienda, tope, miTalle, todas, m, orden]);

  const activos = (tienda ? 1 : 0) + (tope < precioMax ? 1 : 0) + (orden !== "relevancia" ? 1 : 0) + (todas ? 1 : 0);

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-20 bg-background/90 px-4 pb-3 pt-4 backdrop-blur-md">
        <h1 className="font-display text-[26px] font-bold tracking-tight">Explorar</h1>
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => set("q", e.target.value || null)}
              placeholder="Buscá prendas, colores o tiendas"
              className="h-11 rounded-2xl bg-card pl-10 pr-9 text-sm"
            />
            {q && (
              <button onClick={() => set("q", null)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Borrar búsqueda">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setVerFiltros(!verFiltros)}
            className={cn(
              "relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 transition-colors",
              verFiltros ? "bg-[var(--ink)] text-white ring-[var(--ink)]" : "bg-card ring-border"
            )}
            aria-label="Filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activos > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white">
                {activos}
              </span>
            )}
          </button>
        </div>

        <Carrusel className="mt-3">
          {[{ id: "", plural: "Todo" }, ...CATEGORIAS].map((c) => (
            <button
              key={c.id}
              onClick={() => set("cat", c.id || null)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                cat === c.id ? "bg-[var(--ink)] text-white" : "bg-card ring-1 ring-border hover:bg-black/[0.03]"
              )}
            >
              {c.plural}
            </button>
          ))}
        </Carrusel>

        <label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl bg-[var(--brand-50)] px-3.5 py-2.5">
          <span>
            <span className="block text-[13px] font-semibold text-[var(--brand-700)]">Sólo las que tienen mi talle</span>
            <span className="block text-[11px] text-[var(--brand-700)]/70">Talle disponible y 70 % de confianza o más</span>
          </span>
          <Switch checked={miTalle} onCheckedChange={(v) => set("mitalle", v ? "1" : null)} />
        </label>

        {verFiltros && (
          <div className="mt-3 space-y-4 rounded-2xl bg-card p-4 ring-1 ring-border">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Tienda</p>
              <Select value={tienda || "todas"} onValueChange={(v) => set("tienda", v === "todas" ? null : v)}>
                <SelectTrigger className="h-10 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las tiendas</SelectItem>
                  {tiendasConPrendas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Precio máximo</span>
                <span className="font-bold tabular">{tope >= precioMax ? "Sin tope" : money(tope)}</span>
              </div>
              <Slider min={500} max={precioMax} step={100} value={[tope]} onValueChange={([v]) => setTope(v)} />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Ordenar por</p>
              <Select value={orden} onValueChange={(v) => setOrden(v as Orden)}>
                <SelectTrigger className="h-10 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevancia">Recomendadas</SelectItem>
                  <SelectItem value="confianza">Mejor calce para mí</SelectItem>
                  <SelectItem value="precio-asc">Menor precio</SelectItem>
                  <SelectItem value="precio-desc">Mayor precio</SelectItem>
                  <SelectItem value="nuevas">Más nuevas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center justify-between text-[13px] font-semibold">
              Mostrar prendas de todos los géneros
              <Switch checked={todas} onCheckedChange={(v) => set("todas", v ? "1" : null)} />
            </label>
            {activos > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setTope(precioMax);
                  setOrden("relevancia");
                  const n = new URLSearchParams(params);
                  n.delete("tienda");
                  n.delete("todas");
                  setParams(n, { replace: true });
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </header>

      <div className="px-4 pt-2">
        <p className="mb-3 text-xs text-muted-foreground">
          {resultado.length} {resultado.length === 1 ? "prenda" : "prendas"}
          {tienda && ` en ${tiendas.find((t) => t.id === tienda)?.nombre}`}
        </p>
        {resultado.length === 0 ? (
          <VacioApp
            icono={SearchX}
            titulo="No encontramos nada"
            texto="Probá con otra búsqueda o sacá algún filtro."
            accion={
              <Button variant="outline" className="rounded-xl" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                Ver todo
              </Button>
            }
          />
        ) : (
          <>
            <GrillaPrendas prendas={resultado.slice(0, limite)} />
            {resultado.length > limite && (
              <Button variant="outline" className="mt-6 h-11 w-full rounded-2xl" onClick={() => setLimite(limite + 24)}>
                Ver más ({resultado.length - limite})
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
