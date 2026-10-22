import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ExternalLink, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { PrendaIlustracion } from "../figura/prenda-ilustracion";
import { useStore, useYo } from "../../lib/store";
import { money } from "../../lib/format";
import type { Prenda } from "../../data/prendas";
import { recDe } from "./comun";
import { cn } from "../ui/utils";

/**
 * «Comprar en la tienda»: simula el salto al e-commerce de la tienda
 * y registra la venta derivada (que después ve la tienda y el admin).
 */
export function ComprarDialog({
  prenda,
  talle: talleInicial,
  open,
  onOpenChange,
}: {
  prenda: Prenda;
  talle: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { tiendas, pruebas, registrarVenta } = useStore();
  const { usuario } = useYo();
  const navigate = useNavigate();
  const tienda = tiendas.find((t) => t.id === prenda.tiendaId);
  const rec = recDe(prenda, usuario?.medidas);
  const [talle, setTalle] = useState(talleInicial);
  const [paso, setPaso] = useState<"confirmar" | "yendo">("confirmar");

  useEffect(() => {
    if (open) {
      setTalle(talleInicial);
      setPaso("confirmar");
    }
  }, [open, talleInicial]);

  const conPrueba = !!usuario && pruebas.some((p) => p.usuarioId === usuario.id && p.prendaId === prenda.id);

  function comprar() {
    if (!usuario) return;
    setPaso("yendo");
    setTimeout(() => {
      const v = registrarVenta({ usuarioId: usuario.id, prendaId: prenda.id, talle, conPrueba });
      onOpenChange(false);
      if (v) {
        toast.success(`Listo, tu compra en ${tienda?.nombre} quedó registrada`, {
          description: `${prenda.nombre} · talle ${talle} · ${money(prenda.precio)}`,
          action: { label: "Ver", onClick: () => navigate("/app/compras") },
        });
      } else {
        toast.error("No pudimos registrar la compra");
      }
    }, 1600);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => paso === "confirmar" && onOpenChange(v)}>
      <DialogContent className="max-w-[360px] gap-0 rounded-3xl p-0 sm:max-w-[360px]">
        {paso === "yendo" ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span
              className="grid h-16 w-16 place-items-center rounded-2xl font-display text-2xl font-bold text-white"
              style={{ background: tienda?.color }}
            >
              {tienda?.nombre[0]}
            </span>
            <Loader2 className="mt-6 h-6 w-6 animate-spin text-[var(--brand)]" />
            <p className="mt-3 font-display text-lg font-bold">Abriendo {tienda?.nombre}…</p>
            <p className="mt-1 text-sm text-muted-foreground">Te llevamos al checkout de la tienda con tu talle {talle} ya elegido.</p>
          </div>
        ) : (
          <>
            <DialogHeader className="px-5 pt-5 text-left">
              <DialogTitle className="font-display text-xl">Comprar en {tienda?.nombre}</DialogTitle>
              <DialogDescription>Vas a terminar la compra en la web de la tienda.</DialogDescription>
            </DialogHeader>
            <div className="mx-5 mt-4 flex gap-3 rounded-2xl bg-[var(--surface)] p-3">
              <PrendaIlustracion prenda={prenda} className="h-20 w-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{prenda.nombre}</p>
                <p className="text-xs text-muted-foreground">{prenda.colorNombre}</p>
                <p className="mt-1 font-bold tabular">{money(prenda.precio)}</p>
              </div>
            </div>
            <div className="px-5 pt-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Talle</p>
              <div className="flex flex-wrap gap-2">
                {prenda.talles.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTalle(t)}
                    className={cn(
                      "relative h-10 min-w-11 rounded-xl border px-3 text-sm font-bold transition-colors",
                      t === talle
                        ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                        : "border-border bg-card hover:border-[var(--brand-300)]"
                    )}
                  >
                    {t}
                    {rec?.talle === t && (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[var(--brand)] ring-2 ring-white" />
                    )}
                  </button>
                ))}
              </div>
              {rec && talle !== rec.talle ? (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Elegiste {talle}, pero según tus medidas te recomendamos {rec.talle} ({rec.confianza} %).
                </p>
              ) : rec ? (
                <p className="mt-3 text-xs text-[var(--ok)]">Es tu talle recomendado · {rec.confianza} % de confianza</p>
              ) : null}
            </div>
            <div className="mt-4 flex items-start gap-2 border-t border-border px-5 py-3 text-[11px] leading-snug text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              El pago lo procesa {tienda?.nombre}. A vos no te cuesta nada extra: la tienda le paga una comisión a la app.
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <Button variant="outline" className="h-11 flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button className="h-11 flex-[1.6] rounded-xl" onClick={comprar}>
                Ir a la tienda <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
