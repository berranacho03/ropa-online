import { useEffect, useState } from "react";
import { Check, ExternalLink, MapPin, Save, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { PageBody, PageHeader, Panel } from "../../components/shell";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import { esClaro } from "../../components/figura/cuerpo";
import { ConTienda, useDatosTienda } from "../../components/tienda/comun";
import { useStore } from "../../lib/store";
import type { Tienda } from "../../data/tiendas";
import { fechaLarga, money, num } from "../../lib/format";
import { cn } from "../../components/ui/utils";

export function TiendaPerfil() {
  return <ConTienda titulo="Perfil de tienda">{(t) => <Perfil tienda={t} />}</ConTienda>;
}

const PALETA = [
  "#1d1b22", "#334155", "#7a8a99", "#a8a29e", "#92400e", "#b45309", "#ca8a04", "#65a30d",
  "#15803d", "#0f766e", "#0891b2", "#0369a1", "#1e3a8a", "#4338ca", "#6d28d9", "#86198f",
  "#be185d", "#b91c1c", "#c2410c", "#57534e",
];

type Campos = Pick<Tienda, "nombre" | "descripcion" | "ciudad" | "web" | "contacto" | "color">;

const tomar = (t: Tienda): Campos => ({
  nombre: t.nombre,
  descripcion: t.descripcion,
  ciudad: t.ciudad,
  web: t.web,
  contacto: t.contacto,
  color: t.color,
});

function Perfil({ tienda }: { tienda: Tienda }) {
  const { actualizarTienda } = useStore();
  const { prendas } = useDatosTienda(tienda.id);
  const [f, setF] = useState<Campos>(() => tomar(tienda));
  useEffect(() => setF(tomar(tienda)), [tienda.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiado = JSON.stringify(f) !== JSON.stringify(tomar(tienda));
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.contacto);
  const valido = f.nombre.trim().length >= 2 && f.ciudad.trim() && emailOk && /^#[0-9a-f]{6}$/i.test(f.color);

  const set = (k: keyof Campos) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const guardar = () => {
    actualizarTienda(tienda.id, {
      ...f,
      nombre: f.nombre.trim(),
      descripcion: f.descripcion.trim(),
      ciudad: f.ciudad.trim(),
      web: f.web.trim().replace(/^https?:\/\//, ""),
      contacto: f.contacto.trim(),
    });
    toast.success("Perfil guardado", { description: "Los usuarios ya ven los cambios en la app." });
  };

  const claro = esClaro(f.color);
  const publicadas = prendas.filter((p) => p.estado === "publicada");
  const muestra = publicadas.slice(0, 4);

  return (
    <>
      <PageHeader
        titulo="Perfil de tienda"
        bajada="Lo que ven los usuarios cuando entran a tu tienda en la app."
        acciones={
          <>
            <Button variant="ghost" disabled={!cambiado} onClick={() => setF(tomar(tienda))}>
              <Undo2 className="mr-2 h-4 w-4" /> Descartar
            </Button>
            <Button disabled={!cambiado || !valido} onClick={guardar}>
              <Save className="mr-2 h-4 w-4" /> Guardar cambios
            </Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <Panel titulo="Datos de la tienda">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" value={f.nombre} onChange={set("nombre")} maxLength={40} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="desc">Descripción</Label>
                  <Textarea id="desc" value={f.descripcion} onChange={set("descripcion")} maxLength={160} rows={3} />
                  <p className="text-right text-xs text-muted-foreground">{f.descripcion.length}/160</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input id="ciudad" value={f.ciudad} onChange={set("ciudad")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="web">Web</Label>
                  <Input id="web" value={f.web} onChange={set("web")} placeholder="tutienda.com.uy" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="contacto">Email de contacto</Label>
                  <Input id="contacto" type="email" value={f.contacto} onChange={set("contacto")} className={cn(!emailOk && "border-red-400")} />
                  {!emailOk && <p className="text-xs text-red-600">Revisá el email.</p>}
                </div>
              </div>
            </Panel>

            <Panel titulo="Color de la tienda" bajada="Se usa en la portada y el logo de tu tienda dentro de la app">
              <div className="flex flex-wrap gap-2">
                {PALETA.map((c) => (
                  <button
                    key={c}
                    onClick={() => setF({ ...f, color: c })}
                    aria-label={`Color ${c}`}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-full ring-offset-2 transition-transform hover:scale-110",
                      f.color.toLowerCase() === c && "ring-2 ring-[var(--brand)]"
                    )}
                    style={{ background: c }}
                  >
                    {f.color.toLowerCase() === c && <Check className={cn("h-4 w-4", esClaro(c) ? "text-black" : "text-white")} />}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <label className="relative h-9 w-9 cursor-pointer overflow-hidden rounded-full border border-border" style={{ background: f.color }}>
                  <input type="color" value={f.color} onChange={set("color")} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Elegir otro color" />
                </label>
                <Input value={f.color} onChange={set("color")} className="w-28 font-mono uppercase" maxLength={7} />
                <span className="text-sm text-muted-foreground">u otro color a mano</span>
              </div>
            </Panel>
          </div>

          {/* Vista previa en la app */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Así te ven en la app</p>
            <div className="overflow-hidden rounded-[2rem] border-[6px] border-[#1d1b22] bg-background shadow-xl">
              <div
                className="relative h-32 overflow-hidden"
                style={{ background: `linear-gradient(140deg, ${f.color} 0%, color-mix(in srgb, ${f.color} 60%, white) 110%)` }}
              >
                <div
                  className="absolute inset-0 opacity-[0.12]"
                  style={{ backgroundImage: `radial-gradient(${claro ? "#000" : "#fff"} 1.5px, transparent 1.5px)`, backgroundSize: "16px 16px" }}
                />
                <span className={cn("absolute -bottom-5 -right-2 whitespace-nowrap font-display text-[80px] font-bold leading-none opacity-15", claro ? "text-black" : "text-white")}>
                  {f.nombre}
                </span>
              </div>
              <div className="relative px-4 pb-5">
                <span
                  className="-mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-white font-display text-2xl font-bold shadow-lg ring-4 ring-background"
                  style={{ color: f.color }}
                >
                  {f.nombre.trim()[0] ?? "?"}
                </span>
                <p className="mt-2 font-display text-xl font-bold leading-tight">{f.nombre || "Tu tienda"}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {f.ciudad || "Ciudad"} · En la app desde el {fechaLarga(tienda.fechaAlta)}
                </p>
                <p className="mt-2 text-xs text-foreground/80">{f.descripcion || "Contale a los usuarios qué vendés."}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                  <ExternalLink className="h-3 w-3" /> {f.web || "tu web"}
                </p>
                {muestra.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {muestra.map((p) => (
                      <div key={p.id}>
                        <PrendaIlustracion prenda={p} className="aspect-[4/5] rounded-xl" />
                        <p className="mt-1 truncate text-[11px] font-medium">{p.nombre}</p>
                        <p className="text-[11px] text-muted-foreground">{money(p.precio)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-muted px-3 py-4 text-center text-xs text-muted-foreground">
                    Tus prendas aparecen acá cuando las publiques.
                  </p>
                )}
                {publicadas.length > 4 && (
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">y {num(publicadas.length - 4)} prendas más</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
