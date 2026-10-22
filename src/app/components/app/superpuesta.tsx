import { useEffect, useRef, useState, type MutableRefObject, type PointerEvent, type ReactNode } from "react";
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

/** Corrimiento (en % del cuadro) y escala que la persona agrega a mano. */
export interface AjusteFino {
  dx: number;
  dy: number;
  escala: number;
}

/**
 * Prenda superpuesta sobre una foto o sobre el video de la cámara.
 * Se puede arrastrar y escalar a mano.
 *
 * Con `seguida`, la prenda la dibuja otra capa (que sigue el cuerpo) y
 * el arrastre y la escala pasan a ser un ajuste fino sobre esa capa,
 * que se informa por `ajusteFino`.
 */
export function Superpuesta({
  prenda,
  talle,
  medidas,
  fondo,
  posInicial,
  seguida,
  ajusteFino,
  aviso,
}: {
  prenda: Prenda;
  talle: string;
  medidas: Medidas;
  fondo: ReactNode;
  posInicial?: { x: number; y: number };
  /** Capa con la prenda que sigue el cuerpo; reemplaza a la prenda manual. */
  seguida?: ReactNode;
  ajusteFino?: MutableRefObject<AjusteFino>;
  /** Reemplaza el aviso de arriba a la izquierda. */
  aviso?: ReactNode;
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

  // Si hay seguimiento, el arrastre se vuelve un corrimiento sobre la capa seguida.
  const [fino, setFino] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (ajusteFino) ajusteFino.current = { dx: fino.x, dy: fino.y, escala: ajuste };
  }, [ajusteFino, fino, ajuste]);
  useEffect(() => setFino({ x: 0, y: 0 }), [prenda.id]);

  const escala = escalaTalle(prenda, talle, medidas) * ajuste;
  const ancho = (inferior ? 40 : 52) * escala;
  const siguiendo = seguida != null;

  const arrastre = {
    onPointerDown: (e: PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      const base = siguiendo ? fino : pos;
      drag.current = { px: e.clientX, py: e.clientY, x: base.x, y: base.y };
    },
    onPointerMove: (e: PointerEvent) => {
      const d = drag.current;
      const box = ref.current?.getBoundingClientRect();
      if (!d || !box) return;
      const nx = d.x + ((e.clientX - d.px) / box.width) * 100;
      const ny = d.y + ((e.clientY - d.py) / box.height) * 100;
      if (siguiendo) setFino({ x: Math.max(-30, Math.min(30, nx)), y: Math.max(-30, Math.min(30, ny)) });
      else setPos({ x: Math.max(5, Math.min(95, nx)), y: Math.max(5, Math.min(95, ny)) });
    },
    onPointerUp: () => (drag.current = null),
    onPointerCancel: () => (drag.current = null),
  };

  return (
    <div>
      <div
        ref={ref}
        className="relative aspect-[3/4] w-full touch-none select-none overflow-hidden rounded-3xl bg-black"
      >
        {fondo}
        {siguiendo ? (
          <div className="absolute inset-0 cursor-grab active:cursor-grabbing" {...arrastre}>
            {seguida}
          </div>
        ) : (
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
            {...arrastre}
          >
            <PrendaIlustracion prenda={prenda} fondo={false} className="aspect-[4/5] w-full opacity-95" />
          </div>
        )}
        {aviso ?? (
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            <Move className="h-3 w-3" /> Arrastrá la prenda para ubicarla
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 px-1">
        {siguiendo ? (
          <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">Ajuste fino</span>
        ) : (
          <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <Slider
          className="flex-1"
          min={siguiendo ? 0.8 : 0.6}
          max={siguiendo ? 1.25 : 1.6}
          step={0.01}
          value={[ajuste]}
          onValueChange={([v]) => setAjuste(v)}
          aria-label={siguiendo ? "Ajuste fino del tamaño" : "Tamaño de la prenda"}
        />
        <button
          type="button"
          onClick={() => {
            setAjuste(1);
            setFino({ x: 0, y: 0 });
          }}
          className="shrink-0 text-xs font-semibold text-[var(--brand)]"
        >
          {siguiendo ? "Restablecer" : `Talle ${talle}`}
        </button>
      </div>
    </div>
  );
}
