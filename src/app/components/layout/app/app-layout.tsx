import { useEffect, useRef } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { BatteryFull, Signal, Wifi } from "lucide-react";
import { INICIO_DE, getUsuario } from "../../../lib/auth";
import { useYo } from "../../../lib/store";
import { TABS_APP } from "../../../lib/navegacion";
import { Toaster } from "../../ui/sonner";
import { cn } from "../../ui/utils";

/**
 * Layout de la app de usuario. En el celular ocupa toda la pantalla;
 * en la computadora se muestra centrada con ancho de teléfono, que es
 * como se va a ver en la presentación.
 */
export function AppLayout() {
  const usuario = getUsuario();
  const location = useLocation();
  const { usuario: yo } = useYo();
  const main = useRef<HTMLElement>(null);

  // Cada pantalla nueva arranca desde arriba (el scroll vive en <main>).
  useEffect(() => {
    main.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol !== "usuario") return <Navigate to={INICIO_DE[usuario.rol]} replace />;

  // Quien no cargó sus medidas pasa primero por el onboarding.
  const enBienvenida = location.pathname.startsWith("/app/bienvenida");
  if (yo && !yo.medidas && !enBienvenida) return <Navigate to="/app/bienvenida" replace />;

  const activo = (path: string) =>
    path === "/app" ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div
      className="flex h-screen justify-center sm:items-center sm:py-6"
      style={{
        background:
          "radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--brand) 28%, transparent) 0%, transparent 70%), var(--ink)",
      }}
    >
      <div className="relative flex h-full w-full max-w-[420px] flex-col overflow-hidden bg-background sm:max-h-[900px] sm:rounded-[2.6rem] sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:ring-[10px] sm:ring-black">
        {/* Barra de estado del teléfono (sólo en pantalla grande, para la presentación) */}
        <div className="hidden h-8 shrink-0 items-center justify-between bg-background px-7 pt-1 text-[12px] font-semibold text-foreground sm:flex">
          <span className="tabular">9:41</span>
          <span className="absolute left-1/2 top-1.5 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
          <span className="flex items-center gap-1">
            <Signal className="h-3.5 w-3.5" />
            <Wifi className="h-3.5 w-3.5" />
            <BatteryFull className="h-4 w-4" />
          </span>
        </div>

        <main ref={main} className="thin-scroll relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>

        {!enBienvenida && (
          <nav className="relative z-30 grid shrink-0 grid-cols-5 border-t border-border bg-card/95 px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] backdrop-blur sm:pb-3">
            {TABS_APP.map((tab) => {
              const act = activo(tab.path);
              const Icon = tab.icon;
              const centro = tab.path === "/app/probador";
              if (centro) {
                return (
                  <Link key={tab.path} to={tab.path} className="flex flex-col items-center gap-1 pb-1.5 text-[10.5px] font-semibold">
                    <span
                      className={cn(
                        "-mt-5 grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg ring-4 ring-card transition-transform active:scale-95",
                        act ? "scale-105" : ""
                      )}
                      style={{
                        background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-700) 100%)",
                        boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--brand) 70%, transparent)",
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={act ? "text-[var(--brand)]" : "text-muted-foreground"}>{tab.label}</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={cn(
                    "relative flex flex-col items-center gap-1 pb-1.5 pt-2.5 text-[10.5px] font-semibold transition-colors",
                    act ? "text-[var(--brand)]" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {act && <span className="absolute top-0 h-[3px] w-6 rounded-b-full bg-[var(--brand)]" />}
                  <Icon className={cn("h-[22px] w-[22px]", act && "stroke-[2.4]")} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}
        <Toaster position="top-center" richColors closeButton={false} />
      </div>
    </div>
  );
}
