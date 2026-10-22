import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Check, ChevronLeft, CreditCard, Crown, Loader2, Lock, PartyPopper, Sparkles, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Maniqui, PERSONAS } from "../../components/figura/maniqui";
import { useStore, usePrendasVisibles, useYo } from "../../lib/store";
import { money, fechaLarga } from "../../lib/format";
import { HOY, type PlanPremium } from "../../data/seed";
import type { Prenda } from "../../data/prendas";
import { cn } from "../../components/ui/utils";

const INCLUYE: { texto: string; gratis: boolean; premium: boolean }[] = [
  { texto: "Tu talle ideal en todas las tiendas", gratis: true, premium: true },
  { texto: "Detalle por zona y tabla de talles", gratis: true, premium: true },
  { texto: "Probador virtual ilimitado", gratis: false, premium: true },
  { texto: "Probarte con tu foto y en vivo", gratis: false, premium: true },
  { texto: "Comparar dos talles lado a lado", gratis: false, premium: true },
  { texto: "Avisos cuando entra tu talle", gratis: false, premium: true },
];

function sumarMes(iso: string, meses: number) {
  const d = new Date(iso + "T12:00:00");
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

export function Premium() {
  const navigate = useNavigate();
  const { supuestos, suscribir, cancelarSuscripcion, pruebas } = useStore();
  const { usuario, suscripcion, premium } = useYo();
  const prendas = usePrendasVisibles();
  const [plan, setPlan] = useState<PlanPremium>("anual");
  const [checkout, setCheckout] = useState(false);
  const [estado, setEstado] = useState<"form" | "pagando" | "ok">("form");
  const [cancelar, setCancelar] = useState(false);

  if (!usuario) return null;

  const ahorro = supuestos.precioMensual * 12 - supuestos.precioAnual;
  const ahorroPct = Math.round((ahorro / (supuestos.precioMensual * 12)) * 100);
  const precio = plan === "anual" ? supuestos.precioAnual : supuestos.precioMensual;
  const muestra = prendas.find((p) => p.destacada && p.categoria === "campera") ?? prendas[0];

  function pagar() {
    setEstado("pagando");
    setTimeout(() => {
      suscribir(usuario!.id, plan);
      setEstado("ok");
    }, 1800);
  }

  // ── Ya es Premium ──
  if (premium && suscripcion && estado !== "ok") {
    const meses = Math.max(0, Math.round((new Date(HOY).getTime() - new Date(suscripcion.inicio).getTime()) / (30 * 86400000)));
    let prox = suscripcion.inicio;
    const paso = suscripcion.plan === "anual" ? 12 : 1;
    while (prox <= HOY) prox = sumarMes(prox, paso);
    const pruebasMes = pruebas.filter((p) => p.usuarioId === usuario.id && p.fecha.slice(0, 7) === HOY.slice(0, 7)).length;
    return (
      <div className="pb-8">
        <HeroPremium titulo="Sos Premium" bajada="Gracias por bancar el proyecto." onAtras={() => navigate(-1)} muestra={muestra} />
        <div className="-mt-6 px-4">
          <div className="relative rounded-3xl bg-card p-5 shadow-lg ring-1 ring-border">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tu plan</p>
            <p className="mt-1 font-display text-2xl font-bold">
              Premium {suscripcion.plan === "anual" ? "anual" : "mensual"}
            </p>
            <p className="text-sm text-muted-foreground">
              {money(suscripcion.plan === "anual" ? supuestos.precioAnual : supuestos.precioMensual)} por {suscripcion.plan === "anual" ? "año" : "mes"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-[var(--surface)] p-3">
                <p className="text-[11px] text-muted-foreground">Desde</p>
                <p className="font-semibold">{fechaLarga(suscripcion.inicio)}</p>
              </div>
              <div className="rounded-2xl bg-[var(--surface)] p-3">
                <p className="text-[11px] text-muted-foreground">Próxima renovación</p>
                <p className="font-semibold">{fechaLarga(prox)}</p>
              </div>
              <div className="rounded-2xl bg-[var(--surface)] p-3">
                <p className="text-[11px] text-muted-foreground">Pruebas este mes</p>
                <p className="font-semibold">{pruebasMes}</p>
              </div>
              <div className="rounded-2xl bg-[var(--surface)] p-3">
                <p className="text-[11px] text-muted-foreground">Meses con Premium</p>
                <p className="font-semibold">{meses || "Recién empezás"}</p>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <CreditCard className="h-4 w-4" /> Visa terminada en 4242
            </p>
          </div>
          <Button asChild className="mt-4 h-12 w-full rounded-2xl text-base font-bold">
            <Link to="/app/probador">
              <Sparkles className="h-4 w-4" /> Ir al probador
            </Link>
          </Button>
          <button type="button" onClick={() => setCancelar(true)} className="mt-6 w-full text-center text-sm font-semibold text-[var(--danger)]">
            Cancelar suscripción
          </button>
        </div>

        <AlertDialog open={cancelar} onOpenChange={setCancelar}>
          <AlertDialogContent className="max-w-[340px] rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar Premium?</AlertDialogTitle>
              <AlertDialogDescription>
                Vas a perder el probador virtual. Tu talle recomendado sigue siendo gratis y tus compras quedan guardadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Seguir con Premium</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-[var(--danger)] hover:bg-[var(--danger)]/90"
                onClick={() => {
                  cancelarSuscripcion(usuario.id);
                  toast("Cancelaste tu suscripción", { description: "Podés volver cuando quieras." });
                }}
              >
                Cancelar plan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ── Gratuito: planes y checkout ──
  return (
    <div className="pb-8">
      <HeroPremium titulo="Probátela antes de comprarla" bajada="Con Premium te probás toda la ropa que quieras, en todos los talles." onAtras={() => navigate(-1)} muestra={muestra} />

      <div className="-mt-6 space-y-3 px-4">
        {(["anual", "mensual"] as PlanPremium[]).map((p) => {
          const act = plan === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-3xl border-2 bg-card p-4 text-left shadow-sm transition-all",
                act ? "border-[var(--brand)] shadow-[0_12px_30px_-16px_var(--brand)]" : "border-transparent ring-1 ring-border"
              )}
            >
              <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2", act ? "border-[var(--brand)] bg-[var(--brand)]" : "border-border")}>
                {act && <Check className="h-3.5 w-3.5 text-white" />}
              </span>
              <span className="flex-1">
                <span className="block font-display text-lg font-bold">{p === "anual" ? "Anual" : "Mensual"}</span>
                <span className="block text-xs text-muted-foreground">
                  {p === "anual" ? `${money(supuestos.precioAnual / 12)} por mes, un solo pago` : "Cancelás cuando quieras"}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-display text-xl font-bold tabular">{money(p === "anual" ? supuestos.precioAnual : supuestos.precioMensual)}</span>
                <span className="block text-[11px] text-muted-foreground">por {p === "anual" ? "año" : "mes"}</span>
              </span>
              {p === "anual" && ahorro > 0 && (
                <span className="absolute -top-2.5 left-12 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
                  Ahorrás {money(ahorro)} · {ahorroPct} %
                </span>
              )}
            </button>
          );
        })}

        <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
          <div className="grid grid-cols-[1fr_56px_56px] border-b border-border px-4 py-2.5 text-[11px] font-semibold text-muted-foreground">
            <span>Qué incluye</span>
            <span className="text-center">Gratis</span>
            <span className="text-center text-[var(--brand)]">Premium</span>
          </div>
          {INCLUYE.map((f) => (
            <div key={f.texto} className="grid grid-cols-[1fr_56px_56px] items-center border-b border-border/60 px-4 py-2.5 text-[13px] last:border-0">
              <span>{f.texto}</span>
              <span className="flex justify-center">
                {f.gratis ? <Check className="h-4 w-4 text-[var(--ok)]" /> : <X className="h-4 w-4 text-muted-foreground/50" />}
              </span>
              <span className="flex justify-center">
                <Check className="h-4 w-4 text-[var(--brand)]" />
              </span>
            </div>
          ))}
        </div>

        <Button className="h-13 w-full rounded-2xl py-3.5 text-base font-bold" onClick={() => { setEstado("form"); setCheckout(true); }}>
          <Crown className="h-5 w-5" /> Pasarme a Premium · {money(precio)}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          {plan === "mensual" ? "Se renueva cada mes." : "Se renueva cada año."} Cancelás cuando quieras desde esta pantalla.
        </p>
      </div>

      <Dialog open={checkout} onOpenChange={(v) => {
          if (estado === "pagando") return;
          setCheckout(v);
          if (!v && estado === "ok") setEstado("form");
        }}>
        <DialogContent className="max-w-[360px] rounded-3xl sm:max-w-[360px]">
          {estado === "ok" ? (
            <div className="flex flex-col items-center py-4 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-600">
                <PartyPopper className="h-8 w-8" />
              </span>
              <DialogTitle className="mt-4 font-display text-2xl">¡Ya sos Premium!</DialogTitle>
              <DialogDescription className="mt-1">
                Activamos tu plan {plan}. Ahora te podés probar toda la ropa que quieras.
              </DialogDescription>
              <Button className="mt-6 h-12 w-full rounded-2xl font-bold" onClick={() => navigate("/app/probador")}>
                <Sparkles className="h-4 w-4" /> Ir al probador
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader className="text-left">
                <DialogTitle className="font-display text-xl">Pagar Premium {plan}</DialogTitle>
                <DialogDescription>Tarjeta de prueba: no se cobra nada real.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Número de tarjeta</label>
                  <Input defaultValue="4242 4242 4242 4242" className="mt-1 h-11 rounded-xl tabular" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Nombre en la tarjeta</label>
                  <Input defaultValue={usuario.nombre.toUpperCase()} className="mt-1 h-11 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Vencimiento</label>
                    <Input defaultValue="12/29" className="mt-1 h-11 rounded-xl tabular" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">CVC</label>
                    <Input defaultValue="123" className="mt-1 h-11 rounded-xl tabular" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[var(--surface)] px-4 py-3">
                <span className="text-sm">Total hoy</span>
                <span className="font-display text-xl font-bold tabular">{money(precio)}</span>
              </div>
              <Button className="h-12 rounded-2xl text-base font-bold" onClick={pagar} disabled={estado === "pagando"}>
                {estado === "pagando" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Procesando pago…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Pagar {money(precio)}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HeroPremium({
  titulo,
  bajada,
  onAtras,
  muestra,
}: {
  titulo: string;
  bajada: string;
  onAtras: () => void;
  muestra?: Prenda;
}) {
  return (
    <div
      className="relative overflow-hidden px-5 pb-12 pt-4 text-white"
      style={{ background: "linear-gradient(160deg, var(--ink) 0%, var(--brand-700) 75%, var(--brand) 130%)" }}
    >
      <div className="absolute -right-8 top-10 h-48 w-48 rounded-full bg-[var(--brand)]/40 blur-3xl" />
      <button onClick={onAtras} className="relative -ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Volver">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="relative flex items-end gap-2">
        <div className="flex-1 pb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-amber-950">
            <Crown className="h-3 w-3" /> Premium
          </span>
          <h1 className="mt-3 font-display text-[28px] font-bold leading-[1.05] tracking-tight">{titulo}</h1>
          <p className="mt-2 text-sm text-white/75">{bajada}</p>
        </div>
        {muestra && (
          <div className="h-[190px] w-[88px] shrink-0">
            <Maniqui persona={PERSONAS[0]} puestas={[{ prenda: muestra }]} sombraPiso={false} />
          </div>
        )}
      </div>
    </div>
  );
}
