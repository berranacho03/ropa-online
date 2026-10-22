/** Controles de filtro del admin: búsqueda y selects en una fila. */

import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../ui/utils";

export function Buscador({
  valor,
  onCambio,
  placeholder,
  className,
}: {
  valor: string;
  onCambio: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0 flex-1 sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={valor} onChange={(e) => onCambio(e.target.value)} placeholder={placeholder} className="pl-8" />
    </div>
  );
}

export function FiltroSelect({
  valor,
  onCambio,
  opciones,
  className,
  etiqueta,
}: {
  valor: string;
  onCambio: (v: string) => void;
  opciones: { valor: string; texto: string }[];
  className?: string;
  etiqueta?: string;
}) {
  return (
    <Select value={valor} onValueChange={onCambio}>
      <SelectTrigger className={cn("w-full sm:w-[11rem]", className)} aria-label={etiqueta}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opciones.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.texto}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Normaliza para buscar sin tildes ni mayúsculas. */
export const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
