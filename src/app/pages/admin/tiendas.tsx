import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { BadgePercent, Pause, Play, Rocket, Store as StoreIcon, Hourglass, PauseCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Barra, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { AntesAhora, ChipEstadoTienda } from "../../components/admin/piezas";
import { Buscador, FiltroSelect, normalizar } from "../../components/admin/filtros";
import { fmt1 } from "../../components/admin/datos";
import { useStore } from "../../lib/store";
import { resumenTiendas } from "../../lib/metricas";
import { money, moneyCorto, num } from "../../lib/format";
import type { EstadoTienda, Tienda } from "../../data/tiendas";

export function AdminTiendas() {
  const { tiendas, prendas, ventas, actualizarTienda } = useStore();
  const navigate = useNavigate();
  const [estado, setEstado] = useState("todas");
  const [q, setQ] = useState("");
  const [orden, setOrden] = useState("ventas");

  const resumen = useMemo(() => resumenTiendas(tiendas, prendas, ventas), [tiendas, prendas, ventas]);

  const filas = useMemo(() => {
    const nq = normalizar(q.trim());
    return resumen
      .filter((r) => estado === "todas" || r.tienda.estado === estado)
      .filter((r) => !nq || normalizar(`${r.tienda.nombre} ${r.tienda.ciudad}`).includes(nq))
      .sort((a, b) =>
        orden === "nombre"
          ? a.tienda.nombre.localeCompare(b.tienda.nombre)
          : orden === "comisiones"
            ? b.comisiones - a.comisiones
            : orden === "mejora"
              ? b.devTalleAntes - b.devTalle - (a.devTalleAntes - a.devTalle)
              : b.ventas - a.ventas
      );
  }, [resumen, estado, q, orden]);

  const activas = tiendas.filter((t) => t.estado === "activa");
  const comisionMedia = activas.reduce((a, t) => a + t.comisionPct, 0) / Math.max(1, activas.length);
  const totalComisiones = resumen.reduce((a, r) => a + r.comisiones, 0);

  const cambiarEstado = (t: Tienda) => {
    const nuevo: EstadoTienda = t.estado === "activa" ? "pausada" : "activa";
    actualizarTienda(t.id, { estado: nuevo });
    toast.success(
      nuevo === "pausada"
        ? `${t.nombre} quedó pausada: sus prendas dejan de mostrarse en la app.`
        : t.estado === "onboarding"
          ? `${t.nombre} quedó activa: sus prendas publicadas ya se ven en la app.`
          : `${t.nombre} volvió a estar activa.`
    );
  };

  return (
    <>
      <PageHeader
        titulo="Tiendas asociadas"
        bajada="Estado de cada tienda, su catálogo, las ventas que le derivamos, la comisión que cede y cuánto le bajamos las devoluciones por talle."
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Kpi etiqueta="Activas" valor={num(activas.length)} detalle={`de ${tiendas.length} tiendas`} icono={StoreIcon} acento="verde" />
          <Kpi
            etiqueta="En onboarding"
            valor={num(tiendas.filter((t) => t.estado === "onboarding").length)}
            detalle="cargando catálogo"
            icono={Hourglass}
            acento="ambar"
          />
          <Kpi
            etiqueta="Pausadas"
            valor={num(tiendas.filter((t) => t.estado === "pausada").length)}
            icono={PauseCircle}
            acento="neutro"
          />
          <Kpi
            etiqueta="Comisión media"
            valor={`${fmt1(comisionMedia)} %`}
            detalle={`${moneyCorto(totalComisiones)} generadas en total`}
            icono={BadgePercent}
            acento="verde"
          />
        </div>

        <Panel bodyClassName="p-0">
          <div className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Buscador valor={q} onCambio={setQ} placeholder="Buscar tienda o ciudad…" />
            <FiltroSelect
              etiqueta="Estado"
              valor={estado}
              onCambio={setEstado}
              opciones={[
                { valor: "todas", texto: "Todos los estados" },
                { valor: "activa", texto: "Activas" },
                { valor: "onboarding", texto: "En onboarding" },
                { valor: "pausada", texto: "Pausadas" },
              ]}
            />
            <FiltroSelect
              etiqueta="Orden"
              valor={orden}
              onCambio={setOrden}
              opciones={[
                { valor: "ventas", texto: "Más ventas" },
                { valor: "comisiones", texto: "Más comisiones" },
                { valor: "mejora", texto: "Más baja de devoluciones" },
                { valor: "nombre", texto: "Nombre" },
              ]}
            />
            <span className="text-xs text-muted-foreground sm:ml-auto">{filas.length} tiendas</span>
          </div>

          {filas.length === 0 ? (
            <Vacio icono={StoreIcon} titulo="No hay tiendas con ese filtro" />
          ) : (
            <>
            <ul className="divide-y divide-border md:hidden">
              {filas.map((r) => (
                <li key={r.tienda.id}>
                  <Link to={`/admin/tiendas/${r.tienda.id}`} className="block px-4 py-3 hover:bg-muted/50">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.tienda.color }} />
                        <span className="truncate font-medium text-foreground">{r.tienda.nombre}</span>
                        <span className="truncate text-xs text-muted-foreground">{r.tienda.ciudad}</span>
                      </span>
                      <ChipEstadoTienda estado={r.tienda.estado} />
                    </div>
                    <p className="tabular mt-1 text-xs text-muted-foreground">
                      {r.prendas} prendas · {num(r.ventas)} ventas · {money(r.comisiones)} al {r.tienda.comisionPct} %
                    </p>
                    <div className="mt-1">
                      <AntesAhora antes={r.devTalleAntes} ahora={r.devTalle} sinDatos={r.ventas === 0} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tienda</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Prendas</TableHead>
                    <TableHead className="w-[7rem]">Tabla completa</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Facturación</TableHead>
                    <TableHead className="text-right">Comisiones</TableHead>
                    <TableHead>Dev. por talle antes → ahora</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((r) => {
                    const t = r.tienda;
                    const pctCompleta = r.prendas ? (r.completas / r.prendas) * 100 : 0;
                    return (
                      <TableRow
                        key={t.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/admin/tiendas/${t.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                              style={{ background: t.color }}
                            >
                              {t.nombre.slice(0, 1)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{t.nombre}</p>
                              <p className="text-xs text-muted-foreground">{t.ciudad}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ChipEstadoTienda estado={t.estado} />
                        </TableCell>
                        <TableCell className="tabular text-right">{r.prendas}</TableCell>
                        <TableCell>
                          {r.prendas ? (
                            <div className="flex items-center gap-2">
                              <Barra valor={pctCompleta} max={100} />
                              <span
                                className={`tabular w-10 shrink-0 text-right text-xs ${pctCompleta < 90 ? "font-medium text-amber-700" : "text-muted-foreground"}`}
                              >
                                {Math.round(pctCompleta)} %
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin prendas</span>
                          )}
                        </TableCell>
                        <TableCell className="tabular text-right font-medium">{num(r.ventas)}</TableCell>
                        <TableCell className="tabular text-right">{money(r.gmv)}</TableCell>
                        <TableCell className="tabular text-right">
                          <span className="font-medium">{money(r.comisiones)}</span>
                          <span className="block text-xs text-muted-foreground">al {t.comisionPct} %</span>
                        </TableCell>
                        <TableCell>
                          <AntesAhora antes={r.devTalleAntes} ahora={r.devTalle} sinDatos={r.ventas === 0} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              cambiarEstado(t);
                            }}
                          >
                            {t.estado === "activa" ? (
                              <>
                                <Pause className="mr-1 h-3.5 w-3.5" /> Pausar
                              </>
                            ) : t.estado === "onboarding" ? (
                              <>
                                <Rocket className="mr-1 h-3.5 w-3.5" /> Activar
                              </>
                            ) : (
                              <>
                                <Play className="mr-1 h-3.5 w-3.5" /> Reactivar
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </Panel>
        <p className="text-xs text-muted-foreground">
          «Antes» es la devolución por talle de las ventas online de cada tienda antes de sumarse a ROPA;
          «ahora», la de las ventas que le derivamos. Las comisiones son netas de devoluciones.
        </p>
      </PageBody>
    </>
  );
}
