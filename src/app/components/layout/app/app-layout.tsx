import { Link, Navigate, Outlet, useLocation } from "react-router";
import { INICIO_DE, getUsuario } from "../../../lib/auth";
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

  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol !== "usuario") return <Navigate to={INICIO_DE[usuario.rol]} replace />;

  const activo = (path: string) =>
    path === "/app" ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen justify-center bg-[var(--ink)] sm:py-6">
      <div className="relative flex h-full w-full max-w-[420px] flex-col overflow-hidden bg-background sm:rounded-[2.25rem] sm:shadow-2xl sm:ring-8 sm:ring-black">
        <main className="thin-scroll min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <nav className="grid shrink-0 grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
          {TABS_APP.map((tab) => {
            const act = activo(tab.path);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  act ? "text-[var(--brand)]" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <Toaster position="top-center" />
      </div>
    </div>
  );
}
