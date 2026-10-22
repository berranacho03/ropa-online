import { useMemo } from "react";
import { Lightbulb, Megaphone, Timer, UserPlus, Wallet } from "lucide-react";
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
import { Kpi, PageBody, PageHeader, Panel } from "../../components/shell";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  CURSOR_BARRA,
  CajaTooltip,
  EJE,
  EstadoMeta,
  GRILLA,
  Leyenda,
  MALO,
  META,
  SERIE,
  enMiles,
  fmt1,
  techo,
} from "../../components/admin2/graficos";
import { useStore } from "../../lib/store";
import { marketingPorCanal, type FilaCanal } from "../../lib/metricas";
import { MESES, mesDe } from "../../data/seed";
import { CANALES, type Canal } from "../../data/usuarios";
import { mesCorto, money, moneyCorto, num } from "../../lib/format";

const META_PAYBACK = 6;
const PAGOS: Canal[] = ["tiktok", "instagram", "influencer", "google"];

export function AdminMarketing() {
  const { usuarios, suscripciones, ventas, campanas, supuestos } = useStore();

  const canales = useMemo(
    () => marketingPorCanal({ usuarios, suscripciones, ventas, campanas, supuestos }),
    [usuarios, suscripciones, ventas, campanas, supuestos]
  );

  const d = useMemo(() => {
    const pagos = canales.filter((c) => c.gasto > 0);
    const gratis = canales.filter((c) => c.gasto === 0);
    const gasto = pagos.reduce((a, c) => a + c.gasto, 0);
    const altasPagas = pagos.reduce((a, c) => a + c.altas, 0);
    const altas = canales.reduce((a, c) => a + c.altas, 0);
    const cacMedio = altasPagas ? gasto / altasPagas : 0;
    const arpuPagos = altasPagas ? pagos.reduce((a, c) => a + c.arpu * c.altas, 0) / altasPagas : 0;
    const paybackMedio = arpuPagos ? cacMedio / arpuPagos : null;

    const barras = [...pagos]
      .sort((a, b) => (a.payback ?? 99) - (b.payback ?? 99))
      .map((c) => ({ canal: c.nombre, payback: c.payback ? Math.round(c.payback * 10) / 10 : 0, fila: c }));

    // Gasto y altas por mes (dos gráficos con el mismo eje X, nunca doble eje).
    const altasMes = new Map<string, number>();
    for (const u of usuarios) if (!u.demo) altasMes.set(mesDe(u.fechaAlta), (altasMes.get(mesDe(u.fechaAlta)) ?? 0) + 1);
    const porMes = MESES.map((mes) => {
      const fila: Record<string, number | string> = { mes, etiqueta: mesCorto(mes) };
      let total = 0;
      for (const c of PAGOS) {
        const g = campanas.filter((x) => x.mes === mes && x.canal === c).reduce((a, x) => a + x.gasto, 0);
        fila[c] = g;
        total += g;
      }
      fila.total = total;
      fila.altas = altasMes.get(mes) ?? 0;
      fila.costoAlta = fila.altas ? Math.round(total / (fila.altas as number)) : 0;
      return fila;
    });

    return { pagos, gratis, gasto, altas, altasPagas, cacMedio, paybackMedio, barras, porMes };
  }, [canales, usuarios, campanas]);

  const conclusion = useMemo(() => armarConclusion(d.pagos, d.gratis), [d.pagos, d.gratis]);
  const maxPayback = Math.max(META_PAYBACK + 2, ...d.barras.map((b) => b.payback));
  const nombreCanal = (id: Canal) => CANALES.find((c) => c.id === id)?.nombre ?? id;

  return (
    <>
      <PageHeader
        titulo="Marketing"
        bajada="Cuánto cuesta conseguir cada usuario según el canal y en cuántos meses se recupera. La hipótesis: lo invertido vuelve en 6 meses o menos."
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi etiqueta="Gasto en campañas" valor={moneyCorto(d.gasto)} detalle={`${campanas.length} campañas, 12 meses`} icono={Wallet} />
          <Kpi
            etiqueta="Altas"
            valor={num(d.altas)}
            detalle={`${num(d.altasPagas)} por canales pagos`}
            icono={UserPlus}
          />
          <Kpi etiqueta="CAC medio (pagos)" valor={money(d.cacMedio)} detalle="gasto / altas del canal" icono={Megaphone} />
          <Kpi
            etiqueta="Payback medio"
            valor={d.paybackMedio !== null ? `${fmt1(d.paybackMedio)} meses` : "—"}
            detalle={`meta ≤ ${META_PAYBACK} meses`}
            icono={Timer}
            acento={d.paybackMedio !== null && d.paybackMedio <= META_PAYBACK ? "verde" : "rojo"}
          />
        </div>

        <div className="rounded-xl border border-[var(--brand-300)] bg-[var(--brand-50)] p-4">
          <div className="flex gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-700)]" />
            <div className="space-y-1 text-sm text-foreground">
              {conclusion.map((t, i) => (
                <p key={i} className={i === 0 ? "font-medium" : "text-muted-foreground"}>
                  {t}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Panel
            className="lg:col-span-2"
            titulo="Payback por canal"
            bajada="Meses para recuperar el costo de adquisición (CAC ÷ ARPU mensual)"
          >
            <Leyenda
              items={[
                { nombre: "Recupera en plazo", color: SERIE.a },
                { nombre: "Fuera de plazo", color: MALO },
                { nombre: `Meta ${META_PAYBACK} meses`, color: META, tipo: "meta" },
              ]}
            />
            <ResponsiveContainer width="100%" height={Math.max(200, d.barras.length * 48)}>
              <BarChart data={d.barras} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid {...GRILLA} vertical horizontal={false} />
                <XAxis type="number" {...EJE} domain={[0, Math.ceil(maxPayback)]} tickFormatter={(v) => `${v}`} />
                <YAxis type="category" dataKey="canal" {...EJE} width={84} />
                <Tooltip
                  cursor={CURSOR_BARRA}
                  content={
                    <CajaTooltip
                      formato={(v) => `${fmt1(v)} meses`}
                      titulo={(l, p) => {
                        const f = p[0]?.payload?.fila as FilaCanal | undefined;
                        return f ? `${l} · CAC ${money(f.cac)} · ARPU ${money(f.arpu)}/mes` : l;
                      }}
                    />
                  }
                />
                <ReferenceLine x={META_PAYBACK} stroke={META} strokeDasharray="4 3" strokeWidth={1.5} />
                <Bar
                  dataKey="payback"
                  name="Payback"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                  label={{ position: "insideRight", fontSize: 11, fill: "#fff", formatter: (v: number) => `${fmt1(v)} m` }}
                >
                  {d.barras.map((b) => (
                    <Cell key={b.canal} fill={b.payback <= META_PAYBACK ? SERIE.a : MALO} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {d.gratis.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {d.gratis.map((c) => c.nombre).join(" y ")} no tienen gasto en campañas: su CAC es cero.
              </p>
            )}
          </Panel>

          <Panel className="lg:col-span-3" titulo="Por canal" bodyClassName="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Canal</TableHead>
                  <TableHead className="text-right">Gasto</TableHead>
                  <TableHead className="text-right">Altas</TableHead>
                  <TableHead className="text-right">Premium</TableHead>
                  <TableHead className="text-right">CAC</TableHead>
                  <TableHead className="text-right">ARPU/mes</TableHead>
                  <TableHead className="pr-4 text-right">Payback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...canales]
                  .sort((a, b) => b.gasto - a.gasto)
                  .map((c) => (
                    <TableRow key={c.canal}>
                      <TableCell className="pl-4 font-medium">{c.nombre}</TableCell>
                      <TableCell className="tabular text-right">{c.gasto ? money(c.gasto) : "—"}</TableCell>
                      <TableCell className="tabular text-right">{num(c.altas)}</TableCell>
                      <TableCell className="tabular text-right">
                        {num(c.premium)}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({c.altas ? fmt1((c.premium / c.altas) * 100) : "0"} %)
                        </span>
                      </TableCell>
                      <TableCell className="tabular text-right">{c.gasto ? money(c.cac) : "$ 0"}</TableCell>
                      <TableCell className="tabular text-right">{money(c.arpu)}</TableCell>
                      <TableCell className="pr-4 text-right">
                        {c.payback === null ? (
                          <span className="text-xs text-muted-foreground">sin gasto</span>
                        ) : (
                          <EstadoMeta cumple={c.payback <= META_PAYBACK}>{fmt1(c.payback)} m</EstadoMeta>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel titulo="Gasto mensual en campañas" bajada="Por canal pago, apilado">
            <Leyenda
              items={[
                { nombre: "TikTok", color: SERIE.a },
                { nombre: "Instagram", color: SERIE.b },
                { nombre: "Influencers", color: SERIE.c },
                { nombre: "Google", color: "var(--ink-500)" },
              ]}
            />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.porMes} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid {...GRILLA} />
                <XAxis dataKey="etiqueta" {...EJE} interval="preserveStartEnd" />
                <YAxis {...EJE} tickFormatter={enMiles} domain={techo(Math.max(...d.porMes.map((f) => f.total as number)))} tickCount={5} />
                <Tooltip cursor={CURSOR_BARRA} content={<CajaTooltip formato={(v) => money(v)} total />} />
                {PAGOS.map((c, i) => (
                  <Bar
                    key={c}
                    dataKey={c}
                    name={nombreCanal(c)}
                    stackId="g"
                    fill={[SERIE.a, SERIE.b, SERIE.c, "var(--ink-500)"][i]}
                    stroke="var(--card)"
                    strokeWidth={1}
                    maxBarSize={28}
                    radius={i === PAGOS.length - 1 ? [4, 4, 0, 0] : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel titulo="Altas por mes" bajada="Usuarios nuevos de todos los canales, mismo período">
            <div className="mb-3 h-[18px]" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={d.porMes} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid {...GRILLA} />
                <XAxis dataKey="etiqueta" {...EJE} interval="preserveStartEnd" />
                <YAxis {...EJE} allowDecimals={false} domain={techo(Math.max(...d.porMes.map((f) => f.altas as number)))} tickCount={5} />
                <Tooltip
                  cursor={CURSOR_BARRA}
                  content={
                    <CajaTooltip
                      formato={(v) => num(v)}
                      titulo={(l, p) => `${l} · ${money(Number(p[0]?.payload?.costoAlta ?? 0))} de gasto por alta`}
                    />
                  }
                />
                <Bar dataKey="altas" name="Altas" fill={SERIE.a} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <Panel titulo="Campañas" bajada="Gasto por mes y canal; entre paréntesis, la campaña o influencer de ese mes" bodyClassName="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Mes</TableHead>
                {PAGOS.map((c) => (
                  <TableHead key={c} className="text-right">
                    {nombreCanal(c)}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="pr-4 text-right">Altas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...d.porMes].reverse().map((f) => (
                <TableRow key={f.mes as string}>
                  <TableCell className="pl-4 font-medium capitalize">{f.etiqueta}</TableCell>
                  {PAGOS.map((c) => {
                    const camp = campanas.filter((x) => x.mes === f.mes && x.canal === c);
                    return (
                      <TableCell key={c} className="text-right">
                        {camp.length ? (
                          <>
                            <span className="tabular">{money(f[c] as number)}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {camp.map((x) => x.nombre).join(", ")}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="tabular text-right font-medium">{money(f.total as number)}</TableCell>
                  <TableCell className="tabular pr-4 text-right">{num(f.altas as number)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="pl-4 font-medium">Total</TableCell>
                {PAGOS.map((c) => (
                  <TableCell key={c} className="tabular text-right">
                    {money(d.porMes.reduce((a, f) => a + (f[c] as number), 0))}
                  </TableCell>
                ))}
                <TableCell className="tabular text-right font-semibold">{money(d.gasto)}</TableCell>
                <TableCell className="tabular pr-4 text-right">
                  {num(d.porMes.reduce((a, f) => a + (f.altas as number), 0))}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Panel>
      </PageBody>
    </>
  );
}

/** Texto de conclusión calculado a partir de los números del canal. */
function armarConclusion(pagos: FilaCanal[], gratis: FilaCanal[]): string[] {
  const conPayback = pagos.filter((c) => c.payback !== null);
  if (conPayback.length === 0) return ["Todavía no hay datos suficientes para calcular el payback por canal."];
  const ok = conPayback.filter((c) => c.payback! <= META_PAYBACK).sort((a, b) => a.payback! - b.payback!);
  const mal = conPayback.filter((c) => c.payback! > META_PAYBACK).sort((a, b) => b.payback! - a.payback!);
  const lista = (xs: FilaCanal[]) =>
    xs.map((c) => `${c.nombre} (${fmt1(c.payback!)} meses)`).join(xs.length > 2 ? ", " : " y ");
  const out: string[] = [];
  if (mal.length === 0) out.push(`Todos los canales pagos recuperan la inversión en ${META_PAYBACK} meses o menos: la hipótesis se cumple.`);
  else if (ok.length === 0) out.push(`Ningún canal pago recupera la inversión en ${META_PAYBACK} meses: la hipótesis no se cumple.`);
  else
    out.push(
      `${ok.length === 1 ? "Recupera" : "Recuperan"} la inversión en plazo: ${lista(ok)}. ${mal.length === 1 ? "No llega" : "No llegan"}: ${lista(mal)}.`
    );
  const mejor = [...pagos].filter((c) => c.altas > 0).sort((a, b) => b.premium / b.altas - a.premium / a.altas)[0];
  if (mejor)
    out.push(
      `${mejor.nombre} es el canal pago que más convierte a Premium (${fmt1((mejor.premium / mejor.altas) * 100)} %), con un CAC de ${money(mejor.cac)}.`
    );
  if (mal.length) {
    const peor = mal[0];
    const arpuNecesario = peor.cac / META_PAYBACK;
    out.push(
      `Para que ${peor.nombre} llegue a la meta habría que bajar su CAC a ${money(peor.arpu * META_PAYBACK)} o subir su ingreso por usuario a ${money(arpuNecesario)} por mes.`
    );
  }
  if (gratis.length)
    out.push(`${gratis.map((c) => c.nombre).join(" y ")} traen ${num(gratis.reduce((a, c) => a + c.altas, 0))} altas sin costo de campaña.`);
  return out;
}
