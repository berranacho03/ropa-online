import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, CheckCircle2, Clock, Inbox, LifeBuoy, MessageSquare, Search, Send, Store, User } from "lucide-react";
import { toast } from "sonner";
import { Chip, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { cn } from "../../components/ui/utils";
import { fmt1 } from "../../components/admin2/graficos";
import { useStore } from "../../lib/store";
import { HOY, type Ticket } from "../../data/seed";
import { fecha, relativo } from "../../lib/format";

const CATEGORIAS: Record<Ticket["categoria"], string> = {
  talle: "Talle",
  probador: "Probador",
  pago: "Pagos",
  cuenta: "Cuenta",
  catalogo: "Catálogo",
  comisiones: "Comisiones",
};

/** Los tickets creados en la sesión tienen ids con guion (`t-…`). */
const esNuevo = (t: Ticket) => t.id.includes("-");

const horaDe = (iso: string) => (iso.length > 10 ? iso.slice(11, 16) : "");

export function AdminSoporte() {
  const { tickets, usuarios, tiendas, responderTicket } = useStore();
  const [estado, setEstado] = useState("todos");
  const [origen, setOrigen] = useState("todos");
  const [categoria, setCategoria] = useState("todas");
  const [q, setQ] = useState("");
  const [abiertoId, setAbiertoId] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState("");

  const autor = useMemo(() => {
    const us = new Map(usuarios.map((u) => [u.id, u.nombre]));
    const ts = new Map(tiendas.map((t) => [t.id, t.nombre]));
    return (t: Ticket) => (t.origen === "tienda" ? ts.get(t.autorId) : us.get(t.autorId)) ?? t.autorId;
  }, [usuarios, tiendas]);

  const ordenados = useMemo(
    () =>
      [...tickets].sort(
        (a, b) =>
          Number(esNuevo(b)) - Number(esNuevo(a)) ||
          Number(b.estado === "abierto") - Number(a.estado === "abierto") ||
          b.fecha.localeCompare(a.fecha) ||
          (b.mensajes[0]?.fecha ?? "").localeCompare(a.mensajes[0]?.fecha ?? "")
      ),
    [tickets]
  );

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ordenados.filter(
      (x) =>
        (estado === "todos" || x.estado === estado) &&
        (origen === "todos" || x.origen === origen) &&
        (categoria === "todas" || x.categoria === categoria) &&
        (!t || x.asunto.toLowerCase().includes(t) || autor(x).toLowerCase().includes(t))
    );
  }, [ordenados, estado, origen, categoria, q, autor]);

  const kpis = useMemo(() => {
    const abiertos = tickets.filter((t) => t.estado === "abierto");
    const respondidos = tickets.filter((t) => t.mensajes.some((m) => m.de === "soporte") && t.respuestaHoras > 0);
    const primera = respondidos.length ? respondidos.reduce((a, t) => a + t.respuestaHoras, 0) / respondidos.length : 0;
    const sinRespuesta = abiertos.filter((t) => !t.mensajes.some((m) => m.de === "soporte")).length;
    return { abiertos: abiertos.length, primera, sinRespuesta, resueltos: tickets.length - abiertos.length };
  }, [tickets]);

  const seleccionado = abiertoId ? tickets.find((t) => t.id === abiertoId) ?? null : null;

  const enviar = (cerrar: boolean) => {
    if (!seleccionado) return;
    const texto = respuesta.trim();
    if (texto) responderTicket(seleccionado.id, { de: "soporte", texto }, cerrar);
    else if (cerrar) responderTicket(seleccionado.id, { de: "soporte", texto: "Damos el caso por resuelto. ¡Cualquier cosa, escribinos de nuevo!" }, true);
    setRespuesta("");
    toast.success(cerrar ? "Ticket resuelto" : "Respuesta enviada", {
      description: `${seleccionado.asunto} · ${autor(seleccionado)}`,
    });
  };

  return (
    <>
      <PageHeader
        titulo="Soporte"
        bajada="Bandeja de consultas que llegan por el chat de la app y del portal de tiendas. Los tickets nuevos de la sesión aparecen arriba."
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi etiqueta="Abiertos" valor={String(kpis.abiertos)} detalle={`${kpis.sinRespuesta} sin responder`} icono={Inbox} acento={kpis.sinRespuesta ? "ambar" : "neutro"} />
          <Kpi etiqueta="Primera respuesta" valor={`${fmt1(kpis.primera)} h`} detalle="promedio" icono={Clock} />
          <Kpi etiqueta="Resueltos" valor={String(kpis.resueltos)} detalle={`de ${tickets.length} tickets`} icono={CheckCircle2} acento="verde" />
          <Kpi
            etiqueta="De tiendas"
            valor={String(tickets.filter((t) => t.origen === "tienda").length)}
            detalle={`${tickets.filter((t) => t.origen === "usuario").length} de usuarios`}
            icono={Store}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Panel bodyClassName="p-0" className={cn(seleccionado && "hidden lg:block")}>
            <div className="space-y-2 border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por asunto o autor…" className="pl-8" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger className="w-full" aria-label="Estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Estado</SelectItem>
                    <SelectItem value="abierto">Abiertos</SelectItem>
                    <SelectItem value="resuelto">Resueltos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={origen} onValueChange={setOrigen}>
                  <SelectTrigger className="w-full" aria-label="Origen">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Origen</SelectItem>
                    <SelectItem value="usuario">Usuarios</SelectItem>
                    <SelectItem value="tienda">Tiendas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="w-full" aria-label="Categoría">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Tema</SelectItem>
                    {Object.entries(CATEGORIAS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {filtrados.length === 0 ? (
              <Vacio icono={LifeBuoy} titulo="No hay tickets con esos filtros" detalle={estado === "abierto" ? "¡Bandeja al día!" : undefined} />
            ) : (
              <ul className="divide-y divide-border lg:max-h-[640px] lg:overflow-y-auto">
                {filtrados.map((t) => {
                  const ult = t.mensajes[t.mensajes.length - 1];
                  const esperando = t.estado === "abierto" && ult?.de === "cliente";
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setAbiertoId(t.id);
                          setRespuesta("");
                        }}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-colors hover:bg-muted/50",
                          abiertoId === t.id && "bg-[var(--brand-50)]"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                            {t.origen === "tienda" ? <Store className="h-3.5 w-3.5 shrink-0" /> : <User className="h-3.5 w-3.5 shrink-0" />}
                            <span className="truncate">{autor(t)}</span>
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">{relativo(t.fecha, HOY)}</span>
                        </div>
                        <p className={cn("mt-1 truncate text-sm", esperando ? "font-semibold" : "font-medium")}>{t.asunto}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {esNuevo(t) && <Chip className="border-[var(--brand-300)] bg-[var(--brand)] text-white">Nuevo</Chip>}
                          <Chip className="border-border bg-muted/60 text-muted-foreground">{CATEGORIAS[t.categoria]}</Chip>
                          {t.estado === "resuelto" ? (
                            <Chip className="border-[var(--brand-300)] bg-[var(--brand-50)] text-[var(--brand-700)]">Resuelto</Chip>
                          ) : esperando ? (
                            <Chip className="border-amber-200 bg-amber-50 text-amber-800">Espera respuesta</Chip>
                          ) : (
                            <Chip className="border-slate-200 bg-slate-50 text-slate-600">Abierto</Chip>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <div className={cn(!seleccionado && "hidden lg:block")}>
            {seleccionado ? (
              <Panel
                titulo={seleccionado.asunto}
                bajada={`${seleccionado.origen === "tienda" ? "Tienda" : "Usuario"}: ${autor(seleccionado)} · ${CATEGORIAS[seleccionado.categoria]} · ${fecha(seleccionado.fecha)}`}
                acciones={
                  <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setAbiertoId(null)}>
                    <ArrowLeft className="h-4 w-4" /> Bandeja
                  </Button>
                }
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {seleccionado.origen === "tienda" ? (
                    <Link to={`/admin/tiendas/${seleccionado.autorId}`} className="font-medium text-[var(--brand-700)] hover:underline">
                      Ver tienda
                    </Link>
                  ) : (
                    <Link to={`/admin/usuarios/${seleccionado.autorId}`} className="font-medium text-[var(--brand-700)] hover:underline">
                      Ver ficha del usuario
                    </Link>
                  )}
                  {seleccionado.respuestaHoras > 0 && <span>· Primera respuesta en {fmt1(seleccionado.respuestaHoras)} h</span>}
                </div>
                <ol className="space-y-3">
                  {seleccionado.mensajes.map((m, i) => (
                    <li key={i} className={cn("flex", m.de === "soporte" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                          m.de === "soporte"
                            ? "rounded-br-sm bg-[var(--brand)] text-white"
                            : "rounded-bl-sm bg-muted text-foreground"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.texto}</p>
                        <p className={cn("mt-1 text-[11px]", m.de === "soporte" ? "text-white/75" : "text-muted-foreground")}>
                          {m.de === "soporte" ? "Equipo de soporte" : autor(seleccionado)} · {fecha(m.fecha)} {horaDe(m.fecha)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                {seleccionado.estado === "abierto" ? (
                  <div className="mt-5 space-y-2 border-t border-border pt-4">
                    <Textarea
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      placeholder="Escribí la respuesta…"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && respuesta.trim()) enviar(false);
                      }}
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="outline" onClick={() => enviar(true)}>
                        <CheckCircle2 className="h-4 w-4" /> {respuesta.trim() ? "Responder y resolver" : "Marcar resuelto"}
                      </Button>
                      <Button onClick={() => enviar(false)} disabled={!respuesta.trim()}>
                        <Send className="h-4 w-4" /> Responder
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 flex items-center gap-1.5 border-t border-border pt-4 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-[var(--brand-700)]" /> Ticket resuelto.
                  </p>
                )}
              </Panel>
            ) : (
              <Panel>
                <Vacio icono={MessageSquare} titulo="Elegí un ticket" detalle="Abrí una conversación de la bandeja para leerla y responder." />
              </Panel>
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
}
