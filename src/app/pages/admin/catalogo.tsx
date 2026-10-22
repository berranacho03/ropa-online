import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, CheckCircle2, Pause, Play, Search, Shirt, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Chip, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Ficha, FiltrosMovil, ListaFichas, SoloEscritorio } from "../../components/admin/responsive";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import {
  TablaTallesEditor,
  aBorrador,
  aTabla,
  errorDe,
  zonasDe,
  type Borrador,
} from "../../components/admin2/tabla-talles-editor";
import { fmt1 } from "../../components/admin2/graficos";
import { useStore } from "../../lib/store";
import { CATEGORIAS, nombreCategoria, type Zona } from "../../lib/talles";
import { nombreCompleto, tablaCompleta, type EstadoPrenda, type Prenda } from "../../data/prendas";
import type { Venta } from "../../data/seed";
import { money, num } from "../../lib/format";
import { cn } from "../../components/ui/utils";

const ESTADOS: { id: EstadoPrenda; nombre: string; clase: string }[] = [
  { id: "publicada", nombre: "Publicada", clase: "border-[var(--brand-300)] bg-[var(--brand-50)] text-[var(--brand-700)]" },
  { id: "incompleta", nombre: "Incompleta", clase: "border-amber-200 bg-amber-50 text-amber-800" },
  { id: "pausada", nombre: "Pausada", clase: "border-slate-200 bg-slate-100 text-slate-600" },
];
const estadoDe = (e: EstadoPrenda) => ESTADOS.find((x) => x.id === e)!;

const CALCE: Record<string, string> = { ajustado: "Ajustado", regular: "Regular", oversize: "Oversize" };
const POR_PAGINA = 40;

interface Fila {
  prenda: Prenda;
  tienda: string;
  completa: boolean;
  pruebas: number;
  ventas: number;
  devTalle: number;
}

