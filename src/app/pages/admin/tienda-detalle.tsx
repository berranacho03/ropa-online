import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  Globe,
  HandCoins,
  Mail,
  MapPin,
  Pause,
  Play,
  Rocket,
  ShoppingBag,
  Sparkles,
  Store as StoreIcon,
  Target,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Chip, Dato, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { GraficoMensual } from "../../components/admin/graficos";
import { AntesAhora, ChipEstadoTienda } from "../../components/admin/piezas";
import { fmt1, variacion, ventasMesYPrevio } from "../../components/admin/datos";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import { useStore } from "../../lib/store";
import { tasaDevTalle } from "../../lib/metricas";
import { HOY, MESES, comisionDe, mesDe } from "../../data/seed";
import { nombreCompleto, tablaCompleta } from "../../data/prendas";
import { fecha, money, num, pct } from "../../lib/format";
import { nombreCategoria } from "../../lib/talles";

export function AdminTiendaDetalle() {
  const { id } = useParams();
  const { tiendas, prendas, ventas, pruebas, actualizarTienda } = useStore();
  const tienda = tiendas.find((t) => t.id === id);
  const [todas, setTodas] = useState(false);

  const d = useMemo(() => {
    if (!tienda) return null;
    const ps = prendas.filter((p) => p.tiendaId === tienda.id);
    const ids = new Set(ps.map((p) => p.id));
    const vs = ventas.filter((v) => v.tiendaId === tienda.id);
    const prs = pruebas.filter((p) => ids.has(p.prendaId));
    const compras = new Set(vs.map((v) => `${v.usuarioId}|${v.prendaId}`));
    const pruebaCompra = prs.length ? (prs.filter((p) => compras.has(`${p.usuarioId}|${p.prendaId}`)).length / prs.length) * 100 : 0;
    const { actual, previo } = ventasMesYPrevio(vs);
    const desde = MESES.indexOf(mesDe(tienda.fechaAlta));
    const meses = MESES.slice(Math.max(0, desde));
    const base = meses.map((mes) => {
      const vm = vs.filter((v) => mesDe(v.fecha) === mes);
      return { mes, ventas: vm.length, devueltas: vm.filter((v) => v.motivoDevolucion === "talle").length };
    });
    // Con pocas ventas por mes la tasa salta mucho: se muestra el promedio móvil de 3 meses.
    const serie = base.map((b, i) => {
      const ventana = base.slice(Math.max(0, i - 2), i + 1);
      const n = ventana.reduce((a, x) => a + x.ventas, 0);
      const dv = ventana.reduce((a, x) => a + x.devueltas, 0);
      return { ...b, dev: n ? Math.round((dv / n) * 1000) / 10 : 0 };
    });
    const porPrenda = new Map<string, { ventas: number; dev: number; pruebas: number }>();
    for (const p of ps) porPrenda.set(p.id, { ventas: 0, dev: 0, pruebas: 0 });
    for (const v of vs) {
      const x = porPrenda.get(v.prendaId);
      if (x) {
        x.ventas++;
        if (v.motivoDevolucion === "talle") x.dev++;
      }
    }
    for (const p of prs) {
      const x = porPrenda.get(p.prendaId);
      if (x) x.pruebas++;
    }
    const prendasOrd = [...ps].sort((a, b) => (porPrenda.get(b.id)?.ventas ?? 0) - (porPrenda.get(a.id)?.ventas ?? 0));
    const sig = vs.filter((v) => v.siguio);
    return {
      ps: prendasOrd,
      porPrenda,
      vs,
      ventasMes: actual.length,
      varVentas: variacion(actual.length, previo.length),
      comMes: actual.reduce((a, v) => a + comisionDe(v), 0),
      gmv: vs.filter((v) => v.estado === "confirmada").reduce((a, v) => a + v.precio, 0),
      comTotal: vs.reduce((a, v) => a + comisionDe(v), 0),
      dev: tasaDevTalle(vs),
      siguio: vs.length ? (sig.length / vs.length) * 100 : 0,
      pruebaCompra,
      pruebas: prs.length,
      completas: ps.filter(tablaCompleta).length,
      serie,
    };
  }, [tienda, prendas, ventas, pruebas]);

  if (!tienda || !d)
    return (
      <PageBody>
        <Vacio
          icono={StoreIcon}
          titulo="No encontramos esa tienda"
          accion={
            <Button asChild variant="outline">
              <Link to="/admin/tiendas">Volver a tiendas</Link>
            </Button>
          }
        />
      </PageBody>
    );

  const evitadas = Math.max(0, Math.round(((tienda.devTalleAntes - d.dev) / 100) * d.vs.length));
  const precioMedio = d.vs.length ? d.vs.reduce((a, v) => a + v.precio, 0) / d.vs.length : 0;
  const visibles = todas ? d.ps : d.ps.slice(0, 12);

  const cambiarEstado = () => {
    const nuevo = tienda.estado === "activa" ? "pausada" : "activa";
    actualizarTienda(tienda.id, { estado: nuevo });
    toast.success(nuevo === "pausada" ? `${tienda.nombre} quedó pausada.` : `${tienda.nombre} quedó activa.`);
  };

  return (
    <>
      <PageHeader
        titulo={tienda.nombre}
        bajada={`${tienda.descripcion} Lo que ROPA le aporta: es el mismo panel de métricas que ve la tienda en su portal.`}
        acciones={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/tiendas">
                <ArrowLeft className="mr-2 h-4 w-4" /> Tiendas
              </Link>
            </Button>
            <Button variant="outline" onClick={cambiarEstado}>
              {tienda.estado === "activa" ? (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Pausar
                </>
              ) : tienda.estado === "onboarding" ? (
                <>
                  <Rocket className="mr-2 h-4 w-4" /> Activar
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Reactivar
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ChipEstadoTienda estado={tienda.estado} />
          <Chip className="border-border text-muted-foreground">
            <MapPin className="h-3 w-3" /> {tienda.ciudad}
          </Chip>
          <Chip className="border-border text-muted-foreground">Comisión {tienda.comisionPct} %</Chip>
          <Chip className="border-border capitalize text-muted-foreground">{tienda.estilo}</Chip>
        </div>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Antes vs. ahora: el argumento de venta para la tienda */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Devolución por talle
            </p>
            {d.vs.length ? (
              <>
                <div className="mt-3 flex items-end gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Antes de ROPA</p>
                    <p className="tabular font-display text-3xl font-semibold text-muted-foreground line-through decoration-1">
                      {fmt1(tienda.devTalleAntes)} %
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Con ROPA</p>
                    <p className="tabular font-display text-4xl font-semibold text-foreground">{fmt1(d.dev)} %</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  <AntesAhora antes={tienda.devTalleAntes} ahora={d.dev} />
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  ≈ <span className="font-medium text-foreground">{num(evitadas)} devoluciones evitadas</span>, unos{" "}
                  {money(evitadas * precioMedio)} que no volvieron a la tienda.
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Antes de sumarse: {fmt1(tienda.devTalleAntes)} %. Todavía no hay ventas derivadas para comparar.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            <Kpi etiqueta="Ventas del mes" valor={num(d.ventasMes)} variacion={d.varVentas} detalle="vs. mismo tramo" icono={ShoppingBag} acento="verde" />
            <Kpi etiqueta="Comisión del mes" valor={money(d.comMes)} detalle={`${money(d.comTotal)} en total`} icono={HandCoins} acento="verde" />
            <Kpi
              etiqueta="Siguen la recomendación"
              valor={pct(d.siguio, 0)}
              detalle={`de ${num(d.vs.length)} ventas derivadas`}
              icono={Target}
              acento="verde"
            />
            <Kpi
              etiqueta="De prueba a compra"
              valor={pct(d.pruebaCompra, 1)}
              detalle={`${num(d.pruebas)} pruebas virtuales`}
              icono={Sparkles}
              acento="neutro"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel titulo="Ventas derivadas por mes" bajada={`Facturación total ${money(d.gmv)}`}>
            {d.serie.length ? (
              <GraficoMensual
                tipo="barra"
                datos={d.serie}
                series={[{ clave: "ventas", nombre: "Ventas derivadas" }]}
                formato={num}
                alto={220}
              />
            ) : (
              <Vacio icono={ShoppingBag} titulo="Sin ventas todavía" />
            )}
          </Panel>
          <Panel titulo="Devolución por talle por mes" bajada="Promedio móvil de 3 meses. Punteada: la tasa que tenía antes de sumarse">
            {d.vs.length ? (
              <GraficoMensual
                datos={d.serie}
                series={[{ clave: "dev", nombre: "Devolución por talle" }]}
                formato={(n) => `${fmt1(n)} %`}
                formatoEje={(n) => `${n} %`}
                referencia={{ valor: tienda.devTalleAntes, etiqueta: `antes ${tienda.devTalleAntes} %` }}
                alto={220}
              />
            ) : (
              <Vacio icono={Undo2} titulo="Sin ventas todavía" />
            )}
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <Panel
            titulo={`Prendas (${d.ps.length})`}
            bajada={`${d.completas} con tabla de talles completa`}
            className="lg:col-span-3"
            acciones={
              d.ps.length > 12 && (
                <Button variant="ghost" size="sm" onClick={() => setTodas(!todas)}>
                  {todas ? "Ver menos" : `Ver las ${d.ps.length}`}
                </Button>
              )
            }
          >
            {d.ps.length === 0 ? (
              <Vacio icono={StoreIcon} titulo="Todavía no cargó prendas" detalle="Está en onboarding: puede cargar su catálogo desde su portal o con la carga por CSV." />
            ) : (
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {visibles.map((p) => {
                  const x = d.porPrenda.get(p.id)!;
                  const completa = tablaCompleta(p);
                  return (
                    <li key={p.id} className="min-w-0">
                      <PrendaIlustracion prenda={p} className="aspect-[4/5] rounded-xl" />
                      <p className="mt-2 truncate text-sm font-medium text-foreground">{nombreCompleto(p)}</p>
                      <p className="text-xs text-muted-foreground">
                        {nombreCategoria(p.categoria)} · {money(p.precio)}
                      </p>
                      <p className="tabular mt-1 text-xs text-muted-foreground">
                        {x.ventas} ventas · {x.pruebas} pruebas
                        {x.ventas > 0 && ` · ${Math.round((x.dev / x.ventas) * 100)}\u00a0%\u00a0dev.`}
                      </p>
                      {(!completa || p.estado !== "publicada") && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {!completa && <Chip className="border-amber-200 bg-amber-50 text-amber-700">Tabla incompleta</Chip>}
                          {p.estado !== "publicada" && <Chip className="border-border text-muted-foreground capitalize">{p.estado}</Chip>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel titulo="Contacto y acuerdo">
            <dl className="space-y-3">
              <Dato etiqueta="Sitio web">
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" /> {tienda.web}
                </span>
              </Dato>
              <Dato etiqueta="Correo">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {tienda.contacto}
                </span>
              </Dato>
              <Dato etiqueta="Ciudad">{tienda.ciudad}</Dato>
              <Dato etiqueta="Socia desde">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> {fecha(tienda.fechaAlta)}
                </span>
              </Dato>
              <Dato etiqueta="Comisión pactada">{tienda.comisionPct} % por venta derivada</Dato>
              <Dato etiqueta="Molde">
                {tienda.sesgoTalle === 0
                  ? "Estándar"
                  : `${tienda.sesgoTalle > 0 ? "Grande" : "Chico"} (${tienda.sesgoTalle > 0 ? "+" : ""}${tienda.sesgoTalle} cm)`}
              </Dato>
            </dl>
          </Panel>
        </div>
      </PageBody>
    </>
  );
}
