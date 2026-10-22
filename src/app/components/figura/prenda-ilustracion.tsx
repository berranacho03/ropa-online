import { useId } from "react";
import { CUERPO_CATALOGO, aclarar } from "./cuerpo";
import { DibujoPrenda, HOLGURA_NEUTRA, type PrendaDibujo } from "./prendas-svg";
import type { Categoria } from "../../lib/talles";
import { cn } from "../ui/utils";

/** Recorte del viewBox según la categoría: la prenda llena el cuadro. */
const RECORTE: Record<Categoria, string> = {
  remera: "34 88 172 196",
  buzo: "30 70 180 236",
  camisa: "30 86 180 216",
  campera: "28 86 184 220",
  vestido: "0 96 240 330",
  jean: "26 196 188 316",
  pantalon: "26 196 188 316",
  short: "48 196 144 152",
  pollera: "30 196 180 216",
};

/**
 * "Foto de producto": la prenda sola sobre un fondo suave del mismo
 * color, como en un e-commerce.
 */
export function PrendaIlustracion({
  prenda,
  className,
  fondo = true,
}: {
  prenda: PrendaDibujo;
  className?: string;
  fondo?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const vb = prenda.categoria === "vestido" && prenda.nombre.toLowerCase().includes("largo") ? "0 96 240 384" : RECORTE[prenda.categoria];
  return (
    <div
      className={cn("flex items-center justify-center overflow-hidden", className)}
      style={fondo ? { background: aclarar(prenda.color, 0.82) } : undefined}
    >
      <svg viewBox={vb} className="h-[86%] w-[86%]" role="img" aria-label={prenda.nombre}>
        <DibujoPrenda prenda={prenda} cuerpo={CUERPO_CATALOGO} holgura={HOLGURA_NEUTRA} uid={uid} />
      </svg>
    </div>
  );
}
