import { useMemo } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  BadgePercent,
  Check,
  FileSpreadsheet,
  PartyPopper,
  Receipt,
  Ruler,
  ShoppingBag,
  Store,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Chip, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import {
  C_DEVOL,
  C_GRILLA,
  C_SERIE,
  ChipEstadoPrenda,
  ConTienda,
  MIN_VENTAS,
  TICK,
  TOOLTIP_ESTILO,
  UMBRAL_DEV,
  statsPorPrenda,
  useDatosTienda,
} from "../../components/tienda/comun";
import { LISTA_TARJETAS } from "../../components/tienda/movil";
import { useStore } from "../../lib/store";
import { tasaDevTalle } from "../../lib/metricas";
import { HOY, MESES, MES_ACTUAL, comisionDe, mesDe } from "../../data/seed";
import { tablaCompleta, nombreCompleto, type Prenda } from "../../data/prendas";
import type { Tienda } from "../../data/tiendas";
import { fecha, fechaLarga, mesCorto, money, moneyCorto, num, pct } from "../../lib/format";
import { cn } from "../../components/ui/utils";

export function TiendaInicio() {
  return (
    <ConTienda titulo="Mi tienda">
      {(t) => (t.estado === "onboarding" ? <Alta tienda={t} /> : <Tablero tienda={t} />)}
    </ConTienda>
  );
}

// ── Tienda activa ────────────────────────────────────────────

const mesAnterior = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return mm === 1 ? `${y - 1}-12` : `${y}-${String(mm - 1).padStart(2, "0")}`;
};

