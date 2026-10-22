import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Crown, Percent, Repeat, TrendingDown, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Chip, Kpi, PageBody, PageHeader, Panel } from "../../components/shell";
import { Button } from "../../components/ui/button";
import { Ficha, ListaFichas, SoloEscritorio } from "../../components/admin/responsive";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  CURSOR_BARRA,
  CajaTooltip,
  EJE,
  GRILLA,
  KpiMeta,
  Leyenda,
  MALO,
  META,
  SERIE,
  enMiles,
  fmt1,
  techo,
} from "../../components/admin2/graficos";
import { useStore } from "../../lib/store";
import { conversionPremium, finDeMes, serieMensual, subActivaEn } from "../../lib/metricas";
import { HOY, MESES, mesDe } from "../../data/seed";
import { addDays } from "../../data/azar";
import { CANALES } from "../../data/usuarios";
import { fecha, mesCorto, money, moneyCorto, num } from "../../lib/format";

const META_CONVERSION = 5;

export function AdminSuscripciones() {
  const store = useStore();
  const { usuarios, suscripciones, supuestos } = store;
  const [verTodas, setVerTodas] = useState(false);
  const [filtroPlan, setFiltroPlan] = useState<"todas" | "mensual" | "anual" | "bajas">("todas");

  const serie = useMemo(
    () => serieMensual(store),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.usuarios, store.suscripciones, store.ventas, store.pruebas, store.campanas, store.supuestos]
  );

  const d = useMemo(() => {
    const activas = suscripciones.filter((s) => subActivaEn(s, HOY));
    const mensuales = activas.filter((s) => s.plan === "mensual").length;
    const anuales = activas.length - mensuales;
    const mrr = mensuales * supuestos.precioMensual + anuales * (supuestos.precioAnual / 12);

    // Altas, bajas, MRR y churn por mes.
    const porMes = MESES.map((mes) => {
      const ini = `${mes}-01`;
      const corte = finDeMes(mes) < HOY ? finDeMes(mes) : HOY;
      const activasIni = suscripciones.filter((s) => subActivaEn(s, addDays(ini, -1))).length;
      const altas = suscripciones.filter((s) => mesDe(s.inicio) === mes).length;
      const bajas = suscripciones.filter((s) => s.fin && mesDe(s.fin) === mes).length;
      const act = suscripciones.filter((s) => subActivaEn(s, corte));
      const m = act.filter((s) => s.plan === "mensual").length;
      return {
        mes,
        etiqueta: mesCorto(mes),
        altas,
        bajas,
        activasIni,
        churn: activasIni ? (bajas / activasIni) * 100 : 0,
        mrr: Math.round(m * supuestos.precioMensual + (act.length - m) * (supuestos.precioAnual / 12)),
      };
    });
    const completos = porMes.filter((x) => finDeMes(x.mes) < HOY && x.activasIni > 0);
    const ult3 = completos.slice(-3);
    const churn = ult3.length ? ult3.reduce((a, x) => a + x.churn, 0) / ult3.length : 0;
    const mrrAnterior = porMes.length >= 2 ? porMes[porMes.length - 2].mrr : mrr;

    // Conversión a Premium por canal (misma base que la métrica general).
    const base = usuarios.filter((u) => !u.demo && u.fechaAlta <= addDays(HOY, -14));
    const pagaron = new Set(suscripciones.map((s) => s.usuarioId));
    const porCanal = CANALES.map((c) => {
      const us = base.filter((u) => u.canal === c.id);
      const conv = us.length ? (us.filter((u) => pagaron.has(u.id)).length / us.length) * 100 : 0;
      return { canal: c.nombre, usuarios: us.length, conv: Math.round(conv * 10) / 10 };
    }).sort((a, b) => b.conv - a.conv);

    return { activas: activas.length, mensuales, anuales, mrr, mrrAnterior, porMes, churn, porCanal };
  }, [suscripciones, usuarios, supuestos]);

  const conversion = useMemo(() => conversionPremium(usuarios, suscripciones), [usuarios, suscripciones]);

  const ingresos = useMemo(() => {
    const filas = serie.map((p) => ({
      etiqueta: mesCorto(p.mes),
      suscripciones: Math.round(p.suscripciones),
      comisiones: Math.round(p.comisiones),
    }));
    const subs = filas.reduce((a, f) => a + f.suscripciones, 0);
    const com = filas.reduce((a, f) => a + f.comisiones, 0);
    return { filas, subs, com, pctSubs: subs + com ? (subs / (subs + com)) * 100 : 0 };
  }, [serie]);

  const nombre = useMemo(() => new Map(usuarios.map((u) => [u.id, u.nombre])), [usuarios]);

  const recientes = useMemo(() => {
    const filtradas = suscripciones.filter((s) =>
      filtroPlan === "todas" ? true : filtroPlan === "bajas" ? !!s.fin : s.plan === filtroPlan
    );
    return filtradas
      .map((s) => ({ s, ultimo: s.fin && s.fin > s.inicio ? s.fin : s.inicio }))
      .sort((a, b) => b.ultimo.localeCompare(a.ultimo) || b.s.id.localeCompare(a.s.id));
  }, [suscripciones, filtroPlan]);

  const mixMensual = d.activas ? (d.mensuales / d.activas) * 100 : 0;
  const variacionMrr = d.mrrAnterior ? ((d.mrr - d.mrrAnterior) / d.mrrAnterior) * 100 : 0;
  const cumpleConv = conversion >= META_CONVERSION;
  const maxConv = Math.max(META_CONVERSION + 1, ...d.porCanal.map((c) => c.conv));

  return (
    <>
      <PageHeader
        titulo="Suscripciones e ingresos"
        bajada="Premium habilita el probador virtual; la recomendación de talle es gratis. Acá se ve cuánto entra por suscripciones y cuánto por comisiones de las tiendas."
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
          <Kpi etiqueta="Premium activos" valor={num(d.activas)} detalle={`al ${fecha(HOY)}`} icono={Crown} acento="verde" />
          <Kpi
            etiqueta="MRR"
            valor={moneyCorto(d.mrr)}
            variacion={variacionMrr}
            detalle="vs. mes anterior"
            icono={Wallet}
            acento="verde"
          />
          <Kpi
            etiqueta="Churn mensual"
            valor={`${fmt1(d.churn)} %`}
            detalle="promedio 3 meses"
            icono={TrendingDown}
            acento={d.churn > 8 ? "rojo" : d.churn > 5 ? "ambar" : "neutro"}
          />
          <KpiMeta
            etiqueta="Conversión a Premium"
            valor={`${fmt1(conversion)} %`}
            cumple={cumpleConv}
            meta={`meta ${META_CONVERSION} %`}
            detalle="alguna vez pagaron"
            icono={Percent}
          />
          <Kpi
            etiqueta="Mix mensual / anual"
            valor={`${fmt1(mixMensual, 0)} / ${fmt1(100 - mixMensual, 0)}`}
            detalle={`${num(d.mensuales)} mensuales · ${num(d.anuales)} anuales`}
            icono={Repeat}
          />
          <Kpi
            etiqueta="Suscripciones / comisiones"
            valor={`${fmt1(ingresos.pctSubs, 0)} / ${fmt1(100 - ingresos.pctSubs, 0)}`}
            detalle="% del ingreso, 12 meses"
            icono={Wallet}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel titulo="Altas y bajas por mes" bajada="Suscripciones nuevas y canceladas en cada mes">
            <Leyenda
              items={[
                { nombre: "Altas", color: SERIE.a },
                { nombre: "Bajas", color: SERIE.b },
              ]}
            />
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={d.porMes} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid {...GRILLA} />
                <XAxis dataKey="etiqueta" {...EJE} interval="preserveStartEnd" />
                <YAxis {...EJE} allowDecimals={false} domain={techo(Math.max(...d.porMes.map((x) => Math.max(x.altas, x.bajas))))} tickCount={5} />
                <Tooltip cursor={CURSOR_BARRA} content={<CajaTooltip formato={(v) => num(v)} />} />
                <Bar dataKey="altas" name="Altas" fill={SERIE.a} radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="bajas" name="Bajas" fill={SERIE.b} radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel titulo="MRR por mes" bajada="Ingreso recurrente mensual al cierre de cada mes (anuales prorrateados en 12)">
            <ResponsiveContainer width="100%" height={264}>
              <LineChart data={d.porMes} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                <CartesianGrid {...GRILLA} />
                <XAxis dataKey="etiqueta" {...EJE} interval="preserveStartEnd" />
                <YAxis {...EJE} tickFormatter={enMiles} domain={techo(Math.max(...d.porMes.map((x) => x.mrr)))} tickCount={5} />
                <Tooltip content={<CajaTooltip formato={(v) => money(v)} />} />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  name="MRR"
                  stroke={SERIE.a}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Panel
            className="lg:col-span-3"
            titulo="Ingresos por mes"
            bajada={`Suscripciones vs. comisiones por ventas derivadas · 12 meses: ${moneyCorto(ingresos.subs)} y ${moneyCorto(ingresos.com)}`}
          >
            <Leyenda
              items={[
                { nombre: "Suscripciones", color: SERIE.a },
                { nombre: "Comisiones", color: SERIE.b },
              ]}
            />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ingresos.filas} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
                <CartesianGrid {...GRILLA} />
                <XAxis dataKey="etiqueta" {...EJE} interval="preserveStartEnd" />
                <YAxis {...EJE} tickFormatter={enMiles} domain={techo(Math.max(...ingresos.filas.map((f) => f.suscripciones + f.comisiones)))} tickCount={5} />
                <Tooltip cursor={CURSOR_BARRA} content={<CajaTooltip formato={(v) => money(v)} total />} />
                <Bar dataKey="suscripciones" name="Suscripciones" stackId="i" fill={SERIE.a} maxBarSize={28} stroke="var(--card)" strokeWidth={1} />
                <Bar dataKey="comisiones" name="Comisiones" stackId="i" fill={SERIE.b} radius={[4, 4, 0, 0]} maxBarSize={28} stroke="var(--card)" strokeWidth={1} />
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-muted-foreground">
              El mes en curso está incompleto: las comisiones son al {fecha(HOY)}.
            </p>
          </Panel>

          <Panel
            className="lg:col-span-2"
            titulo="Conversión a Premium por canal"
            bajada="Usuarios de cada canal que alguna vez pagaron"
          >
            <Leyenda
              items={[
                { nombre: "Cumple", color: SERIE.a },
                { nombre: "Debajo de la meta", color: MALO },
                { nombre: `Meta ${META_CONVERSION} %`, color: META, tipo: "meta" },
              ]}
            />
            <ResponsiveContainer width="100%" height={Math.max(220, d.porCanal.length * 38)}>
              <BarChart data={d.porCanal} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
                <CartesianGrid {...GRILLA} vertical horizontal={false} />
                <XAxis type="number" {...EJE} domain={[0, Math.ceil(maxConv)]} tickFormatter={(v) => `${v} %`} />
                <YAxis type="category" dataKey="canal" {...EJE} width={92} />
                <Tooltip
                  cursor={CURSOR_BARRA}
                  content={
                    <CajaTooltip
                      formato={(v) => `${fmt1(v)} %`}
                      titulo={(l, p) => `${l} · ${num(Number(p[0]?.payload?.usuarios ?? 0))} usuarios`}
                    />
                  }
                />
                <ReferenceLine x={META_CONVERSION} stroke={META} strokeDasharray="4 3" strokeWidth={1.5} />
                <Bar
                  dataKey="conv"
                  name="Conversión"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={18}
                  label={{ position: "right", fontSize: 11, fill: "var(--foreground)", formatter: (v: number) => `${fmt1(v)} %` }}
                >
                  {d.porCanal.map((c) => (
                    <Cell key={c.canal} fill={c.conv >= META_CONVERSION ? SERIE.a : MALO} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <Panel
          titulo="Suscripciones recientes"
          bajada="Altas y bajas más recientes"
          bodyClassName="p-0"
          acciones={
            <Tabs value={filtroPlan} onValueChange={(v) => setFiltroPlan(v as typeof filtroPlan)}>
              <TabsList>
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="mensual">Mensual</TabsTrigger>
                <TabsTrigger value="anual">Anual</TabsTrigger>
                <TabsTrigger value="bajas">Bajas</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <ListaFichas>
            {recientes.slice(0, verTodas ? 60 : 12).map(({ s }) => {
              const activa = subActivaEn(s, HOY) || (s.inicio === HOY && !s.fin);
              return (
                <Ficha
                  key={s.id}
                  titulo={
                    <Link to={`/admin/usuarios/${s.usuarioId}`} className="hover:underline">
                      {nombre.get(s.usuarioId) ?? s.usuarioId}
                    </Link>
                  }
                  subtitulo={s.inicio === HOY ? <span className="text-[var(--brand-700)]">nueva hoy</span> : undefined}
                  lateral={
                    activa ? (
                      <Chip className="border-[var(--brand-300)] bg-[var(--brand-50)] text-[var(--brand-700)]">Activa</Chip>
                    ) : (
                      <Chip className="border-border text-muted-foreground">Cancelada</Chip>
                    )
                  }
                  datos={[
                    [
                      "Plan",
                      <span className="tabular">
                        <span className="capitalize">{s.plan}</span> ·{" "}
                        {s.plan === "mensual" ? `${money(supuestos.precioMensual)}/mes` : `${money(supuestos.precioAnual)}/año`}
                      </span>,
                    ],
                    ["Inicio", <span className="tabular">{fecha(s.inicio)}</span>],
                    !activa && !!s.fin && ["Baja", <span className="tabular">{fecha(s.fin)}</span>],
                  ]}
                />
              );
            })}
          </ListaFichas>
          <SoloEscritorio>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Usuario</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead className="pr-4">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recientes.slice(0, verTodas ? 60 : 12).map(({ s }) => {
                const activa = subActivaEn(s, HOY) || (s.inicio === HOY && !s.fin);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="pl-4">
                      <Link to={`/admin/usuarios/${s.usuarioId}`} className="font-medium hover:underline">
                        {nombre.get(s.usuarioId) ?? s.usuarioId}
                      </Link>
                      {s.inicio === HOY && <span className="ml-2 text-xs text-[var(--brand-700)]">nueva hoy</span>}
                    </TableCell>
                    <TableCell className="capitalize">{s.plan}</TableCell>
                    <TableCell className="tabular text-right">
                      {s.plan === "mensual" ? `${money(supuestos.precioMensual)}/mes` : `${money(supuestos.precioAnual)}/año`}
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground">{fecha(s.inicio)}</TableCell>
                    <TableCell className="pr-4">
                      {activa ? (
                        <Chip className="border-[var(--brand-300)] bg-[var(--brand-50)] text-[var(--brand-700)]">Activa</Chip>
                      ) : (
                        <span className="text-sm text-muted-foreground">Cancelada {s.fin ? fecha(s.fin) : ""}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </SoloEscritorio>
          {recientes.length > 12 && (
            <div className="border-t border-border p-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setVerTodas((v) => !v)}>
                {verTodas ? "Ver menos" : "Ver más"}
              </Button>
            </div>
          )}
        </Panel>
      </PageBody>
    </>
  );
}