export function AdminCatalogo() {
  const { prendas, tiendas, ventas, pruebas } = useStore();
  const [q, setQ] = useState("");
  const [tienda, setTienda] = useState("todas");
  const [categoria, setCategoria] = useState("todas");
  const [estado, setEstado] = useState("todos");
  const [soloIncompletas, setSoloIncompletas] = useState(false);
  const [limite, setLimite] = useState(POR_PAGINA);
  const [abierta, setAbierta] = useState<string | null>(null);

  const nombreTienda = useMemo(() => new Map(tiendas.map((t) => [t.id, t.nombre])), [tiendas]);

  // Métricas por prenda: un solo recorrido de pruebas y ventas.
  const metricas = useMemo(() => {
    const pr = new Map<string, number>();
    for (const p of pruebas) pr.set(p.prendaId, (pr.get(p.prendaId) ?? 0) + 1);
    const vs = new Map<string, Venta[]>();
    for (const v of ventas) {
      const l = vs.get(v.prendaId);
      if (l) l.push(v);
      else vs.set(v.prendaId, [v]);
    }
    return { pr, vs };
  }, [pruebas, ventas]);

  const filas: Fila[] = useMemo(
    () =>
      prendas.map((p) => {
        const vs = metricas.vs.get(p.id) ?? [];
        return {
          prenda: p,
          tienda: nombreTienda.get(p.tiendaId) ?? p.tiendaId,
          completa: tablaCompleta(p),
          pruebas: metricas.pr.get(p.id) ?? 0,
          ventas: vs.length,
          devTalle: vs.length ? (vs.filter((v) => v.motivoDevolucion === "talle").length / vs.length) * 100 : 0,
        };
      }),
    [prendas, metricas, nombreTienda]
  );

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return filas
      .filter(
        (f) =>
          (tienda === "todas" || f.prenda.tiendaId === tienda) &&
          (categoria === "todas" || f.prenda.categoria === categoria) &&
          (estado === "todos" || f.prenda.estado === estado) &&
          (!soloIncompletas || !f.completa) &&
          (!t ||
            nombreCompleto(f.prenda).toLowerCase().includes(t) ||
            f.tienda.toLowerCase().includes(t) ||
            f.prenda.id.includes(t))
      )
      .sort((a, b) => b.ventas - a.ventas || b.pruebas - a.pruebas);
  }, [filas, q, tienda, categoria, estado, soloIncompletas]);

  const kpis = useMemo(() => {
    const total = filas.length;
    const completas = filas.filter((f) => f.completa).length;
    const publicadas = filas.filter((f) => f.prenda.estado === "publicada").length;
    const conVentas = filas.filter((f) => f.ventas >= 8);
    const peor = [...conVentas].sort((a, b) => b.devTalle - a.devTalle)[0];
    return { total, completas, publicadas, peor };
  }, [filas]);

  const filaAbierta = abierta ? filas.find((f) => f.prenda.id === abierta) ?? null : null;
  const tiendasOrden = useMemo(() => [...tiendas].sort((a, b) => a.nombre.localeCompare(b.nombre)), [tiendas]);

  const limpiar = () => {
    setQ("");
    setTienda("todas");
    setCategoria("todas");
    setEstado("todos");
    setSoloIncompletas(false);
  };

  return (
    <>
      <PageHeader
        titulo="Catálogo de prendas"
        bajada="Todas las prendas de todas las tiendas, con su tabla de talles y cómo rinde cada una en la app. Una tabla incompleta deja a la prenda sin recomendación."
        acciones={
          <Button asChild variant="outline">
            <Link to="/admin/carga">Cargar catálogo</Link>
          </Button>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi etiqueta="Prendas" valor={num(kpis.total)} detalle={`${tiendas.length} tiendas`} icono={Shirt} />
          <Kpi
            etiqueta="Publicadas"
            valor={num(kpis.publicadas)}
            detalle={`${fmt1((kpis.publicadas / Math.max(1, kpis.total)) * 100, 0)} % del total`}
            icono={CheckCircle2}
            acento="verde"
          />
          <Kpi
            etiqueta="Tabla completa"
            valor={`${fmt1((kpis.completas / Math.max(1, kpis.total)) * 100)} %`}
            detalle={`${kpis.total - kpis.completas} prendas sin medidas`}
            icono={Table2}
            acento={kpis.completas / Math.max(1, kpis.total) >= 0.9 ? "verde" : "ambar"}
          />
          <Kpi
            etiqueta="Más devuelta por talle"
            valor={kpis.peor ? `${fmt1(kpis.peor.devTalle, 0)} %` : "—"}
            detalle={kpis.peor ? `${kpis.peor.prenda.nombre} · ${kpis.peor.tienda}` : undefined}
            icono={AlertTriangle}
            acento="ambar"
          />
        </div>

        <Panel bodyClassName="p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
            <div className="relative min-w-0 flex-1 md:w-44 md:flex-none">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setLimite(POR_PAGINA);
                }}
                placeholder="Prenda o tienda…"
                className="pl-8"
              />
            </div>
            <FiltrosMovil
              activos={[tienda !== "todas", categoria !== "todas", estado !== "todos", soloIncompletas].filter(Boolean).length}
              onLimpiar={() => {
                setTienda("todas");
                setCategoria("todas");
                setEstado("todos");
                setSoloIncompletas(false);
                setLimite(POR_PAGINA);
              }}
            >
              <Select value={tienda} onValueChange={(v) => { setTienda(v); setLimite(POR_PAGINA); }}>
                <SelectTrigger className="w-full md:w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las tiendas</SelectItem>
                  {tiendasOrden.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoria} onValueChange={(v) => { setCategoria(v); setLimite(POR_PAGINA); }}>
                <SelectTrigger className="w-full md:w-auto">
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
              <Select value={estado} onValueChange={(v) => { setEstado(v); setLimite(POR_PAGINA); }}>
                <SelectTrigger className="w-full md:w-auto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5">
                <Switch checked={soloIncompletas} onCheckedChange={(v) => { setSoloIncompletas(v); setLimite(POR_PAGINA); }} />
                <span className="whitespace-nowrap text-sm">Tabla incompleta</span>
              </label>
            </FiltrosMovil>
            <p className="tabular ml-auto text-xs text-muted-foreground">
              {num(filtradas.length)} de {num(filas.length)}
            </p>
          </div>

          {filtradas.length === 0 ? (
            <Vacio
              icono={Shirt}
              titulo="No hay prendas con esos filtros"
              accion={
                <Button variant="outline" size="sm" onClick={limpiar}>
                  Limpiar filtros
                </Button>
              }
            />
          ) : (
            <>
              <ListaFichas>
                {filtradas.slice(0, limite).map((f) => {
                  const e = estadoDe(f.prenda.estado);
                  return (
                    <Ficha
                      key={f.prenda.id}
                      onClick={() => setAbierta(f.prenda.id)}
                      inicio={<PrendaIlustracion prenda={f.prenda} className="h-12 w-10 shrink-0 rounded-md" />}
                      titulo={nombreCompleto(f.prenda)}
                      subtitulo={`${f.tienda} · ${money(f.prenda.precio)}`}
                      lateral={<Chip className={e.clase}>{e.nombre}</Chip>}
                      datos={[
                        [
                          "Categoría",
                          <>
                            {nombreCategoria(f.prenda.categoria)} ·{" "}
                            <span className="tabular">
                              {f.prenda.talles[0]}–{f.prenda.talles[f.prenda.talles.length - 1]}
                            </span>
                          </>,
                        ],
                        [
                          "Tabla",
                          f.completa ? (
                            <span className="text-[var(--brand-700)]">Completa</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                              <AlertTriangle className="h-3.5 w-3.5" /> Incompleta
                            </span>
                          ),
                        ],
                        ["Pruebas · ventas", <span className="tabular">{num(f.pruebas)} · {num(f.ventas)}</span>],
                        [
                          "Dev. talle",
                          <span
                            className={cn(
                              "tabular",
                              f.ventas >= 5 && f.devTalle >= 20 ? "font-medium text-red-700" : "text-muted-foreground"
                            )}
                          >
                            {f.ventas ? `${fmt1(f.devTalle, 0)} %` : "—"}
                          </span>,
                        ],
                      ]}
                    />
                  );
                })}
              </ListaFichas>
              <SoloEscritorio>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 pl-4" />
                    <TableHead>Prenda</TableHead>
                    <TableHead>Tienda</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tabla</TableHead>
                    <TableHead className="text-right">Pruebas</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="pr-4 text-right">Dev. talle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.slice(0, limite).map((f) => {
                    const e = estadoDe(f.prenda.estado);
                    return (
                      <TableRow key={f.prenda.id} className="cursor-pointer" onClick={() => setAbierta(f.prenda.id)}>
                        <TableCell className="py-1.5 pl-4">
                          <PrendaIlustracion prenda={f.prenda} className="h-12 w-10 rounded-md" />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-foreground">{nombreCompleto(f.prenda)}</p>
                          <p className="text-xs text-muted-foreground">
                            {nombreCategoria(f.prenda.categoria)} · {CALCE[f.prenda.calce].toLowerCase()} ·{" "}
                            <span className="tabular">
                              {f.prenda.talles[0]}–{f.prenda.talles[f.prenda.talles.length - 1]}
                            </span>
                          </p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{f.tienda}</TableCell>
                        <TableCell className="tabular text-right">{money(f.prenda.precio)}</TableCell>
                        <TableCell>
                          <Chip className={e.clase}>{e.nombre}</Chip>
                        </TableCell>
                        <TableCell>
                          {f.completa ? (
                            <span className="text-xs text-[var(--brand-700)]">Completa</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                              <AlertTriangle className="h-3.5 w-3.5" /> Incompleta
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="tabular text-right">{num(f.pruebas)}</TableCell>
                        <TableCell className="tabular text-right">{num(f.ventas)}</TableCell>
                        <TableCell
                          className={cn(
                            "tabular pr-4 text-right",
                            f.ventas >= 5 && f.devTalle >= 20 ? "font-medium text-red-700" : "text-muted-foreground"
                          )}
                        >
                          {f.ventas ? `${fmt1(f.devTalle, 0)} %` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </SoloEscritorio>
              {filtradas.length > limite && (
                <div className="border-t border-border p-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setLimite((l) => l + POR_PAGINA * 2)}>
                    Ver más ({num(filtradas.length - limite)} restantes)
                  </Button>
                </div>
              )}
            </>
          )}
        </Panel>
      </PageBody>

      <Sheet open={!!filaAbierta} onOpenChange={(v) => !v && setAbierta(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {filaAbierta && (
            <DetallePrenda
              key={filaAbierta.prenda.id}
              fila={filaAbierta}
              ventas={metricas.vs.get(filaAbierta.prenda.id) ?? []}
              onCerrar={() => setAbierta(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function DetallePrenda({ fila, ventas, onCerrar }: { fila: Fila; ventas: Venta[]; onCerrar: () => void }) {
  const { actualizarPrenda } = useStore();
  const p = fila.prenda;
  const zonas: Zona[] = useMemo(() => zonasDe(p.categoria, p.tabla), [p.categoria, p.tabla]);
  const inicial = useMemo(() => aBorrador(p.tabla, p.talles, zonas), [p.tabla, p.talles, zonas]);
  const [borrador, setBorrador] = useState<Borrador>(inicial);
  const cambiado = JSON.stringify(borrador) !== JSON.stringify(inicial);

  const completa = p.talles.every((t) => zonas.every((z) => errorDe(borrador[t]?.[z]) === null));
  const invalidas = p.talles.some((t) => zonas.some((z) => errorDe(borrador[t]?.[z]) === "invertida"));

  const porTalle = useMemo(
    () =>
      p.talles.map((t) => {
        const vs = ventas.filter((v) => v.talle === t);
        const dev = vs.filter((v) => v.motivoDevolucion === "talle").length;
        return { talle: t, ventas: vs.length, dev, pct: vs.length ? (dev / vs.length) * 100 : 0 };
      }),
    [p.talles, ventas]
  );
  const maxVentas = Math.max(1, ...porTalle.map((x) => x.ventas));

  const guardar = () => {
    const tabla = aTabla(borrador, p.talles, zonas);
    let estado = p.estado;
    if (!completa) estado = "incompleta";
    else if (p.estado === "incompleta") estado = "pausada";
    actualizarPrenda(p.id, { tabla, estado });
    toast.success("Tabla de talles guardada", {
      description: !completa
        ? "Faltan medidas: la prenda queda como incompleta y sin recomendación."
        : p.estado === "incompleta"
          ? "La tabla quedó completa. Ya podés publicar la prenda."
          : `${nombreCompleto(p)} · ${fila.tienda}`,
    });
  };

  const cambiarEstado = (nuevo: EstadoPrenda) => {
    actualizarPrenda(p.id, { estado: nuevo });
    toast.success(nuevo === "publicada" ? "Prenda publicada" : "Prenda pausada", {
      description: nuevo === "publicada" ? "Ya aparece en la app con su recomendación de talle." : "Deja de aparecer en la app.",
    });
  };

  const e = estadoDe(p.estado);

  return (
    <>
      <SheetHeader className="border-b border-border">
        <div className="flex items-start gap-4 pr-6">
          <PrendaIlustracion prenda={p} className="aspect-[4/5] w-20 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <SheetTitle className="text-lg">{nombreCompleto(p)}</SheetTitle>
            <SheetDescription>
              {fila.tienda} · {nombreCategoria(p.categoria)} · {CALCE[p.calce]} · {money(p.precio)}
            </SheetDescription>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip className={e.clase}>{e.nombre}</Chip>
              <span className="text-xs text-muted-foreground">{p.material}</span>
            </div>
          </div>
        </div>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-6">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-border p-3">
            <p className="tabular text-xl font-semibold">{num(fila.pruebas)}</p>
            <p className="text-xs text-muted-foreground">pruebas virtuales</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="tabular text-xl font-semibold">{num(fila.ventas)}</p>
            <p className="text-xs text-muted-foreground">ventas derivadas</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="tabular text-xl font-semibold">{fila.ventas ? `${fmt1(fila.devTalle, 0)} %` : "—"}</p>
            <p className="text-xs text-muted-foreground">devueltas por talle</p>
          </div>
        </div>

        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Tabla de talles</h3>
            <span className="text-xs text-muted-foreground">Rango del cuerpo que le queda bien a cada talle</span>
          </div>
          <TablaTallesEditor talles={p.talles} zonas={zonas} borrador={borrador} onChange={setBorrador} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={guardar} disabled={!cambiado || invalidas}>
              Guardar tabla
            </Button>
            <Button variant="ghost" onClick={() => setBorrador(inicial)} disabled={!cambiado}>
              Descartar cambios
            </Button>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Ventas y devoluciones por talle</h3>
          {ventas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tiene ventas derivadas.</p>
          ) : (
            <ul className="space-y-1.5">
              {porTalle.map((x) => (
                <li key={x.talle} className="grid grid-cols-[2.5rem_1fr_7rem] items-center gap-3 text-sm">
                  <span className="font-medium">{x.talle}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${(x.ventas / maxVentas) * 100}%` }} />
                  </div>
                  <span className="tabular text-right text-xs text-muted-foreground">
                    {x.ventas} vtas ·{" "}
                    <span className={cn(x.ventas >= 3 && x.pct >= 20 && "font-medium text-red-700")}>
                      {x.ventas ? `${fmt1(x.pct, 0)} % dev.` : "—"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">Estado en la app</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.estado === "publicada"
              ? "La prenda está visible en la app y recibe recomendación de talle."
              : p.estado === "pausada"
                ? "La prenda está pausada: no aparece en la app."
                : "Le faltan medidas: no se puede publicar hasta completar la tabla."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.estado === "publicada" ? (
              <Button variant="outline" onClick={() => cambiarEstado("pausada")}>
                <Pause className="h-4 w-4" /> Pausar
              </Button>
            ) : (
              <Button onClick={() => cambiarEstado("publicada")} disabled={!tablaCompleta(p)}>
                <Play className="h-4 w-4" /> Publicar
              </Button>
            )}
            <Button variant="ghost" onClick={onCerrar}>
              Cerrar
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