function Tablero({ tienda }: { tienda: Tienda }) {
  const { prendas, ventas, pruebas } = useDatosTienda(tienda.id);

  const delMes = ventas.filter((v) => mesDe(v.fecha) === MES_ACTUAL);
  const anterior = ventas.filter((v) => mesDe(v.fecha) === mesAnterior(MES_ACTUAL));
  // El mes en curso va por el día 22: se compara contra los mismos días del mes anterior.
  const dia = HOY.slice(8, 10);
  const anteriorMismosDias = anterior.filter((v) => v.fecha.slice(8, 10) <= dia);
  const facturacion = delMes.filter((v) => v.estado === "confirmada").reduce((a, v) => a + v.precio, 0);
  const comision = delMes.reduce((a, v) => a + comisionDe(v), 0);
  const variacionVentas = anteriorMismosDias.length
    ? ((delMes.length - anteriorMismosDias.length) / anteriorMismosDias.length) * 100
    : undefined;

  const ahora = tasaDevTalle(ventas);
  const siguieron = ventas.filter((v) => v.siguio);
  const ahoraSiguieron = tasaDevTalle(siguieron);
  const antes = tienda.devTalleAntes;
  const evitadas = Math.max(0, Math.round(((antes - ahora) / 100) * ventas.length));

  const serie = useMemo(() => {
    const desde = mesDe(tienda.fechaAlta);
    return MESES.filter((m) => m >= desde).map((m) => {
      const vs = ventas.filter((v) => mesDe(v.fecha) === m);
      const devTalle = vs.filter((v) => v.motivoDevolucion === "talle").length;
      return {
        mes: mesCorto(m),
        quedaron: vs.length - devTalle,
        devTalle,
        tasa: vs.length ? (devTalle / vs.length) * 100 : 0,
      };
    });
  }, [ventas, tienda.fechaAlta]);

  const stats = useMemo(() => statsPorPrenda(prendas, ventas, pruebas), [prendas, ventas, pruebas]);
  const peores = prendas
    .map((p) => ({ p, s: stats.get(p.id)! }))
    .filter((x) => x.s.comprada >= MIN_VENTAS && x.s.devTalle > 0)
    .sort((a, b) => b.s.pctDevTalle - a.s.pctDevTalle)
    .slice(0, 5);
  const porId = new Map(prendas.map((p) => [p.id, p]));

  return (
    <>
      <PageHeader
        titulo={`Hola, ${tienda.nombre}`}
        bajada={`Lo que la app le aportó a tu tienda desde que te sumaste, el ${fechaLarga(tienda.fechaAlta)}.`}
        acciones={
          <Button asChild variant="outline">
            <Link to="/tienda/ventas">
              Ver ventas <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Kpi
            etiqueta="Ventas desde la app"
            valor={num(delMes.length)}
            detalle={`vs. ${num(anteriorMismosDias.length)} al día ${Number(dia)} de ${mesCorto(mesAnterior(MES_ACTUAL))}`}
            variacion={variacionVentas}
            icono={ShoppingBag}
            acento="verde"
          />
          <Kpi etiqueta="Facturación del mes" valor={moneyCorto(facturacion)} detalle="ventas que no se devolvieron" icono={Receipt} />
          <Kpi
            etiqueta="Comisión a pagar"
            valor={money(comision)}
            detalle={`${tienda.comisionPct} % de lo vendido · en curso`}
            icono={BadgePercent}
          />
          <Kpi
            etiqueta="Devolución por talle"
            valor={delMes.length ? pct(tasaDevTalle(delMes), 1) : "—"}
            detalle={`este mes · antes ${pct(antes)}`}
            icono={Undo2}
            acento={!delMes.length ? "neutro" : tasaDevTalle(delMes) < antes ? "verde" : "ambar"}
          />
        </div>

        {ventas.length === 0 ? (
          <RecienPublicada tienda={tienda} prendas={prendas} />
        ) : (
          <>
        {/* Protagonista: antes vs. ahora */}
        <Panel
          titulo="Devoluciones por talle: antes y después de sumarte"
          bajada="Antes: lo que nos contaste en el alta. Ahora: calculado con tus ventas que llegaron desde la app."
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div className="flex items-end gap-4 sm:gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Antes</p>
                <p className="tabular whitespace-nowrap text-3xl font-semibold text-slate-400 line-through decoration-2 sm:text-4xl">{pct(antes)}</p>
              </div>
              <ArrowRight className="mb-3 h-6 w-6 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-700)]">Ahora</p>
                <p className="tabular whitespace-nowrap font-display text-5xl font-semibold leading-none text-[var(--brand-700)] sm:text-6xl">{pct(ahora, 1)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <BarraComparacion etiqueta="Antes de sumarte a la app" valor={antes} gris />
              <BarraComparacion etiqueta="Todas tus ventas desde la app" valor={ahora} />
              <BarraComparacion etiqueta="Quienes compraron el talle que les recomendamos" valor={ahoraSiguieron} fuerte />
              <p className="pt-1 text-sm text-muted-foreground">
                Sobre {num(ventas.length)} ventas, son unas{" "}
                <span className="font-semibold text-foreground">{num(evitadas)} devoluciones por talle evitadas</span>
                {antes > ahora ? ` (${Math.round(((antes - ahora) / antes) * 100)} % menos).` : "."}
              </p>
            </div>
          </div>
        </Panel>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel titulo="Ventas por mes" bajada="Las que se quedaron y las devueltas por talle" className="lg:col-span-2">
            {serie.length === 0 ? (
              <Vacio icono={ShoppingBag} titulo="Todavía no hay ventas" />
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={serie} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C_GRILLA} vertical={false} />
                  <XAxis dataKey="mes" tick={TICK} axisLine={false} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    contentStyle={TOOLTIP_ESTILO}
                    formatter={(v: number, n: string) => [num(v), n]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="quedaron" name="Se quedaron" stackId="v" fill={C_SERIE} stroke="#fff" strokeWidth={1} barSize={26} />
                  <Bar dataKey="devTalle" name="Devueltas por talle" stackId="v" fill={C_DEVOL} stroke="#fff" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel
            titulo="Prendas con más devoluciones"
            bajada={`Más de ${UMBRAL_DEV} %: la tabla de talles probablemente esté mal cargada`}
            bodyClassName="p-0"
          >
            {peores.length === 0 ? (
              <Vacio icono={Check} titulo="Ninguna prenda con devoluciones por talle" />
            ) : (
              <ul className="divide-y divide-border">
                {peores.map(({ p, s }) => {
                  const alerta = s.pctDevTalle >= UMBRAL_DEV;
                  return (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                      <PrendaIlustracion prenda={p} className="h-12 w-10 shrink-0 rounded-md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{nombreCompleto(p)}</p>
                        <p className="text-xs text-muted-foreground">
                          {num(s.devTalle)} de {num(s.comprada)} ventas
                        </p>
                        {alerta && (
                          <Link to={`/tienda/talles?prenda=${p.id}`} className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline">
                            <AlertTriangle className="h-3 w-3" /> Tabla probablemente mal cargada
                          </Link>
                        )}
                      </div>
                      <span className={cn("tabular text-sm font-semibold", alerta ? "text-amber-700" : "text-foreground")}>
                        {pct(s.pctDevTalle)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

          </>
        )}

        <Panel
          titulo="Últimas ventas"
          acciones={
            <Link to="/tienda/ventas" className="text-sm font-medium text-[var(--brand-700)] hover:underline">
              Ver todas
            </Link>
          }
          bodyClassName="p-0"
        >
          {ventas.length === 0 ? (
            <Vacio icono={ShoppingBag} titulo="Todavía no hay ventas" detalle="Cuando alguien compre una de tus prendas desde la app, aparece acá." />
          ) : (
            <>
            <ul className={LISTA_TARJETAS}>
              {ventas.slice(0, 6).map((v) => {
                const p = porId.get(v.prendaId);
                return (
                  <li key={v.id} className="flex gap-3 px-4 py-3">
                    {p && <PrendaIlustracion prenda={p} className="h-12 w-10 shrink-0 rounded-md" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-snug">{p ? nombreCompleto(p) : v.prendaId}</p>
                        <p className="tabular shrink-0 text-sm font-semibold">{money(v.precio)}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {fecha(v.fecha)} · talle <span className="font-semibold text-foreground">{v.talle}</span>
                        {v.siguio ? (
                          <span className="text-[var(--brand-700)]"> · recomendado</span>
                        ) : (
                          <> · le sugerimos {v.talleRecomendado}</>
                        )}
                      </p>
                      {v.estado === "devuelta" && (
                        <Chip className="mt-1.5 border-orange-200 bg-orange-50 text-orange-800">
                          Devuelta{v.motivoDevolucion === "talle" ? " · talle" : ""}
                        </Chip>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="hidden xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Fecha</TableHead>
                  <TableHead>Prenda</TableHead>
                  <TableHead>Talle</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="pr-4 text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.slice(0, 6).map((v) => {
                  const p = porId.get(v.prendaId);
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="pl-4 text-muted-foreground">{fecha(v.fecha)}</TableCell>
                      <TableCell className="font-medium">{p ? nombreCompleto(p) : v.prendaId}</TableCell>
                      <TableCell>
                        {v.talle}
                        {v.siguio ? (
                          <span className="ml-2 text-xs text-[var(--brand-700)]">recomendado</span>
                        ) : (
                          <span className="ml-2 text-xs text-muted-foreground">le sugerimos {v.talleRecomendado}</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular text-right">{money(v.precio)}</TableCell>
                      <TableCell className="pr-4 text-right">
                        {v.estado === "devuelta" ? (
                          <Chip className="border-orange-200 bg-orange-50 text-orange-800">
                            Devuelta{v.motivoDevolucion === "talle" ? " · talle" : ""}
                          </Chip>
                        ) : (
                          <Chip className="border-border text-muted-foreground">Confirmada</Chip>
                        )}
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
      </PageBody>
    </>
  );
}

function RecienPublicada({ tienda, prendas }: { tienda: Tienda; prendas: Prenda[] }) {
  const publicadas = prendas.filter((p) => p.estado === "publicada");
  return (
    <Panel
      titulo="Tu tienda ya está en la app"
      bajada="Cuando lleguen las primeras ventas vas a ver acá cuánto bajan tus devoluciones por talle."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Devolución por talle antes de sumarte</p>
          <p className="tabular font-display text-5xl font-semibold text-slate-500">{pct(tienda.devTalleAntes)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Es el punto de partida. Con {num(publicadas.length)} prendas publicadas con su tabla de talles, la app ya les recomienda el talle a los usuarios.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link to="/tienda/prendas">Ver mis prendas</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/tienda/insights">Insights de talles</Link>
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {publicadas.slice(0, 8).map((p) => (
            <PrendaIlustracion key={p.id} prenda={p} className="aspect-[4/5] rounded-lg" />
          ))}
        </div>
      </div>
    </Panel>
  );
}

function BarraComparacion({ etiqueta, valor, gris, fuerte }: { etiqueta: string; valor: number; gris?: boolean; fuerte?: boolean }) {
  const max = 40;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className={cn(fuerte ? "font-medium text-foreground" : "text-muted-foreground")}>{etiqueta}</span>
        <span className="tabular shrink-0 whitespace-nowrap font-semibold">{pct(valor, 1)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, (valor / max) * 100)}%`,
            background: gris ? "#a8adb5" : fuerte ? "var(--brand-700)" : "var(--brand)",
          }}
        />
      </div>
    </div>
  );
}

// ── Tienda en alta ───────────────────────────────────────────

function Alta({ tienda }: { tienda: Tienda }) {
  const { actualizarTienda, actualizarPrenda } = useStore();
  const { prendas } = useDatosTienda(tienda.id);

  const datosOk = !!(tienda.nombre && tienda.descripcion && tienda.ciudad && tienda.web && tienda.contacto);
  const catalogoOk = prendas.length > 0;
  const completas = prendas.filter((p) => tablaCompleta(p)).length;
  const tablasOk = catalogoOk && completas === prendas.length;
  const listo = datosOk && catalogoOk && tablasOk;

  const pasos = [
    {
      titulo: "Datos de la tienda",
      detalle: datosOk ? `${tienda.nombre} · ${tienda.ciudad} · ${tienda.web}` : "Completá descripción, ciudad, web y contacto.",
      hecho: datosOk,
      to: "/tienda/perfil",
      accion: datosOk ? "Revisar" : "Completar",
      icono: Store,
    },
    {
      titulo: "Cargar el catálogo",
      detalle: catalogoOk ? `${num(prendas.length)} prendas cargadas` : "Subí tu planilla de prendas (CSV) o probá con la de ejemplo.",
      hecho: catalogoOk,
      to: "/tienda/carga",
      accion: catalogoOk ? "Cargar más" : "Cargar",
      icono: FileSpreadsheet,
    },
    {
      titulo: "Completar las tablas de talles",
      detalle: !catalogoOk
        ? "Cada prenda necesita su tabla de medidas para que podamos recomendar el talle."
        : tablasOk
          ? "Todas las prendas tienen su tabla completa."
          : `${num(completas)} de ${num(prendas.length)} prendas con la tabla completa`,
      hecho: tablasOk,
      to: "/tienda/talles",
      accion: "Abrir tablas",
      icono: Ruler,
    },
  ];
  const hechos = pasos.filter((p) => p.hecho).length;

  const publicar = () => {
    actualizarTienda(tienda.id, { estado: "activa" });
    let n = 0;
    for (const p of prendas) {
      if (tablaCompleta(p) && p.estado !== "publicada") actualizarPrenda(p.id, { estado: "publicada" });
      if (tablaCompleta(p)) n++;
    }
    toast.success("¡Listo! Tus prendas ya aparecen en la app", {
      description: `${num(n)} prendas de ${tienda.nombre} publicadas.`,
    });
  };

  return (
    <>
      <PageHeader
        titulo={`¡Hola, ${tienda.nombre}!`}
        bajada="Tres pasos y tus prendas aparecen en la app con la recomendación de talle. Te lleva unos minutos."
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Panel titulo="Alta de tu tienda" bajada={`${hechos} de 4 pasos completos`}>
            <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${(hechos / 4) * 100}%` }} />
            </div>
            <ol className="space-y-3">
              {pasos.map((p, i) => (
                <li
                  key={p.titulo}
                  className={cn(
                    "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-xl border p-4 sm:flex",
                    p.hecho ? "border-[var(--brand-100)] bg-[var(--brand-50)]" : "border-border"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-full text-sm font-semibold sm:self-center",
                      p.hecho ? "bg-[var(--brand)] text-white" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {p.hecho ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{p.titulo}</p>
                    <p className="text-sm text-muted-foreground sm:truncate">{p.detalle}</p>
                  </div>
                  <Button asChild size="sm" variant={p.hecho ? "ghost" : "default"} className={cn("col-start-2 justify-self-start", p.hecho && "max-sm:-ml-3")}>
                    <Link to={p.to}>{p.accion}</Link>
                  </Button>
                </li>
              ))}
              <li
                className={cn(
                  "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-xl border-2 border-dashed p-4 sm:flex",
                  listo ? "border-[var(--brand)]" : "border-border"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-full text-sm font-semibold sm:self-center",
                    listo ? "bg-[var(--brand-100)] text-[var(--brand-700)]" : "bg-muted text-muted-foreground"
                  )}
                >
                  4
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Publicar</p>
                  <p className="text-sm text-muted-foreground">
                    {listo ? "Todo listo: al publicar, tus prendas aparecen en la app." : "Se habilita cuando completes los pasos anteriores."}
                  </p>
                </div>
                <Button disabled={!listo} onClick={publicar} className="col-span-2 sm:shrink-0">
                  <PartyPopper className="mr-2 h-4 w-4" /> Publicar mi tienda
                </Button>
              </li>
            </ol>
          </Panel>

          <Panel titulo="Tu catálogo" bajada={catalogoOk ? `${num(prendas.length)} prendas` : "Vacío por ahora"}>
            {catalogoOk ? (
              <div className="grid grid-cols-3 gap-3">
                {prendas.slice(0, 9).map((p) => (
                  <div key={p.id} className="min-w-0">
                    <PrendaIlustracion prenda={p} className="aspect-[4/5] rounded-lg" />
                    <p className="mt-1 truncate text-xs font-medium">{p.nombre}</p>
                    <ChipEstadoPrenda estado={tablaCompleta(p) ? "publicada" : "incompleta"} className="mt-1 px-1.5 text-[10px]" />
                  </div>
                ))}
              </div>
            ) : (
              <Vacio
                icono={FileSpreadsheet}
                titulo="Todavía no cargaste prendas"
                detalle="Con la planilla de ejemplo podés ver cómo queda en un minuto."
                accion={
                  <Button asChild size="sm">
                    <Link to="/tienda/carga">Cargar catálogo</Link>
                  </Button>
                }
              />
            )}
          </Panel>
        </div>

        <Panel titulo="Qué vas a ver cuando publiques">
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="font-medium">Menos devoluciones por talle</p>
              <p className="text-muted-foreground">
                Hoy se te devuelve el {pct(tienda.devTalleAntes)} de las ventas online por talle. Con la app, quien compra el talle que le recomendamos devuelve bastante menos.
              </p>
            </div>
            <div>
              <p className="font-medium">Ventas que llegan desde la app</p>
              <p className="text-muted-foreground">Pagás {tienda.comisionPct} % sólo por las ventas que se quedan: las devueltas no comisionan.</p>
            </div>
            <div>
              <p className="font-medium">Qué talles pedir</p>
              <p className="text-muted-foreground">Te mostramos qué talles recomendamos más de cada prenda, para que ajustes el stock.</p>
            </div>
          </div>
        </Panel>
      </PageBody>
    </>
  );
}
