import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Camera, Check, Crown, LifeBuoy, Ruler, ShoppingBag, Sparkles, Undo2, User, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Chip, Dato, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { ChipPlan, MedidasOcultas } from "../../components/admin/piezas";
import { planDe, planesPorUsuario, recientes } from "../../components/admin/datos";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import { usePrendasVisibles, useStore } from "../../lib/store";
import { recomendar, nombreCategoria } from "../../lib/talles";
import { HOY, compatible, comisionDe } from "../../data/seed";
import { nombreCanal } from "../../data/usuarios";
import { nombreCompleto, type Prenda } from "../../data/prendas";
import { hash } from "../../data/azar";
import { fecha, money, num, relativo } from "../../lib/format";

const FEEDBACK = { bien: "Le quedó bien", chico: "Le quedó chico", grande: "Le quedó grande" } as const;
const MODO = { ejemplo: "Modelo de ejemplo", foto: "Foto propia", vivo: "Cámara" } as const;

export function AdminUsuarioDetalle() {
  const { id } = useParams();
  const { usuarios, suscripciones, ventas, pruebas, prendas, tiendas, tickets, favoritos } = useStore();
  const visiblesCatalogo = usePrendasVisibles();
  const u = usuarios.find((x) => x.id === id);
  const [verMedidas, setVerMedidas] = useState(false);

  const d = useMemo(() => {
    if (!u) return null;
    const prendaPor = new Map(prendas.map((p) => [p.id, p]));
    const subs = suscripciones.filter((s) => s.usuarioId === u.id).sort((a, b) => b.inicio.localeCompare(a.inicio));
    const compras = recientes(ventas.filter((v) => v.usuarioId === u.id));
    const prs = recientes(pruebas.filter((p) => p.usuarioId === u.id));
    const tks = tickets.filter((t) => t.origen === "usuario" && t.autorId === u.id);

    // Recomendaciones de ejemplo: favoritos primero, después prendas compatibles elegidas por hash.
    let recs: { prenda: Prenda; talle: string; confianza: number }[] = [];
    if (u.medidas) {
      const m = u.medidas;
      const favs = (favoritos[u.id] ?? []).map((x) => prendaPor.get(x)).filter(Boolean) as Prenda[];
      const resto = visiblesCatalogo
        .filter((p) => compatible(p, m) && !favs.includes(p))
        .sort((a, b) => hash(u.id + a.id) - hash(u.id + b.id));
      recs = [...favs, ...resto]
        .slice(0, 6)
        .map((p) => {
          const r = recomendar(p.tabla, p.categoria, m);
          return r ? { prenda: p, talle: r.talle, confianza: r.confianza } : null;
        })
        .filter(Boolean) as typeof recs;
    }
    return { prendaPor, subs, compras, prs, tks, recs };
  }, [u, prendas, suscripciones, ventas, pruebas, tickets, favoritos, visiblesCatalogo]);

  const planes = useMemo(() => planesPorUsuario(suscripciones), [suscripciones]);

  if (!u || !d)
    return (
      <PageBody>
        <Vacio
          icono={User}
          titulo="No encontramos ese usuario"
          accion={
            <Button asChild variant="outline">
              <Link to="/admin/usuarios">Volver a usuarios</Link>
            </Button>
          }
        />
      </PageBody>
    );

  const devTalle = d.compras.filter((v) => v.motivoDevolucion === "talle").length;
  const gastado = d.compras.filter((v) => v.estado === "confirmada").reduce((a, v) => a + v.precio, 0);
  const comision = d.compras.reduce((a, v) => a + comisionDe(v), 0);
  const tiendaNombre = (tid: string) => tiendas.find((t) => t.id === tid)?.nombre ?? tid;

  return (
    <>
      <PageHeader
        titulo={u.nombre}
        bajada={`${u.email} · ${u.edad} años · ${u.ciudad}`}
        acciones={
          <Button asChild variant="outline">
            <Link to="/admin/usuarios">
              <ArrowLeft className="mr-2 h-4 w-4" /> Usuarios
            </Link>
          </Button>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ChipPlan plan={planDe(planes, u.id)} />
          <Chip className="border-border text-muted-foreground">Llegó por {nombreCanal(u.canal)}</Chip>
          {u.conFoto && (
            <Chip className="border-border text-muted-foreground">
              <Camera className="h-3 w-3" /> Con foto
            </Chip>
          )}
          {u.demo && <Chip className="border-[var(--brand-300)] text-[var(--brand-700)]">Cuenta de demostración</Chip>}
        </div>
      </PageHeader>

      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Kpi etiqueta="Compras" valor={num(d.compras.length)} detalle={`${money(gastado)} en tiendas`} icono={ShoppingBag} acento="verde" />
          <Kpi
            etiqueta="Devueltas por talle"
            valor={num(devTalle)}
            detalle={d.compras.length ? `de ${d.compras.length} compras` : "sin compras"}
            icono={Undo2}
            acento={devTalle ? "ambar" : "verde"}
          />
          <Kpi etiqueta="Pruebas virtuales" valor={num(d.prs.length)} detalle={d.prs[0] ? `última ${relativo(d.prs[0].fecha, HOY)}` : "nunca usó el probador"} icono={Sparkles} acento="neutro" />
          <Kpi etiqueta="Comisión generada" valor={money(comision)} detalle="para ROPA" icono={Crown} acento="neutro" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel titulo="Datos">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Dato etiqueta="Edad">{u.edad} años</Dato>
              <Dato etiqueta="Ciudad">{u.ciudad}</Dato>
              <Dato etiqueta="Canal">{nombreCanal(u.canal)}</Dato>
              <Dato etiqueta="Alta">{fecha(u.fechaAlta)}</Dato>
              <Dato etiqueta="Última actividad">{relativo(u.ultimaActividad, HOY)}</Dato>
              <Dato etiqueta="Consentimiento">{u.consentimiento ? "Aceptado" : "Pendiente"}</Dato>
              <Dato etiqueta="Foto">{u.conFoto ? "Cargada (enmascarada)" : "No subió"}</Dato>
              <Dato etiqueta="Medidas">{!u.medidas ? "Sin cargar" : u.medidasMedidas ? "Con cinta" : "Estimadas"}</Dato>
            </dl>
          </Panel>

          <Panel titulo="Medidas" bajada={u.medidas ? `Género ${u.medidas.genero}` : undefined}>
            {u.medidas ? (
              <MedidasOcultas medidas={u.medidas} nombre={u.nombre} visibles={verMedidas} onVer={() => setVerMedidas(true)} formato="ficha" />
            ) : (
              <Vacio icono={Ruler} titulo="Todavía no cargó sus medidas" detalle="Está en el onboarding." />
            )}
          </Panel>

          <Panel titulo="Plan y suscripciones" bodyClassName="p-0">
            {d.subs.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Plan gratuito: nunca pagó Premium.</p>
            ) : (
              <ul className="divide-y divide-border">
                {d.subs.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">Premium {s.plan}</p>
                      <p className="text-xs text-muted-foreground">
                        Desde {fecha(s.inicio)}
                        {s.fin ? ` hasta ${fecha(s.fin)}` : ""}
                      </p>
                    </div>
                    {s.fin && s.fin <= HOY ? (
                      <Chip className="border-border text-muted-foreground">Dada de baja</Chip>
                    ) : (
                      <Chip className="border-emerald-200 bg-emerald-50 text-emerald-700">Vigente</Chip>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel titulo="Compras" bajada="Talle recomendado contra el comprado, y qué dijo después" bodyClassName="p-0">
          {d.compras.length === 0 ? (
            <Vacio icono={ShoppingBag} titulo="Sin compras derivadas" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Prenda</TableHead>
                    <TableHead className="text-center">Recomendado</TableHead>
                    <TableHead className="text-center">Compró</TableHead>
                    <TableHead className="text-right">Confianza</TableHead>
                    <TableHead>Probador</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.compras.map((v) => {
                    const p = d.prendaPor.get(v.prendaId);
                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            {p && <PrendaIlustracion prenda={p} className="h-11 w-9 shrink-0 rounded-md" />}
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{p ? nombreCompleto(p) : v.prendaId}</p>
                              <Link to={`/admin/tiendas/${v.tiendaId}`} className="text-xs text-muted-foreground hover:underline">
                                {tiendaNombre(v.tiendaId)} · {money(v.precio)} · {fecha(v.fecha)}
                              </Link>
                              <p className="text-xs md:hidden">
                                Recomendado {v.talleRecomendado} · compró{" "}
                                <span className={v.siguio ? "font-medium text-foreground" : "font-medium text-amber-700"}>{v.talle}</span>
                                {v.estado === "devuelta" && <span className="text-red-600"> · devuelta</span>}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{v.talleRecomendado}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center gap-1 font-medium ${v.siguio ? "text-foreground" : "text-amber-700"}`}>
                            {v.talle}
                            {v.siguio ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-label="Siguió la recomendación" /> : <X className="h-3.5 w-3.5" aria-label="No la siguió" />}
                          </span>
                        </TableCell>
                        <TableCell className="tabular text-right">{v.confianza} %</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{v.conPrueba ? "Se la probó" : "—"}</TableCell>
                        <TableCell>
                          {v.estado === "devuelta" ? (
                            <Chip className="border-red-200 bg-red-50 text-red-700">
                              Devuelta {v.motivoDevolucion === "talle" ? "por talle" : "por otro motivo"}
                            </Chip>
                          ) : (
                            <Chip className="border-emerald-200 bg-emerald-50 text-emerald-700">Confirmada</Chip>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{v.feedback ? FEEDBACK[v.feedback] : "Sin respuesta"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Panel>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel titulo="Recomendaciones de talle" bajada="Lo que le recomienda hoy la app en algunas prendas">
            {d.recs.length === 0 ? (
              <Vacio icono={Ruler} titulo="Sin medidas, no hay recomendaciones" />
            ) : (
              <ul className="grid grid-cols-3 gap-3">
                {d.recs.map((r) => (
                  <li key={r.prenda.id} className="min-w-0">
                    <div className="relative">
                      <PrendaIlustracion prenda={r.prenda} className="aspect-[4/5] rounded-lg" />
                      <span className="absolute left-1.5 top-1.5 rounded-md bg-card/95 px-1.5 py-0.5 text-xs font-semibold text-[var(--brand-700)] shadow-sm">
                        {r.talle}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-xs font-medium text-foreground">{nombreCompleto(r.prenda)}</p>
                    <p className="tabular text-xs text-muted-foreground">
                      {nombreCategoria(r.prenda.categoria)} · {r.confianza} % conf.
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="space-y-6">
            <Panel titulo="Pruebas virtuales" bajada={`${d.prs.length} en total`} bodyClassName="p-0">
              {d.prs.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Nunca usó el probador.</p>
              ) : (
                <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                  {d.prs.slice(0, 30).map((p) => {
                    const pr = d.prendaPor.get(p.prendaId);
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <div className="min-w-0">
                          <p className="truncate text-foreground">
                            {pr ? nombreCompleto(pr) : p.prendaId} · talle {p.talle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fecha(p.fecha)} · {MODO[p.modo]} · {(p.latenciaMs / 1000).toFixed(1).replace(".", ",")} s
                            {p.cortesia ? " · de cortesía" : ""}
                          </p>
                        </div>
                        {p.ok ? (
                          <Chip className="border-emerald-200 bg-emerald-50 text-emerald-700">OK</Chip>
                        ) : (
                          <Chip className="border-red-200 bg-red-50 text-red-700">Falló</Chip>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel
              titulo="Tickets de soporte"
              acciones={
                d.tks.length > 0 && (
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/admin/soporte">Soporte</Link>
                  </Button>
                )
              }
              bodyClassName="p-0"
            >
              {d.tks.length === 0 ? (
                <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <LifeBuoy className="h-4 w-4" /> No abrió tickets.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {d.tks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-foreground">{t.asunto}</p>
                        <p className="text-xs text-muted-foreground">
                          {fecha(t.fecha)} · {t.mensajes.length} mensajes
                        </p>
                      </div>
                      <Chip
                        className={
                          t.estado === "abierto"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-border text-muted-foreground"
                        }
                      >
                        {t.estado === "abierto" ? "Abierto" : "Resuelto"}
                      </Chip>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}
