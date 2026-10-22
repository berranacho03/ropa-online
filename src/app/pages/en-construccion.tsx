import { Hammer } from "lucide-react";
import { PageBody, PageHeader } from "../components/shell";

/** Pantalla provisoria mientras se construye cada fase. */
export function EnConstruccion({ titulo, fase }: { titulo: string; fase: string }) {
  return (
    <>
      <PageHeader titulo={titulo} />
      <PageBody>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-20 text-center">
          <span className="mb-4 rounded-full bg-[var(--brand-100)] p-3">
            <Hammer className="h-6 w-6 text-[var(--brand-700)]" />
          </span>
          <p className="font-medium text-foreground">Esta pantalla llega en la {fase}.</p>
          <p className="mt-1 text-sm text-muted-foreground">Ver PLAN.md, sección 9.</p>
        </div>
      </PageBody>
    </>
  );
}
