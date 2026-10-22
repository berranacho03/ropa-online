import { cn } from "./ui/utils";
import { MARCA } from "../lib/marca";

/** Isotipo: una remera dentro del cuadrado de marca. */
export function Isotipo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="var(--brand)" />
      <path d="M11 8h4l1 2 1-2h4l4 4-3 3-1-1v10H11V14l-1 1-3-3z" fill="#fff" />
    </svg>
  );
}

export function Imagotipo({
  size = 32,
  claro = false,
  className,
}: {
  size?: number;
  /** Texto blanco, para fondos oscuros. */
  claro?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Isotipo size={size} />
      <span
        className={cn("font-display font-bold", claro ? "text-white" : "text-foreground")}
        style={{ fontSize: size * 0.72, lineHeight: 1 }}
      >
        {MARCA.nombre}
      </span>
    </span>
  );
}
