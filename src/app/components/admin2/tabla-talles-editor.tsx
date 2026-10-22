/**
 * Editor de la tabla de talles de una prenda: talle × zona, con el
 * rango de cuerpo (mín–máx en cm) que le queda bien a cada talle.
 * Una celda vacía es una medida faltante (tabla incompleta).
 */

import { useMemo } from "react";
import { cn } from "../ui/utils";
import { NOMBRE_ZONA, PESOS, type Categoria, type TablaTalles, type Zona } from "../../lib/talles";

export type Borrador = Record<string, Partial<Record<Zona, [string, string]>>>;

const ORDEN_ZONAS: Zona[] = ["pecho", "cintura", "cadera", "altura"];

export function zonasDe(categoria: Categoria, tabla: TablaTalles): Zona[] {
  const set = new Set<Zona>(Object.keys(PESOS[categoria]) as Zona[]);
  for (const fila of Object.values(tabla)) for (const z of Object.keys(fila) as Zona[]) set.add(z);
  return ORDEN_ZONAS.filter((z) => set.has(z));
}

export function aBorrador(tabla: TablaTalles, talles: string[], zonas: Zona[]): Borrador {
  const b: Borrador = {};
  for (const t of talles) {
    b[t] = {};
    for (const z of zonas) {
      const r = tabla[t]?.[z];
      b[t][z] = r ? [String(r[0]), String(r[1])] : ["", ""];
    }
  }
  return b;
}

export type ErrorCelda = "vacia" | "invertida" | null;

export function errorDe(par: [string, string] | undefined): ErrorCelda {
  if (!par || par[0].trim() === "" || par[1].trim() === "") return "vacia";
  const a = Number(par[0].replace(",", "."));
  const b = Number(par[1].replace(",", "."));
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= a) return "invertida";
  return null;
}

/** Convierte el borrador en tabla. Las celdas vacías o inválidas se omiten. */
export function aTabla(b: Borrador, talles: string[], zonas: Zona[]): TablaTalles {
  const out: TablaTalles = {};
  for (const t of talles) {
    out[t] = {};
    for (const z of zonas) {
      const par = b[t]?.[z];
      if (errorDe(par) === null) {
        out[t][z] = [Number(par![0].replace(",", ".")), Number(par![1].replace(",", "."))];
      }
    }
  }
  return out;
}

export function TablaTallesEditor({
  talles,
  zonas,
  borrador,
  onChange,
}: {
  talles: string[];
  zonas: Zona[];
  borrador: Borrador;
  onChange: (b: Borrador) => void;
}) {
  const set = (t: string, z: Zona, i: 0 | 1, v: string) => {
    const par: [string, string] = [...(borrador[t]?.[z] ?? ["", ""])] as [string, string];
    par[i] = v.replace(/[^\d.,]/g, "");
    onChange({ ...borrador, [t]: { ...borrador[t], [z]: par } });
  };

  const errores = useMemo(() => {
    let vacias = 0;
    let invertidas = 0;
    for (const t of talles)
      for (const z of zonas) {
        const e = errorDe(borrador[t]?.[z]);
        if (e === "vacia") vacias++;
        if (e === "invertida") invertidas++;
      }
    return { vacias, invertidas };
  }, [borrador, talles, zonas]);

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Talle</th>
              {zonas.map((z) => (
                <th key={z} className="px-2 py-2 text-left font-medium">
                  {NOMBRE_ZONA[z]} <span className="font-normal">(cm)</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {talles.map((t) => (
              <tr key={t} className="border-t border-border">
                <td className="px-3 py-1.5 font-semibold">{t}</td>
                {zonas.map((z) => {
                  const par = borrador[t]?.[z] ?? ["", ""];
                  const e = errorDe(par);
                  return (
                    <td key={z} className="px-2 py-1.5">
                      <div
                        className={cn(
                          "flex w-fit items-center gap-1 rounded-md border px-1 py-0.5",
                          e === "vacia" && "border-amber-300 bg-amber-50",
                          e === "invertida" && "border-red-300 bg-red-50",
                          e === null && "border-border"
                        )}
                      >
                        <input
                          aria-label={`${NOMBRE_ZONA[z]} mínimo, talle ${t}`}
                          inputMode="decimal"
                          value={par[0]}
                          onChange={(ev) => set(t, z, 0, ev.target.value)}
                          className="tabular w-10 bg-transparent px-1 py-0.5 text-right outline-none"
                          placeholder="—"
                        />
                        <span className="text-muted-foreground">–</span>
                        <input
                          aria-label={`${NOMBRE_ZONA[z]} máximo, talle ${t}`}
                          inputMode="decimal"
                          value={par[1]}
                          onChange={(ev) => set(t, z, 1, ev.target.value)}
                          className="tabular w-10 bg-transparent px-1 py-0.5 text-right outline-none"
                          placeholder="—"
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {errores.vacias === 0 && errores.invertidas === 0 ? (
          <span className="text-[var(--brand-700)]">Tabla completa: todos los talles tienen sus medidas.</span>
        ) : (
          <>
            {errores.vacias > 0 && (
              <span className="text-amber-700">
                {errores.vacias} medida{errores.vacias === 1 ? "" : "s"} sin cargar.{" "}
              </span>
            )}
            {errores.invertidas > 0 && (
              <span className="text-red-700">
                {errores.invertidas} rango{errores.invertidas === 1 ? "" : "s"} inválido{errores.invertidas === 1 ? "" : "s"} (el mínimo tiene que ser menor que el máximo).
              </span>
            )}
          </>
        )}
      </p>
    </div>
  );
}
