import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Store } from "lucide-react";
import { Barra, Chip, PageBody, PageHeader, Panel } from "../../components/shell";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { CargaCatalogo } from "../../components/carga-catalogo";
import { useStore } from "../../lib/store";
import { resumenTiendas } from "../../lib/metricas";
import { fecha, relativo } from "../../lib/format";
import { HOY } from "../../data/seed";
import { cn } from "../../components/ui/utils";

export function AdminCarga() {
  const { tiendas, prendas, ventas } = useStore();

  const enAlta = useMemo(
    () => resumenTiendas(tiendas.filter((t) => t.estado === "onboarding"), prendas, ventas),
    [tiendas, prendas, ventas]
  );
  const otras = useMemo(
    () => tiendas.filter((t) => t.estado !== "onboarding").sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [tiendas]
  );
  const [tiendaId, setTiendaId] = useState(enAlta[0]?.tienda.id ?? tiendas[0]?.id ?? "");
  const actual = tiendas.find((t) => t.id === tiendaId);

  return (
    <>
      <PageHeader
        titulo="Carga de catálogo"
        bajada="El equipo comercial carga el catálogo en nombre de una tienda: subí el CSV con prendas y tabla de talles, revisá la vista previa y publicá."
      />
      <PageBody className="space-y-6">
        <Panel
          titulo="Tiendas en alta"
          bajada="Lo que falta para que cada tienda nueva quede con su catálogo publicado y todas sus tablas completas."
          bodyClassName="p-0"
        >
          {enAlta.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No hay tiendas en onboarding.</p>
          ) : (
            <ul className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
              {enAlta.map((r) => {
                const pctCompletas = r.prendas ? (r.completas / r.prendas) * 100 : 0;
                const elegida = r.tienda.id === tiendaId;
                return (
                  <li key={r.tienda.id} className="sm:border-r sm:border-border sm:last:border-r-0">
                    <button
                      type="button"
                      onClick={() => setTiendaId(r.tienda.id)}
                      className={cn(
                        "w-full p-4 text-left transition-colors hover:bg-muted/50",
                        elegida && "bg-[var(--brand-50)]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: r.tienda.color }} />
                          <span className="truncate font-medium">{r.tienda.nombre}</span>
                        </div>
                        {elegida ? (
                          <Chip className="border-[var(--brand-300)] bg-card text-[var(--brand-700)]">Cargando</Chip>
                        ) : (
                          <span className="text-xs text-muted-foreground">alta {relativo(r.tienda.fechaAlta, HOY)}</span>
                        )}
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Prendas</dt>
                          <dd className="tabular text-base font-semibold text-foreground">{r.prendas}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Publicadas</dt>
                          <dd className="tabular text-base font-semibold text-foreground">{r.publicadas}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Tablas OK</dt>
                          <dd className="tabular text-base font-semibold text-foreground">
                            {r.prendas ? `${Math.round(pctCompletas)} %` : "—"}
                          </dd>
                        </div>
                      </dl>
                      <Barra valor={r.completas} max={Math.max(1, r.prendas)} className="mt-3" />
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {r.prendas === 0
                          ? "Todavía no cargó ninguna prenda."
                          : r.completas === r.prendas
                            ? "Todas las tablas completas: lista para publicar."
                            : `${r.prendas - r.completas} prenda${r.prendas - r.completas === 1 ? "" : "s"} con medidas faltantes.`}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          titulo={actual ? `Cargar catálogo de ${actual.nombre}` : "Cargar catálogo"}
          bajada={actual ? `${actual.ciudad} · alta ${fecha(actual.fechaAlta)} · comisión ${actual.comisionPct} %` : undefined}
          acciones={
            <Select value={tiendaId} onValueChange={setTiendaId}>
              <SelectTrigger className="w-56">
                <Store className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Elegí una tienda" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>En onboarding</SelectLabel>
                  {enAlta.map((r) => (
                    <SelectItem key={r.tienda.id} value={r.tienda.id}>
                      {r.tienda.nombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Activas y pausadas</SelectLabel>
                  {otras.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          }
        >
          {actual ? (
            <>
              <CargaCatalogo key={actual.id} tiendaId={actual.id} />
              <p className="mt-4 text-xs text-muted-foreground">
                Las prendas publicadas aparecen enseguida en la app y en el{" "}
                <Link to="/admin/catalogo" className="font-medium text-[var(--brand-700)] underline-offset-2 hover:underline">
                  catálogo de prendas
                </Link>
                .
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Elegí una tienda para empezar.</p>
          )}
        </Panel>
      </PageBody>
    </>
  );
}
