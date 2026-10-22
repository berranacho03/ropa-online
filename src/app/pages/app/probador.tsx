import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  Camera,
  Check,
  Columns2,
  Crown,
  ImagePlus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Upload,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { Maniqui, PERSONAS, personaPara, type Persona } from "../../components/figura/maniqui";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import {
  AppHeader,
  Carrusel,
  Corazon,
  Segmentado,
  capitalizar,
  paraMi,
  recDe,
  resumenZonas,
  useCortesia,
  useFavoritos,
} from "../../components/app/comun";
import { ComprarDialog } from "../../components/app/comprar";
import { Superpuesta, type AjusteFino } from "../../components/app/superpuesta";
import { aPantalla, ajustePara, cargarDetector, suavizar, transformDe, type Ajuste, type Detector } from "../../components/app/pose";
import { cuerpoDe } from "../../components/figura/cuerpo";
import { DibujoPrenda } from "../../components/figura/prendas-svg";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { useStore, usePrendasVisibles, useYo } from "../../lib/store";
import { ES_INFERIOR, evaluarTalle, holgura, recomendar, type Medidas } from "../../lib/talles";
import { money } from "../../lib/format";
import type { Prenda } from "../../data/prendas";
import { cn } from "../../components/ui/utils";

type Modo = "ejemplo" | "foto" | "vivo";
type Fase = "elegir" | "procesando" | "resultado";

const PASOS = [
  "Detectando la pose y los hombros",
  "Ajustando la prenda a tu talle",
  "Calculando la caída de la tela",
  "Iluminando y dando los últimos retoques",
];

