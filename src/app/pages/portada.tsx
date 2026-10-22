import { Link } from "react-router";
import { Imagotipo } from "../components/logo";
import { MARCA } from "../lib/marca";

/**
 * Portada pública. Provisoria: la animación de scroll con la persona
 * que cambia de look llega en la fase 3 (PLAN.md, sección 3 bis).
 */
export function Portada() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--ink)] text-white">
      <div className="ropa-grid absolute inset-0" />
      <div
        className="absolute left-1/2 top-1/3 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)" }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
        <Imagotipo size={32} claro />
        <Link
          to="/login"
          className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
        >
          Iniciar sesión
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-300)]">
          {MARCA.bajada}
        </p>
        <h1 className="font-display max-w-3xl text-5xl font-bold leading-[1.02] sm:text-7xl">
          ¿Cuál es tu talle <span className="text-[var(--brand-300)]">en esta tienda?</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/60">
          Te decimos qué talle te queda en cada prenda y te dejamos probártela
          antes de comprarla.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/login"
            className="rounded-full bg-[var(--brand)] px-7 py-3 font-medium transition-colors hover:bg-[var(--brand-600)]"
          >
            Crear mi perfil
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-white/20 px-7 py-3 font-medium transition-colors hover:bg-white/10"
          >
            Soy una tienda
          </Link>
        </div>
      </main>
    </div>
  );
}
