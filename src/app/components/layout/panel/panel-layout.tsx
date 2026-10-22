import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { PanelSidebar } from "./panel-sidebar";
import { PanelTopbar } from "./panel-topbar";
import { Toaster } from "../../ui/sonner";
import { INICIO_DE, getUsuario } from "../../../lib/auth";
import { NAV_ADMIN, NAV_TIENDA } from "../../../lib/navegacion";
import { cn } from "../../ui/utils";
import { useStore } from "../../../lib/store";

/** Layout con sidebar, compartido por la administración y el portal de tienda. */
export function PanelLayout({ portal }: { portal: "admin" | "tienda" }) {
  const usuario = getUsuario();
  const { tiendas } = useStore();

  // Menús, diálogos y hojas se montan en <body>, fuera de este layout:
  // para que tomen el acento turquesa, la clase del portal va en el body.
  useEffect(() => {
    if (portal !== "tienda") return;
    document.body.classList.add("portal-tienda");
    return () => document.body.classList.remove("portal-tienda");
  }, [portal]);

  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol !== portal) return <Navigate to={INICIO_DE[usuario.rol]} replace />;

  const esAdmin = portal === "admin";
  const tienda = tiendas.find((t) => t.id === usuario.tiendaId);
  const contexto = esAdmin
    ? "Plataforma completa"
    : tienda?.estado === "onboarding"
      ? `${tienda.nombre} · en alta`
      : (tienda?.nombre ?? "Tienda");

  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden bg-background",
        !esAdmin && "portal-tienda"
      )}
    >
      <PanelSidebar
        grupos={esAdmin ? NAV_ADMIN : NAV_TIENDA}
        titulo={esAdmin ? "Administración" : "Portal de tienda"}
        inicio={esAdmin ? "/admin" : "/tienda"}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <PanelTopbar contexto={contexto} />
        <main className="thin-scroll min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