export function Probador() {
  const [params, setParams] = useSearchParams();
  const { prendas, tiendas, fotos, registrarPrueba, setFoto, actualizarPerfil } = useStore();
  const { usuario } = useYo();
  const { premium, restantes, puedeProbar } = useCortesia();
  const m = usuario?.medidas;

  const prenda = prendas.find((p) => p.id === params.get("prenda"));
  const rec = prenda && m ? recDe(prenda, m) : null;
  const talleParam = params.get("talle");
  const talle = prenda && talleParam && prenda.talles.includes(talleParam) ? talleParam : rec?.talle ?? prenda?.talles[0] ?? "M";
  const setTalle = (t: string) => {
    const n = new URLSearchParams(params);
    n.set("talle", t);
    setParams(n, { replace: true });
  };

  const [modo, setModo] = useState<Modo>("ejemplo");
  const [fase, setFase] = useState<Fase>("elegir");
  const [personaId, setPersonaId] = useState<string>("yo");
  const [duracion, setDuracion] = useState(5600);
  const [comprar, setComprar] = useState(false);
  const foto = usuario ? fotos[usuario.id] : undefined;

  // Al cambiar de prenda o de modo, se vuelve a empezar.
  useEffect(() => setFase("elegir"), [prenda?.id, modo]);

  if (!usuario || !m) return null;

  const personas: Persona[] = [personaPara(m, "yo"), ...PERSONAS];
  const persona = personas.find((p) => p.id === personaId) ?? personas[0];
  const tienda = tiendas.find((t) => t.id === prenda?.tiendaId);

  function empezar() {
    if (!puedeProbar) return;
    setDuracion(Math.round(4800 + Math.random() * 1600));
    setFase("procesando");
  }

  function terminar(modoPrueba: Modo, latencia: number) {
    if (!usuario || !prenda) return;
    registrarPrueba({
      usuarioId: usuario.id,
      prendaId: prenda.id,
      talle,
      latenciaMs: latencia,
      cortesia: !premium,
      modo: modoPrueba,
    });
    if (!premium) toast("Usaste tu prueba de cortesía", { description: "Para seguir probándote ropa, pasate a Premium." });
  }

  return (
    <div className="pb-8">
      <AppHeader
        titulo="Probador virtual"
        acciones={
          premium ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
              <Crown className="h-3 w-3" /> Premium
            </span>
          ) : (
            <span className="rounded-full bg-[var(--brand-50)] px-2.5 py-1 text-[11px] font-bold text-[var(--brand-700)]">
              {restantes > 0 ? `${restantes} prueba gratis` : "Sin pruebas gratis"}
            </span>
          )
        }
      />

      {!prenda ? (
        <ElegirPrenda onElegir={(p) => setParams({ prenda: p.id, talle: recDe(p, m)?.talle ?? p.talles[0] }, { replace: true })} />
      ) : (
        <div className="px-4 pt-4">
          {/* Prenda elegida y talle */}
          <div className="flex items-center gap-3 rounded-2xl bg-card p-2.5 ring-1 ring-border">
            <PrendaIlustracion prenda={prenda} className="h-16 w-14 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{prenda.nombre}</p>
              <p className="truncate text-xs text-muted-foreground">
                {tienda?.nombre} · {money(prenda.precio)}
              </p>
              {rec && <p className="text-[11px] font-semibold text-[var(--brand)]">Tu talle: {rec.talle} · {rec.confianza} %</p>}
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={() => setParams({}, { replace: true })}>
              Cambiar
            </Button>
          </div>

          {fase !== "resultado" && (
            <ChipsTalle prenda={prenda} talle={talle} recTalle={rec?.talle} onChange={setTalle} className="mt-3" />
          )}

          <Segmentado
            className="mt-4"
            valor={modo}
            onChange={setModo}
            opciones={[
              { id: "ejemplo", label: <><Users className="h-4 w-4" /> Ejemplo</> },
              { id: "foto", label: <><ImagePlus className="h-4 w-4" /> Tu foto</> },
              { id: "vivo", label: <><Video className="h-4 w-4" /> En vivo</> },
            ]}
          />

          {!puedeProbar && fase === "elegir" && modo !== "vivo" ? (
            <Paywall />
          ) : modo === "ejemplo" ? (
            <ModoEjemplo
              prenda={prenda}
              talle={talle}
              setTalle={setTalle}
              recTalle={rec?.talle}
              personas={personas}
              persona={persona}
              setPersonaId={setPersonaId}
              fase={fase}
              duracion={duracion}
              restantes={premium ? null : restantes}
              onEmpezar={empezar}
              onFin={() => {
                terminar("ejemplo", duracion);
                setFase("resultado");
              }}
              onOtra={() => setFase("elegir")}
              onComprar={() => setComprar(true)}
            />
          ) : modo === "foto" ? (
            <ModoFoto
              prenda={prenda}
              talle={talle}
              setTalle={setTalle}
              recTalle={rec?.talle}
              medidas={m}
              foto={foto}
              onFoto={(url) => {
                setFoto(usuario.id, url);
                actualizarPerfil(usuario.id, { conFoto: true });
              }}
              fase={fase}
              duracion={duracion}
              restantes={premium ? null : restantes}
              onEmpezar={empezar}
              onFin={() => {
                terminar("foto", duracion);
                setFase("resultado");
              }}
              onOtra={() => setFase("elegir")}
              onComprar={() => setComprar(true)}
            />
          ) : (
            <ModoVivo
              prenda={prenda}
              talle={talle}
              setTalle={setTalle}
              recTalle={rec?.talle}
              medidas={m}
              puedeProbar={puedeProbar}
              onActiva={(lat) => terminar("vivo", lat)}
              onComprar={() => setComprar(true)}
              onCambiarModo={setModo}
            />
          )}

          <ComprarDialog prenda={prenda} talle={talle} open={comprar} onOpenChange={setComprar} />
        </div>
      )}
    </div>
  );
}

// ── Selector de prenda ──────────────────────────────────────

function ElegirPrenda({ onElegir }: { onElegir: (p: Prenda) => void }) {
  const visibles = usePrendasVisibles();
  const { usuario } = useYo();
  const fav = useFavoritos();
  const m = usuario?.medidas;
  const favoritas = visibles.filter((p) => fav.es(p.id));
  const destacadas = useMemo(() => visibles.filter((p) => p.destacada && paraMi(p, m)), [visibles, m]);
  const mas = useMemo(
    () => visibles.filter((p) => !p.destacada && paraMi(p, m) && (recDe(p, m)?.confianza ?? 0) >= 85).slice(0, 8),
    [visibles, m]
  );

  const Fila = ({ titulo, lista }: { titulo: string; lista: Prenda[] }) => (
    <div className="mt-6">
      <h2 className="mb-2.5 px-4 font-display text-base font-bold">{titulo}</h2>
      <div className="px-4">
        <Carrusel>
          {lista.map((p) => {
            const r = recDe(p, m);
            return (
              <button key={p.id} onClick={() => onElegir(p)} className="w-[118px] shrink-0 text-left">
                <PrendaIlustracion prenda={p} className="aspect-[4/5] rounded-2xl ring-1 ring-black/5 transition-transform hover:scale-[1.02]" />
                <p className="mt-1.5 truncate text-xs font-semibold">{p.nombre}</p>
                {r && <p className="text-[11px] text-muted-foreground">Tu talle: {r.talle}</p>}
              </button>
            );
          })}
        </Carrusel>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mx-4 mt-4 overflow-hidden rounded-3xl bg-[var(--ink)] p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="h-[150px] w-[70px] shrink-0">
            {m && destacadas[0] && <Maniqui persona={personaPara(m)} puestas={[{ prenda: destacadas[0], talle: recDe(destacadas[0], m)?.talle }]} sombraPiso={false} />}
          </div>
          <div>
            <p className="font-display text-xl font-bold leading-tight">¿Qué te querés probar?</p>
            <p className="mt-1 text-[13px] text-white/70">
              Elegí una prenda y mirá cómo te queda en cada talle: sobre una persona de ejemplo, en tu foto o con la cámara.
            </p>
          </div>
        </div>
      </div>
      {favoritas.length > 0 && <Fila titulo="De tus favoritos" lista={favoritas} />}
      <Fila titulo="Destacadas" lista={destacadas} />
      {mas.length > 0 && <Fila titulo="Te quedan muy bien" lista={mas} />}
      <p className="mt-6 px-4 text-center text-xs text-muted-foreground">
        ¿Buscás otra? Abrila desde{" "}
        <Link to="/app/explorar" className="font-semibold text-[var(--brand)]">
          Explorar
        </Link>{" "}
        y tocá «Probármela».
      </p>
    </div>
  );
}

