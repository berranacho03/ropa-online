import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Camera, ChevronLeft, ChevronRight, Crown, Repeat, Users, UserCheck } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Ficha, FiltrosMovil, ListaFichas, SoloEscritorio } from "../../components/admin/responsive";
import { Chip, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { ChipPlan, MedidasOcultas, NOMBRE_PLAN } from "../../components/admin/piezas";
import { Buscador, FiltroSelect, normalizar } from "../../components/admin/filtros";
import { contarPor, hace, planDe, planesPorUsuario } from "../../components/admin/datos";
import { useStore } from "../../lib/store";
import { retencion } from "../../lib/metricas";
import { CANALES, nombreCanal } from "../../data/usuarios";
import { HOY } from "../../data/seed";
import { fecha, num, pct, relativo } from "../../lib/format";

const POR_PAGINA = 25;

export function AdminUsuarios() {
  const { usuarios, suscripciones, ventas, pruebas } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("todos");
  const [canal, setCanal] = useState("todos");
  const [ciudad, setCiudad] = useState("todas");
  const [foto, setFoto] = useState("todos");
  const [actividad, setActividad] = useState("todos");
  const [pagina, setPagina] = useState(0);
  const [vistas, setVistas] = useState<Set<string>>(new Set());

  const planes = useMemo(() => planesPorUsuario(suscripciones), [suscripciones]);
  const compras = useMemo(() => contarPor(ventas, (v) => v.usuarioId), [ventas]);
  const nPruebas = useMemo(() => contarPor(pruebas, (p) => p.usuarioId), [pruebas]);
  const ciudades = useMemo(() => [...new Set(usuarios.map((u) => u.ciudad))].sort(), [usuarios]);

  const kpis = useMemo(() => {
    const reales = usuarios.filter((u) => !u.demo);
    return {
      total: usuarios.length,
      activos30: usuarios.filter((u) => u.ultimaActividad >= hace(30)).length,
      premium: [...planes.values()].filter((p) => p === "premium").length,
      conFoto: (reales.filter((u) => u.conFoto).length / Math.max(1, reales.length)) * 100,
      r30: retencion(usuarios, 30),
      r60: retencion(usuarios, 60),
      r90: retencion(usuarios, 90),
    };
  }, [usuarios, planes]);

  const filtrados = useMemo(() => {
    const nq = normalizar(q.trim());
    const desde30 = hace(30);
    return usuarios
      .filter((u) => !nq || normalizar(`${u.nombre} ${u.email} ${u.id}`).includes(nq))
      .filter((u) => plan === "todos" || planDe(planes, u.id) === plan)
      .filter((u) => canal === "todos" || u.canal === canal)
      .filter((u) => ciudad === "todas" || u.ciudad === ciudad)
      .filter((u) => foto === "todos" || (foto === "si") === u.conFoto)
      .filter(
        (u) =>
          actividad === "todos" ||
          (actividad === "activos" ? u.ultimaActividad >= desde30 : u.ultimaActividad < desde30)
      )
      .sort(
        (a, b) =>
          Number(!!b.demo) - Number(!!a.demo) ||
          b.ultimaActividad.localeCompare(a.ultimaActividad) ||
          b.fechaAlta.localeCompare(a.fechaAlta)
      );
  }, [usuarios, q, plan, canal, ciudad, foto, actividad, planes]);

  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const pag = Math.min(pagina, paginas - 1);
  const filas = filtrados.slice(pag * POR_PAGINA, (pag + 1) * POR_PAGINA);
  const conFiltro = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPagina(0);
  };

  return (
    <>
      <PageHeader
        titulo="Usuarios"
        bajada="Quiénes usan ROPA, por dónde llegaron y qué hacen. Las medidas corporales se muestran enmascaradas: verlas queda registrado."
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
          <Kpi etiqueta="Usuarios" valor={num(kpis.total)} detalle="registrados" icono={Users} acento="neutro" />
          <Kpi
            etiqueta="Activos 30 días"
            valor={num(kpis.activos30)}
            detalle={pct((kpis.activos30 / kpis.total) * 100, 0) + " del total"}
            icono={UserCheck}
            acento="verde"
          />
          <Kpi etiqueta="Premium" valor={num(kpis.premium)} detalle="suscripción vigente" icono={Crown} acento="verde" />
          <Kpi etiqueta="Con foto" valor={pct(kpis.conFoto, 1)} detalle="para el probador" icono={Camera} acento="neutro" />
          <div className="col-span-2 lg:col-span-1">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Retención</p>
                <span className="rounded-lg bg-[var(--brand-100)] p-1.5 text-[var(--brand-700)]">
                  <Repeat className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  ["30 d", kpis.r30],
                  ["60 d", kpis.r60],
                  ["90 d", kpis.r90],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <p className="tabular whitespace-nowrap text-lg font-semibold tracking-tight">{pct(v as number, 0)}</p>
                    <p className="text-xs text-muted-foreground">{k}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Panel bodyClassName="p-0">
          <div className="flex gap-2 border-b border-border p-4 md:grid md:grid-cols-3 xl:grid-cols-6">
            <Buscador valor={q} onCambio={conFiltro(setQ)} placeholder="Nombre o correo (ej. sofi)…" className="sm:max-w-none md:col-span-3 xl:col-span-1" />
            <FiltrosMovil
              activos={[plan !== "todos", canal !== "todos", ciudad !== "todas", foto !== "todos", actividad !== "todos"].filter(Boolean).length}
              onLimpiar={() => {
                conFiltro(setPlan)("todos");
                conFiltro(setCanal)("todos");
                conFiltro(setCiudad)("todas");
                conFiltro(setFoto)("todos");
                conFiltro(setActividad)("todos");
              }}
            >
            <FiltroSelect
              etiqueta="Plan"
              valor={plan}
              onCambio={conFiltro(setPlan)}
              className="sm:w-full"
              opciones={[
                { valor: "todos", texto: "Todo plan" },
                ...(["gratis", "premium", "ex"] as const).map((p) => ({ valor: p, texto: NOMBRE_PLAN[p] })),
              ]}
            />
            <FiltroSelect
              etiqueta="Canal"
              valor={canal}
              onCambio={conFiltro(setCanal)}
              className="sm:w-full"
              opciones={[{ valor: "todos", texto: "Todo canal" }, ...CANALES.map((c) => ({ valor: c.id, texto: c.nombre }))]}
            />
            <FiltroSelect
              etiqueta="Ciudad"
              valor={ciudad}
              onCambio={conFiltro(setCiudad)}
              className="sm:w-full"
              opciones={[{ valor: "todas", texto: "Toda ciudad" }, ...ciudades.map((c) => ({ valor: c, texto: c }))]}
            />
            <FiltroSelect
              etiqueta="Foto"
              valor={foto}
              onCambio={conFiltro(setFoto)}
              className="sm:w-full"
              opciones={[
                { valor: "todos", texto: "Con y sin foto" },
                { valor: "si", texto: "Con foto" },
                { valor: "no", texto: "Sin foto" },
              ]}
            />
            <FiltroSelect
              etiqueta="Actividad"
              valor={actividad}
              onCambio={conFiltro(setActividad)}
              className="sm:w-full"
              opciones={[
                { valor: "todos", texto: "Toda actividad" },
                { valor: "activos", texto: "Activos 30 días" },
                { valor: "inactivos", texto: "Inactivos" },
              ]}
            />
            </FiltrosMovil>
          </div>

          {filas.length === 0 ? (
            <Vacio icono={Users} titulo="Ningún usuario coincide" detalle="Probá con otro nombre o sacá algún filtro." />
          ) : (
            <>
            <ListaFichas>
              {filas.map((u) => (
                <Ficha
                  key={u.id}
                  onClick={() => navigate(`/admin/usuarios/${u.id}`)}
                  titulo={
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate">{u.nombre}</span>
                      {u.demo && <Chip className="border-[var(--brand-300)] text-[var(--brand-700)]">demo</Chip>}
                      {u.conFoto && <Camera className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Con foto" />}
                    </span>
                  }
                  subtitulo={u.email}
                  lateral={<ChipPlan plan={planDe(planes, u.id)} />}
                  datos={[
                    ["Edad · ciudad", `${u.edad} · ${u.ciudad}`],
                    ["Canal", nombreCanal(u.canal)],
                    ["Actividad", relativo(u.ultimaActividad, HOY)],
                    ["Compras · pruebas", <span className="tabular">{compras.get(u.id) ?? 0} · {nPruebas.get(u.id) ?? 0}</span>],
                    [
                      "Medidas",
                      <MedidasOcultas
                        medidas={u.medidas}
                        nombre={u.nombre}
                        visibles={vistas.has(u.id)}
                        onVer={() => setVistas((s) => new Set(s).add(u.id))}
                      />,
                    ],
                    ["Alta", <span className="tabular">{fecha(u.fechaAlta)}</span>],
                  ]}
                />
              ))}
            </ListaFichas>
            <SoloEscritorio>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Usuario</TableHead>
                    <TableHead>Edad · ciudad</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Actividad · alta</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Compras</TableHead>
                    <TableHead className="text-right">Pruebas</TableHead>
                    <TableHead>Medidas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((u) => (
                    <TableRow key={u.id} className="cursor-pointer" onClick={() => navigate(`/admin/usuarios/${u.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-100)] text-xs font-semibold text-[var(--brand-700)]">
                            {u.nombre
                              .split(" ")
                              .map((x) => x[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-medium text-foreground">
                              {u.nombre}
                              {u.demo && <Chip className="border-[var(--brand-300)] text-[var(--brand-700)]">demo</Chip>}
                              {u.conFoto && <Camera className="h-3.5 w-3.5 text-muted-foreground" aria-label="Con foto" />}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="tabular">{u.edad}</span>
                        <span className="block text-xs text-muted-foreground">{u.ciudad}</span>
                      </TableCell>
                      <TableCell>{nombreCanal(u.canal)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span>{relativo(u.ultimaActividad, HOY)}</span>
                        <span className="tabular block text-xs text-muted-foreground">alta {fecha(u.fechaAlta)}</span>
                      </TableCell>
                      <TableCell>
                        <ChipPlan plan={planDe(planes, u.id)} />
                      </TableCell>
                      <TableCell className="tabular text-right">{compras.get(u.id) ?? 0}</TableCell>
                      <TableCell className="tabular text-right">{nPruebas.get(u.id) ?? 0}</TableCell>
                      <TableCell>
                        <MedidasOcultas
                          medidas={u.medidas}
                          nombre={u.nombre}
                          visibles={vistas.has(u.id)}
                          onVer={() => setVistas((s) => new Set(s).add(u.id))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SoloEscritorio>
            </>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {filtrados.length
                ? `${num(pag * POR_PAGINA + 1)}–${num(Math.min(filtrados.length, (pag + 1) * POR_PAGINA))} de ${num(filtrados.length)}`
                : "0 usuarios"}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={pag === 0} onClick={() => setPagina(pag - 1)} aria-label="Página anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tabular text-xs text-muted-foreground">
                {pag + 1} / {paginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pag >= paginas - 1}
                onClick={() => setPagina(pag + 1)}
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Panel>
      </PageBody>
    </>
  );
}
