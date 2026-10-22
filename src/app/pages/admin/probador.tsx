import { useMemo, useState } from "react";
import { AlertOctagon, Camera, Clock, DollarSign, Gift, Info, Sparkles } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Barra, Kpi, PageBody, PageHeader, Panel } from "../../components/shell";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  CURSOR_BARRA,
  CajaTooltip,
  EJE,
  EstadoMeta,
  GRILLA,
  KpiMeta,
  Leyenda,
  MALO,
  META,
  SERIE,
  fmt1,
  techo,
} from "../../components/admin2/graficos";
import { useStore } from "../../lib/store";
import { costoIaPorSuscriptor, percentil } from "../../lib/metricas";
import { HOY, MESES, mesDe } from "../../data/seed";
import { addDays } from "../../data/azar";
import { fecha, mesCorto, money, moneyDec, num } from "../../lib/format";

const META_SEG = 10;
const MODOS = [
  { id: "foto", nombre: "Con foto propia" },
  { id: "vivo", nombre: "En vivo (cámara)" },
  { id: "ejemplo", nombre: "Con modelo de ejemplo" },
] as const;

export function AdminProbador() {
  const { pruebas, suscripciones, supuestos } = useStore();
  const [vista, setVista] = useState<"dia" | "mes">("dia");

  const d = useMemo(() => {
    const desde90 = addDays(HOY, -90);
    const recientes = pruebas.filter((p) => p.fecha >= desde90);
    const lat = recientes.map((p) => p.latenciaMs / 1000);
    const p50 = percentil(lat, 0.5);
    const p95 = percentil(lat, 0.95);
    const sobreMeta = lat.length ? (lat.filter((x) => x > META_SEG).length / lat.length) * 100 : 0;

    // Histograma: tramos de 1 s, el último acumula 16 s o más.
    const tramos = Array.from({ length: 17 }, (_, i) => ({
      tramo: i === 16 ? "16+" : `${i}`,
      desde: i,
      cantidad: 0,
    }));
    for (const x of lat) tramos[Math.min(16, Math.floor(x))].cantidad++;

    const fallos = recientes.filter((p) => !p.ok).length;
    const tasaFallos = recientes.length ? (fallos / recientes.length) * 100 : 0;

    const modos = MODOS.map((m) => {
      const n = recientes.filter((p) => p.modo === m.id).length;
      return { ...m, n, pct: recientes.length ? (n / recientes.length) * 100 : 0 };
    });

    const costoMedioUsd = recientes.length ? recientes.reduce((a, p) => a + p.costoUsd, 0) / recientes.length : 0;

    // Por día (últimos 30) y por mes.
    const cuenta = new Map<string, number>();
    for (const p of pruebas) cuenta.set(p.fecha, (cuenta.get(p.fecha) ?? 0) + 1);
    const porDia = Array.from({ length: 30 }, (_, i) => {
      const f = addDays(HOY, i - 29);
      return { clave: f, etiqueta: fecha(f).slice(0, 6), pruebas: cuenta.get(f) ?? 0 };
    });
    const porMes = MESES.map((mes) => ({
      clave: mes,
      etiqueta: mesCorto(mes),
      pruebas: pruebas.filter((p) => mesDe(p.fecha) === mes).length,
    }));

    // Cortesía: la prueba gratis de los usuarios sin Premium.
    const cortesia = pruebas.filter((p) => p.cortesia);
    const primeraCortesia = new Map<string, string>();
    for (const p of cortesia) {
      const f = primeraCortesia.get(p.usuarioId);
      if (!f || p.fecha < f) primeraCortesia.set(p.usuarioId, p.fecha);
    }
    const convirtieron = new Set(
      suscripciones
        .filter((s) => {
          const f = primeraCortesia.get(s.usuarioId);
          return f !== undefined && s.inicio >= f;
        })
        .map((s) => s.usuarioId)
    ).size;
    const costoCortesia = cortesia.reduce((a, p) => a + p.costoUsd, 0) * supuestos.dolar;

    return {
      total90: recientes.length,
      p50,
      p95,
      sobreMeta,
      tramos,
      fallos,
      tasaFallos,
      modos,
      costoMedioUsd,
      porDia,
      porMes,
      cortesia: cortesia.length,
      usuariosCortesia: primeraCortesia.size,
      convirtieron,
      costoCortesia,
    };
  }, [pruebas, suscripciones, supuestos.dolar]);

  const costoSub = useMemo(
    () => costoIaPorSuscriptor(pruebas, suscripciones, supuestos),
    [pruebas, suscripciones, supuestos]
  );
  const margen = supuestos.precioMensual - costoSub;
  const pctCosto = supuestos.precioMensual ? (costoSub / supuestos.precioMensual) * 100 : 0;
  const serie = vista === "dia" ? d.porDia : d.porMes;
  const promedioDia = d.porDia.reduce((a, x) => a + x.pruebas, 0) / d.porDia.length;

  return (
    <>
      <PageHeader
        titulo="Probador y costos de IA"
        bajada="Cuánto se usa la prueba virtual, cuánto tarda y cuánto cuesta. Dos hipótesis en juego: que la prueba tarde 10 segundos o menos y que el costo de IA quede por debajo de lo que paga cada suscriptor."
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            etiqueta="Pruebas (90 días)"
            valor={num(d.total90)}
            detalle={`${fmt1(promedioDia)} por día en el último mes`}
            icono={Camera}
          />
          <KpiMeta
            etiqueta="Latencia p95"
            valor={`${fmt1(d.p95)} s`}
            cumple={d.p95 <= META_SEG}
            meta={`meta ≤ ${META_SEG} s`}
            detalle={`p50 ${fmt1(d.p50)} s`}
            icono={Clock}
          />
          <Kpi
            etiqueta="Tasa de fallos"
            valor={`${fmt1(d.tasaFallos)} %`}
            detalle={`${num(d.fallos)} pruebas sin imagen`}
            icono={AlertOctagon}
            acento={d.tasaFallos > 5 ? "rojo" : d.tasaFallos > 2 ? "ambar" : "neutro"}
          />
          <Kpi
            etiqueta="Costo por prueba"
            valor={`USD ${d.costoMedioUsd.toFixed(3).replace(".", ",")}`}
            detalle={`${moneyDec(d.costoMedioUsd * supuestos.dolar)} al dólar ${supuestos.dolar}`}
            icono={DollarSign}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Panel
            className="lg:col-span-3"
            titulo="Pruebas virtuales"
            bajada={vista === "dia" ? "Últimos 30 días" : "Por mes desde el lanzamiento"}
            acciones={
              <Tabs value={vista} onValueChange={(v) => setVista(v as "dia" | "mes")}>
                <TabsList>
                  <TabsTrigger value="dia">Por día</TabsTrigger>
                  <TabsTrigger value="mes">Por mes</TabsTrigger>
                </TabsList>
              </Tabs>
            }
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={serie} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid {...GRILLA} />
                <XAxis dataKey="etiqueta" {...EJE} interval="preserveStartEnd" minTickGap={16} />
                <YAxis {...EJE} allowDecimals={false} domain={techo(Math.max(...serie.map((x) => x.pruebas)))} tickCount={5} />
                <Tooltip cursor={CURSOR_BARRA} content={<CajaTooltip formato={(v) => num(v)} />} />
                <Bar dataKey="pruebas" name="Pruebas" fill={SERIE.a} radius={[4, 4, 0, 0]} maxBarSize={vista === "dia" ? 14 : 28} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel
            className="lg:col-span-2"
            titulo="Distribución de latencias"
            bajada={`Segundos por prueba, últimos 90 días · ${fmt1(d.sobreMeta)} % tarda más de ${META_SEG} s`}
          >
            <Leyenda
              items={[
                { nombre: `Hasta ${META_SEG} s`, color: SERIE.a },
                { nombre: `Más de ${META_SEG} s`, color: MALO },
              ]}
            />
            <ResponsiveContainer width="100%" height={226}>
              <BarChart data={d.tramos} margin={{ top: 18, right: 4, left: -16, bottom: 0 }} barCategoryGap={1}>
                <CartesianGrid {...GRILLA} />
                <XAxis dataKey="tramo" {...EJE} interval={1} />
                <YAxis {...EJE} allowDecimals={false} domain={techo(Math.max(...d.tramos.map((x) => x.cantidad)))} tickCount={5} />
                <Tooltip
                  cursor={CURSOR_BARRA}
                  content={
                    <CajaTooltip
                      formato={(v) => `${num(v)} pruebas`}
                      titulo={(l) => (l === "16+" ? "16 s o más" : `Entre ${l} y ${Number(l) + 1} s`)}
                    />
                  }
                />
                <ReferenceLine x="10" stroke={META} strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "meta", position: "top", fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Bar dataKey="cantidad" name="Pruebas" radius={[3, 3, 0, 0]}>
                  {d.tramos.map((t) => (
                    <Cell key={t.tramo} fill={t.desde >= META_SEG ? MALO : SERIE.a} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel titulo="Costo de IA por suscriptor" bajada="Por mes, contra el precio del plan mensual (últimos 90 días)" className="lg:col-span-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="tabular text-3xl font-semibold tracking-tight">{money(costoSub)}</p>
              <EstadoMeta cumple={costoSub < supuestos.precioMensual}>{costoSub < supuestos.precioMensual ? "Menor que el precio" : "Supera el precio"}</EstadoMeta>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              de {money(supuestos.precioMensual)} que paga cada suscriptor por mes
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Costo de IA</span>
                  <span className="tabular">{fmt1(pctCosto)} % del precio</span>
                </div>
                <Barra valor={costoSub} max={supuestos.precioMensual} alertaAlLlenar />
              </div>
              <dl className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Margen bruto</dt>
                  <dd className="tabular font-semibold">{money(margen)}/mes</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Pruebas por mes</dt>
                  <dd className="tabular font-semibold">
                    {d.costoMedioUsd ? fmt1(costoSub / (d.costoMedioUsd * supuestos.dolar), 0) : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </Panel>

          <Panel titulo="Modo de la prueba" bajada="Cómo se probaron la prenda (90 días)">
            <ul className="space-y-3">
              {d.modos.map((m) => (
                <li key={m.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{m.nombre}</span>
                    <span className="tabular text-muted-foreground">
                      {num(m.n)} · {fmt1(m.pct, 0)} %
                    </span>
                  </div>
                  <Barra valor={m.n} max={Math.max(1, d.total90)} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel titulo="Pruebas de cortesía" bajada={`Los gratuitos tienen ${supuestos.pruebasCortesia} prueba${supuestos.pruebasCortesia === 1 ? "" : "s"} gratis para conocer el probador`}>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Gift className="h-3.5 w-3.5" /> Pruebas regaladas
                </dt>
                <dd className="tabular text-2xl font-semibold">{num(d.cortesia)}</dd>
                <dd className="text-xs text-muted-foreground">{num(d.usuariosCortesia)} usuarios</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> Pasaron a Premium
                </dt>
                <dd className="tabular text-2xl font-semibold">{num(d.convirtieron)}</dd>
                <dd className="text-xs text-muted-foreground">
                  {d.usuariosCortesia ? `${fmt1((d.convirtieron / d.usuariosCortesia) * 100)} % de los que probaron` : "—"}
                </dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
              Costo total de la cortesía: <span className="tabular font-medium text-foreground">{money(d.costoCortesia)}</span>
              {d.convirtieron > 0 && <> · {money(d.costoCortesia / d.convirtieron)} por cada nuevo Premium</>}.
            </p>
          </Panel>
        </div>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Los tiempos y costos son simulados y están calibrados con los precios públicos de proveedores de prueba virtual
          (USD {supuestos.costoIaUsd.toFixed(2).replace(".", ",")} por imagen generada, editable en Configuración).
        </p>
      </PageBody>
    </>
  );
}
