import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Progreso (0 a 1) del scroll a lo largo de una sección alta: 0 cuando su
 * borde de arriba toca el de la ventana, 1 cuando su borde de abajo toca el
 * de abajo. Un único listener de scroll + requestAnimationFrame; el callback
 * escribe directo en el DOM, así la página no se vuelve a renderizar en cada
 * cuadro.
 */
export function useScrub(ref: RefObject<HTMLElement | null>, onFrame: (p: number) => void, activo = true) {
  const cb = useRef(onFrame);
  cb.current = onFrame;

  useEffect(() => {
    if (!activo) return;
    let raf = 0;
    const calcular = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const recorrido = r.height - window.innerHeight;
      const p = recorrido > 0 ? Math.min(1, Math.max(0, -r.top / recorrido)) : 0;
      cb.current(p);
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(calcular);
    };
    calcular();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, activo]);
}

/** true si el sistema pide reducir el movimiento. */
export function useMenosMovimiento() {
  const consulta = "(prefers-reduced-motion: reduce)";
  const [menos, setMenos] = useState(() => typeof window !== "undefined" && window.matchMedia(consulta).matches);
  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const cambio = () => setMenos(mq.matches);
    mq.addEventListener("change", cambio);
    return () => mq.removeEventListener("change", cambio);
  }, []);
  return menos;
}
