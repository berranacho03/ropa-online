import { useNavigate } from "react-router";
import { ChevronDown, LogOut, ShieldCheck, Store } from "lucide-react";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { getUsuario, logout } from "../../../lib/auth";
import { HOY } from "../../../data/azar";
import { fechaLarga } from "../../../lib/format";

export function PanelTopbar({ contexto }: { contexto: string }) {
  const navigate = useNavigate();
  const usuario = getUsuario();
  const esAdmin = usuario?.rol === "admin";

  const salir = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:gap-4 lg:px-6">
      <div className="w-10 lg:hidden" />

      <div className="hidden items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-1.5 md:flex">
        {esAdmin ? (
          <ShieldCheck className="h-4 w-4 text-[var(--brand)]" />
        ) : (
          <Store className="h-4 w-4 text-[var(--brand)]" />
        )}
        <span className="text-sm text-foreground">{contexto}</span>
      </div>

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        <div className="hidden border-r border-border pr-3 text-right text-sm xl:block">
          <div className="font-medium text-foreground">{fechaLarga(HOY)}</div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md py-1 pl-2 pr-2 transition-colors hover:bg-muted">
              <Avatar className="h-9 w-9 border-2 border-[var(--brand)]">
                <AvatarFallback className="bg-[var(--brand)] text-sm text-white">
                  {usuario?.iniciales ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium leading-tight text-foreground">
                  {usuario?.nombre}
                </p>
                <p className="text-xs leading-tight text-muted-foreground">{usuario?.cargo}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{usuario?.nombre}</p>
              <p className="text-xs font-normal text-muted-foreground">{usuario?.email}</p>
              <Badge className="mt-1.5 gap-1 bg-[var(--brand)] text-white">{contexto}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={salir}
              className="text-red-600 focus:bg-red-50 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
