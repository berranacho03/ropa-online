import { Maniqui, personaPara } from "../figura/maniqui";
import type { Medidas, PreferenciaCalce } from "../../lib/talles";
import { cn } from "../ui/utils";

// Alturas de cada zona en el viewBox del maniquí (240 × 540).
const LINEAS = [
  { zona: "Pecho", y: 145, n: 1, texto: "Pasá la cinta por la parte más ancha, bajo las axilas." },
  { zona: "Cintura", y: 205, n: 2, texto: "En la parte más angosta, un poco arriba del ombligo." },
  { zona: "Cadera", y: 250, n: 3, texto: "Por la parte más ancha de la cola, con los pies juntos." },
];

/** Guía visual de dónde medirse: una silueta con la cinta en cada zona. */
export function GuiaMedidas({ medidas }: { medidas: Medidas }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-[var(--brand-50)] p-3">
      <div className="relative aspect-[240/540] h-[210px] shrink-0">
        <Maniqui persona={personaPara(medidas)} puestas={[]} sombraPiso={false} className="opacity-90" />
        {LINEAS.map((l) => (
          <div key={l.zona} className="absolute inset-x-[8%]" style={{ top: `${(l.y / 540) * 100}%` }}>
            <div className="h-0 border-t-2 border-dashed border-[var(--brand)]" />
            <span className="absolute -right-2 -top-2.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--brand)] text-[10px] font-bold text-white">
              {l.n}
            </span>
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-col justify-center gap-2.5">
        <p className="text-[13px] font-bold text-[var(--brand-700)]">Dónde medirte</p>
        {LINEAS.map((l) => (
          <div key={l.zona} className="flex gap-2">
            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-[9px] font-bold text-white">
              {l.n}
            </span>
            <p className="text-[11.5px] leading-snug text-[var(--ink-700)]">
              <b>{l.zona}.</b> {l.texto}
            </p>
          </div>
        ))}
        <p className="text-[11px] text-[var(--ink-500)]">La cinta firme pero sin apretar, sobre ropa liviana.</p>
      </div>
    </div>
  );
}

const CALCES: { id: PreferenciaCalce; titulo: string; texto: string; aire: number }[] = [
  { id: "ajustado", titulo: "Ajustado", texto: "Al cuerpo", aire: 0 },
  { id: "regular", titulo: "Regular", texto: "Ni muy muy, ni tan tan", aire: 1 },
  { id: "holgado", titulo: "Holgado", texto: "Suelto, con aire", aire: 2 },
];

/** Selector del calce preferido, con un dibujito de remera para cada uno. */
export function ElegirCalce({ valor, onChange }: { valor: PreferenciaCalce; onChange: (v: PreferenciaCalce) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {CALCES.map((c) => {
        const act = valor === c.id;
        const w = 9 + c.aire * 3;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={cn(
              "flex flex-col items-center rounded-2xl border-2 bg-card px-2 py-3 transition-all",
              act ? "border-[var(--brand)] bg-[var(--brand-50)]" : "border-transparent ring-1 ring-border"
            )}
          >
            <svg viewBox="0 0 48 40" className="h-9 w-11">
              <path
                d={`M${24 - w},6 L${24 - w - 8},12 L${24 - w - 5},19 L${24 - w},17 L${24 - w + c.aire},36 L${24 + w - c.aire},36 L${24 + w},17 L${24 + w + 5},19 L${24 + w + 8},12 L${24 + w},6 Q24,11 ${24 - w},6 Z`}
                fill={act ? "var(--brand)" : "var(--ink-700)"}
                opacity={act ? 1 : 0.75}
              />
            </svg>
            <span className="mt-1 text-[13px] font-semibold">{c.titulo}</span>
            <span className="text-[10.5px] leading-tight text-muted-foreground">{c.texto}</span>
          </button>
        );
      })}
    </div>
  );
}

export const NOMBRE_CALCE: Record<PreferenciaCalce, string> = {
  ajustado: "Ajustado",
  regular: "Regular",
  holgado: "Holgado",
};
