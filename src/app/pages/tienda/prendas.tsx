import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, FileSpreadsheet, Pause, Pencil, Play, Search, Shirt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import {
  ChipEstadoPrenda,
  ConTienda,
  conMuchasDevoluciones,
  statsPorPrenda,
  useDatosTienda,
} from "../../components/tienda/comun";
import { useStore } from "../../lib/store";
import { CATEGORIAS, nombreCategoria } from "../../lib/talles";
import { tablaCompleta, type EstadoPrenda, type Prenda } from "../../data/prendas";
import type { Tienda } from "../../data/tiendas";
import { money, num, pct } from "../../lib/format";

export function TiendaPrendas() {
  return <ConTienda titulo="Mis prendas">{(t) => <Prendas tienda={t} />}</ConTienda>;
}

function Prendas({ tienda }: { tienda: Tienda }) {
  const { actualizarPrenda } = useStore();
  const { prendas, ventas, pruebas } = useDatosTienda(tienda.id);
  const stats = useMemo(() => statsPorPrenda(prendas, ventas, pruebas), [prendas, ventas, pruebas]);

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"todas" | EstadoPrenda>("todas");
  const [cat, setCat] = useState("todas");
  const [editando, setEditando] = useState<Prenda | null>(null);
  const [precio, setPrecio] = useState("");

  const filtradas = prendas.filter(
    (p) =>
      (estado === "todas" || p.estado === estado) &&
      (cat === "todas" || p.categoria === cat) &&
      `${p.nombre} ${p.colorNombre}`.toLowerCase().includes(q.trim().toLowerCase())
  );

  const tot = {
    publicadas: prendas.filter((p) => p.estado === "publicada").length,
    incompletas: prendas.filter((p) => p.estado === "incompleta").length,
    recomendada: [...stats.values()].reduce((a, s) => a + s.recomendada, 0),
    comprada: [...stats.values()].reduce((a, s) => a + s.comprada, 0),
  };
  const enAlta = tienda.estado === "onboarding";

  const alternar = (p: Prenda) => {
    if (p.estado === "publicada") {
      actualizarPrenda(p.id, { estado: "pausada" });
      toast(`${p.nombre} pausada`, { description: "Deja de aparecer en la app hasta que la vuelvas a publicar." });
    } else {
      actualizarPrenda(p.id, { estado: "publicada" });
      toast.success(`${p.nombre} publicada`, {
        description: enAlta ? "Se va a ver en la app cuando publiques tu tienda." : "Ya aparece en la app con la recomendación de talle.",
      });
    }
  };

  const guardarPrecio = () => {
    const n = Math.round(Number(precio.replace(/[^\d]/g, "")));
    if (!editando || !n) return;
    actualizarPrenda(editando.id, { precio: n });
    toast.success("Precio actualizado", { description: `${editando.nombre}: ${money(n)}` });
    setEditando(null);
  };

  return (
    <>
      <PageHeader
        titulo="Mis prendas"
        bajada="Tu catálogo en la app: qué está publicado, qué tiene la tabla de talles incompleta y cómo le va a cada prenda."
        acciones={
          <Button asChild>
            <Link to="/tienda/carga">
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Cargar catálogo
            </Link>
          </Button>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Kpi etiqueta="Prendas" valor={num(prendas.length)} detalle={`${num(tot.publicadas)} publicadas`} icono={Shirt} acento="verde" />
          <Kpi
            etiqueta="Tabla incompleta"
            valor={num(tot.incompletas)}
            detalle="no se pueden recomendar"
            icono={AlertTriangle}
            acento={tot.incompletas ? "ambar" : "neutro"}
          />
          <Kpi etiqueta="Veces recomendadas" valor={num(tot.recomendada)} detalle="aprox., desde tu alta" />
          <Kpi
            etiqueta="Compradas"
            valor={num(tot.comprada)}
            detalle={tot.recomendada ? `${pct((tot.comprada / tot.recomendada) * 100, 1)} de las recomendaciones` : undefined}
          />
        </div>

        <Panel
          bodyClassName="p-0"
          titulo={`${num(filtradas.length)} prendas`}
          acciones={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar prenda" className="h-9 w-48 pl-8" />
              </div>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="h-9 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.plural}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={estado} onValueChange={(v) => setEstado(v as typeof estado)}>
                <SelectTrigger className="h-9 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos los estados</SelectItem>
                  <SelectItem value="publicada">Publicadas</SelectItem>
                  <SelectItem value="incompleta">Tabla incompleta</SelectItem>
                  <SelectItem value="pausada">Pausadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          {prendas.length === 0 ? (
            <Vacio
              icono={Shirt}
              titulo="Todavía no cargaste prendas"
              detalle="Subí tu planilla o usá la de ejemplo para ver cómo funciona."
              accion={
                <Button asChild size="sm">
                  <Link to="/tienda/carga">Cargar catálogo</Link>
                </Button>
              }
            />
          ) : filtradas.length === 0 ? (
            <Vacio icono={Search} titulo="Ninguna prenda con esos filtros" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Prenda</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Talles</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Recomendada</TableHead>
                  <TableHead className="text-right">Probada</TableHead>
                  <TableHead className="text-right">Comprada</TableHead>
                  <TableHead className="text-right">Devuelta</TableHead>
                  <TableHead className="pr-4 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((p) => {
                  const s = stats.get(p.id)!;
                  const completa = tablaCompleta(p);
                  const alerta = conMuchasDevoluciones(s);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <PrendaIlustracion prenda={p} className="h-14 w-11 shrink-0 rounded-md" />
                          <div className="min-w-0">
                            <p className="font-medium">{p.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {nombreCategoria(p.categoria)} · {p.colorNombre} · calce {p.calce}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ChipEstadoPrenda estado={p.estado} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.talles.map((t) => {
                            const ok = Object.keys(p.tabla[t] ?? {}).length > 0;
                            return (
                              <span
                                key={t}
                                title={ok ? undefined : "Sin medidas"}
                                className={
                                  ok
                                    ? "rounded border border-border px-1.5 text-xs"
                                    : "rounded border border-dashed border-amber-400 px-1.5 text-xs text-amber-700"
                                }
                              >
                                {t}
                              </span>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="tabular text-right">
                        <button
                          className="group inline-flex items-center gap-1 hover:text-[var(--brand-700)]"
                          onClick={() => {
                            setEditando(p);
                            setPrecio(String(p.precio));
                          }}
                        >
                          {money(p.precio)}
                          <Pencil className="h-3 w-3 opacity-40 group-hover:opacity-100" />
                        </button>
                      </TableCell>
                      <TableCell className="tabular text-right">{num(s.recomendada)}</TableCell>
                      <TableCell className="tabular text-right">{num(s.probada)}</TableCell>
                      <TableCell className="tabular text-right">{num(s.comprada)}</TableCell>
                      <TableCell className="tabular text-right">
                        {num(s.devuelta)}
                        {alerta && (
                          <Link
                            to={`/tienda/talles?prenda=${p.id}`}
                            title={`${pct(s.pctDevTalle)} devuelta por talle: revisá la tabla`}
                            className="ml-1 inline-flex align-middle text-amber-600"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        {completa ? (
                          <Button size="sm" variant="outline" onClick={() => alternar(p)} className="w-24">
                            {p.estado === "publicada" ? (
                              <>
                                <Pause className="mr-1 h-3.5 w-3.5" /> Pausar
                              </>
                            ) : (
                              <>
                                <Play className="mr-1 h-3.5 w-3.5" /> Publicar
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button size="sm" asChild className="w-24">
                            <Link to={`/tienda/talles?prenda=${p.id}`}>Completar</Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Panel>
        <p className="text-xs text-muted-foreground">
          «Recomendada» es aproximada: cuenta las veces que la app le mostró esta prenda a alguien con su talle sugerido. Una prenda sin tabla de talles completa no se puede publicar.
        </p>
      </PageBody>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar precio</DialogTitle>
            <DialogDescription>{editando?.nombre}. El cambio se ve en la app al instante.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm text-muted-foreground">$</span>
            <Input
              autoFocus
              inputMode="numeric"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && guardarPrecio()}
              className="pl-7"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button onClick={guardarPrecio}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
