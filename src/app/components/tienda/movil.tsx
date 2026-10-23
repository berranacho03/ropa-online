/** Piezas para que las pantallas del portal de tienda se lean bien en el celular. */

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { cn } from "../ui/utils";

/** Buscador con lupa. En el celular ocupa todo el ancho disponible. */
export function Buscador({
  valor,
  onCambio,
  placeholder = "Buscar prenda",
  className,
}: {
  valor: string;
  onCambio: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" value={valor} onChange={(e) => onCambio(e.target.value)} placeholder={placeholder} className="h-9 w-full pl-8" />
    </div>
  );
}

/**
 * Barra de filtros para el celular (se oculta desde md): el buscador a lo ancho
 * y un botón «Filtros» que abre una hoja desde abajo con los selectores apilados.
 */
export function FiltrosMovil({
  busqueda,
  activos,
  onLimpiar,
  children,
  className,
}: {
  busqueda?: React.ReactNode;
  /** Cuántos filtros están aplicados (para el contador del botón). */
  activos: number;
  onLimpiar?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className={cn("flex items-center gap-2 border-b border-border p-3 md:hidden", className)}>
      <div className="min-w-0 flex-1">{busqueda}</div>
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 shrink-0">
            <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Filtros
            {activos > 0 && (
              <span className="ml-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand)] px-1 text-[11px] font-semibold text-white">
                {activos}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="portal-tienda max-h-[85dvh] gap-0 rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>La lista se actualiza al instante.</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 overflow-y-auto px-4 pb-2">{children}</div>
          <SheetFooter className="flex-row gap-2">
            {onLimpiar && (
              <Button variant="outline" className="flex-1" disabled={activos === 0} onClick={onLimpiar}>
                Limpiar
              </Button>
            )}
            <Button className="flex-1" onClick={() => setAbierto(false)}>
              Ver resultados
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Etiqueta encima de un selector dentro de la hoja de filtros. */
export function CampoFiltro({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
      {children}
    </div>
  );
}

/** Grilla de 2 columnas etiqueta/valor para los datos secundarios de una tarjeta. */
export function DatosTarjeta({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-2", className)}>{children}</dl>;
}

export function DatoTarjeta({ etiqueta, children, className }: { etiqueta: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Lista de tarjetas: una columna en el celular y dos entre md y xl (desde xl se ve la tabla).
 * Los bordes se arman a mano para que la grilla no quede con líneas dobles.
 */
export const LISTA_TARJETAS =
  "divide-y divide-border xl:hidden md:grid md:grid-cols-2 md:divide-y-0 md:[&>li]:border-b md:[&>li]:border-border md:[&>li:nth-child(odd)]:border-r md:[&>li:nth-last-child(-n+2)]:border-b-0 md:[&>li:nth-child(odd):last-child]:border-r-0";
