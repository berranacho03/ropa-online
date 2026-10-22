import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Check, Download, HandCoins, Receipt, ShoppingBag, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Chip, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { FilaBarra, GraficoMensual } from "../../components/admin/graficos";
import { FiltroSelect } from "../../components/admin/filtros";
import { descargarCsv } from "../../components/admin/piezas";
import { fmt1, recientes, variacion } from "../../components/admin/datos";
import { useStore } from "../../lib/store";
import { tasaDevTalle } from "../../lib/metricas";
import { HOY, MESES, MES_ACTUAL, comisionDe, mesDe } from "../../data/seed";
import { nombreCompleto } from "../../data/prendas";
import { fecha, mesCorto, money, moneyCorto, num } from "../../lib/format";

const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];
const mesLargo = (ym: string) => `${MESES_LARGOS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

export function AdminVentas() {
  const { ventas, tiendas, prendas, usuarios } = useStore();
  const [mes, setMes] = useState(MES_ACTUAL);
  const [cuantas, setCuantas] = useState(25);

  const tiendaPor = useMemo(() => new Map(tiendas.map((t) => [t.id, t])), [tiendas]);
  const prendaPor = useMemo(() => new Map(prendas.map((p) => [p.id, p])), [prendas]);
  const usuarioPor = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios]);

  // Un solo recorrido: ventas y comisiones por mes y por tienda.
  const base = useMemo(() => {
    const porMes = new Map<string, { ventas: number; comisiones: number; gmv: number }>();
    const porMesTienda = new Map<string, number>();
    for (const v of ventas) {
      const m = mesDe(v.fecha);
      const c = comisionDe(v);
      const x = porMes.get(m) ?? { ventas: 0, comisiones: 0, gmv: 0 };
      x.ventas++;
      x.comisiones += c;
      if (v.estado === "confirmada") x.gmv += v.precio;
      porMes.set(m, x);
      const k = `${m}|${v.tiendaId}`;
      porMesTienda.set(k, (porMesTienda.get(k) ?? 0) + c);
    }
    const serie = MESES.map((m) => ({
      mes: m,
      ventas: porMes.get(m)?.ventas ?? 0,
      comisiones: Math.round(porMes.get(m)?.comisiones ?? 0),
    }));
    return { porMes, porMesTienda, serie };
  }, [ventas]);

  const delMes = useMemo(() => recientes(ventas.filter((v) => mesDe(v.fecha) === mes)), [ventas, mes]);

  const d = useMemo(() => {
    const i = MESES.indexOf(mes);
    const prev = MESES[i - 1];
    const actual = base.porMes.get(mes);
    // El mes en curso se compara con el mismo tramo del mes anterior.
    const anterior = !prev
      ? undefined
      : mes === MES_ACTUAL
        ? (() => {
            const vs = ventas.filter((v) => mesDe(v.fecha) === prev && v.fecha <= `${prev}-${HOY.slice(8, 10)}`);
            return { ventas: vs.length, comisiones: vs.reduce((a, v) => a + comisionDe(v), 0), gmv: 0 };
          })()
        : base.porMes.get(prev);
    const porTienda = new Map<string, { ventas: number; comision: number }>();
    for (const v of delMes) {
      const x = porTienda.get(v.tiendaId) ?? { ventas: 0, comision: 0 };
      x.ventas++;
      x.comision += comisionDe(v);
      porTienda.set(v.tiendaId, x);
    }
    const ranking = [...porTienda.entries()]
      .map(([id, x]) => ({ tienda: tiendaPor.get(id), ...x }))
      .sort((a, b) => b.comision - a.comision);

    // Liquidación: 6 meses hasta el elegido.
    const meses = MESES.slice(Math.max(0, i - 5), i + 1);
    const filas = tiendas
      .map((t) => {
        const valores = meses.map((m) => base.porMesTienda.get(`${m}|${t.id}`) ?? 0);
        return { tienda: t, valores, total: valores.reduce((a, b) => a + b, 0) };
      })
      .filter((f) => f.total > 0)
      .sort((a, b) => b.valores[b.valores.length - 1] - a.valores[a.valores.length - 1] || b.total - a.total);
    const totales = meses.map((_, j) => filas.reduce((a, f) => a + f.valores[j], 0));

    return {
      ventas: actual?.ventas ?? 0,
      comisiones: actual?.comisiones ?? 0,
      gmv: actual?.gmv ?? 0,
      varVentas: variacion(actual?.ventas ?? 0, anterior?.ventas ?? 0),
      varCom: variacion(actual?.comisiones ?? 0, anterior?.comisiones ?? 0),
      dev: tasaDevTalle(delMes),
      siguio: delMes.length ? (delMes.filter((v) => v.siguio).length / delMes.length) * 100 : 0,
      ranking,
      liq: { meses, filas, totales },
    };
  }, [base, delMes, mes, tiendaPor, tiendas, ventas]);

  const exportar = () => {
    const filas: (string | number)[][] = [
      ["fecha", "venta", "tienda", "prenda", "usuario", "talle_recomendado", "talle_comprado", "siguio", "con_prueba", "estado", "motivo_devolucion", "precio", "comision_pct", "comision"],
      ...delMes.map((v) => [
        v.fecha,
        v.id,
        tiendaPor.get(v.tiendaId)?.nombre ?? v.tiendaId,
        prendaPor.get(v.prendaId) ? nombreCompleto(prendaPor.get(v.prendaId)!) : v.prendaId,
        v.usuarioId,
        v.talleRecomendado,
        v.talle,
        v.siguio ? "si" : "no",
        v.conPrueba ? "si" : "no",
        v.estado,
        v.motivoDevolucion ?? "",
        v.precio,
        v.comisionPct,
        Math.round(comisionDe(v) * 100) / 100,
      ]),
    ];
    descargarCsv(`ropa-ventas-${mes}.csv`, filas);
    toast.success(`Descargaste ${delMes.length} ventas de ${mesLargo(mes)}.`);
  };

  const parcial = mes === MES_ACTUAL;

  return (
    <>
      <PageHeader
        titulo="Ventas y comisiones"
        bajada="Ventas que la app deriva a las tiendas asociadas y la liquidación mensual de comisiones a cobrar."
        acciones={
          <>
            <FiltroSelect
              etiqueta="Mes"
              valor={mes}
              onCambio={(m) => {
                setMes(m);
                setCuantas(25);
              }}
              opciones={[...MESES].reverse().map((m) => ({ valor: m, texto: mesLargo(m) + (m === MES_ACTUAL ? " (en curso)" : "") }))}
              className="sm:w-[14.5rem]"
            />
            <Button variant="outline" onClick={exportar} disabled={delMes.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
          </>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Kpi
            etiqueta="Ventas derivadas"
            valor={num(d.ventas)}
            variacion={d.varVentas}
            detalle={parcial ? "vs. mismo tramo del mes anterior" : "vs. mes anterior"}
            icono={ShoppingBag}
            acento="verde"
          />
          <Kpi etiqueta="Facturación de tiendas" valor={moneyCorto(d.gmv)} detalle="ventas no devueltas" icono={Receipt} acento="neutro" />
          <Kpi
            etiqueta="Comisiones a cobrar"
            valor={money(d.comisiones)}
            variacion={d.varCom}
            detalle={`${d.ranking.length} tiendas`}
            icono={HandCoins}
            acento="verde"
          />
          <Kpi
            etiqueta="Devolución por talle"
            valor={`${fmt1(d.dev)} %`}
            detalle={`${Math.round(d.siguio)} % siguió la recomendación`}
            icono={Undo2}
            acento={d.dev > 20 ? "ambar" : "verde"}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Panel titulo="Comisiones por mes" bajada="Netas de devoluciones" className="lg:col-span-3">
            <GraficoMensual
              tipo="barra"
              datos={base.serie}
              series={[{ clave: "comisiones", nombre: "Comisiones" }]}
              formato={money}
              formatoEje={(v) => (v >= 1000 ? `${Math.round(v / 1000)} k` : String(v))}
              alto={260}
            />
          </Panel>
          <Panel titulo="Por tienda" bajada={`Comisión de ${mesLargo(mes)}`} className="lg:col-span-2">
            {d.ranking.length === 0 ? (
              <Vacio icono={HandCoins} titulo="Sin ventas ese mes" />
            ) : (
              <div className="max-h-[270px] overflow-y-auto pr-1">
                {d.ranking.map((r) => (
                  <FilaBarra
                    key={r.tienda?.id}
                    etiqueta={
                      <Link to={`/admin/tiendas/${r.tienda?.id}`} className="hover:underline">
                        {r.tienda?.nombre}
                      </Link>
                    }
                    detalle={`${r.ventas} ventas`}
                    valor={r.comision}
                    max={d.ranking[0].comision}
                    texto={money(r.comision)}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel
          titulo="Liquidación de comisiones"
          bajada={`A cobrar por tienda, ${mesCorto(d.liq.meses[0])} a ${mesCorto(mes)}${parcial ? " (el mes en curso todavía no cerró)" : ""}`}
          bodyClassName="p-0"
        >
          <div className="max-h-[440px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="bg-muted/50">
                  <TableHead className="sticky left-0 z-10 bg-muted">Tienda</TableHead>
                  {d.liq.meses.map((m) => (
                    <TableHead key={m} className={`text-right ${m === mes ? "text-[var(--brand-700)]" : ""}`}>
                      {mesCorto(m)}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.liq.filas.map((f) => (
                  <TableRow key={f.tienda.id}>
                    <TableCell className="sticky left-0 bg-card">
                      <Link to={`/admin/tiendas/${f.tienda.id}`} className="font-medium hover:underline">
                        {f.tienda.nombre}
                      </Link>
                      <span className="ml-1.5 text-xs text-muted-foreground">{f.tienda.comisionPct} %</span>
                    </TableCell>
                    {f.valores.map((v, j) => (
                      <TableCell
                        key={j}
                        className={`tabular text-right ${d.liq.meses[j] === mes ? "bg-[var(--brand-50)] font-medium" : ""} ${v === 0 ? "text-muted-foreground" : ""}`}
                      >
                        {v ? money(v) : "—"}
                      </TableCell>
                    ))}
                    <TableCell className="tabular text-right font-semibold">{money(f.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 bg-muted/40 font-semibold">
                  <TableCell className="sticky left-0 bg-muted">Total</TableCell>
                  {d.liq.totales.map((t, j) => (
                    <TableCell key={j} className="tabular text-right">
                      {money(t)}
                    </TableCell>
                  ))}
                  <TableCell className="tabular text-right">{money(d.liq.totales.reduce((a, b) => a + b, 0))}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Panel>

        <Panel
          titulo={`Ventas de ${mesLargo(mes)}`}
          bajada="Las más recientes primero; lo hecho en la sesión aparece arriba"
          bodyClassName="p-0"
        >
          {delMes.length === 0 ? (
            <Vacio icono={ShoppingBag} titulo="Sin ventas ese mes" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Prenda</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead className="text-center">Recomendado</TableHead>
                      <TableHead className="text-center">Comprado</TableHead>
                      <TableHead>Siguió</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-right">Comisión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delMes.slice(0, cuantas).map((v) => {
                      const p = prendaPor.get(v.prendaId);
                      const u = usuarioPor.get(v.usuarioId);
                      return (
                        <TableRow key={v.id}>
                          <TableCell className="tabular whitespace-nowrap text-muted-foreground">{fecha(v.fecha)}</TableCell>
                          <TableCell>
                            <p className="max-w-[16rem] truncate font-medium">{p ? nombreCompleto(p) : v.prendaId}</p>
                            <Link to={`/admin/tiendas/${v.tiendaId}`} className="text-xs text-muted-foreground hover:underline">
                              {tiendaPor.get(v.tiendaId)?.nombre}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link to={`/admin/usuarios/${v.usuarioId}`} className="whitespace-nowrap hover:underline">
                              {u?.nombre ?? v.usuarioId}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center">{v.talleRecomendado}</TableCell>
                          <TableCell className="text-center font-medium">{v.talle}</TableCell>
                          <TableCell>
                            {v.siguio ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <Check className="h-3.5 w-3.5" /> Sí
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700">
                                <X className="h-3.5 w-3.5" /> No
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {v.estado === "devuelta" ? (
                              <Chip className="border-red-200 bg-red-50 text-red-700">
                                Devuelta{v.motivoDevolucion === "talle" ? " · talle" : ""}
                              </Chip>
                            ) : (
                              <Chip className="border-emerald-200 bg-emerald-50 text-emerald-700">Confirmada</Chip>
                            )}
                          </TableCell>
                          <TableCell className="tabular text-right">{money(v.precio)}</TableCell>
                          <TableCell className="tabular text-right">{money(comisionDe(v))}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {delMes.length > cuantas && (
                <div className="border-t border-border p-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setCuantas(cuantas + 50)}>
                    Ver más ({delMes.length - cuantas} restantes)
                  </Button>
                </div>
              )}
            </>
          )}
        </Panel>
      </PageBody>
    </>
  );
}
