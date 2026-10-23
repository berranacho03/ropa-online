import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Camera, Check, ChevronLeft, Lock, Ruler, ShieldCheck, Sparkles } from "lucide-react";
import { Isotipo } from "../../components/logo";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Maniqui, personaPara } from "../../components/figura/maniqui";
import { CampoMedida, Segmentado, recDe, tieneMiTalle } from "../../components/app/comun";
import { GuiaMedidas, ElegirCalce } from "../../components/app/medidas";
import { useStore, usePrendasVisibles, useYo } from "../../lib/store";
import { estimarMedidas, type Contextura, type Genero, type Medidas, type PreferenciaCalce } from "../../lib/talles";
import { cn } from "../../components/ui/utils";

const PASOS = ["Tus datos", "Tus medidas", "Privacidad", "Listo"];

const BASE: Record<Genero, Omit<Medidas, "genero" | "preferencia">> = {
  mujer: { altura: 163, peso: 57, pecho: 86, cintura: 68, cadera: 95 },
  hombre: { altura: 176, peso: 72, pecho: 96, cintura: 82, cadera: 97 },
};

export function Bienvenida() {
  const navigate = useNavigate();
  const { actualizarPerfil, tiendas } = useStore();
  const { usuario } = useYo();
  const prendas = usePrendasVisibles();

  const [paso, setPaso] = useState(0);
  const [nombre, setNombre] = useState(usuario?.nombre === "Usuario nuevo" ? "" : usuario?.nombre ?? "");
  const [edad, setEdad] = useState(usuario?.edad ?? 18);
  const [genero, setGenero] = useState<Genero | null>(null);

  const [modo, setModo] = useState<"medi" | "estimar">("medi");
  const [m, setM] = useState(BASE.mujer);
  const [contextura, setContextura] = useState<Contextura>("media");
  const [preferencia, setPreferencia] = useState<PreferenciaCalce>("regular");

  const [okMedidas, setOkMedidas] = useState(false);
  const [okFoto, setOkFoto] = useState(false);
  const [verPolitica, setVerPolitica] = useState(false);

  const estimadas = useMemo(
    () => estimarMedidas(m.altura, m.peso, genero ?? "mujer", contextura),
    [m.altura, m.peso, genero, contextura]
  );

  const medidas: Medidas = {
    ...m,
    ...(modo === "estimar" ? estimadas : {}),
    genero: genero ?? "mujer",
    preferencia,
  };

  const elegirGenero = (g: Genero) => {
    setGenero(g);
    setM(BASE[g]);
  };

  const puedeSeguir = paso === 0 ? nombre.trim().length >= 2 && !!genero : paso === 2 ? okMedidas : true;

  function terminar() {
    if (!usuario) return;
    actualizarPerfil(usuario.id, {
      nombre: nombre.trim(),
      edad,
      medidas,
      medidasMedidas: modo === "medi",
      consentimiento: true,
      conFoto: false,
    });
    navigate("/app", { replace: true });
  }

  // Para el paso final: una prenda destacada con su talle calculado.
  const muestra = useMemo(() => {
    const cand = prendas.filter((p) => p.destacada && !["vestido", "pollera"].includes(p.categoria) && (p.genero === "unisex" || p.genero === medidas.genero));
    return cand.find((p) => p.categoria === "remera") ?? cand[0];
  }, [prendas, medidas.genero]);
  const recMuestra = muestra ? recDe(muestra, medidas) : null;
  const tiendaMuestra = tiendas.find((t) => t.id === muestra?.tiendaId);
  const enTuTalle = paso === 3 ? prendas.filter((p) => (p.genero === "unisex" || p.genero === medidas.genero) && tieneMiTalle(p, recDe(p, medidas))).length : 0;

  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* Progreso */}
      <div className="sticky top-0 z-10 bg-background/90 px-5 pb-3 pt-4 backdrop-blur">
        <div className="flex h-9 items-center justify-between">
          {paso > 0 && paso < 3 ? (
            <button onClick={() => setPaso(paso - 1)} className="-ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-black/5" aria-label="Volver">
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <Isotipo size={28} />
          )}
          <span className="text-xs font-semibold text-muted-foreground">
            {paso < 3 ? `Paso ${paso + 1} de 3 · ${PASOS[paso]}` : "¡Todo listo!"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {PASOS.map((p, i) => (
            <div key={p} className="h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
              <div
                className="h-full rounded-full bg-[var(--brand)] transition-all duration-500"
                style={{ width: i < paso ? "100%" : i === paso ? "55%" : "0%" }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pb-6">
        {paso === 0 && (
          <div className="pt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-50)] px-3 py-1 text-xs font-semibold text-[var(--brand-700)]">
              <Sparkles className="h-3.5 w-3.5" /> Te lleva 1 minuto
            </span>
            <h1 className="mt-3 font-display text-[28px] font-bold leading-[1.1] tracking-tight">
              Armemos tu perfil de talles
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Con tus medidas te decimos qué talle comprar en cada tienda. Se acabó pedir un M y que te llegue un M de otro planeta.
            </p>

            <label className="mt-7 block text-[13px] font-semibold">¿Cómo te llamás?</label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              className="mt-2 h-12 rounded-xl bg-card text-base"
              autoFocus
            />

            <div className="mt-5">
              <CampoMedida label="Edad" valor={edad} onChange={setEdad} min={13} max={45} unidad="años" />
            </div>

            <p className="mt-5 text-[13px] font-semibold">¿Qué tablas de talles usamos?</p>
            <p className="text-[11px] text-muted-foreground">Define el molde de referencia y qué prendas te mostramos primero.</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(["mujer", "hombre"] as Genero[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => elegirGenero(g)}
                  className={cn(
                    "relative flex flex-col items-center rounded-2xl border-2 bg-card px-3 pb-3 pt-2 transition-all",
                    genero === g ? "border-[var(--brand)] shadow-[0_8px_24px_-12px_var(--brand)]" : "border-transparent ring-1 ring-border"
                  )}
                >
                  <div className="h-28 w-14">
                    <Maniqui persona={personaPara({ ...BASE[g], genero: g, preferencia: "regular" })} puestas={[]} sombraPiso={false} />
                  </div>
                  <span className="mt-1 text-sm font-semibold">{g === "mujer" ? "Talles de mujer" : "Talles de hombre"}</span>
                  {genero === g && (
                    <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[var(--brand)] text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {paso === 1 && (
          <div className="pt-4">
            <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight">Tus medidas</h1>
            <p className="mt-1 text-sm text-muted-foreground">Con una cinta de costura y un espejo alcanza.</p>

            <Segmentado
              className="mt-4"
              valor={modo}
              onChange={setModo}
              opciones={[
                { id: "medi", label: <><Ruler className="h-4 w-4" /> Me medí</> },
                { id: "estimar", label: "No sé mis medidas" },
              ]}
            />

            {modo === "medi" ? (
              <div className="mt-4 space-y-3">
                <GuiaMedidas medidas={medidas} />
                <CampoMedida label="Altura" valor={m.altura} onChange={(v) => setM({ ...m, altura: v })} min={140} max={205} />
                <CampoMedida label="Peso" valor={m.peso} onChange={(v) => setM({ ...m, peso: v })} min={38} max={140} unidad="kg" />
                <CampoMedida label="Pecho" ayuda="Por la parte más ancha, bajo las axilas" valor={m.pecho} onChange={(v) => setM({ ...m, pecho: v })} min={70} max={135} />
                <CampoMedida label="Cintura" ayuda="Por la parte más angosta, sobre el ombligo" valor={m.cintura} onChange={(v) => setM({ ...m, cintura: v })} min={54} max={130} />
                <CampoMedida label="Cadera" ayuda="Por la parte más ancha de la cola" valor={m.cadera} onChange={(v) => setM({ ...m, cadera: v })} min={75} max={140} />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="rounded-2xl bg-[var(--brand-50)] px-4 py-3 text-[13px] text-[var(--brand-700)]">
                  Las estimamos con tu altura, peso y contextura. Es menos preciso: cuando puedas, medite y actualizalas en tu perfil.
                </p>
                <CampoMedida label="Altura" valor={m.altura} onChange={(v) => setM({ ...m, altura: v })} min={140} max={205} />
                <CampoMedida label="Peso" valor={m.peso} onChange={(v) => setM({ ...m, peso: v })} min={38} max={140} unidad="kg" />
                <div className="rounded-2xl bg-card p-3.5 ring-1 ring-border">
                  <p className="text-[13px] font-semibold">Contextura</p>
                  <Segmentado
                    className="mt-2"
                    valor={contextura}
                    onChange={setContextura}
                    opciones={[
                      { id: "delgada", label: "Delgada" },
                      { id: "media", label: "Media" },
                      { id: "robusta", label: "Robusta" },
                    ]}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["pecho", "cintura", "cadera"] as const).map((z) => (
                    <div key={z} className="rounded-2xl bg-card p-3 text-center ring-1 ring-border">
                      <p className="text-[11px] capitalize text-muted-foreground">{z}</p>
                      <p className="font-display text-xl font-bold tabular">
                        ≈{estimadas[z]}
                        <span className="text-xs font-medium text-muted-foreground"> cm</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="mb-2 mt-6 text-[13px] font-semibold">¿Cómo te gusta que te quede la ropa?</p>
            <ElegirCalce valor={preferencia} onChange={setPreferencia} />
          </div>
        )}

        {paso === 2 && (
          <div className="pt-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand-50)] text-[var(--brand)]">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h1 className="mt-4 font-display text-[26px] font-bold leading-tight tracking-tight">Tus datos son tuyos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Antes de seguir, necesitamos tu permiso. Podés cambiarlo o borrar todo cuando quieras desde Privacidad.
            </p>

            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
                <Ruler className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">Usar mis medidas para recomendarme talles</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Necesario para usar la app. No se comparten con las tiendas: ellas sólo ven el talle que compraste.
                  </span>
                </span>
                <Switch checked={okMedidas} onCheckedChange={setOkMedidas} />
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
                <Camera className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">Usar mi foto en el probador virtual</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Opcional. La foto queda guardada sólo en tu teléfono y la podés borrar en cualquier momento.
                  </span>
                </span>
                <Switch checked={okFoto} onCheckedChange={setOkFoto} />
              </label>
            </div>

            <button type="button" onClick={() => setVerPolitica(true)} className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[var(--brand)]">
              <Lock className="h-4 w-4" /> Leer cómo cuidamos tus datos
            </button>
          </div>
        )}

        {paso === 3 && (
          <div className="pt-2 text-center">
            <div className="relative mx-auto mt-2 h-[300px] w-[150px]">
              <div className="absolute inset-x-[-50px] bottom-3 top-10 rounded-full bg-[var(--brand-100)] blur-2xl" />
              <div className="relative h-full">
                <Maniqui persona={personaPara(medidas)} puestas={muestra ? [{ prenda: muestra, talle: recMuestra?.talle }] : []} />
              </div>
            </div>
            <h1 className="mt-2 font-display text-[28px] font-bold leading-tight tracking-tight">
              ¡Listo, {nombre.trim().split(" ")[0]}!
            </h1>
            <p className="mx-auto mt-1 max-w-[300px] text-sm text-muted-foreground">
              Ya calculamos tu talle en todas las tiendas. Hay <b className="text-foreground">{enTuTalle} prendas</b> con tu talle esperándote.
            </p>
            {muestra && recMuestra && (
              <div className="mx-auto mt-5 max-w-[300px] rounded-2xl bg-card p-4 text-left ring-1 ring-border">
                <p className="text-xs text-muted-foreground">
                  {muestra.nombre} · {tiendaMuestra?.nombre}
                </p>
                <p className="mt-1 font-display text-lg font-bold">
                  Tu talle: <span className="text-[var(--brand)]">{recMuestra.talle}</span>
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">· {recMuestra.confianza} % de confianza</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/90 px-5 pb-5 pt-3 backdrop-blur">
        {paso < 3 ? (
          <Button
            className="h-12 w-full rounded-2xl text-base font-semibold"
            disabled={!puedeSeguir}
            onClick={() => setPaso(paso + 1)}
          >
            {paso === 2 ? "Acepto y sigo" : "Continuar"} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="h-12 w-full rounded-2xl text-base font-semibold" onClick={terminar}>
            Ver prendas en mi talle <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {paso === 2 && !okMedidas && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Activá el uso de medidas para continuar.</p>
        )}
      </div>

      <Dialog open={verPolitica} onOpenChange={setVerPolitica}>
        <DialogContent className="max-w-[min(360px,calc(100%-2rem))] rounded-3xl sm:max-w-[360px]">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display">Cómo cuidamos tus datos</DialogTitle>
            <DialogDescription>Resumen de la política de privacidad.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2.5 text-sm">
            {[
              "Guardamos tus medidas y tu calce preferido para calcular tu talle. Nada más.",
              "Tu foto nunca sale de tu teléfono: el probador corre en el navegador.",
              "Las tiendas no ven tus medidas, sólo el talle que compraste.",
              "Podés descargar tus datos o pedir que borremos tu cuenta desde Perfil → Privacidad.",
              "No vendemos datos ni los usamos para publicidad de terceros.",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ok)]" />
                {t}
              </li>
            ))}
          </ul>
          <Button className="rounded-xl" onClick={() => setVerPolitica(false)}>
            Entendido
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