// ── Piezas comunes ──────────────────────────────────────────

function ChipsTalle({
  prenda,
  talle,
  recTalle,
  onChange,
  className,
  oscuro,
}: {
  prenda: Prenda;
  talle: string;
  recTalle?: string;
  onChange: (t: string) => void;
  className?: string;
  oscuro?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {prenda.talles.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={cn(
            "relative h-9 min-w-10 rounded-xl px-2.5 text-[13px] font-bold transition-all",
            t === talle
              ? "bg-[var(--brand)] text-white shadow-[0_6px_16px_-8px_var(--brand)]"
              : oscuro
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-card ring-1 ring-border hover:ring-[var(--brand-300)]"
          )}
        >
          {t}
          {t === recTalle && (
            <span className={cn("absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2", t === talle ? "bg-white ring-[var(--brand)]" : "bg-[var(--brand)] ring-card")} />
          )}
        </button>
      ))}
      {recTalle && <span className={cn("ml-1 text-[11px]", oscuro ? "text-white/60" : "text-muted-foreground")}>● tu talle</span>}
    </div>
  );
}

function Paywall() {
  const { supuestos } = useStore();
  return (
    <div className="mt-4 overflow-hidden rounded-3xl text-white" style={{ background: "linear-gradient(150deg, var(--ink) 0%, var(--brand-700) 120%)" }}>
      <div className="p-5">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
          <Crown className="h-3 w-3" /> Premium
        </span>
        <p className="mt-3 font-display text-[22px] font-bold leading-tight">Ya usaste tu prueba de cortesía</p>
        <p className="mt-1 text-sm text-white/75">Con Premium te probás todo lo que quieras, en todos los talles.</p>
        <ul className="mt-4 space-y-2 text-sm">
          {["Pruebas ilimitadas con tu foto o en vivo", "Comparar dos talles lado a lado", "Tu talle sigue siendo gratis, siempre"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber-300" /> {t}
            </li>
          ))}
        </ul>
        <Button asChild className="mt-5 h-12 w-full rounded-2xl bg-white text-base font-bold text-[var(--ink)] hover:bg-white/90">
          <Link to="/app/premium">Pasarme a Premium · {money(supuestos.precioMensual)}/mes</Link>
        </Button>
      </div>
    </div>
  );
}

function BotonProbar({ talle, restantes, onClick, disabled }: { talle: string; restantes: number | null; onClick: () => void; disabled?: boolean }) {
  return (
    <div className="mt-5">
      <Button className="h-13 w-full rounded-2xl py-3.5 text-base font-bold" onClick={onClick} disabled={disabled}>
        <Sparkles className="h-5 w-5" /> Probármela en talle {talle}
      </Button>
      {restantes !== null && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Usa tu prueba de cortesía ({restantes} disponible). Después, con Premium.
        </p>
      )}
    </div>
  );
}

