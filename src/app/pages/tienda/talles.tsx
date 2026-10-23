import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { AlertTriangle, ArrowDownUp, ChevronsUpDown, Copy, Ruler, Save, Undo2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import {
  ChipEstadoPrenda,
  ConTienda,
  conMuchasDevoluciones,
  estadoTrasTabla,
  statsPorPrenda,
  useDatosTienda,
} from "../../components/tienda/comun";
import { useStore } from "../../lib/store";
import { NOMBRE_ZONA, PESOS, nombreCategoria, tablaPara, type Rango, type TablaTalles, type Zona } from "../../lib/talles";
import { tablaCompleta, nombreCompleto, type Prenda } from "../../data/prendas";
import type { Tienda } from "../../data/tiendas";
import { num, pct } from "../../lib/format";
import { tasaDevTalle } from "../../lib/metricas";
import { cn } from "../../components/ui/utils";

export function TiendaTalles() {
  return <ConTienda titulo="Tablas de talles">{(t) => <Talles tienda={t} />}</ConTienda>;
}

/** Celdas en edición: texto libre por talle/zona/extremo. */
type Borrador = Record<string, Partial<Record<Zona, [string, string]>>>;

const aBorrador = (p: Prenda): Borrador => {
  const b: Borrador = {};
  for (const t of p.talles) {
    b[t] = {};
    for (const z of Object.keys(PESOS[p.categoria]) as Zona[]) {
      const r = p.tabla[t]?.[z];
      b[t][z] = r ? [String(r[0]), String(r[1])] : ["", ""];
    }
  }
  return b;
};

const aTabla = (b: Borrador): TablaTalles => {
  const t: TablaTalles = {};
  for (const [talle, zonas] of Object.entries(b)) {
    t[talle] = {};
    for (const [z, par] of Object.entries(zonas) as [Zona, [string, string]][]) {
      const a = Number(par[0].replace(",", "."));
      const c = Number(par[1].replace(",", "."));
      if (par[0] !== "" && par[1] !== "" && Number.isFinite(a) && Number.isFinite(c) && c > a) t[talle][z] = [a, c] as Rango;
    }
  }
  return t;
};

function Talles({ tienda }: { tienda: Tienda }) {
  const { actualizarPrenda, ventas: todas } = useStore();
  const promedio = useMemo(() => tasaDevTalle(todas), [todas]);
  const { prendas, ventas, pruebas } = useDatosTienda(tienda.id);
  const stats = useMemo(() => statsPorPrenda(prendas, ventas, pruebas), [prendas, ventas, pruebas]);
  const [params, setParams] = useSearchParams();

  // Primero las que piden atención: incompletas y con muchas devoluciones.
  const orden = useMemo(
    () =>
      [...prendas].sort((a, b) => {
        const pa = !tablaCompleta(a) ? 0 : conMuchasDevoluciones(stats.get(a.id)) ? 1 : 2;
        const pb = !tablaCompleta(b) ? 0 : conMuchasDevoluciones(stats.get(b.id)) ? 1 : 2;
        return pa - pb || a.nombre.localeCompare(b.nombre);
      }),
    [prendas, stats]
  );

  const id = params.get("prenda") ?? orden[0]?.id;
  const prenda = prendas.find((p) => p.id === id) ?? orden[0];

  const [borrador, setBorrador] = useState<Borrador>({});
  const [aplicar, setAplicar] = useState(false);
  const [destinos, setDestinos] = useState<Set<string>>(new Set());
  const [talleSel, setTalleSel] = useState<string | undefined>();
  const [elegirAbierto, setElegirAbierto] = useState(false);

  useEffect(() => {
    if (prenda) setBorrador(aBorrador(prenda));
    setTalleSel(undefined);
    // Sólo al cambiar de prenda: no pisar lo que se está editando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prenda?.id]);

  if (!prenda)
    return (
      <>
        <PageHeader titulo="Tablas de talles" />
        <PageBody>
          <Vacio
            icono={Ruler}
            titulo="Todavía no cargaste prendas"
            detalle="Cargá tu catálogo y después ajustá acá la tabla de cada prenda."
            accion={
              <Button asChild size="sm">
                <Link to="/tienda/carga">Cargar catálogo</Link>
              </Button>
            }
          />
        </PageBody>
      </>
    );

  const zonas = Object.keys(PESOS[prenda.categoria]) as Zona[];
  const muchasZonas = zonas.length > 3;
  const tablaNueva = aTabla(borrador);
  const original = JSON.stringify(aBorrador(prenda));
  const cambiado = JSON.stringify(borrador) !== original;
  const vacias = prenda.talles.filter((t) => zonas.some((z) => !tablaNueva[t]?.[z]));
  const s = stats.get(prenda.id)!;
  const alerta = conMuchasDevoluciones(s);

  const vs = ventas.filter((v) => v.prendaId === prenda.id);
  const porTalle = (t: string) => {
    const x = vs.filter((v) => v.talle === t);
    return {
      n: x.length,
      dev: x.filter((v) => v.motivoDevolucion === "talle").length,
      chico: x.filter((v) => v.feedback === "chico").length,
      grande: x.filter((v) => v.feedback === "grande").length,
    };
  };
  const chicos = vs.filter((v) => v.feedback === "chico").length;
  const grandes = vs.filter((v) => v.feedback === "grande").length;

  const setCelda = (t: string, z: Zona, k: 0 | 1, v: string) =>
    setBorrador((b) => {
      const par = [...(b[t]?.[z] ?? ["", ""])] as [string, string];
      par[k] = v.replace(/[^\d.,]/g, "");
      return { ...b, [t]: { ...b[t], [z]: par } };
    });

  const completarVacios = () => {
    const std = tablaPara(prenda.categoria, prenda.calce, 0, prenda.talles);
    setBorrador((b) => {
      const n: Borrador = { ...b };
      for (const t of prenda.talles)
        for (const z of zonas) {
          const r = std[t]?.[z];
          const actual = n[t]?.[z];
          if (r && (!actual || actual[0] === "" || actual[1] === "")) n[t] = { ...n[t], [z]: [String(r[0]), String(r[1])] };
        }
      return n;
    });
  };

  const correr = (cm: number) =>
    setBorrador((b) => {
      const n: Borrador = {};
      for (const [t, zs] of Object.entries(b)) {
        n[t] = {};
        for (const [z, par] of Object.entries(zs) as [Zona, [string, string]][]) {
          n[t][z] =
            z === "altura" || par[0] === "" || par[1] === ""
              ? par
              : [String(Number(par[0].replace(",", ".")) + cm), String(Number(par[1].replace(",", ".")) + cm)];
        }
      }
      return n;
    });

  const guardar = () => {
    const estado = estadoTrasTabla(prenda, tablaNueva);
    actualizarPrenda(prenda.id, { tabla: tablaNueva, estado });
    toast.success("Tabla guardada", {
      description:
        estado === "incompleta"
          ? `Faltan medidas en ${vacias.join(", ")}: la prenda no se recomienda hasta completarla.`
          : prenda.estado === "incompleta"
            ? "Tabla completa: la prenda ya se puede recomendar."
            : "Las recomendaciones de esta prenda ya usan la tabla nueva.",
    });
  };

  const hermanas = prendas.filter((p) => p.id !== prenda.id && p.categoria === prenda.categoria);

  const aplicarA = () => {
    let n = 0;
    for (const p of hermanas) {
      if (!destinos.has(p.id)) continue;
      const tabla: TablaTalles = {};
      for (const t of p.talles) tabla[t] = tablaNueva[t] ? { ...tablaNueva[t] } : (p.tabla[t] ?? {});
      actualizarPrenda(p.id, { tabla, estado: estadoTrasTabla(p, tabla) });
      n++;
    }
    toast.success(`Tabla aplicada a ${num(n)} prendas`, { description: `Copiada de ${nombreCompleto(prenda)}.` });
    setAplicar(false);
    setDestinos(new Set());
  };

  const lista = (alto: string) => (
  <ul className={cn("divide-y divide-border overflow-y-auto", alto)}>
    {orden.map((p) => {
      const st = stats.get(p.id);
      const sel = p.id === prenda.id;
      return (
        <li key={p.id}>
          <button
            onClick={() => {
              setParams({ prenda: p.id }, { replace: true });
              setElegirAbierto(false);
            }}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
              sel && "bg-[var(--brand-50)]"
            )}
          >
            <PrendaIlustracion prenda={p} className="h-11 w-9 shrink-0 rounded" />
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm", sel && "font-medium text-[var(--brand-700)]")}>{nombreCompleto(p)}</p>
              <p className="text-xs text-muted-foreground">
                {nombreCategoria(p.categoria)} · {p.talles.join(" ")}
              </p>
            </div>
            {!tablaCompleta(p) ? (
              <span title="Tabla incompleta" className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            ) : conMuchasDevoluciones(st) ? (
              <span title={`${pct(st!.pctDevTalle)} devuelta por talle`}>
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              </span>
            ) : null}
          </button>
        </li>
      );
    })}
  </ul>
  );

  const estadoCelda = (t: string, z: Zona) => {
    const par = borrador[t]?.[z] ?? ["", ""];
    const vacia = par[0] === "" || par[1] === "";
    const invertida = !vacia && Number(par[1].replace(",", ".")) <= Number(par[0].replace(",", "."));
    return { par, vacia, invertida };
  };
  const talleActivo = talleSel && prenda.talles.includes(talleSel) ? talleSel : prenda.talles[0];
  const atencion = prendas.filter((p) => !tablaCompleta(p) || conMuchasDevoluciones(stats.get(p.id))).length;

  return (
    <>
      <PageHeader
        titulo="Tablas de talles"
        bajada="Para cada talle, el rango de medidas del cuerpo que le queda bien (en cm). Es lo que usa la app para recomendar: si está mal cargada, se nota en las devoluciones."
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
          <Panel titulo={`${num(prendas.length)} prendas`} bodyClassName="p-0" className="hidden self-start lg:block">
            {lista("max-h-[70vh]")}
          </Panel>

          <div className="min-w-0 space-y-4">
            <Button variant="outline" className="h-11 w-full justify-between lg:hidden" onClick={() => setElegirAbierto(true)}>
              <span className="truncate">
                Cambiar de prenda <span className="text-muted-foreground">· {num(prendas.length)}</span>
                {atencion > 0 && <span className="text-amber-700"> · {num(atencion)} para revisar</span>}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
            </Button>
            <Panel>
              <div className="flex flex-wrap items-center gap-4">
                <PrendaIlustracion prenda={prenda} className="h-20 w-16 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 basis-52">
                  <p className="text-lg font-semibold">{nombreCompleto(prenda)}</p>
                  <p className="text-sm text-muted-foreground">
                    {nombreCategoria(prenda.categoria)} · calce {prenda.calce} · {num(s.comprada)} ventas, {num(s.devTalle)} devueltas por talle
                  </p>
                  <ChipEstadoPrenda estado={prenda.estado} className="mt-1.5" />
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                  <Button variant="outline" size="sm" onClick={completarVacios} disabled={vacias.length === 0}>
                    <Wand2 className="mr-1.5 h-3.5 w-3.5" /> <span className="sm:hidden">Completar vacíos</span>
                    <span className="hidden sm:inline">Completar con plantilla</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setAplicar(true)} disabled={hermanas.length === 0}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Aplicar a varias
                  </Button>
                </div>
              </div>
            </Panel>

            {alerta && (
              <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="flex-1">
                  <span className="font-semibold">El {pct(s.pctDevTalle)} de las ventas de esta prenda se devuelve por talle</span> (el promedio
                  de la app es {pct(promedio)}). La tabla probablemente esté mal cargada.
                  {chicos + grandes > 0 &&
                    (chicos >= grandes
                      ? ` A ${num(chicos)} ${chicos === 1 ? "comprador le" : "compradores les"} quedó chico: tus rangos parecen estar altos; probá bajarlos.`
                      : ` A ${num(grandes)} ${grandes === 1 ? "comprador le" : "compradores les"} quedó grande: tus rangos parecen estar bajos; probá subirlos.`)}
                </p>
                <Button size="sm" variant="outline" className="border-amber-300 bg-white" onClick={() => correr(chicos >= grandes ? -2 : 2)}>
                  <ArrowDownUp className="mr-1.5 h-3.5 w-3.5" /> Correr {chicos >= grandes ? "−2" : "+2"} cm
                </Button>
              </div>
            )}

            <Panel
              titulo="Medidas del cuerpo por talle"
              bajada="Mínimo y máximo de cada zona, en centímetros. Las celdas vacías no se pueden recomendar."
              bodyClassName="p-0 @container"
            >
              {/* Tarjeta por talle cuando no entra la tabla completa (depende del ancho del panel y de cuántas zonas tiene la prenda). */}
              <div className={muchasZonas ? "@min-[40rem]:hidden" : "@min-[36rem]:hidden"}>
                <div role="tablist" aria-label="Talles" className="flex flex-wrap gap-1.5 border-b border-border p-3">
                  {prenda.talles.map((t) => {
                    const falta = zonas.some((z) => estadoCelda(t, z).vacia);
                    const mal = zonas.some((z) => estadoCelda(t, z).invertida);
                    const act = t === talleActivo;
                    return (
                      <button
                        key={t}
                        role="tab"
                        aria-selected={act}
                        onClick={() => setTalleSel(t)}
                        className={cn(
                          "relative h-10 min-w-12 rounded-lg border px-3 text-sm font-semibold transition-colors",
                          act ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-border bg-card text-foreground"
                        )}
                      >
                        {t}
                        {(falta || mal) && (
                          <span
                            className={cn(
                              "absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ring-2 ring-card",
                              mal ? "bg-red-500" : "bg-amber-500"
                            )}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                {talleActivo && (
                  <div className="p-4">
                    <div className="mb-3 flex items-baseline justify-between gap-3">
                      <p className="font-display text-2xl font-semibold">Talle {talleActivo}</p>
                      {(() => {
                        const d = porTalle(talleActivo);
                        const malo = d.n >= 2 && d.dev / d.n >= 0.34;
                        return (
                          <p className={cn("text-right text-xs text-muted-foreground", malo && "font-semibold text-amber-700")}>
                            {d.n === 0 ? "Sin ventas" : `${num(d.n)} vendidas · ${num(d.dev)} dev.`}
                            {(d.chico > 0 || d.grande > 0) && (
                              <span className="block font-normal text-muted-foreground">
                                {d.chico > 0 && `${d.chico} chico`}
                                {d.chico > 0 && d.grande > 0 && " · "}
                                {d.grande > 0 && `${d.grande} grande`}
                              </span>
                            )}
                          </p>
                        );
                      })()}
                    </div>
                    <ul className="space-y-2.5">
                      {zonas.map((z) => {
                        const { par, vacia, invertida } = estadoCelda(talleActivo, z);
                        return (
                          <li key={z} className="flex items-center gap-3 rounded-xl border border-border p-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{NOMBRE_ZONA[z]}</p>
                              <p className={cn("text-xs text-muted-foreground", vacia && "text-amber-700", invertida && "text-red-600")}>
                                {invertida ? "El máximo tiene que ser mayor" : vacia ? "Falta completar" : z === "altura" ? "estatura, cm" : "cm"}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {[0, 1].map((k) => (
                                <span key={k} className="contents">
                                  {k === 1 && <span className="text-muted-foreground">–</span>}
                                  <Input
                                    inputMode="decimal"
                                    aria-label={`${talleActivo} ${NOMBRE_ZONA[z]} ${k ? "máximo" : "mínimo"}`}
                                    value={par[k]}
                                    placeholder={k ? "máx" : "mín"}
                                    onChange={(e) => setCelda(talleActivo, z, k as 0 | 1, e.target.value)}
                                    className={cn(
                                      "tabular h-11 w-[4.25rem] px-1 text-center text-base",
                                      vacia && "border-dashed border-amber-400 bg-amber-50/50",
                                      invertida && "border-red-400"
                                    )}
                                  />
                                </span>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className={cn("hidden", muchasZonas ? "@min-[40rem]:block" : "@min-[36rem]:block")}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Talle</TableHead>
                      {zonas.map((z) => (
                        <TableHead key={z} className="text-center">
                          {NOMBRE_ZONA[z]}
                          {z === "altura" ? " (estatura)" : ""}
                        </TableHead>
                      ))}
                      <TableHead className={cn("whitespace-normal pr-4 text-right leading-tight", muchasZonas ? "w-24" : "w-28")}>Vendidas · devueltas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prenda.talles.map((t) => {
                      const d = porTalle(t);
                      const malo = d.n >= 2 && d.dev / d.n >= 0.34;
                      return (
                        <TableRow key={t}>
                          <TableCell className="pl-4 text-base font-semibold">{t}</TableCell>
                          {zonas.map((z) => {
                            const par = borrador[t]?.[z] ?? ["", ""];
                            const vacia = par[0] === "" || par[1] === "";
                            const invertida = !vacia && Number(par[1].replace(",", ".")) <= Number(par[0].replace(",", "."));
                            return (
                              <TableCell key={z}>
                                <div className="flex items-center justify-center gap-1">
                                  {[0, 1].map((k) => (
                                    <Input
                                      key={k}
                                      inputMode="numeric"
                                      aria-label={`${t} ${NOMBRE_ZONA[z]} ${k ? "máximo" : "mínimo"}`}
                                      value={par[k]}
                                      placeholder={k ? "máx" : "mín"}
                                      onChange={(e) => setCelda(t, z, k as 0 | 1, e.target.value)}
                                      className={cn(
                                        "tabular h-8 px-1.5 text-center",
                                        muchasZonas ? "w-12" : "w-14",
                                        vacia && "border-dashed border-amber-400 bg-amber-50/50",
                                        invertida && "border-red-400"
                                      )}
                                    />
                                  ))}
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell className="whitespace-normal pr-4 text-right text-sm">
                            {d.n === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className={cn("tabular", malo && "font-semibold text-amber-700")}>
                                {num(d.n)} · {num(d.dev)} dev.
                                {(d.chico > 0 || d.grande > 0) && (
                                  <span className="block text-xs font-normal text-muted-foreground">
                                    {d.chico > 0 && `${d.chico} chico`}
                                    {d.chico > 0 && d.grande > 0 && " · "}
                                    {d.grande > 0 && `${d.grande} grande`}
                                  </span>
                                )}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-border bg-card px-4 py-3",
                  cambiado && "sticky bottom-0 z-10 shadow-[0_-6px_16px_-10px_rgba(0,0,0,0.25)]"
                )}
              >
                <p className="text-sm text-muted-foreground">
                  {vacias.length > 0 ? (
                    <span className="text-amber-700">Faltan medidas en {vacias.join(", ")}.</span>
                  ) : (
                    "Tabla completa."
                  )}{" "}
                  {cambiado && <span className="font-medium text-foreground">Hay cambios sin guardar.</span>}
                </p>
                <div className="flex w-full gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
                  <Button variant="ghost" size="sm" disabled={!cambiado} onClick={() => setBorrador(aBorrador(prenda))}>
                    <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Descartar
                  </Button>
                  <Button size="sm" disabled={!cambiado} onClick={guardar}>
                    <Save className="mr-1.5 h-3.5 w-3.5" /> Guardar tabla
                  </Button>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </PageBody>

      <Sheet open={elegirAbierto} onOpenChange={setElegirAbierto}>
        <SheetContent side="bottom" className="portal-tienda max-h-[85dvh] gap-0 rounded-t-2xl p-0">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Elegí una prenda</SheetTitle>
            <SheetDescription>Primero las que piden atención: tabla incompleta o muchas devoluciones.</SheetDescription>
          </SheetHeader>
          {lista("min-h-0 flex-1")}
        </SheetContent>
      </Sheet>

      <Dialog open={aplicar} onOpenChange={setAplicar}>
        <DialogContent className="portal-tienda sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aplicar esta tabla a otras prendas</DialogTitle>
            <DialogDescription>
              Copia los rangos de {nombreCompleto(prenda)} a las otras prendas de la categoría {nombreCategoria(prenda.categoria).toLowerCase()} que elijas, talle por talle.
              {cambiado ? " Incluye los cambios sin guardar." : ""}
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {hermanas.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60">
                  <Checkbox
                    checked={destinos.has(p.id)}
                    onCheckedChange={(c) => {
                      const n = new Set(destinos);
                      if (c) n.add(p.id);
                      else n.delete(p.id);
                      setDestinos(n);
                    }}
                  />
                  <PrendaIlustracion prenda={p} className="h-9 w-7 shrink-0 rounded" />
                  <span className="flex-1 truncate text-sm">{nombreCompleto(p)}</span>
                  {!tablaCompleta(p) && <span className="text-xs text-amber-700">incompleta</span>}
                </label>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAplicar(false)}>
              Cancelar
            </Button>
            <Button disabled={destinos.size === 0} onClick={aplicarA}>
              Aplicar a {num(destinos.size)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
