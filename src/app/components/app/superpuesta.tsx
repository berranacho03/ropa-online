import { useEffect, useRef, useState, type ReactNode } from "react";
import { Move, ZoomIn } from "lucide-react";
import { PrendaIlustracion } from "../figura/prenda-ilustracion";
import { Slider } from "../ui/slider";
import { ES_INFERIOR, holgura, type Medidas } from "../../lib/talles";
import type { Prenda } from "../../data/prendas";

/** Escala de la prenda según la holgura del talle: más aire, más grande. */
export function escalaTalle(prenda: Prenda, talle: string, m: Medidas) {
  const h = holgura(prenda.tabla, prenda.categoria, talle, m);
  const aire = ES_INFERIOR[prenda.categoria] ? h.cadera : h.torso;
  return Math.max(0.8, Math.min(1.4, 1 + (aire - 4) / 40));
}

/**
 * Prenda superpuesta sobre una foto o sobre el video de la cámara.
 * Se puede arrastrar y escalar. Es una vista aproximada: no hay
 * detección del cuerpo, la persona acomoda la prenda a mano.
 */
export function Superpuesta({
  prenda,
  talle,
  medidas,
  fondo,
  posInicial,
}: {
  prenda: Prenda;
  talle: string;
  medidas: Medidas;
  fondo: ReactNode;
  posInicial?: { x: number; y: number };
}) {
  const inferior = ES_INFERIOR[prenda.categoria];
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(posInicial ?? { x: 50, y: inferior ? 68 : 44 });
  const [ajuste, setAjuste] = useState(1);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  useEffect(() => {
    setPos(posInicial ?? { x: 50, y: inferior ? 68 : 44 });
    setAjuste(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prenda.id]);

  const escala = escalaTalle(prenda, talle, medidas) * ajuste;
  const ancho = (inferior ? 40 : 52) * escala;

  return (
    <div>
      <div
        ref={ref}
        className="relative aspect-[3/4] w-full touch-none select-none overflow-hidden rounded-3xl bg-black"
      >
        {fondo}
        <div
          className="absolute cursor-grab active:cursor-grabbing"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: `${ancho}%`,
            transform: "translate(-50%, -50%)",
            transition: drag.current ? "none" : "width 300ms ease",
            filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))",
          }}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            const box = ref.current?.getBoundingClientRect();
            if (!d || !box) return;
            setPos({
              x: Math.max(5, Math.min(95, d.x + ((e.clientX - d.px) / box.width) * 100)),
              y: Math.max(5, Math.min(95, d.y + ((e.clientY - d.py) / box.height) * 100)),
            });
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          <PrendaIlustracion prenda={prenda} fondo={false} className="aspect-[4/5] w-full opacity-95" />
        </div>
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
          <Move className="h-3 w-3" /> Arrastrá la prenda para ubicarla
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 px-1">
        <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Slider className="flex-1" min={0.6} max={1.6} step={0.02} value={[ajuste]} onValueChange={([v]) => setAjuste(v)} />
        <button type="button" onClick={() => setAjuste(1)} className="shrink-0 text-xs font-semibold text-[var(--brand)]">
          Talle {talle}
        </button>
      </div>
    </div>
  );
}
