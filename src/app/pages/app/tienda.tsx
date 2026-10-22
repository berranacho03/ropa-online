import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronLeft, ExternalLink, MapPin, Store } from "lucide-react";
import { Carrusel, GrillaPrendas, VacioApp, paraMi, recDe, tieneMiTalle } from "../../components/app/comun";
import { useStore, usePrendasVisibles, useYo } from "../../lib/store";
import { CATEGORIAS, type Categoria } from "../../lib/talles";
import { fechaLarga } from "../../lib/format";
import { esClaro } from "../../components/figura/cuerpo";
import { cn } from "../../components/ui/utils";

export function AppTienda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tiendas } = useStore();
  const { usuario } = useYo();
  const visibles = usePrendasVisibles();
  const [cat, setCat] = useState<Categoria | "">("");
  const tienda = tiendas.find((t) => t.id === id);
  const m = usuario?.medidas;

  const prendas = useMemo(() => visibles.filter((p) => p.tiendaId === id), [visibles, id]);
  const mias = prendas.filter((p) => paraMi(p, m));
  const conMiTalle = mias.filter((p) => tieneMiTalle(p, recDe(p, m))).length;
  const cats = CATEGORIAS.filter((c) => prendas.some((p) => p.categoria === c.id));
  const lista = (cat ? prendas.filter((p) => p.categoria === cat) : prendas).sort(
    (a, b) => Number(paraMi(b, m)) - Number(paraMi(a, m))
  );

  if (!tienda) {
    return <VacioApp icono={Store} titulo="No encontramos la tienda" />;
  }
  const claro = esClaro(tienda.color);
  const sesgo =
    tienda.sesgoTalle >= 2 ? "Talla grande: su M es más amplio que el promedio" : tienda.sesgoTalle <= -2 ? "Talla chica: su M es más justo que el promedio" : "Talla estándar";

  return (
    <div className="pb-8">
      <div
        className="relative h-44 overflow-hidden"
        style={{ background: `linear-gradient(140deg, ${tienda.color} 0%, color-mix(in srgb, ${tienda.color} 60%, white) 110%)` }}
      >
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(${claro ? "#000" : "#fff"} 1.5px, transparent 1.5px)`,
            backgroundSize: "16px 16px",
          }}
        />
        <span
          className={cn("absolute -bottom-6 -right-2 whitespace-nowrap font-display text-[110px] font-bold leading-none opacity-15", claro ? "text-black" : "text-white")}
        >
          {tienda.nombre}
        </span>
        <button
          onClick={() => navigate(-1)}
          className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow"
          aria-label="Volver"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="relative px-4">
        <span
          className="-mt-9 grid h-[72px] w-[72px] place-items-center rounded-2xl bg-white font-display text-3xl font-bold shadow-lg ring-4 ring-background"
          style={{ color: tienda.color }}
        >
          {tienda.nombre[0]}
        </span>
        <h1 className="mt-3 font-display text-[26px] font-bold leading-tight tracking-tight">{tienda.nombre}</h1>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {tienda.ciudad} · En la app desde el {fechaLarga(tienda.fechaAlta)}
        </p>
        <p className="mt-3 text-sm text-[var(--ink-700)]">{tienda.descripcion}</p>

        <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-2xl bg-card py-3 text-center ring-1 ring-border">
          <div>
            <p className="font-display text-xl font-bold">{prendas.length}</p>
            <p className="text-[11px] text-muted-foreground">prendas</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-[var(--brand)]">{conMiTalle}</p>
            <p className="text-[11px] text-muted-foreground">con tu talle</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold">{cats.length}</p>
            <p className="text-[11px] text-muted-foreground">categorías</p>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-[var(--brand-50)] px-3 py-2 text-xs text-[var(--brand-700)]">
          <b>Cómo talla:</b> {sesgo}. Ya lo tenemos en cuenta en tu recomendación.
        </p>
        <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <ExternalLink className="h-3 w-3" /> {tienda.web}
        </p>
      </div>

      {cats.length > 1 && (
        <div className="mt-5 px-4">
          <Carrusel>
            {[{ id: "" as const, plural: "Todo" }, ...cats].map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold",
                  cat === c.id ? "bg-[var(--ink)] text-white" : "bg-card ring-1 ring-border"
                )}
              >
                {c.plural}
              </button>
            ))}
          </Carrusel>
        </div>
      )}

      <div className="mt-4 px-4">
        {lista.length === 0 ? (
          <VacioApp icono={Store} titulo="Todavía no hay prendas" texto="Esta tienda está cargando su catálogo." />
        ) : (
          <GrillaPrendas prendas={lista} />
        )}
      </div>
    </div>
  );
}
