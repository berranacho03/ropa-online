import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { BarChart3, HelpCircle, PackageOpen, Ruler, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Barra, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import { C_GRILLA, C_SERIE, ConTienda, TICK, TOOLTIP_ESTILO, useDatosTienda } from "../../components/tienda/comun";
import { LISTA_TARJETAS } from "../../components/tienda/movil";
import { useStore } from "../../lib/store";
import { recomendar, tablaPara } from "../../lib/talles";
import { compatible } from "../../data/seed";
import { nombreCompleto, tablaCompleta, type Prenda } from "../../data/prendas";
import type { Tienda } from "../../data/tiendas";
import { num, pct } from "../../lib/format";
import { cn } from "../../components/ui/utils";

export function TiendaInsights() {
  return <ConTienda titulo="Insights de talles">{(t) => <Insights tienda={t} />}</ConTienda>;
}

const MUESTRA = 400;
const DUDA = 70;

interface Analisis {
  prenda: Prenda;
  usuarios: number;
  dist: { talle: string; n: number; pct: number }[];
  top: string;
  confMedia: number;
  pctDuda: number;
  /** Respecto de la tabla estándar: a cuántos les tocaría un talle distinto. */
  masChico: number;
  masGrande: number;
}

/** Reparte N unidades proporcionalmente, sin perder unidades por redondeo. */
function repartir(dist: { talle: string; pct: number }[], total: number) {
  const base = dist.map((d) => ({ talle: d.talle, exacto: (d.pct / 100) * total }));
  const out = base.map((b) => ({ talle: b.talle, n: Math.floor(b.exacto), resto: b.exacto - Math.floor(b.exacto) }));
  let falta = total - out.reduce((a, b) => a + b.n, 0);
  for (const o of [...out].sort((a, b) => b.resto - a.resto)) {
    if (falta <= 0) break;
    o.n++;
    falta--;
  }
  return out;
}

function Insights({ tienda }: { tienda: Tienda }) {
  const { usuarios } = useStore();
  const { prendas } = useDatosTienda(tienda.id);
  const muestra = useMemo(() => usuarios.filter((u) => u.medidas).slice(0, MUESTRA), [usuarios]);

  const analisis = useMemo<Analisis[]>(() => {
    return prendas
      .filter((p) => tablaCompleta(p))
      .map((p) => {
        const std = tablaPara(p.categoria, p.calce, 0, p.talles);
        const cuenta = new Map(p.talles.map((t) => [t, 0]));
        let conf = 0;
        let duda = 0;
        let n = 0;
        let masChico = 0;
        let masGrande = 0;
        for (const u of muestra) {
          if (!compatible(p, u.medidas!)) continue;
          const r = recomendar(p.tabla, p.categoria, u.medidas!);
          if (!r) continue;
          n++;
          cuenta.set(r.talle, (cuenta.get(r.talle) ?? 0) + 1);
          conf += r.confianza;
          if (r.confianza < DUDA) duda++;
          const rs = recomendar(std, p.categoria, u.medidas!);
          if (rs && rs.talle !== r.talle) {
            if (p.talles.indexOf(r.talle) < p.talles.indexOf(rs.talle)) masChico++;
            else masGrande++;
          }
        }
        const dist = p.talles.map((t) => ({ talle: t, n: cuenta.get(t) ?? 0, pct: n ? ((cuenta.get(t) ?? 0) / n) * 100 : 0 }));
        const top = [...dist].sort((a, b) => b.n - a.n)[0]?.talle ?? "—";
        return {
          prenda: p,
          usuarios: n,
          dist,
          top,
          confMedia: n ? conf / n : 0,
          pctDuda: n ? (duda / n) * 100 : 0,
          masChico: n ? (masChico / n) * 100 : 0,
          masGrande: n ? (masGrande / n) * 100 : 0,
        };
      });
  }, [prendas, muestra]);

  const [sel, setSel] = useState<string | undefined>();
  const [pedido, setPedido] = useState("100");
  const refGrafico = useRef<HTMLDivElement>(null);
  const actual = analisis.find((a) => a.prenda.id === sel) ?? analisis[0];

  if (analisis.length === 0)
    return (
      <>
        <PageHeader titulo="Insights de talles" />
        <PageBody>
          <Vacio
            icono={BarChart3}
            titulo="Necesitamos prendas con su tabla de talles completa"
            detalle="Con la tabla cargada calculamos qué talle les recomendaríamos a los usuarios de la app."
            accion={
              <Button asChild size="sm">
                <Link to={prendas.length ? "/tienda/talles" : "/tienda/carga"}>{prendas.length ? "Completar tablas" : "Cargar catálogo"}</Link>
              </Button>
            }
          />
        </PageBody>
      </>
    );

  const total = Math.max(0, Math.min(100000, Math.round(Number(pedido) || 0)));
  const reparto = repartir(actual.dist, total);
  const dudosas = [...analisis].sort((a, b) => a.confMedia - b.confMedia);
  const confGeneral = analisis.reduce((a, x) => a + x.confMedia * x.usuarios, 0) / Math.max(1, analisis.reduce((a, x) => a + x.usuarios, 0));
  const masChico = analisis.reduce((a, x) => a + x.masChico, 0) / analisis.length;
  const masGrande = analisis.reduce((a, x) => a + x.masGrande, 0) / analisis.length;

  const s = tienda.sesgoTalle;
  const equivalencia =
    s === 0 ? "un M" : s > 0 ? (s >= 2 ? "un L" : "un M/L") : s <= -2 ? "un S" : "un S/M";

  return (
    <>
      <PageHeader
        titulo="Insights de talles"
        bajada={`Qué talle les recomendaríamos de cada prenda a ${num(muestra.length)} usuarios de la app con sus medidas cargadas. Sirve para decidir cuánto stock pedir de cada talle.`}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Kpi etiqueta="Usuarios en la muestra" valor={num(muestra.length)} detalle="con medidas cargadas" icono={Users} />
          <Kpi etiqueta="Prendas analizadas" valor={num(analisis.length)} detalle="con tabla completa" icono={Ruler} />
          <Kpi
            etiqueta="Confianza media"
            valor={pct(confGeneral)}
            detalle="de la recomendación de talle"
            icono={HelpCircle}
            acento={confGeneral >= 75 ? "verde" : "ambar"}
          />
          <Kpi
            etiqueta="Tu molde"
            valor={s === 0 ? "Estándar" : s > 0 ? `+${s} cm` : `${s} cm`}
            detalle={`tu M equivale a ${equivalencia}`}
            icono={PackageOpen}
          />
        </div>

        <div ref={refGrafico} className="scroll-mt-4">
        <Panel
          titulo="Qué talles se recomiendan"
          bajada={`${nombreCompleto(actual.prenda)} · ${num(actual.usuarios)} usuarios compatibles`}
          acciones={
            <Select value={actual.prenda.id} onValueChange={setSel}>
              <SelectTrigger className="h-9 w-[min(16rem,calc(100vw-4.5rem))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {analisis.map((a) => (
                  <SelectItem key={a.prenda.id} value={a.prenda.id}>
                    {nombreCompleto(a.prenda)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[7rem_1fr_16rem]">
            <PrendaIlustracion prenda={actual.prenda} className="hidden aspect-[4/5] rounded-lg lg:flex" />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={actual.dist} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C_GRILLA} vertical={false} />
                <XAxis dataKey="talle" tick={{ ...TICK, fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} %`} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={TOOLTIP_ESTILO}
                  formatter={(v: number, _n, item) => [`${pct(v, 1)} · ${num(item.payload.n)} usuarios`, "Recomendado"]}
                  labelFormatter={(l) => `Talle ${l}`}
                />
                <Bar dataKey="pct" fill={C_SERIE} radius={[4, 4, 0, 0]} maxBarSize={56}>
                  <LabelList dataKey="pct" position="top" formatter={(v: number) => (v >= 1 ? pct(v) : "")} style={{ fontSize: 11, fill: "#4b5563" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-medium">¿Cuánto pedir de cada talle?</p>
              <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                Pedido de
                <Input value={pedido} onChange={(e) => setPedido(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="tabular h-8 w-20 bg-card" />
                unidades
              </label>
              <ul className="mt-3 space-y-1.5">
                {reparto.map((r) => (
                  <li key={r.talle} className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{r.talle}</span>
                    <span className={cn("tabular", r.n === 0 && "text-muted-foreground")}>{num(r.n)} u.</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Proporcional a lo que recomendamos. Es una guía: sumale tu historial de ventas.</p>
            </div>
          </div>
        </Panel>

        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Panel titulo="Dónde dudan más los usuarios" bajada={`Confianza media de la recomendación y % de usuarios con menos de ${DUDA} %`} bodyClassName="p-0">
            <ul className={LISTA_TARJETAS}>
              {dudosas.map((a) => (
                <li key={a.prenda.id}>
                  <button
                    onClick={() => {
                      setSel(a.prenda.id);
                      setTimeout(() => refGrafico.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                    }}
                    className={cn("flex w-full gap-3 px-4 py-3 text-left", a.prenda.id === actual.prenda.id && "bg-[var(--brand-50)]")}
                  >
                    <PrendaIlustracion prenda={a.prenda} className="h-12 w-10 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-snug">{nombreCompleto(a.prenda)}</p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          más pedido <span className="text-sm font-semibold text-foreground">{a.top}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs">
                        <Barra valor={a.confMedia} max={100} className="flex-1" />
                        <span className="tabular shrink-0">{pct(a.confMedia)} confianza</span>
                      </div>
                      <p className={cn("mt-0.5 text-xs text-muted-foreground", a.pctDuda >= 40 && "font-semibold text-amber-700")}>
                        Dudan {pct(a.pctDuda)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Prenda</TableHead>
                  <TableHead className="whitespace-normal leading-tight">Más recomendado</TableHead>
                  <TableHead className="w-40">Confianza media</TableHead>
                  <TableHead className="pr-4 text-right">Dudan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dudosas.map((a) => (
                  <TableRow key={a.prenda.id} className="cursor-pointer" onClick={() => setSel(a.prenda.id)}>
                    <TableCell className="min-w-[10rem] whitespace-normal pl-4">
                      <div className="flex items-center gap-2.5">
                        <PrendaIlustracion prenda={a.prenda} className="h-9 w-7 shrink-0 rounded" />
                        <span className="font-medium">{nombreCompleto(a.prenda)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{a.top}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Barra valor={a.confMedia} max={100} className="w-20" />
                        <span className="tabular text-sm">{pct(a.confMedia)}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("tabular pr-4 text-right", a.pctDuda >= 40 && "font-semibold text-amber-700")}>{pct(a.pctDuda)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              Cuando la confianza es baja, la persona está entre dos talles. Rangos más finos en la tabla, o el probador virtual, ayudan a decidir.
            </p>
          </Panel>

          <Panel titulo="Tu molde vs. el estándar" bajada="Comparado con la tabla de referencia de cada categoría">
            <p className="font-display text-2xl font-semibold leading-snug">
              Tu M equivale a {equivalencia} de otras tiendas.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {s === 0
                ? "Tus tablas están alineadas con la referencia: quien es M en otras tiendas, es M en la tuya."
                : s > 0
                  ? `Tu ropa viene ${s} cm más amplia que la referencia en pecho, cintura y cadera. Muchos usuarios necesitan un talle menos del que suelen comprar.`
                  : `Tu ropa viene ${Math.abs(s)} cm más justa que la referencia. Muchos usuarios necesitan un talle más del que suelen comprar.`}
            </p>
            <div className="mt-5 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Les recomendamos un talle más chico</span>
                  <span className="tabular font-semibold">{pct(masChico)}</span>
                </div>
                <Barra valor={masChico} max={100} />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Les recomendamos un talle más grande</span>
                  <span className="tabular font-semibold">{pct(masGrande)}</span>
                </div>
                <Barra valor={masGrande} max={100} />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Respecto del talle que les tocaría con la tabla estándar. Es justo lo que la app evita: que alguien compre «su talle de siempre» y le quede mal.
            </p>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
