import { createBrowserRouter, type RouteObject } from "react-router";
import { PanelLayout } from "./components/layout/panel/panel-layout";
import { AppLayout } from "./components/layout/app/app-layout";
import { Portada } from "./pages/portada";
import { Login } from "./pages/login";
import { EnConstruccion } from "./pages/en-construccion";
import { DevFiguras } from "./pages/dev/figuras";
import {
  NAV_ADMIN,
  NAV_TIENDA,
  PANTALLAS_APP,
  TABS_APP,
  type GrupoNav,
  type ItemNav,
} from "./lib/navegacion";

// Mientras se construye cada fase, todas las pantallas del menú existen
// y muestran en qué fase llegan. Cada una se reemplaza por su página real.

const pendiente = (item: ItemNav, base: string, fase: string): RouteObject => {
  const element = <EnConstruccion titulo={item.label} fase={fase} />;
  return item.path === base
    ? { index: true, element }
    : { path: item.path.slice(base.length + 1), element };
};

const desdeGrupos = (grupos: GrupoNav[], base: string, fase: string) =>
  grupos.flatMap((g) => g.items).map((i) => pendiente(i, base, fase));

const extra = (path: string, titulo: string, fase: string): RouteObject => ({
  path,
  element: <EnConstruccion titulo={titulo} fase={fase} />,
});

export const router = createBrowserRouter([
  { path: "/", Component: Portada },
  { path: "/login", Component: Login },
  { path: "/dev/figuras", Component: DevFiguras },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      ...[...TABS_APP, ...PANTALLAS_APP].map((i) => pendiente(i, "/app", "fase 2")),
      extra("bienvenida", "Bienvenida", "fase 2"),
      extra("prenda/:id", "Detalle de prenda", "fase 2"),
      extra("tiendas/:id", "Tienda", "fase 2"),
    ],
  },
  {
    path: "/tienda",
    element: <PanelLayout portal="tienda" />,
    children: desdeGrupos(NAV_TIENDA, "/tienda", "fase 4"),
  },
  {
    path: "/admin",
    element: <PanelLayout portal="admin" />,
    children: [
      ...desdeGrupos(NAV_ADMIN, "/admin", "fase 5"),
      extra("tiendas/:id", "Detalle de tienda", "fase 5"),
      extra("usuarios/:id", "Ficha de usuario", "fase 6"),
    ],
  },
]);
