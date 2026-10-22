import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, ChevronRight, Crown, Info, Ruler, Shirt, ShoppingBag, Sparkles } from "lucide-react";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import { BarraZona, Corazon, PrendaCard, Carrusel, VacioApp, recDe, resumenZonas, useCortesia, paraMi } from "../../components/app/comun";
import { ComprarDialog } from "../../components/app/comprar";
import { Button } from "../../components/ui/button";
import { useStore, usePrendasVisibles, useYo } from "../../lib/store";
import { NOMBRE_ZONA, evaluarTalle, nombreCategoria, type Zona } from "../../lib/talles";
import { money } from "../../lib/format";
import { cn } from "../../components/ui/utils";

const CALCE_PRENDA = { ajustado: "Calce ajustado", regular: "Calce regular", oversize: "Calce oversize" };

export function PrendaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { prendas, tiendas } = useStore();
  const visibles = usePrendasVisibles();
  const { usuario } = useYo();
  const { premium, restantes } = useCortesia();
  const prenda = prendas.find((p) => p.id === id);
  const m = usuario?.medidas;
  const rec = prenda ? recDe(prenda, m) : null;
  const [sel, setSel] = useState<string | null>(null);
  const [comprar, setComprar] = useState(false);

  useEffect(() => setSel(null), [id]);

  if (!prenda || !m) return <VacioApp icono={Shirt} titulo="No encontramos esta prenda" />;

  const tienda = tiendas.find((t) => t.id === prenda.tiendaId);
  const talle = sel ?? rec?.talle ?? prenda.talles[0];
  const esRec = talle === rec?.talle;
  const zonas = esRec && rec ? rec.zonas : evaluarTalle(prenda.tabla, prenda.categoria, talle, m);
  const zonasTabla = Array.from(new Set(Object.values(prenda.tabla).flatMap((z) => Object.keys(z)))) as Zona[];
  const parecidas = visibles
    .filter((p) => p.id !== prenda.id && p.categoria === prenda.categoria && paraMi(p, m))
    .slice(0, 8);

  return (
    <div>
      {/* Imagen */}
      <div className="relative">
        <PrendaIlustracion prenda={prenda} className="aspect-[1/1] w-full" />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow"
          aria-label="Volver"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Corazon prendaId={prenda.id} className="absolute right-3 top-3 h-9 w-9" />
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold">{CALCE_PRENDA[prenda.calce]}</span>
          {prenda.destacada && (
            <span className="rounded-full bg-[var(--ink)] px-2.5 py-1 text-[11px] font-semibold text-white">Destacada</span>
          )}
        </div>
      </div>

      {/* Datos */}
      <div className="px-4 pt-4">
        <Link to={`/app/tiendas/${tienda?.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-bold text-white" style={{ background: tienda?.color }}>
            {tienda?.nombre[0]}
          </span>
          {tienda?.nombre}
          <ChevronRight className="h-3 w-3" />
        </Link>
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <h1 className="font-display text-[24px] font-bold leading-tight tracking-tight">{prenda.nombre}</h1>
          <p className="mt-0.5 shrink-0 font-display text-[22px] font-bold tabular">{money(prenda.precio)}</p>
        </div>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {prenda.colorNombre} · {prenda.material} · {nombreCategoria(prenda.categoria)}
        </p>
      </div>

      {/* Tu talle */}
      {rec && (
        <div className="mx-4 mt-5 overflow-hidden rounded-3xl bg-card ring-1 ring-border">
          <div className="flex items-center gap-4 p-4" style={{ background: "linear-gradient(120deg, var(--brand-50), transparent 80%)" }}>
            <span
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-display text-[28px] font-bold text-white shadow-[0_10px_24px_-10px_var(--brand)]"
              style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-700))" }}
            >
              {rec.talle}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-700)]">Tu talle en {tienda?.nombre}</p>
              <p className="font-display text-[21px] font-bold leading-tight">
                Tu talle: {rec.talle} · {rec.confianza} %
              </p>
              <p className="text-xs text-muted-foreground">de confianza, según tus medidas y su tabla</p>
            </div>
          </div>

          {/* Selector de talles */}
          <div className="border-t border-border px-4 pt-4">
            <p className="text-xs font-semibold text-muted-foreground">Mirá cómo te queda cada talle</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {prenda.talles.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSel(t)}
                  className={cn(
                    "relative h-11 min-w-12 rounded-xl border-2 px-3 text-sm font-bold transition-all",
                    t === talle ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-border bg-card hover:border-[var(--brand-300)]",
                    t === rec.talle && t !== talle && "border-[var(--brand)] text-[var(--brand)]"
                  )}
                >
                  {t}
                  {t === rec.talle && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--brand)] px-1.5 text-[9px] font-bold leading-4 text-white">
                      TU TALLE
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Zonas */}
          <div className="space-y-4 px-4 pb-4 pt-5">
            <p className="text-[13px]">
              {esRec ? "Cómo te queda el " : "Así te quedaría el "}
              <b>{talle}</b>: <span className="text-muted-foreground">{resumenZonas(zonas)}</span>
            </p>
            {zonas.map((z) => (
              <BarraZona key={z.zona} z={z} />
            ))}
            {rec.alternativa && esRec && (
              <button
                type="button"
                onClick={() => setSel(rec.alternativa!.talle)}
                className="flex w-full items-center gap-2 rounded-xl bg-[var(--surface)] px-3 py-2.5 text-left text-[13px]"
              >
                <Info className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                <span className="flex-1">
                  {rec.alternativa.motivo === "mas-suelto" ? "Si te gusta más suelto" : "Si lo preferís más ajustado"}, probá{" "}
                  <b>{rec.alternativa.talle}</b>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {!esRec && (
              <button type="button" onClick={() => setSel(null)} className="text-[13px] font-semibold text-[var(--brand)]">
                Volver a mi talle ({rec.talle})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Probador */}
      <Link
        to={`/app/probador?prenda=${prenda.id}&talle=${talle}`}
        className="mx-4 mt-3 flex items-center gap-3 rounded-2xl bg-[var(--ink)] p-4 text-white"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold">Probátela en el probador virtual</span>
          <span className="block text-xs text-white/70">
            {premium ? "Incluido en tu plan Premium" : restantes > 0 ? "Tenés 1 prueba gratis" : "Con Premium"}
          </span>
        </span>
        {!premium && restantes === 0 && <Crown className="h-4 w-4 text-amber-300" />}
        <ChevronRight className="h-4 w-4 text-white/60" />
      </Link>

      {/* Tabla de talles */}
      <div className="mx-4 mt-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Ruler className="h-4 w-4 text-[var(--brand)]" /> Tabla de talles de {tienda?.nombre}
        </h2>
        <p className="text-xs text-muted-foreground">Medidas del cuerpo, en cm, que entran en cada talle.</p>
        <div className="mt-3 overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <table className="w-full text-center text-[13px] tabular">
            <thead>
              <tr className="bg-[var(--surface)] text-[11px] text-muted-foreground">
                <th className="py-2 pl-3 text-left font-semibold">Talle</th>
                {zonasTabla.map((z) => (
                  <th key={z} className="py-2 font-semibold">
                    {z === "altura" ? "Altura" : NOMBRE_ZONA[z]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prenda.talles.map((t) => (
                <tr
                  key={t}
                  onClick={() => setSel(t)}
                  className={cn(
                    "cursor-pointer border-t border-border",
                    t === rec?.talle && "bg-[var(--brand-50)] font-semibold text-[var(--brand-700)]",
                    t === talle && t !== rec?.talle && "bg-black/[0.03]"
                  )}
                >
                  <td className="py-2 pl-3 text-left font-bold">{t}</td>
                  {zonasTabla.map((z) => {
                    const r = prenda.tabla[t]?.[z];
                    return (
                      <td key={z} className="py-2">
                        {r ? `${r[0]}–${r[1]}` : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-dashed border-border text-[12px] text-muted-foreground">
                <td className="py-2 pl-3 text-left font-semibold">Vos</td>
                {zonasTabla.map((z) => (
                  <td key={z} className="py-2 font-semibold text-foreground">
                    {m[z]}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <Link to="/app/medidas" className="mt-2 inline-block text-xs font-semibold text-[var(--brand)]">
          ¿Cambiaron tus medidas? Actualizalas
        </Link>
      </div>

      {parecidas.length > 0 && (
        <div className="mt-8 px-4">
          <h2 className="mb-3 font-display text-lg font-bold">También te pueden gustar</h2>
          <Carrusel>
            {parecidas.map((p) => (
              <PrendaCard key={p.id} prenda={p} className="w-[150px] shrink-0" />
            ))}
          </Carrusel>
        </div>
      )}

      {/* Acciones fijas */}
      <div className="sticky bottom-0 z-10 mt-8 flex gap-2 border-t border-border bg-background/95 px-4 pb-7 pt-3 backdrop-blur">
        <Button asChild variant="outline" className="h-12 flex-1 rounded-2xl border-2 text-sm font-bold">
          <Link to={`/app/probador?prenda=${prenda.id}&talle=${talle}`}>
            <Sparkles className="h-4 w-4" /> Probármela
          </Link>
        </Button>
        <Button className="h-12 flex-[1.4] rounded-2xl text-sm font-bold" onClick={() => setComprar(true)}>
          <ShoppingBag className="h-4 w-4" /> Comprar talle {talle}
        </Button>
      </div>

      <ComprarDialog prenda={prenda} talle={talle} open={comprar} onOpenChange={setComprar} />
    </div>
  );
}
