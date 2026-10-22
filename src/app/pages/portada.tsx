import { Link } from "react-router";
import { Imagotipo } from "../components/logo";
import { EscenaScroll, LooksEstaticos } from "../components/portada/escena";
import { Cierre, ComoFunciona, Planes, ParaTiendas } from "../components/portada/secciones";
import { useMenosMovimiento } from "../components/portada/use-scrub";

/**
 * Portada pública: una persona fija en el centro que, a medida que
 * scrolleás, cambia de look. Cada look muestra el talle recomendado.
 */
export function Portada() {
  const menosMovimiento = useMenosMovimiento();
  return (
    <div className="min-h-screen bg-[var(--ink)] text-white">
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-white/5 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--ink) 72%, transparent)" }}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-8 lg:h-16 lg:px-12">
          <Link to="/" aria-label="Inicio">
            <Imagotipo size={28} claro />
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-white/10"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <main>
        {menosMovimiento ? (
          <div className="relative pt-14">
            <div className="ropa-grid absolute inset-0 opacity-40" />
            <LooksEstaticos />
          </div>
        ) : (
          <EscenaScroll />
        )}
        <ComoFunciona />
        <ParaTiendas />
        <Planes />
        <Cierre />
      </main>
    </div>
  );
}
