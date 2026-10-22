import { useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronLeft, Menu, X } from "lucide-react";
import { cn } from "../../ui/utils";
import { Imagotipo, Isotipo } from "../../logo";
import type { GrupoNav } from "../../../lib/navegacion";

export function PanelSidebar({
  grupos,
  titulo,
  inicio,
}: {
  grupos: GrupoNav[];
  /** Rótulo del portal, debajo del logo. */
  titulo: string;
  /** Ruta raíz del portal: sólo se marca activa si coincide exacto. */
  inicio: string;
}) {
  const [colapsado, setColapsado] = useState(false);
  const [abiertoMovil, setAbiertoMovil] = useState(false);
  const location = useLocation();

  const activo = (path: string) =>
    path === inicio ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <>
      {/* Disparador móvil */}
      <button
        onClick={() => setAbiertoMovil(!abiertoMovil)}
        className="fixed left-4 top-3.5 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ink)] shadow-lg lg:hidden"
        aria-label={abiertoMovil ? "Cerrar menú" : "Abrir menú"}
      >
        {abiertoMovil ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <Menu className="h-5 w-5 text-white" />
        )}
      </button>

      {abiertoMovil && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setAbiertoMovil(false)}
        />
      )}

      <aside
        className={cn(
          "relative z-40 flex flex-col border-r border-white/10 bg-[var(--ink)] transition-all duration-300",
          "fixed inset-y-0 left-0 lg:relative",
          colapsado ? "lg:w-16" : "lg:w-64",
          abiertoMovil ? "flex w-64" : "hidden lg:flex"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-white/10 px-4">
          {colapsado ? <Isotipo size={30} /> : <Imagotipo size={30} claro />}
        </div>

        {!colapsado && (
          <div className="border-b border-white/10 px-4 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-300)]">
              {titulo}
            </p>
          </div>
        )}

        <nav className="sidebar-nav flex-1 overflow-y-auto px-2 py-3">
          {grupos.map((grupo, gi) => (
            <div key={gi} className={cn(gi > 0 && "mt-4")}>
              {grupo.label && !colapsado && (
                <p className="mb-1 select-none px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                  {grupo.label}
                </p>
              )}
              {grupo.label && colapsado && gi > 0 && (
                <div className="mx-2 mb-2 border-t border-white/10" />
              )}
              <ul className="space-y-0.5">
                {grupo.items.map((item) => {
                  const act = activo(item.path);
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setAbiertoMovil(false)}
                        title={colapsado ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                          act
                            ? "bg-[var(--brand)] text-white"
                            : "text-white/75 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0",
                            act ? "text-white" : "text-white/60 group-hover:text-white"
                          )}
                        />
                        {!colapsado && (
                          <span className="flex-1 truncate text-sm font-medium">
                            {item.label}
                          </span>
                        )}
                        {act && (
                          <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {!colapsado && (
          <div className="border-t border-white/10 px-4 py-3">
            <p className="text-[10px] leading-relaxed text-white/35">
              Datos de ejemplo · demostración
            </p>
          </div>
        )}

        <button
          onClick={() => setColapsado(!colapsado)}
          className="absolute -right-3 top-20 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] shadow-sm transition-colors hover:bg-[var(--brand-600)] lg:flex"
          title={colapsado ? "Expandir" : "Contraer"}
        >
          <ChevronLeft
            className={cn("h-4 w-4 text-white transition-transform", colapsado && "rotate-180")}
          />
        </button>
      </aside>
    </>
  );
}
