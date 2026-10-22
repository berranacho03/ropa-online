import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, RotateCcw, Wand2 } from "lucide-react";
import { AppHeader, CampoMedida, recDe, Segmentado } from "../../components/app/comun";
import { ElegirCalce, GuiaMedidas } from "../../components/app/medidas";
import { Maniqui, personaPara } from "../../components/figura/maniqui";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
import { useStore, usePrendasVisibles, useYo } from "../../lib/store";
import { estimarMedidas, type Categoria, type Contextura, type Medidas } from "../../lib/talles";
import { cn } from "../../components/ui/utils";

const EJEMPLOS: Categoria[][] = [["remera", "buzo"], ["jean", "pantalon"], ["campera", "camisa"]];

export function MisMedidas() {
  const { usuario } = useYo();
  const { actualizarPerfil, tiendas } = useStore();
  const prendas = usePrendasVisibles();
  const guardadas = usuario?.medidas;
  const [m, setM] = useState<Medidas | null>(guardadas ?? null);
  const [conCinta, setConCinta] = useState(usuario?.medidasMedidas ?? true);
  const [contextura, setContextura] = useState<Contextura>("media");
  const [verGuia, setVerGuia] = useState(false);

  useEffect(() => {
    if (!m && guardadas) setM(guardadas);
  }, [guardadas, m]);

  const ejemplos = useMemo(() => {
    if (!guardadas) return [];
    const ok = prendas.filter((p) => p.genero === "unisex" || p.genero === guardadas.genero);
    return EJEMPLOS.map((cats) => ok.find((p) => p.destacada && cats.includes(p.categoria)) ?? ok.find((p) => cats.includes(p.categoria))).filter(
      (p) => !!p
    );
  }, [prendas, guardadas]);

  if (!usuario || !guardadas || !m) return null;

  const cambio =
    JSON.stringify(m) !== JSON.stringify(guardadas) || conCinta !== usuario.medidasMedidas;
  const set = (k: keyof Medidas) => (v: number) => setM({ ...m, [k]: v });

  function estimar() {
    if (!m) return;
    setM({ ...m, ...estimarMedidas(m.altura, m.peso, m.genero, contextura) });
    setConCinta(false);
    toast("Estimamos pecho, cintura y cadera", { description: "A partir de tu altura, peso y contextura." });
  }

  function guardar() {
    if (!usuario || !m) return;
    actualizarPerfil(usuario.id, { medidas: m, medidasMedidas: conCinta });
    toast.success("Guardamos tus medidas", { description: "Todas las recomendaciones ya se actualizaron." });
  }

  const remera = ejemplos[0];

  return (
    <div>
      <AppHeader titulo="Mis medidas" atras="/app/perfil" bajada="Mové las medidas y mirá cómo cambia tu talle en vivo." />

      {/* Vista previa en vivo */}
      <div className="mx-4 mt-4 overflow-hidden rounded-3xl bg-card ring-1 ring-border">
        <div className="flex">
          <div className="relative w-[118px] shrink-0 bg-gradient-to-b from-[var(--brand-50)] to-[var(--surface)]">
            <div className="h-[250px] w-full">
              <Maniqui persona={personaPara(m)} puestas={remera ? [{ prenda: remera, talle: recDe(remera, m)?.talle }] : []} />
            </div>
          </div>
          <div className="min-w-0 flex-1 divide-y divide-border">
            <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tu talle en…</p>
            {ejemplos.map((p) => {
              const antes = recDe(p, guardadas);
              const ahora = recDe(p, m);
              const t = tiendas.find((x) => x.id === p.tiendaId);
              const distinto = antes?.talle !== ahora?.talle;
              return (
                <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                  <PrendaIlustracion prenda={p} className="h-11 w-9 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{p.nombre}</p>
                    <p className="truncate text-[10.5px] text-muted-foreground">{t?.nombre}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="flex items-center justify-end gap-1 font-display text-base font-bold">
                      {distinto && (
                        <>
                          <span className="text-xs text-muted-foreground line-through">{antes?.talle}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </>
                      )}
                      <span className={cn(distinto && "text-[var(--brand)]")}>{ahora?.talle}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground tabular">{ahora?.confianza} %</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Cuerpo</h2>
          <button type="button" onClick={() => setVerGuia(!verGuia)} className="text-xs font-semibold text-[var(--brand)]">
            {verGuia ? "Ocultar guía" : "¿Cómo me mido?"}
          </button>
        </div>
        {verGuia && <GuiaMedidas medidas={m} />}
        <CampoMedida label="Altura" valor={m.altura} onChange={set("altura")} min={140} max={205} />
        <CampoMedida label="Peso" valor={m.peso} onChange={set("peso")} min={38} max={140} unidad="kg" />
        <CampoMedida label="Pecho" valor={m.pecho} onChange={set("pecho")} min={70} max={135} />
        <CampoMedida label="Cintura" valor={m.cintura} onChange={set("cintura")} min={54} max={130} />
        <CampoMedida label="Cadera" valor={m.cadera} onChange={set("cadera")} min={75} max={140} />

        <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border">
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-[13px] font-semibold">Las tomé con cinta</span>
              <span className="block text-[11px] text-muted-foreground">Si las estimamos, la confianza es más baja.</span>
            </span>
            <Switch checked={conCinta} onCheckedChange={setConCinta} />
          </label>
          {!conCinta && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-[11px] text-muted-foreground">Estimar pecho, cintura y cadera por contextura:</p>
              <div className="mt-2 flex gap-2">
                <Segmentado
                  className="flex-1"
                  valor={contextura}
                  onChange={setContextura}
                  opciones={[
                    { id: "delgada", label: "Delgada" },
                    { id: "media", label: "Media" },
                    { id: "robusta", label: "Robusta" },
                  ]}
                />
                <Button variant="outline" className="h-auto rounded-xl" onClick={estimar} aria-label="Estimar">
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <h2 className="pt-3 font-display text-lg font-bold">Calce preferido</h2>
        <ElegirCalce valor={m.preferencia} onChange={(p) => setM({ ...m, preferencia: p })} />
      </div>

      <div className="sticky bottom-0 z-10 mt-6 flex gap-2 border-t border-border bg-background/95 px-4 pb-7 pt-3 backdrop-blur">
        <Button variant="outline" className="h-12 rounded-2xl" disabled={!cambio} onClick={() => { setM(guardadas); setConCinta(usuario.medidasMedidas); }}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button className="h-12 flex-1 rounded-2xl text-base font-bold" disabled={!cambio} onClick={guardar}>
          {cambio ? "Guardar medidas" : "Medidas guardadas"}
        </Button>
      </div>
    </div>
  );
}
