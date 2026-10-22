import { useMemo } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Camera,
  Crown,
  FlaskConical,
  HandCoins,
  ShoppingBag,
  Store as StoreIcon,
  Undo2,
  Users,
  Wallet,
  Percent,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Kpi, PageBody, PageHeader, Panel } from "../../components/shell";
import { GraficoMensual } from "../../components/admin/graficos";
import { ChipCumple } from "../../components/admin/piezas";
import { CORTO } from "../../components/admin/hipotesis-textos";
import { fmt1, hace, recientes, variacion, ventasMesYPrevio, mesAnterior } from "../../components/admin/datos";
import { useStore } from "../../lib/store";
import {
  comisionesMes,
  conversionPremium,
  hipotesis,
  ingresoSuscripcionesMes,
  serieMensual,
  tasaDevTalle,
} from "../../lib/metricas";
import { HOY, comisionDe, mesDe } from "../../data/seed";
import { fechaLarga, money, moneyCorto, num, pct, relativo } from "../../lib/format";
import { nombreCompleto } from "../../data/prendas";

export function AdminPanel() {
  const store = useStore();
  const { usuarios, suscripciones, ventas, pruebas, prendas, tiendas, campanas, supuestos } = store;

  const serie = useMemo(
    () => serieMensual({ usuarios, suscripciones, ventas, pruebas, campanas, supuestos }),
    [usuarios, suscripciones, ventas, pruebas, campanas, supuestos]
  );

  const hips = useMemo(() => hipotesis(store), [store]);

  const d = useMemo(() => {
    const mes = mesDe(HOY);
    const prevMes = mesAnterior(mes);
    const { actual, previo } = ventasMesYPrevio(ventas);
    const comAct = comisionesMes(actual, mes);
    const comPrev = previo.reduce((a, v) => a + comisionDe(v), 0);
    const subsAct = ingresoSuscripcionesMes(suscripciones, mes, supuestos);
    const subsPrev = ingresoSuscripcionesMes(suscripciones, prevMes, supuestos);
    const v90 = ventas.filter((v) => v.fecha > hace(90));
    const v180 = ventas.filter((v) => v.fecha > hace(180) && v.fecha <= hace(90));

    // Devolución por talle que tenían las tiendas antes de sumarse, ponderada por ventas.
    const porTienda = new Map<string, number>();
    for (const v of v90) porTienda.set(v.tiendaId, (porTienda.get(v.tiendaId) ?? 0) + 1);
    let pond = 0;
    let tot = 0;
    for (const t of tiendas) {
      const n = porTienda.get(t.id) ?? 0;
      pond += n * t.devTalleAntes;
      tot += n;
    }

    const prendaPor = new Map(prendas.map((p) => [p.id, p]));
    const top = tiendas
      .map((t) => {
        const vs = actual.filter((v) => v.tiendaId === t.id);
        return {
          tienda: t,
          ventas: vs.length,
          gmv: vs.filter((v) => v.estado === "confirmada").reduce((a, v) => a + v.precio, 0),
          comision: vs.reduce((a, v) => a + comisionDe(v), 0),
        };
      })
      .filter((x) => x.ventas > 0)
      .sort((a, b) => b.ventas - a.ventas || b.gmv - a.gmv)
      .slice(0, 8);

    // Actividad reciente: ventas, altas Premium y pruebas, lo último arriba.
    const nombreU = new Map(usuarios.map((u) => [u.id, u.nombre]));
    type Ev = { fecha: string; tipo: "venta" | "premium" | "prueba"; texto: string; detalle: string; orden: number };
    const eventos: Ev[] = [];
    ventas.forEach((v, i) => {
      if (v.fecha < hace(10)) return;
      const p = prendaPor.get(v.prendaId);
      eventos.push({
        fecha: v.fecha,
        tipo: "venta",
        orden: (v.id.includes("-") ? 1e6 : 0) + i,
        texto: `${nombreU.get(v.usuarioId) ?? "Usuario"} compró ${p ? nombreCompleto(p) : "una prenda"}`,
        detalle: `${tiendas.find((t) => t.id === v.tiendaId)?.nombre ?? ""} · talle ${v.talle}${v.siguio ? " (el recomendado)" : ` (recomendado ${v.talleRecomendado})`} · ${money(v.precio)}`,
      });
    });
    suscripciones.forEach((s, i) => {
      if (s.inicio < hace(30)) return;
      eventos.push({
        fecha: s.inicio,
        tipo: "premium",
        orden: (s.id.includes("-") ? 1e6 : 0) + 100000 + i,
        texto: `${nombreU.get(s.usuarioId) ?? "Usuario"} se pasó a Premium`,
        detalle: s.plan === "mensual" ? `Plan mensual · ${money(supuestos.precioMensual)}` : `Plan anual · ${money(supuestos.precioAnual)}`,
      });
    });
    pruebas.forEach((p, i) => {
      if (p.fecha < hace(3)) return;
      const pr = prendaPor.get(p.prendaId);
      eventos.push({
        fecha: p.fecha,
        tipo: "prueba",
        orden: (p.id.includes("-") ? 1e6 : 0) + 200000 + i,
        texto: `${nombreU.get(p.usuarioId) ?? "Usuario"} se probó ${pr ? nombreCompleto(pr) : "una prenda"}`,
        detalle: `Talle ${p.talle} · ${(p.latenciaMs / 1000).toFixed(1).replace(".", ",")} s${p.ok ? "" : " · falló"}`,
      });
    });
    // A igual fecha, lo registrado en la sesión va primero.
    const ordenados = recientes(eventos.sort((a, b) => a.orden - b.orden));
    const sesion = ordenados.filter((e) => e.orden >= 1e6);
    const tope = { venta: 6, premium: 3, prueba: 3 };
    const usados = { venta: 0, premium: 0, prueba: 0 };
    const seed = ordenados.filter((e) => e.orden < 1e6 && usados[e.tipo]++ < tope[e.tipo]);
    const actividad = [...sesion, ...recientes(seed)].slice(0, 9);

    return {
      ventasMes: actual.length,
      varVentas: variacion(actual.length, previo.length),
      comMes: comAct,
      varCom: variacion(comAct, comPrev),
      ingresos: subsAct + comAct,
      subsAct,
      varIngresos: variacion(subsAct + comAct, subsPrev + comPrev),
      dev90: tasaDevTalle(v90),
      varDev: variacion(tasaDevTalle(v90), tasaDevTalle(v180)),
      devAntes: tot ? pond / tot : 0,
      conversion: conversionPremium(usuarios, suscripciones),
      top,
      actividad,
      activas: tiendas.filter((t) => t.estado === "activa").length,
      onboarding: tiendas.filter((t) => t.estado === "onboarding").length,
    };
  }, [ventas, suscripciones, supuestos, tiendas, prendas, usuarios, pruebas]);

  const ult = serie[serie.length - 1];
  const prev = serie[serie.length - 2];
  const conMeta = hips.filter((h) => h.cumple !== null);
  const cumplen = conMeta.filter((h) => h.cumple).length;
  const maxTop = Math.max(1, ...d.top.map((t) => t.ventas));

  return (
    <>
      <PageHeader
        titulo="Panel general"
        bajada={`Cómo viene ROPA al ${fechaLarga(HOY)}: usuarios, Premium, ventas derivadas a tiendas e ingresos. El mes en curso se compara con el mismo tramo del mes anterior.`}
        acciones={
          <Button asChild>
            <Link to="/admin/hipotesis">
              <FlaskConical className="mr-2 h-4 w-4" />
              Hipótesis y riesgos
            </Link>
          </Button>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi
            etiqueta="Usuarios activos del mes"
            valor={num(ult.activos)}
            variacion={variacion(ult.activos, prev.activos)}
            detalle={`${num(ult.nuevos)} altas este mes`}
            icono={Users}
            acento="verde"
          />
          <Kpi
            etiqueta="Premium activos"
            valor={num(ult.premium)}
            variacion={variacion(ult.premium, prev.premium)}
            detalle="vs. fin del mes anterior"
            icono={Crown}
            acento="verde"
          />
          <Kpi
            etiqueta="Conversión a Premium"
            valor={pct(d.conversion, 1)}
            detalle="meta ≥ 5 % · histórica"
            icono={Percent}
            acento={d.conversion >= 5 ? "verde" : "rojo"}
          />
          <Kpi
            etiqueta="Ventas derivadas del mes"
            valor={num(d.ventasMes)}
            variacion={d.varVentas}
            detalle="vs. mismo tramo"
            icono={ShoppingBag}
            acento="verde"
          />
          <Kpi
            etiqueta="Comisiones del mes"
            valor={money(d.comMes)}
            variacion={d.varCom}
            detalle="neto de devoluciones"
            icono={HandCoins}
            acento="verde"
          />
          <Kpi
            etiqueta="Ingresos del mes"
            valor={moneyCorto(d.ingresos)}
            variacion={d.varIngresos}
            detalle={`${moneyCorto(d.subsAct)} de suscripciones`}
            icono={Wallet}
            acento="verde"
          />
          <Kpi
            etiqueta="Devolución por talle"
            valor={pct(d.dev90, 1)}
            variacion={d.varDev}
            invertido
            detalle={`últimos 90 días · antes ${pct(d.devAntes, 0)}`}
            icono={Undo2}
            acento={d.dev90 < d.devAntes ? "verde" : "ambar"}
          />
          <Kpi
            etiqueta="Tiendas activas"
            valor={num(d.activas)}
            detalle={`${d.onboarding} en onboarding`}
            icono={StoreIcon}
            acento="neutro"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel titulo="Usuarios activos por mes" bajada="Con al menos una actividad en el mes">
            <GraficoMensual
              datos={serie.map((p) => ({ mes: p.mes, activos: p.activos }))}
              series={[{ clave: "activos", nombre: "Usuarios activos" }]}
              formato={num}
              alto={200}
            />
          </Panel>
          <Panel titulo="Suscriptores Premium" bajada="Suscripciones vigentes al cierre de cada mes">
            <GraficoMensual
              datos={serie.map((p) => ({ mes: p.mes, premium: p.premium }))}
              series={[{ clave: "premium", nombre: "Premium activos", color: "var(--ink-700)" }]}
              formato={num}
              alto={200}
            />
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Panel
            titulo="Ingresos por mes"
            bajada="Suscripciones Premium + comisiones por ventas derivadas"
            className="lg:col-span-3"
          >
            <GraficoMensual
              tipo="barra"
              apilado
              datos={serie.map((p) => ({ mes: p.mes, suscripciones: Math.round(p.suscripciones), comisiones: Math.round(p.comisiones) }))}
              series={[
                { clave: "suscripciones", nombre: "Suscripciones" },
                { clave: "comisiones", nombre: "Comisiones", color: "var(--brand-300)" },
              ]}
              formato={money}
              formatoEje={(v) => (v >= 1000 ? `${Math.round(v / 1000)} k` : String(v))}
              alto={360}
            />
          </Panel>

          <Panel
            titulo="Hipótesis"
            bajada={`${cumplen} de ${conMeta.length} con meta se cumplen`}
            acciones={
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/hipotesis">
                  Ver todas <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            }
            className="lg:col-span-2"
            bodyClassName="p-0"
          >
            <div className="px-4 pt-4">
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-emerald-500" style={{ width: `${(cumplen / hips.length) * 100}%` }} />
                <div
                  className="h-full border-l-2 border-card bg-red-500"
                  style={{ width: `${((conMeta.length - cumplen) / hips.length) * 100}%` }}
                />
              </div>
            </div>
            <ul className="divide-y divide-border">
              {hips.map((h) => (
                <li key={h.id}>
                  <Link to={h.ruta} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50">
                    <span className="w-6 shrink-0 text-xs font-semibold text-muted-foreground">{h.id}</span>
                    <span className="min-w-0 flex-1 truncate text-foreground">{CORTO[h.id] ?? h.metrica}</span>
                    <span className="tabular hidden shrink-0 text-xs font-medium sm:inline">{h.valor}</span>
                    <ChipCumple cumple={h.cumple} compacto />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Panel
            titulo="Tiendas con más ventas"
            bajada="Ventas derivadas del mes en curso"
            className="lg:col-span-2"
            acciones={
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/tiendas">
                  Tiendas <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            }
          >
            <ul className="space-y-3">
              {d.top.map((t) => (
                <li key={t.tienda.id}>
                  <Link to={`/admin/tiendas/${t.tienda.id}`} className="group block">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.tienda.color }} />
                        <span className="truncate font-medium group-hover:text-[var(--brand-700)] group-hover:underline">
                          {t.tienda.nombre}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{t.ventas}</span> ventas ·{" "}
                        {money(t.comision)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${(t.ventas / maxTop) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel titulo="Actividad reciente" bajada="Ventas, altas Premium y pruebas virtuales" className="lg:col-span-3" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {d.actividad.map((e, i) => {
                const Icono = e.tipo === "venta" ? ShoppingBag : e.tipo === "premium" ? Crown : Camera;
                return (
                  <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span
                      className={`mt-0.5 rounded-lg p-1.5 ${
                        e.tipo === "premium"
                          ? "bg-[var(--brand-100)] text-[var(--brand-700)]"
                          : e.tipo === "venta"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icono className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{e.texto}</p>
                      <p className="truncate text-xs text-muted-foreground">{e.detalle}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{relativo(e.fecha, HOY)}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
        <p className="text-xs text-muted-foreground">
          Tasa de devolución por talle de las tiendas antes de sumarse: {fmt1(d.devAntes)} % (ponderada por ventas).
        </p>
      </PageBody>
    </>
  );
}