/** Animación «Probándote la prenda…» con pasos y barra de progreso. */
function Procesando({ duracion, onFin, children }: { duracion: number; onFin: () => void; children: React.ReactNode }) {
  const [t, setT] = useState(0);
  const fin = useRef(onFin);
  fin.current = onFin;
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const x = Math.min(1, (performance.now() - t0) / duracion);
      setT(x);
      if (x < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => fin.current(), 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duracion]);
  // Progreso con aceleración al principio y frenada al final, como un proceso real.
  const prog = Math.round((1 - Math.pow(1 - t, 1.6)) * 100);
  const paso = Math.min(PASOS.length - 1, Math.floor(t * PASOS.length));
  return (
    <div className="mt-4 overflow-hidden rounded-3xl bg-card ring-1 ring-border">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[var(--brand-50)] to-[var(--surface)]">
        <div className="absolute inset-0 animate-pulse opacity-70 blur-[1.5px]">{children}</div>
        <div
          className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-[color-mix(in_srgb,var(--brand)_35%,transparent)] to-transparent"
          style={{ top: `${((t * 3) % 1) * 110 - 15}%` }}
        />
        <div className="absolute inset-x-0 h-[2px] bg-[var(--brand)] shadow-[0_0_12px_var(--brand)]" style={{ top: `${((t * 3) % 1) * 110 - 5}%` }} />
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-lg font-bold">Probándote la prenda…</p>
          <span className="text-sm font-bold tabular text-[var(--brand)]">{prog} %</span>
        </div>
        <Progress value={prog} className="mt-2 h-2" />
        <ul className="mt-3 space-y-1.5">
          {PASOS.map((p, i) => (
            <li key={p} className={cn("flex items-center gap-2 text-[13px] transition-opacity", i > paso && "opacity-35")}>
              {i < paso ? (
                <Check className="h-4 w-4 text-[var(--ok)]" />
              ) : i === paso ? (
                <RefreshCw className="h-4 w-4 animate-spin text-[var(--brand)]" />
              ) : (
                <span className="h-4 w-4 rounded-full border-2 border-border" />
              )}
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Texto del veredicto para una persona con un talle. */
function Veredicto({ prenda, talle, medidas, oscuro }: { prenda: Prenda; talle: string; medidas: Medidas; oscuro?: boolean }) {
  const zonas = evaluarTalle(prenda.tabla, prenda.categoria, talle, medidas);
  return (
    <p className={cn("text-[12px] leading-snug", oscuro ? "text-white/75" : "text-muted-foreground")}>
      {capitalizar(resumenZonas(zonas))}
    </p>
  );
}

function AccionesResultado({ prenda, talle, onOtra, onComprar }: { prenda: Prenda; talle: string; onOtra: () => void; onComprar: () => void }) {
  return (
    <div className="mt-4 flex gap-2">
      <Button variant="outline" className="h-12 rounded-2xl" onClick={onOtra} aria-label="Probar de nuevo">
        <RefreshCw className="h-4 w-4" />
      </Button>
      <Corazon prendaId={prenda.id} className="h-12 w-12 rounded-2xl bg-card ring-1 ring-border" />
      <Button className="h-12 flex-1 rounded-2xl text-sm font-bold" onClick={onComprar}>
        <ShoppingBag className="h-4 w-4" /> Comprar talle {talle}
      </Button>
    </div>
  );
}

// ── Modo 1: persona de ejemplo ──────────────────────────────

function ModoEjemplo({
  prenda,
  talle,
  setTalle,
  recTalle,
  personas,
  persona,
  setPersonaId,
  fase,
  duracion,
  restantes,
  onEmpezar,
  onFin,
  onOtra,
  onComprar,
}: {
  prenda: Prenda;
  talle: string;
  setTalle: (t: string) => void;
  recTalle?: string;
  personas: Persona[];
  persona: Persona;
  setPersonaId: (id: string) => void;
  fase: Fase;
  duracion: number;
  restantes: number | null;
  onEmpezar: () => void;
  onFin: () => void;
  onOtra: () => void;
  onComprar: () => void;
}) {
  const [comparar, setComparar] = useState(false);
  const i = prenda.talles.indexOf(talle);
  const [talleB, setTalleB] = useState(prenda.talles[i + 1] ?? prenda.talles[i - 1] ?? talle);
  const recPersona = recomendar(prenda.tabla, prenda.categoria, persona.medidas)?.talle;

  if (fase === "procesando") {
    return (
      <Procesando duracion={duracion} onFin={onFin}>
        <Maniqui persona={persona} puestas={[]} className="mx-auto" />
      </Procesando>
    );
  }

  if (fase === "resultado") {
    return (
      <div className="mt-4">
        {!comparar ? (
          <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
            <div className="relative aspect-[4/5] bg-gradient-to-b from-[var(--brand-50)] via-[var(--surface)] to-[var(--surface)]">
              <Maniqui persona={persona} puestas={[{ prenda, talle }]} />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm">
                {persona.id === "yo" ? "Tu silueta" : persona.nombre} · talle {talle}
              </span>
            </div>
            <div className="p-4">
              <ChipsTalle prenda={prenda} talle={talle} recTalle={recTalle} onChange={setTalle} />
              <div className="mt-2.5">
                <Veredicto prenda={prenda} talle={talle} medidas={persona.medidas} />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[
              { t: talle, set: setTalle },
              { t: talleB, set: setTalleB },
            ].map(({ t, set }, k) => (
              <div key={k} className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
                <div className="relative aspect-[3/5] bg-gradient-to-b from-[var(--brand-50)] to-[var(--surface)]">
                  <Maniqui persona={persona} puestas={[{ prenda, talle: t }]} />
                  <span className="absolute left-2 top-2 rounded-full bg-[var(--ink)] px-2 py-0.5 text-[11px] font-bold text-white">{t}</span>
                  {t === recTalle && (
                    <span className="absolute right-2 top-2 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[10px] font-bold text-white">Tu talle</span>
                  )}
                </div>
                <div className="p-2.5">
                  <div className="flex flex-wrap gap-1">
                    {prenda.talles.map((x) => (
                      <button
                        key={x}
                        onClick={() => set(x)}
                        className={cn("h-7 min-w-7 rounded-lg px-1.5 text-[11px] font-bold", x === t ? "bg-[var(--brand)] text-white" : "bg-black/[0.05]")}
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <Veredicto prenda={prenda} talle={t} medidas={persona.medidas} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button variant="secondary" className="mt-3 h-10 w-full rounded-2xl" onClick={() => setComparar(!comparar)}>
          <Columns2 className="h-4 w-4" /> {comparar ? "Ver un solo talle" : "Comparar dos talles"}
        </Button>
        <AccionesResultado prenda={prenda} talle={talle} onOtra={onOtra} onComprar={onComprar} />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-[13px] font-semibold">¿Sobre quién te la probás?</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {personas.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPersonaId(p.id)}
            className={cn(
              "flex flex-col items-center rounded-2xl border-2 bg-card pb-2 pt-1 transition-all",
              persona.id === p.id ? "border-[var(--brand)] bg-[var(--brand-50)]" : "border-transparent ring-1 ring-border"
            )}
          >
            <div className="h-[104px] w-[46px]">
              <Maniqui persona={p} puestas={[]} sombraPiso={false} />
            </div>
            <span className="mt-1 text-xs font-semibold">{p.id === "yo" ? "Vos" : p.nombre}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {persona.id === "yo"
          ? "Una silueta hecha con tus medidas."
          : `${persona.nombre}: ${persona.medidas.altura} cm, pecho ${persona.medidas.pecho}, cintura ${persona.medidas.cintura}. A ${persona.nombre} le recomendaríamos ${recPersona}.`}
      </p>
      <BotonProbar talle={talle} restantes={restantes} onClick={onEmpezar} />
    </div>
  );
}

// ── Modo 2: tu foto ─────────────────────────────────────────

/** Reduce la imagen a ~600 px de lado con un canvas. */
function reducir(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = reject;
    lector.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, 600 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = lector.result as string;
    };
    lector.readAsDataURL(file);
  });
}

function ModoFoto({
  prenda,
  talle,
  setTalle,
  recTalle,
  medidas,
  foto,
  onFoto,
  fase,
  duracion,
  restantes,
  onEmpezar,
  onFin,
  onOtra,
  onComprar,
}: {
  prenda: Prenda;
  talle: string;
  setTalle: (t: string) => void;
  recTalle?: string;
  medidas: Medidas;
  foto?: string;
  onFoto: (url: string) => void;
  fase: Fase;
  duracion: number;
  restantes: number | null;
  onEmpezar: () => void;
  onFin: () => void;
  onOtra: () => void;
  onComprar: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);

  async function subir(f?: File) {
    if (!f) return;
    setCargando(true);
    try {
      onFoto(await reducir(f));
      toast.success("Foto guardada en este dispositivo");
    } catch {
      toast.error("No pudimos leer esa imagen");
    } finally {
      setCargando(false);
    }
  }

  const selector = (
    <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => subir(e.target.files?.[0])} />
  );

  if (fase === "procesando" && foto) {
    return (
      <Procesando duracion={duracion} onFin={onFin}>
        <img src={foto} alt="Tu foto" className="h-full w-full object-cover" />
      </Procesando>
    );
  }

  if (fase === "resultado" && foto) {
    return (
      <div className="mt-4">
        <Superpuesta
          prenda={prenda}
          talle={talle}
          medidas={medidas}
          fondo={<img src={foto} alt="Tu foto" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
        />
        <div className="mt-3 rounded-2xl bg-card p-3 ring-1 ring-border">
          <ChipsTalle prenda={prenda} talle={talle} recTalle={recTalle} onChange={setTalle} />
          <div className="mt-2">
            <Veredicto prenda={prenda} talle={talle} medidas={medidas} />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Vista aproximada: la prenda se superpone sobre tu foto y cambia de tamaño con el talle. Tu foto no sale de este dispositivo.
        </p>
        <AccionesResultado prenda={prenda} talle={talle} onOtra={onOtra} onComprar={onComprar} />
      </div>
    );
  }

  return (
    <div className="mt-4">
      {selector}
      {foto ? (
        <div className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-border">
          <img src={foto} alt="Tu foto guardada" className="h-28 w-[84px] shrink-0 rounded-xl object-cover" />
          <div className="flex min-w-0 flex-col">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Check className="h-4 w-4 text-[var(--ok)]" /> Usar mi foto guardada
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Está guardada sólo en este dispositivo. La podés borrar desde Privacidad.</p>
            <Button variant="outline" size="sm" className="mt-auto w-fit rounded-xl" onClick={() => input.current?.click()} disabled={cargando}>
              <Upload className="h-3.5 w-3.5" /> Subir otra
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-[var(--brand-300)] bg-[var(--brand-50)] px-6 py-9 text-center"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[var(--brand)] shadow-sm">
            <Camera className="h-6 w-6" />
          </span>
          <span className="mt-3 font-display text-lg font-bold">{cargando ? "Procesando…" : "Subí una foto tuya"}</span>
          <span className="mt-1 text-xs text-[var(--ink-500)]">De cuerpo entero, de frente, con buena luz y ropa ajustada.</span>
        </button>
      )}
      <BotonProbar talle={talle} restantes={restantes} onClick={onEmpezar} disabled={!foto} />
    </div>
  );
}

// ── Modo 3: en vivo ─────────────────────────────────────────

type Seguimiento = "cargando" | "buscando" | "siguiendo" | "sin-detector";

/** Tiempo sin ver el cuerpo antes de volver a la prenda manual. */
const PERDIDA_MS = 1000;

function ModoVivo({
  prenda,
  talle,
  setTalle,
  recTalle,
  medidas,
  puedeProbar,
  onActiva,
  onComprar,
  onCambiarModo,
}: {
  prenda: Prenda;
  talle: string;
  setTalle: (t: string) => void;
  recTalle?: string;
  medidas: Medidas;
  puedeProbar: boolean;
  onActiva: (latenciaMs: number) => void;
  onComprar: () => void;
  onCambiarModo: (m: Modo) => void;
}) {
  const [params] = useSearchParams();
  // Sólo en desarrollo: ?fuente=<url de video o imagen> reemplaza a la cámara para probar el seguimiento.
  const fuenteDev = import.meta.env.DEV ? params.get("fuente") : null;
  const fuenteEsImagen = !!fuenteDev && /\.(jpe?g|png|webp|gif)(\?|$)/i.test(fuenteDev);

  const [estado, setEstado] = useState<"apagada" | "pidiendo" | "activa" | "error">("apagada");
  const [error, setError] = useState("");
  const [seg, setSeg] = useState<Seguimiento>("cargando");
  const video = useRef<HTMLVideoElement>(null);
  const imagen = useRef<HTMLImageElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const capa = useRef<SVGGElement | null>(null);
  const suave = useRef<Ajuste | null>(null);
  const fino = useRef<AjusteFino>({ dx: 0, dy: 0, escala: 1 });
  const uid = useId().replace(/:/g, "");

  const inferior = ES_INFERIOR[prenda.categoria];
  const cuerpo = useMemo(() => cuerpoDe(medidas), [medidas]);
  const aire = useMemo(() => holgura(prenda.tabla, prenda.categoria, talle, medidas), [prenda, talle, medidas]);
  // El bucle lee los datos de la prenda actual sin reiniciarse.
  const datos = useRef({ categoria: prenda.categoria, inferior, cuerpo });
  datos.current = { categoria: prenda.categoria, inferior, cuerpo };

  const apagar = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => apagar, []);

  useEffect(() => {
    if (estado === "activa" && video.current && stream.current) {
      video.current.srcObject = stream.current;
      video.current.play().catch(() => undefined);
    }
  }, [estado]);

  // Detector de pose + bucle de seguimiento, mientras la cámara está activa.
  useEffect(() => {
    if (estado !== "activa") return;
    let vivo = true;
    let raf = 0;
    let detector: Detector | null = null;
    let ultimoTiempo = -1;
    let ultimaDeteccion = 0;
    let ultimaVezVisto = 0;
    let siguiendo = false;
    suave.current = null;
    setSeg("cargando");

    const paso = () => {
      raf = requestAnimationFrame(paso);
      const d = detector;
      const v = video.current;
      const img = imagen.current;
      const el = v ?? img;
      const caja = el?.parentElement;
      if (!d || !el || !caja) return;

      const ahora = performance.now();
      let fuente: { ancho: number; alto: number };
      if (v) {
        if (v.readyState < 2 || !v.videoWidth || v.currentTime === ultimoTiempo) return;
        ultimoTiempo = v.currentTime;
        fuente = { ancho: v.videoWidth, alto: v.videoHeight };
      } else {
        if (!img!.complete || !img!.naturalWidth || ahora - ultimaDeteccion < 66) return;
        fuente = { ancho: img!.naturalWidth, alto: img!.naturalHeight };
      }
      ultimaDeteccion = ahora;

      let lms;
      try {
        lms = d.detectForVideo(el, ahora).landmarks[0];
      } catch {
        return;
      }
      const box = { ancho: caja.clientWidth, alto: caja.clientHeight };
      const { categoria, inferior: inf, cuerpo: c } = datos.current;
      const r = lms ? ajustePara(lms, categoria, inf, c, (lm) => aPantalla(lm, fuente, box, true)) : null;

      if (r?.ajuste) {
        suave.current = suavizar(suave.current, r.ajuste);
        ultimaVezVisto = ahora;
        if (!siguiendo) {
          siguiendo = true;
          setSeg("siguiendo");
        }
        aplicar(box);
      } else if (siguiendo && ahora - ultimaVezVisto > PERDIDA_MS) {
        siguiendo = false;
        suave.current = null;
        setSeg("buscando");
      }
    };

    cargarDetector()
      .then((d) => {
        if (!vivo) {
          d.close();
          return;
        }
        detector = d;
        setSeg("buscando");
        raf = requestAnimationFrame(paso);
      })
      .catch(() => {
        if (vivo) setSeg("sin-detector");
      });

    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      detector?.close();
      detector = null;
      suave.current = null;
    };
  }, [estado]);

  /** Lleva la transformación suavizada (más el ajuste fino) a la capa SVG. */
  function aplicar(box?: { ancho: number; alto: number }) {
    const g = capa.current;
    const a = suave.current;
    const caja = g?.ownerSVGElement;
    if (!g || !a || !caja) return;
    const b = box ?? { ancho: caja.clientWidth, alto: caja.clientHeight };
    const f = fino.current;
    g.setAttribute("transform", transformDe(a, { escala: f.escala, dx: (f.dx / 100) * b.ancho, dy: (f.dy / 100) * b.alto }));
  }

  async function activar() {
    if (fuenteDev) {
      setEstado("activa");
      onActiva(0);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador no permite usar la cámara (hace falta HTTPS o un navegador más nuevo).");
      setEstado("error");
      return;
    }
    setEstado("pidiendo");
    const t0 = performance.now();
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setEstado("activa");
      onActiva(Math.round(performance.now() - t0));
    } catch (e) {
      const nombre = (e as DOMException)?.name;
      setError(
        nombre === "NotAllowedError"
          ? "No diste permiso para usar la cámara. Podés habilitarlo desde la configuración del navegador."
          : "No encontramos una cámara disponible en este dispositivo."
      );
      setEstado("error");
    }
  }

  if (estado === "activa") {
    const fondo = fuenteEsImagen ? (
      <img
        ref={imagen}
        src={fuenteDev!}
        crossOrigin="anonymous"
        alt="Fuente de prueba"
        draggable={false}
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />
    ) : (
      <video
        ref={video}
        playsInline
        muted
        {...(fuenteDev ? { src: fuenteDev, crossOrigin: "anonymous" as const, autoPlay: true, loop: true } : {})}
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />
    );

    const pista =
      seg === "cargando"
        ? { punto: "bg-white/70 animate-pulse", texto: "Cargando el detector…" }
        : seg === "siguiendo"
          ? { punto: "bg-emerald-400", texto: "Seguimiento activo" }
          : seg === "buscando"
            ? {
                punto: "bg-amber-400 animate-pulse",
                texto: inferior
                  ? "Ponete de frente, que se vea de la cadera a los pies"
                  : "Ponete de frente, que se vea de la cabeza a la cadera",
              }
            : { punto: "bg-white/60", texto: "Acomodá la prenda a mano" };

    return (
      <div className="mt-4">
        <Superpuesta
          prenda={prenda}
          talle={talle}
          medidas={medidas}
          posInicial={{ x: 50, y: 58 }}
          fondo={fondo}
          ajusteFino={fino}
          aviso={
            <span
              role="status"
              className="pointer-events-none absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur"
            >
              <span className={cn("h-2 w-2 shrink-0 rounded-full", pista.punto)} />
              {pista.texto}
            </span>
          }
          seguida={
            seg === "siguiendo" ? (
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}
                aria-label={`${prenda.nombre}, talle ${talle}`}
              >
                <g
                  ref={(g) => {
                    capa.current = g;
                    if (g) aplicar();
                  }}
                  opacity={0.95}
                >
                  <DibujoPrenda prenda={prenda} cuerpo={cuerpo} holgura={aire} uid={uid} />
                </g>
              </svg>
            ) : undefined
          }
        />
        {seg === "sin-detector" && (
          <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            <p className="font-bold">No pudimos cargar el detector de cuerpo</p>
            <p className="mt-0.5">
              Puede ser la conexión a internet. Mientras tanto, arrastrá la prenda y usá el control de tamaño para acomodarla sobre vos.
            </p>
          </div>
        )}
        <div className="mt-3 rounded-2xl bg-card p-3 ring-1 ring-border">
          <ChipsTalle prenda={prenda} talle={talle} recTalle={recTalle} onChange={setTalle} />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {seg === "siguiendo"
            ? "La prenda sigue tu cuerpo y cambia de ancho con el talle. Si querés, arrastrala o ajustá el tamaño para afinar."
            : "Vista aproximada en vivo."}{" "}
          El video se procesa en tu navegador y no se graba ni se envía a ningún lado.
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            className="h-12 rounded-2xl"
            onClick={() => {
              apagar();
              setEstado("apagada");
            }}
          >
            <VideoOff className="h-4 w-4" /> Apagar
          </Button>
          <Button className="h-12 flex-1 rounded-2xl text-sm font-bold" onClick={onComprar}>
            <ShoppingBag className="h-4 w-4" /> Comprar talle {talle}
          </Button>
        </div>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="mt-4 flex flex-col items-center rounded-3xl bg-card px-6 py-10 text-center ring-1 ring-border">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-[var(--danger)]">
          <VideoOff className="h-6 w-6" />
        </span>
        <p className="mt-3 font-display text-lg font-bold">No pudimos abrir la cámara</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Sin cámara no hay seguimiento en vivo, pero podés probártela igual con tu foto (y acomodar la prenda a mano) o con una persona de ejemplo.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button className="rounded-xl" onClick={() => onCambiarModo("foto")}>
            <ImagePlus className="h-4 w-4" /> Usar mi foto
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => onCambiarModo("ejemplo")}>
            <Users className="h-4 w-4" /> Persona de ejemplo
          </Button>
          <Button variant="ghost" className="rounded-xl" onClick={activar}>
            <RefreshCw className="h-4 w-4" /> Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!puedeProbar) return <Paywall />;

  return (
    <div className="mt-4">
      <div className="relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-3xl bg-[var(--ink)] px-8 text-center text-white">
        <div className="absolute inset-0 opacity-30">
          <Maniqui persona={personaPara(medidas)} puestas={[{ prenda, talle }]} sombraPiso={false} className="blur-[2px]" />
        </div>
        <div className="relative">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/15 backdrop-blur">
            <Video className="h-7 w-7" />
          </span>
          <p className="mt-4 font-display text-xl font-bold">Probátela frente al espejo</p>
          <p className="mt-1 text-sm text-white/70">
            Activá la cámara y la prenda sigue tu cuerpo en tiempo real.{" "}
            {inferior ? "Alejate hasta que se vean la cadera y las piernas." : "Alejate hasta que se vea de la cabeza a la cadera."}
          </p>
          <Button
            className="mt-5 h-11 rounded-2xl bg-white px-6 font-bold text-[var(--ink)] hover:bg-white/90"
            onClick={activar}
            disabled={estado === "pidiendo"}
          >
            {estado === "pidiendo" ? "Esperando permiso…" : "Activar cámara"}
          </Button>
        </div>
      </div>
    </div>
  );
}

