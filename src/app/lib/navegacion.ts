import {
  BadgePercent,
  BarChart3,
  Bot,
  Camera,
  Compass,
  Crown,
  FileSpreadsheet,
  FlaskConical,
  HandCoins,
  Heart,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Ruler,
  Settings,
  Shirt,
  ShieldCheck,
  ShoppingBag,
  Store,
  Target,
  Undo2,
  User,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

export type ItemNav = {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type GrupoNav = { label?: string; items: ItemNav[] };

// ── Panel de administración ─────────────────────────────────

export const NAV_ADMIN: GrupoNav[] = [
  {
    items: [
      { path: "/admin", label: "Panel general", icon: LayoutDashboard },
      { path: "/admin/hipotesis", label: "Hipótesis y riesgos", icon: FlaskConical },
    ],
  },
  {
    label: "Tiendas",
    items: [
      { path: "/admin/tiendas", label: "Tiendas asociadas", icon: Store },
      { path: "/admin/catalogo", label: "Catálogo de prendas", icon: Shirt },
      { path: "/admin/carga", label: "Carga de catálogo", icon: FileSpreadsheet },
    ],
  },
  {
    label: "Usuarios",
    items: [
      { path: "/admin/usuarios", label: "Usuarios", icon: Users },
      { path: "/admin/suscripciones", label: "Suscripciones e ingresos", icon: Crown },
    ],
  },
  {
    label: "Negocio",
    items: [
      { path: "/admin/ventas", label: "Ventas y comisiones", icon: HandCoins },
      { path: "/admin/marketing", label: "Marketing", icon: Megaphone },
    ],
  },
  {
    label: "Producto",
    items: [
      { path: "/admin/precision", label: "Precisión de talles", icon: Target },
      { path: "/admin/probador", label: "Probador y costos de IA", icon: Bot },
    ],
  },
  {
    label: "Operación",
    items: [
      { path: "/admin/soporte", label: "Soporte", icon: LifeBuoy },
      { path: "/admin/privacidad", label: "Privacidad y datos", icon: ShieldCheck },
      { path: "/admin/configuracion", label: "Configuración", icon: Settings },
    ],
  },
];

// ── Portal de tienda ────────────────────────────────────────

export const NAV_TIENDA: GrupoNav[] = [
  {
    items: [{ path: "/tienda", label: "Mi tienda", icon: LayoutDashboard }],
  },
  {
    label: "Catálogo",
    items: [
      { path: "/tienda/prendas", label: "Mis prendas", icon: Shirt },
      { path: "/tienda/carga", label: "Cargar catálogo", icon: FileSpreadsheet },
      { path: "/tienda/talles", label: "Tablas de talles", icon: Ruler },
    ],
  },
  {
    label: "Ventas",
    items: [
      { path: "/tienda/ventas", label: "Ventas y devoluciones", icon: Undo2 },
      { path: "/tienda/insights", label: "Insights de talles", icon: BarChart3 },
      { path: "/tienda/comisiones", label: "Comisiones", icon: BadgePercent },
    ],
  },
  {
    label: "Cuenta",
    items: [
      { path: "/tienda/perfil", label: "Perfil de tienda", icon: Store },
      { path: "/tienda/soporte", label: "Soporte", icon: LifeBuoy },
    ],
  },
];

// ── App de usuario ──────────────────────────────────────────

/** Pestañas de la barra inferior. */
export const TABS_APP: ItemNav[] = [
  { path: "/app", label: "Inicio", icon: Home },
  { path: "/app/explorar", label: "Explorar", icon: Compass },
  { path: "/app/probador", label: "Probador", icon: Camera },
  { path: "/app/compras", label: "Compras", icon: ShoppingBag },
  { path: "/app/perfil", label: "Perfil", icon: User },
];

/** Pantallas de la app que no son pestañas. */
export const PANTALLAS_APP: ItemNav[] = [
  { path: "/app/pruebas", label: "Mis pruebas", icon: Heart },
  { path: "/app/premium", label: "Premium", icon: Crown },
  { path: "/app/privacidad", label: "Privacidad", icon: ShieldCheck },
  { path: "/app/ayuda", label: "Ayuda", icon: LifeBuoy },
  { path: "/app/medidas", label: "Mis medidas", icon: Ruler },
];

