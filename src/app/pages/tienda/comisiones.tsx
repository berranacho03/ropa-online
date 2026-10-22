import { useMemo, useState } from "react";
import { BadgePercent, CheckCircle2, Clock, Receipt, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Chip, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { C_GRILLA, C_SERIE, C_SERIE_SUAVE, ConTienda, TICK, TOOLTIP_ESTILO, useDatosTienda } from "../../components/tienda/comun";
import { MESES, MES_ACTUAL, comisionDe, mesDe } from "../../data/seed";
import { nombreCompleto } from "../../data/prendas";
import type { Tienda } from "../../data/tiendas";
import { fecha, mesCorto, money, num } from "../../lib/format";
import { cn } from "../../components/ui/utils";

export function TiendaComisiones() {
  return <ConTienda titulo="Comisiones">{(t) => <Comisiones tienda={t} />}</ConTienda>;
}

function Comisiones({ tienda }: { tienda: Tienda }) {
  const { prendas, ventas } = useDatosTienda(tienda.id);
  const porId = useMemo(() => new Map(prendas.map((p) => [p.id, p])), [prendas]);

  const filas = useMemo(() => {
    const desde = mesDe(tienda.fechaAlta);
    return MESES.filter((m) => m >= desde)
      .map((m) => {
        const vs = ventas.filter((v) => mesDe(v.fecha) === m);
        const devueltas = vs.filter((v) => v.estado === "devuelta").length;
        const base = vs.filter((v) => v.estado === "confirmada").reduce((a, v) => a + v.precio, 0);
        return {
          mes: m,
          ventas: vs.length,
          devueltas,
          base,
          comision: vs.reduce((a, v) => a + comisionDe(v), 0),
          enCurso: m === MES_ACTUAL,
        };
      })
      .reverse();
  }, [ventas, tienda.fechaAlta]);

  const [mes, setMes] = useState(MES_ACTUAL);
  const elegida = filas.find((f) => f.mes === mes) ?? filas[0];
  const detalle = ventas.filter((v) => mesDe(v.fecha) === elegida?.mes);

  const pagado = filas.filter((f) => !f.enCurso).reduce((a, f) => a + f.comision, 0);
  const vendidoTotal = filas.reduce((a, f) => a + f.base, 0);
  const actual = filas.find((f) => f.enCurso);

  return (
    <>
      <PageHeader
        titulo="Comisiones"
        bajada={`Le pagás a la plataforma el ${tienda.comisionPct} % de cada venta que llega desde la app. Las ventas devueltas no comisionan. Se liquida a mes cerrado.`}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Kpi
            etiqueta={`A pagar · ${mesCorto(MES_ACTUAL)}`}
            valor={money(actual?.comision ?? 0)}
            detalle="mes en curso"
            icono={Clock}
            acento="ambar"
          />
          <Kpi etiqueta="Comisión pactada" valor={`${tienda.comisionPct} %`} detalle="sobre el precio de venta" icono={BadgePercent} />
          <Kpi etiqueta="Pagado hasta ahora" valor={money(pagado)} detalle={`${num(filas.filter((f) => !f.enCurso).length)} meses liquidados`} icono={CheckCircle2} acento="verde" />
          <Kpi
            etiqueta="Vendido desde la app"
            valor={money(vendidoTotal)}
            detalle={`${num(ventas.filter((v) => v.estado === "confirmada").length)} ventas que se quedaron`}
            icono={Wallet}
          />
        </div>

        {filas.length === 0 || ventas.length === 0 ? (
          <Panel>
            <Vacio icono={Receipt} titulo="Todavía no hay comisiones" detalle="Cuando lleguen ventas desde la app vas a ver acá la liquidación de cada mes." />
          </Panel>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Panel titulo="Liquidación mensual" bajada="Elegí un mes para ver el detalle venta por venta" bodyClassName="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Mes</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Devueltas</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead className="text-right">A pagar</TableHead>
                      <TableHead className="pr-4">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filas.map((f) => (
                      <TableRow
                        key={f.mes}
                        onClick={() => setMes(f.mes)}
                        className={cn("cursor-pointer", f.mes === elegida?.mes && "bg-[var(--brand-50)] hover:bg-[var(--brand-50)]")}
                      >
                        <TableCell className="pl-4 font-medium capitalize">{mesCorto(f.mes)}</TableCell>
                        <TableCell className="tabular text-right">{num(f.ventas)}</TableCell>
                        <TableCell className="tabular text-right text-muted-foreground">{num(f.devueltas)}</TableCell>
                        <TableCell className="tabular text-right">{money(f.base)}</TableCell>
                        <TableCell className="tabular text-right text-muted-foreground">{tienda.comisionPct} %</TableCell>
                        <TableCell className="tabular text-right font-semibold">{money(f.comision)}</TableCell>
                        <TableCell className="pr-4">
                          {f.enCurso ? (
                            <Chip className="border-amber-200 bg-amber-50 text-amber-800">En curso</Chip>
                          ) : (
                            <Chip className="border-[var(--brand-300)] bg-[var(--brand-50)] text-[var(--brand-700)]">Pagada</Chip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="pl-4 font-semibold">Total</TableCell>
                      <TableCell className="tabular text-right">{num(filas.reduce((a, f) => a + f.ventas, 0))}</TableCell>
                      <TableCell className="tabular text-right">{num(filas.reduce((a, f) => a + f.devueltas, 0))}</TableCell>
                      <TableCell className="tabular text-right">{money(vendidoTotal)}</TableCell>
                      <TableCell />
                      <TableCell className="tabular text-right font-semibold">{money(filas.reduce((a, f) => a + f.comision, 0))}</TableCell>
                      <TableCell className="pr-4" />
                    </TableRow>
                  </TableFooter>
                </Table>
              </Panel>

              <Panel titulo="Comisión por mes" bajada="El mes en curso, en tono claro">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[...filas].reverse().map((f) => ({ mes: mesCorto(f.mes), comision: Math.round(f.comision), enCurso: f.enCurso }))} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C_GRILLA} vertical={false} />
                    <XAxis dataKey="mes" tick={{ ...TICK, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={44} />
                    <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `$ ${v}`} />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={TOOLTIP_ESTILO} formatter={(v: number) => [money(v), "Comisión"]} />
                    <Bar dataKey="comision" radius={[4, 4, 0, 0]} maxBarSize={28}>
                      {[...filas].reverse().map((f) => (
                        <Cell key={f.mes} fill={f.enCurso ? C_SERIE_SUAVE : C_SERIE} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            <Panel
              titulo={`Detalle de ${elegida ? mesCorto(elegida.mes) : ""}`}
              bajada={`${num(detalle.length)} ventas · ${elegida?.enCurso ? "en curso: puede cambiar hasta el cierre" : "liquidada"}`}
              bodyClassName="p-0"
            >
              {detalle.length === 0 ? (
                <Vacio icono={Receipt} titulo="Sin ventas ese mes" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Fecha</TableHead>
                      <TableHead>Venta</TableHead>
                      <TableHead>Prenda</TableHead>
                      <TableHead>Talle</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="pr-4 text-right">Comisión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalle.map((v) => {
                      const p = porId.get(v.prendaId);
                      const c = comisionDe(v);
                      return (
                        <TableRow key={v.id}>
                          <TableCell className="pl-4 text-muted-foreground">{fecha(v.fecha)}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{v.id}</TableCell>
                          <TableCell className="font-medium">{p ? nombreCompleto(p) : v.prendaId}</TableCell>
                          <TableCell>{v.talle}</TableCell>
                          <TableCell className="tabular text-right">{money(v.precio)}</TableCell>
                          <TableCell>
                            {v.estado === "devuelta" ? (
                              <span className="text-sm text-orange-700">Devuelta · no comisiona</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Confirmada</span>
                            )}
                          </TableCell>
                          <TableCell className={cn("tabular pr-4 text-right", c === 0 ? "text-muted-foreground line-through" : "font-medium")}>
                            {money(c === 0 ? (v.precio * v.comisionPct) / 100 : c)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={6} className="pl-4 font-semibold">
                        Total {elegida?.enCurso ? "a pagar" : "pagado"}
                      </TableCell>
                      <TableCell className="tabular pr-4 text-right font-semibold">{money(elegida?.comision ?? 0)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </Panel>
          </>
        )}
      </PageBody>
    </>
  );
}
