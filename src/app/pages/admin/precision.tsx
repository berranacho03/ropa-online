import { useMemo } from "react";
import { Link } from "react-router";
import { Camera, Check, MessageSquare, Target, Undo2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Ficha, ListaFichas, SoloEscritorio } from "../../components/admin/responsive";
import { Chip, Kpi, PageBody, PageHeader, Panel } from "../../components/shell";
import { FilaBarra, GraficoMensual } from "../../components/admin/graficos";
import { fmt1 } from "../../components/admin/datos";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import { useStore } from "../../lib/store";
import { precision, tasaDevTalle } from "../../lib/metricas";
import { CATEGORIAS, nombreCategoria, type PreferenciaCalce } from "../../lib/talles";
import { MESES, mesDe, type Venta } from "../../data/seed";
import { nombreCompleto, tablaCompleta } from "../../data/prendas";
import { num } from "../../lib/format";

const META = 85;
const TRAMOS: [number, number, string][] = [
  [0, 70, "Menos de 70 %"],
  [70, 80, "70 a 79 %"],
  [80, 90, "80 a 89 %"],
  [90, 101, "90 % o más"],
];
const PREFS: { id: PreferenciaCalce; nombre: string }[] = [
  { id: "ajustado", nombre: "Ajustado" },
  { id: "regular", nombre: "Regular" },
  { id: "holgado", nombre: "Holgado" },
];

const nSig = (vs: Venta[]) => vs.filter((v) => v.siguio).length;
const tono = (p: number) => (p >= META ? "marca" : "mal") as "marca" | "mal";

