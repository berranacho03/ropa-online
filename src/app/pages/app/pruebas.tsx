import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Heart, ImageIcon, Sparkles, Users, Video } from "lucide-react";
import { Maniqui, personaPara } from "../../components/figura/maniqui";
import { AppHeader, GrillaPrendas, Segmentado, VacioApp } from "../../components/app/comun";
import { Button } from "../../components/ui/button";
import { useStore, useYo } from "../../lib/store";
import { HOY } from "../../data/seed";
import { relativo } from "../../lib/format";

const MODO = {
  ejemplo: { label: "Persona de ejemplo", icon: Users },
  foto: { label: "Con tu foto", icon: ImageIcon },
  vivo: { label: "En vivo", icon: Video },
};

export function MisPruebas() {
  const { pruebas, prendas, tiendas, favoritos } = useStore();
  const { usuario } = useYo();
  const [tab, setTab] = useState<"historial" | "armario">("historial");
  const [limite, setLimite] = useState(15);

  const mias = useMemo(
    () =>
      usuario
        ? pruebas
            .map((p, i) => ({ p, i }))
            .filter(({ p }) => p.usuarioId === usuario.id && p.ok)
            .sort((a, b) => b.p.fecha.localeCompare(a.p.fecha) || b.i - a.i)
            .map(({ p }) => p)
        : [],
    [pruebas, usuario]
  );
  if (!usuario?.medidas) return null;
  const favs = (favoritos[usuario.id] ?? []).map((id) => prendas.find((p) => p.id === id)).filter((p) => !!p);
  const yo = personaPara(usuario.medidas);

  return (
    <div className="pb-8">
      <AppHeader titulo="Mis pruebas" atras="/app/perfil" />
      <div className="px-4 pt-3">
        <Segmentado
          valor={tab}
          onChange={setTab}
          opciones={[
            { id: "historial", label: <><Sparkles className="h-4 w-4" /> Historial · {mias.length}</> },
            { id: "armario", label: <><Heart className="h-4 w-4" /> Mi armario · {favs.length}</> },
          ]}
        />
      </div>

      {tab === "historial" ? (
        mias.length === 0 ? (
          <VacioApp
            icono={Sparkles}
            titulo="Todavía no te probaste nada"
            texto="Abrí una prenda y tocá «Probármela» para ver cómo te queda."
            accion={
              <Button asChild className="rounded-xl">
                <Link to="/app/probador">Ir al probador</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-2.5 px-4 pt-4">
            {mias.slice(0, limite).map((x) => {
              const p = prendas.find((y) => y.id === x.prendaId);
              if (!p) return null;
              const t = tiendas.find((y) => y.id === p.tiendaId);
              const M = MODO[x.modo];
              return (
                <Link
                  key={x.id}
                  to={`/app/probador?prenda=${p.id}&talle=${x.talle}`}
                  className="flex items-center gap-3 rounded-2xl bg-card p-2.5 ring-1 ring-border transition-colors hover:bg-black/[0.01]"
                >
                  <div className="h-[88px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-[var(--brand-50)] to-[var(--surface)]">
                    <Maniqui persona={yo} puestas={[{ prenda: p, talle: x.talle }]} sombraPiso={false} className="scale-[1.25] origin-top translate-y-[-2px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">{t?.nombre} · talle {x.talle}</p>
                    <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--ink-700)]">
                      <M.icon className="h-3 w-3" /> {M.label}
                      {x.cortesia && " · cortesía"}
                    </p>
                  </div>
                  <span className="shrink-0 self-start text-[11px] text-muted-foreground">{relativo(x.fecha, HOY)}</span>
                </Link>
              );
            })}
            {mias.length > limite && (
              <Button variant="outline" className="h-11 w-full rounded-2xl" onClick={() => setLimite(limite + 15)}>
                Ver más pruebas
              </Button>
            )}
          </div>
        )
      ) : favs.length === 0 ? (
        <VacioApp
          icono={Heart}
          titulo="Tu armario está vacío"
          texto="Tocá el corazón de una prenda para guardarla acá."
          accion={
            <Button asChild className="rounded-xl">
              <Link to="/app/explorar">Explorar prendas</Link>
            </Button>
          }
        />
      ) : (
        <div className="px-4 pt-4">
          <GrillaPrendas prendas={favs} />
        </div>
      )}
    </div>
  );
}
