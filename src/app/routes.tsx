import { createBrowserRouter } from "react-router";
import { PanelLayout } from "./components/layout/panel/panel-layout";
import { AppLayout } from "./components/layout/app/app-layout";
import { Portada } from "./pages/portada";
import { Login } from "./pages/login";
import { DevFiguras } from "./pages/dev/figuras";

// App de usuario
import { Bienvenida } from "./pages/app/bienvenida";
import { AppInicio } from "./pages/app/inicio";
import { Explorar } from "./pages/app/explorar";
import { AppTienda } from "./pages/app/tienda";
import { PrendaDetalle } from "./pages/app/prenda";
import { Probador } from "./pages/app/probador";
import { MisPruebas } from "./pages/app/pruebas";
import { MisCompras } from "./pages/app/compras";
import { Premium } from "./pages/app/premium";
import { Perfil } from "./pages/app/perfil";
import { MisMedidas } from "./pages/app/medidas";
import { Privacidad } from "./pages/app/privacidad";
import { Ayuda } from "./pages/app/ayuda";

// Portal de tienda
import { TiendaInicio } from "./pages/tienda/inicio";
import { TiendaPrendas } from "./pages/tienda/prendas";
import { TiendaCarga } from "./pages/tienda/carga";
import { TiendaTalles } from "./pages/tienda/talles";
import { TiendaVentas } from "./pages/tienda/ventas";
import { TiendaInsights } from "./pages/tienda/insights";
import { TiendaComisiones } from "./pages/tienda/comisiones";
import { TiendaPerfil } from "./pages/tienda/perfil";
import { TiendaSoporte } from "./pages/tienda/soporte";

// Administración
import { AdminPanel } from "./pages/admin/panel";
import { AdminHipotesis } from "./pages/admin/hipotesis";
import { AdminTiendas } from "./pages/admin/tiendas";
import { AdminTiendaDetalle } from "./pages/admin/tienda-detalle";
import { AdminUsuarios } from "./pages/admin/usuarios";
import { AdminUsuarioDetalle } from "./pages/admin/usuario-detalle";
import { AdminVentas } from "./pages/admin/ventas";
import { AdminPrecision } from "./pages/admin/precision";
import { AdminCatalogo } from "./pages/admin/catalogo";
import { AdminCarga } from "./pages/admin/carga";
import { AdminSuscripciones } from "./pages/admin/suscripciones";
import { AdminMarketing } from "./pages/admin/marketing";
import { AdminProbador } from "./pages/admin/probador";
import { AdminSoporte } from "./pages/admin/soporte";
import { AdminPrivacidad } from "./pages/admin/privacidad";
import { AdminConfiguracion } from "./pages/admin/configuracion";

export const router = createBrowserRouter([
  { path: "/", Component: Portada },
  { path: "/login", Component: Login },
  { path: "/dev/figuras", Component: DevFiguras },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      { index: true, Component: AppInicio },
      { path: "bienvenida", Component: Bienvenida },
      { path: "explorar", Component: Explorar },
      { path: "tiendas/:id", Component: AppTienda },
      { path: "prenda/:id", Component: PrendaDetalle },
      { path: "probador", Component: Probador },
      { path: "pruebas", Component: MisPruebas },
      { path: "compras", Component: MisCompras },
      { path: "premium", Component: Premium },
      { path: "perfil", Component: Perfil },
      { path: "medidas", Component: MisMedidas },
      { path: "privacidad", Component: Privacidad },
      { path: "ayuda", Component: Ayuda },
    ],
  },
  {
    path: "/tienda",
    element: <PanelLayout portal="tienda" />,
    children: [
      { index: true, Component: TiendaInicio },
      { path: "prendas", Component: TiendaPrendas },
      { path: "carga", Component: TiendaCarga },
      { path: "talles", Component: TiendaTalles },
      { path: "ventas", Component: TiendaVentas },
      { path: "insights", Component: TiendaInsights },
      { path: "comisiones", Component: TiendaComisiones },
      { path: "perfil", Component: TiendaPerfil },
      { path: "soporte", Component: TiendaSoporte },
    ],
  },
  {
    path: "/admin",
    element: <PanelLayout portal="admin" />,
    children: [
      { index: true, Component: AdminPanel },
      { path: "hipotesis", Component: AdminHipotesis },
      { path: "tiendas", Component: AdminTiendas },
      { path: "tiendas/:id", Component: AdminTiendaDetalle },
      { path: "usuarios", Component: AdminUsuarios },
      { path: "usuarios/:id", Component: AdminUsuarioDetalle },
      { path: "ventas", Component: AdminVentas },
      { path: "precision", Component: AdminPrecision },
      { path: "catalogo", Component: AdminCatalogo },
      { path: "carga", Component: AdminCarga },
      { path: "suscripciones", Component: AdminSuscripciones },
      { path: "marketing", Component: AdminMarketing },
      { path: "probador", Component: AdminProbador },
      { path: "soporte", Component: AdminSoporte },
      { path: "privacidad", Component: AdminPrivacidad },
      { path: "configuracion", Component: AdminConfiguracion },
    ],
  },
], {
  // Respeta la subcarpeta de GitHub Pages (vite `base`).
  basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/",
});