export function AdminPrecision() {
  const { ventas, prendas, tiendas, usuarios } = useStore();

  const d = useMemo(() => {
    const prendaPor = new Map(prendas.map((p) => [p.id, p]));
    const prefPor = new Map(usuarios.map((u) => [u.id, u.medidas?.preferencia]));
    const agrupar = (clave: (v: Venta) => string | undefined) => {
      const m = new Map<string, Venta[]>();
      for (const v of ventas) {
        const k = clave(v);
        if (!k) continue;
        if (!m.has(k)) m.set(k, []);
        m.get(k)!.push(v);
      }
      return m;
    };

    const porCat = agrupar((v) => prendaPor.get(v.prendaId)?.categoria);
    const categorias = CATEGORIAS.map((c) => ({ c, vs: porCat.get(c.id) ?? [] }))
      .filter((x) => nSig(x.vs) > 0)
      .map((x) => ({ nombre: x.c.plural, p: precision(x.vs), n: nSig(x.vs) }))
      .sort((a, b) => a.p - b.p);

    const porTienda = agrupar((v) => v.tiendaId);
    const tiendasP = tiendas
      .map((t) => ({ t, vs: porTienda.get(t.id) ?? [] }))
      .filter((x) => nSig(x.vs) >= 8)
      .map((x) => ({ t: x.t, p: precision(x.vs), n: nSig(x.vs) }))
      .sort((a, b) => a.p - b.p);

    const porPref = agrupar((v) => prefPor.get(v.usuarioId));
    const prefs = PREFS.map((x) => ({ ...x, p: precision(porPref.get(x.id) ?? []), n: nSig(porPref.get(x.id) ?? []) }));

    const sig = ventas.filter((v) => v.siguio);
    const tramos = TRAMOS.map(([a, b, nombre]) => {
      const vs = sig.filter((v) => v.confianza >= a && v.confianza < b);
      return { nombre, p: precision(vs), n: vs.length };
    }).filter((t) => t.n > 0);

    const noSig = ventas.filter((v) => !v.siguio);
    const conP = ventas.filter((v) => v.conPrueba);
    const sinP = ventas.filter((v) => !v.conPrueba);

    const conFb = ventas.filter((v) => v.feedback);
    const fb = (vs: Venta[]) => {
      const t = vs.filter((v) => v.feedback).length || 1;
      return {
        bien: (vs.filter((v) => v.feedback === "bien").length / t) * 100,
        chico: (vs.filter((v) => v.feedback === "chico").length / t) * 100,
        grande: (vs.filter((v) => v.feedback === "grande").length / t) * 100,
        n: vs.filter((v) => v.feedback).length,
      };
    };

    const serie = MESES.map((mes) => {
      const vs = ventas.filter((v) => mesDe(v.fecha) === mes);
      return { mes, precision: nSig(vs) >= 5 ? Math.round(precision(vs) * 10) / 10 : 0 };
    }).filter((p) => p.precision > 0);

    const porPrenda = agrupar((v) => v.prendaId);
    const peores = [...porPrenda.entries()]
      .map(([id, vs]) => ({
        prenda: prendaPor.get(id),
        ventas: vs.length,
        dev: vs.filter((v) => v.motivoDevolucion === "talle").length,
        chico: vs.filter((v) => v.feedback === "chico").length,
        grande: vs.filter((v) => v.feedback === "grande").length,
      }))
      .filter((x) => x.prenda && x.ventas >= 4 && x.dev > 0)
      .map((x) => ({ ...x, tasa: (x.dev / x.ventas) * 100 }))
      .sort((a, b) => b.tasa - a.tasa || b.dev - a.dev)
      .slice(0, 10);

    return {
      global: precision(ventas),
      nSig: sig.length,
      pctSiguio: ventas.length ? (sig.length / ventas.length) * 100 : 0,
      devSig: tasaDevTalle(sig),
      devNoSig: tasaDevTalle(noSig),
      nNoSig: noSig.length,
      devConP: tasaDevTalle(conP),
      devSinP: tasaDevTalle(sinP),
      nConP: conP.length,
      nSinP: sinP.length,
      categorias,
      tiendasP,
      prefs,
      tramos,
      fbTodos: fb(conFb),
      fbSig: fb(sig),
      fbNoSig: fb(noSig),
      serie,
      peores,
    };
  }, [ventas, prendas, tiendas, usuarios]);

  const tiendaNombre = (id: string) => tiendas.find((t) => t.id === id)?.nombre ?? id;
  const maxComp = Math.max(d.devSig, d.devNoSig, d.devConP, d.devSinP, 1);

  return (
    <>
      <PageHeader
        titulo="Precisión de talles"
        bajada="Cuánto acierta el recomendador: compras que siguieron la recomendación y no se devolvieron por talle. Dónde falla y por qué."
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Precisión global</p>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className="tabular font-display whitespace-nowrap text-5xl font-semibold tracking-tight">{fmt1(d.global)} %</p>
              {d.global >= META ? (
                <Chip className="mb-2 border-emerald-200 bg-emerald-50 text-emerald-700">
                  <Check className="h-3 w-3" /> Cumple la meta
                </Chip>
              ) : (
                <Chip className="mb-2 border-red-200 bg-red-50 text-red-700">Bajo la meta</Chip>
              )}
            </div>
            <div className="relative mt-4 h-2.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${d.global}%` }} />
              <span className="absolute -top-1 w-0.5 bg-[var(--ink)]" style={{ left: `${META}%`, height: 18 }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Meta ≥ {META} % · sobre {num(d.nSig)} compras que siguieron la recomendación
            </p>
          </div>
          <Kpi
            etiqueta="Siguen la recomendación"
            valor={`${fmt1(d.pctSiguio)} %`}
            detalle="de todas las compras derivadas"
            icono={Target}
            acento="verde"
          />
          <Kpi
            etiqueta="Devolución por talle"
            valor={`${fmt1(d.devSig)} % vs ${fmt1(d.devNoSig)} %`}
            detalle="siguiendo la recomendación vs. no"
            icono={Undo2}
            acento="verde"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel titulo="Precisión por mes" bajada={`Eje desde 60 %. Línea punteada: meta ${META} %`}>
            <GraficoMensual
              datos={d.serie}
              series={[{ clave: "precision", nombre: "Precisión" }]}
              formato={(n) => `${fmt1(n)} %`}
              formatoEje={(n) => `${n} %`}
              referencia={{ valor: META, etiqueta: `meta ${META} %` }}
              dominio={[60, 100]}
              alto={220}
            />
          </Panel>
          <Panel
            titulo="Calibración: confianza vs. acierto"
            bajada="Precisión según la confianza que mostró la app al recomendar. Si está bien calibrada, a más confianza, más acierto."
          >
            {d.tramos.map((t) => (
              <FilaBarra key={t.nombre} etiqueta={`Confianza ${t.nombre.toLowerCase()}`} valor={t.p} texto={`${fmt1(t.p)} %`} n={t.n} meta={META} tono={tono(t.p)} />
            ))}
            <p className="mt-3 text-xs text-muted-foreground">
              Marca negra: meta del {META} %. En rojo, los tramos que no llegan.
            </p>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel titulo="Por categoría" bajada="Los jeans y pantalones fallan más: cintura y cadera mandan">
            {d.categorias.map((c) => (
              <FilaBarra key={c.nombre} etiqueta={c.nombre} valor={c.p} texto={`${fmt1(c.p)} %`} n={c.n} meta={META} tono={tono(c.p)} />
            ))}
          </Panel>
          <Panel titulo="Por tienda" bajada="Peores primero. Un molde corrido de la tabla estándar baja el acierto" bodyClassName="max-h-[420px] overflow-y-auto p-4">
            {d.tiendasP.map((x) => (
              <FilaBarra
                key={x.t.id}
                etiqueta={
                  <Link to={`/admin/tiendas/${x.t.id}`} className="hover:underline">
                    {x.t.nombre}
                  </Link>
                }
                detalle={x.t.sesgoTalle ? `molde ${x.t.sesgoTalle > 0 ? "+" : ""}${x.t.sesgoTalle} cm` : undefined}
                valor={x.p}
                texto={`${fmt1(x.p)} %`}
                n={x.n}
                meta={META}
                tono={tono(x.p)}
              />
            ))}
          </Panel>
          <div className="space-y-6">
            <Panel titulo="Por calce preferido" bajada="Lo que eligió cada usuario en su perfil">
              {d.prefs.map((x) => (
                <FilaBarra key={x.id} etiqueta={x.nombre} valor={x.p} texto={`${fmt1(x.p)} %`} n={x.n} meta={META} tono={tono(x.p)} />
              ))}
            </Panel>
            <Panel titulo="¿Seguir la recomendación y probarse sirve?" bajada="Tasa de devolución por talle (menos es mejor)">
              <FilaBarra etiqueta="La siguió" valor={d.devSig} max={maxComp} texto={`${fmt1(d.devSig)} %`} n={d.nSig} />
              <FilaBarra etiqueta="No la siguió" valor={d.devNoSig} max={maxComp} texto={`${fmt1(d.devNoSig)} %`} n={d.nNoSig} tono="mal" />
              <div className="my-2 border-t border-border" />
              <FilaBarra
                etiqueta={
                  <span className="inline-flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5" /> Se la probó antes
                  </span>
                }
                valor={d.devConP}
                max={maxComp}
                texto={`${fmt1(d.devConP)} %`}
                n={d.nConP}
              />
              <FilaBarra etiqueta="Sin probador" valor={d.devSinP} max={maxComp} texto={`${fmt1(d.devSinP)} %`} n={d.nSinP} tono="neutro" />
              {d.nConP < 150 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Pocas compras con prueba previa ({d.nConP}): la diferencia es orientativa.
                </p>
              )}
            </Panel>
          </div>
        </div>

        <Panel
          titulo="Feedback de los usuarios"
          bajada={`«¿Te quedó bien el talle?» · ${num(d.fbTodos.n)} respuestas`}
          acciones={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
        >
          <div className="space-y-4">
            {[
              ["Todas las compras", d.fbTodos],
              ["Siguieron la recomendación", d.fbSig],
              ["No la siguieron", d.fbNoSig],
            ].map(([nombre, f]) => {
              const x = f as typeof d.fbTodos;
              return (
                <div key={nombre as string}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-foreground">{nombre as string}</span>
                    <span className="tabular text-xs text-muted-foreground">n={x.n}</span>
                  </div>
                  <div className="flex h-6 overflow-hidden whitespace-nowrap rounded-md text-[11px] font-medium">
                    <div className="flex items-center justify-center bg-[var(--brand)] text-white" style={{ width: `${x.bien}%` }}>
                      {x.bien >= 12 && (
                        <>
                          <span className="hidden lg:inline">Bien&nbsp;</span>
                          {Math.round(x.bien)}&nbsp;%
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-center border-l-2 border-card bg-amber-400 text-amber-950" style={{ width: `${x.chico}%` }}>
                      {x.chico >= 8 && (
                        <>
                          <span className="hidden lg:inline">Chico&nbsp;</span>
                          {Math.round(x.chico)}&nbsp;%
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-center border-l-2 border-card bg-[var(--ink-500)] text-white" style={{ width: `${x.grande}%` }}>
                      {x.grande >= 8 && (
                        <>
                          <span className="hidden lg:inline">Grande&nbsp;</span>
                          {Math.round(x.grande)}&nbsp;%
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--brand)]" /> Le quedó bien</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Le quedó chico</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--ink-500)]" /> Le quedó grande</span>
            </div>
          </div>
        </Panel>

        <Panel
          titulo="Prendas con más devoluciones por talle"
          bajada="Con 4 ventas o más. Una tasa alta suele indicar una tabla de talles mal cargada: revisarla con la tienda."
          bodyClassName="p-0"
        >
          <ListaFichas>
            {d.peores.map((x) => {
              const p = x.prenda!;
              return (
                <Ficha
                  key={p.id}
                  inicio={<PrendaIlustracion prenda={p} className="h-11 w-9 shrink-0 rounded-md" />}
                  titulo={nombreCompleto(p)}
                  subtitulo={
                    <>
                      <Link to={`/admin/tiendas/${p.tiendaId}`} className="text-[var(--brand-700)] hover:underline">
                        {tiendaNombre(p.tiendaId)}
                      </Link>{" "}
                      · {nombreCategoria(p.categoria)}
                    </>
                  }
                  lateral={
                    <>
                      <p className="tabular text-sm font-semibold text-red-600">{Math.round(x.tasa)} %</p>
                      <p className="text-[11px] text-muted-foreground">dev. por talle</p>
                    </>
                  }
                  datos={[
                    ["Ventas", <span className="tabular">{x.ventas} ({x.dev} dev.)</span>],
                    [
                      "Tabla",
                      tablaCompleta(p) ? (
                        <Chip className="border-border text-muted-foreground">Completa</Chip>
                      ) : (
                        <Chip className="border-amber-200 bg-amber-50 text-amber-700">Incompleta</Chip>
                      ),
                    ],
                    [
                      "Feedback",
                      x.chico || x.grande
                        ? [x.chico && `${x.chico} chico`, x.grande && `${x.grande} grande`].filter(Boolean).join(" · ")
                        : "—",
                    ],
                  ]}
                />
              );
            })}
          </ListaFichas>
          <SoloEscritorio className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Prenda</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Dev. por talle</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Tabla</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.peores.map((x) => {
                  const p = x.prenda!;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <PrendaIlustracion prenda={p} className="h-11 w-9 shrink-0 rounded-md" />
                          <div className="min-w-0">
                            <p className="font-medium">{nombreCompleto(p)}</p>
                            <p className="text-xs text-muted-foreground">{nombreCategoria(p.categoria)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link to={`/admin/tiendas/${p.tiendaId}`} className="whitespace-nowrap text-[var(--brand-700)] hover:underline">
                          {tiendaNombre(p.tiendaId)}
                        </Link>
                      </TableCell>
                      <TableCell className="tabular text-right">{x.ventas}</TableCell>
                      <TableCell className="tabular text-right font-medium text-red-600">
                        {Math.round(x.tasa)} %<span className="ml-1 text-xs font-normal text-muted-foreground">({x.dev})</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {x.chico || x.grande
                          ? [x.chico && `${x.chico} chico`, x.grande && `${x.grande} grande`].filter(Boolean).join(" · ")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {tablaCompleta(p) ? (
                          <Chip className="border-border text-muted-foreground">Completa</Chip>
                        ) : (
                          <Chip className="border-amber-200 bg-amber-50 text-amber-700">Incompleta</Chip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </SoloEscritorio>
        </Panel>
      </PageBody>
    </>
  );
}
