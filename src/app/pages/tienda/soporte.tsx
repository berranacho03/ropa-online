import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LifeBuoy, MessageSquarePlus, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Chip, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { ConTienda } from "../../components/tienda/comun";
import { useStore } from "../../lib/store";
import { HOY, type Ticket } from "../../data/seed";
import type { Tienda } from "../../data/tiendas";
import { fechaHora, relativo } from "../../lib/format";
import { cn } from "../../components/ui/utils";

export function TiendaSoporte() {
  return <ConTienda titulo="Soporte">{(t) => <Soporte tienda={t} />}</ConTienda>;
}

const CATEGORIAS: { id: Ticket["categoria"]; label: string }[] = [
  { id: "catalogo", label: "Catálogo y carga" },
  { id: "talle", label: "Tablas de talles y devoluciones" },
  { id: "comisiones", label: "Comisiones y pagos" },
  { id: "cuenta", label: "Mi cuenta" },
];

const RESPUESTA: Record<Ticket["categoria"], string> = {
  catalogo:
    "¡Hola! Ya estamos mirando tu consulta. Mientras tanto: en Cargar catálogo podés asignar cada columna de tu planilla a un campo y completar los talles sin medidas con la plantilla de la categoría.",
  talle:
    "¡Hola! Gracias por avisar. En Tablas de talles te marcamos las prendas con más devoluciones por talle; si a la mayoría le quedó chico, probá bajar los rangos 2 cm. Igual revisamos tu caso y te escribimos.",
  comisiones:
    "¡Hola! Las ventas devueltas no comisionan, y en Comisiones tenés el detalle venta por venta de cada mes. Revisamos tu liquidación y te confirmamos por acá.",
  cuenta: "¡Hola! Recibimos tu consulta. Alguien del equipo la revisa y te responde por acá en el día.",
  pago: "¡Hola! Recibimos tu consulta sobre pagos. La revisamos y te respondemos por acá en el día.",
  probador: "¡Hola! Recibimos tu consulta. Alguien del equipo la revisa y te responde por acá en el día.",
};

const SEGUIMIENTO = "¡Gracias! Lo sumamos al ticket y te contestamos por acá.";

function Soporte({ tienda }: { tienda: Tienda }) {
  const { tickets, nuevoTicket, responderTicket } = useStore();
  // La respuesta automática llega después de un rato: tiene que usar el store de ese momento.
  const ultimo = useRef(responderTicket);
  ultimo.current = responderTicket;

  const mios = tickets.filter((t) => t.origen === "tienda" && t.autorId === tienda.id);
  const [sel, setSel] = useState<string | "nuevo" | undefined>(undefined);
  const [escribiendo, setEscribiendo] = useState<string | null>(null);
  const actual = sel === "nuevo" ? undefined : (mios.find((t) => t.id === sel) ?? (sel === undefined ? mios[0] : undefined));
  const modoNuevo = sel === "nuevo" || (!actual && mios.length === 0);

  const [asunto, setAsunto] = useState("");
  const [categoria, setCategoria] = useState<Ticket["categoria"]>("catalogo");
  const [texto, setTexto] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const fin = useRef<HTMLDivElement>(null);
  const refHilo = useRef<HTMLDivElement>(null);
  // En el celular el hilo queda abajo de la lista: al elegir uno, lo llevamos ahí.
  const elegir = (id: string) => {
    setSel(id);
    if (window.matchMedia("(max-width: 1023px)").matches)
      setTimeout(() => refHilo.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  useEffect(() => {
    fin.current?.scrollIntoView({ block: "end" });
  }, [actual?.mensajes.length, escribiendo]);

  const responderLuego = (id: string, msg: string) => {
    setEscribiendo(id);
    setTimeout(() => {
      ultimo.current(id, { de: "soporte", texto: msg });
      setEscribiendo((e) => (e === id ? null : e));
    }, 2000);
  };

  const crear = () => {
    if (!asunto.trim() || !texto.trim()) return;
    const t = nuevoTicket({ origen: "tienda", autorId: tienda.id, asunto: asunto.trim(), categoria, texto: texto.trim() });
    setSel(t.id);
    setAsunto("");
    setTexto("");
    toast.success("Mensaje enviado", { description: "Soporte responde 24/7." });
    responderLuego(t.id, RESPUESTA[categoria]);
  };

  const enviar = () => {
    if (!actual || !respuesta.trim()) return;
    responderTicket(actual.id, { de: "cliente", texto: respuesta.trim() });
    setRespuesta("");
    responderLuego(actual.id, SEGUIMIENTO);
  };

  const resolver = () => {
    if (!actual) return;
    responderTicket(actual.id, { de: "cliente", texto: "Listo, quedó resuelto. ¡Gracias!" }, true);
    toast("Ticket marcado como resuelto");
  };

  return (
    <>
      <PageHeader
        titulo="Soporte"
        bajada="Escribinos por cualquier duda con tu catálogo, tus tablas o tus comisiones. Respondemos 24/7."
        acciones={
          <Button onClick={() => elegir("nuevo")}>
            <MessageSquarePlus className="mr-2 h-4 w-4" /> Nueva consulta
          </Button>
        }
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr]">
          <Panel titulo="Tus consultas" bodyClassName="p-0" className="self-start">
            {mios.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Todavía no nos escribiste.</p>
            ) : (
              <ul className="max-h-[65vh] divide-y divide-border overflow-y-auto">
                {mios.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => elegir(t.id)}
                      className={cn("w-full px-4 py-3 text-left transition-colors hover:bg-muted/60", actual?.id === t.id && "bg-[var(--brand-50)]")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm", actual?.id === t.id ? "font-medium text-[var(--brand-700)]" : "text-foreground")}>{t.asunto}</p>
                        <EstadoTicket t={t} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {CATEGORIAS.find((c) => c.id === t.categoria)?.label ?? t.categoria} · {relativo(t.fecha, HOY)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div ref={refHilo} className="min-w-0 scroll-mt-4">
          {modoNuevo ? (
            <Panel titulo="Nueva consulta" bajada="Contanos qué pasa y te respondemos en este mismo hilo.">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_16rem]">
                  <div className="space-y-1.5">
                    <Label htmlFor="asunto">Asunto</Label>
                    <Input id="asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Ej.: no me toma la columna de talles" maxLength={80} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tema</Label>
                    <Select value={categoria} onValueChange={(v) => setCategoria(v as Ticket["categoria"])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="texto">Mensaje</Label>
                  <Textarea id="texto" rows={5} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Contanos con detalle, así lo resolvemos más rápido." />
                </div>
                <div className="flex justify-end gap-2">
                  {mios.length > 0 && (
                    <Button variant="ghost" onClick={() => setSel(undefined)}>
                      Cancelar
                    </Button>
                  )}
                  <Button disabled={!asunto.trim() || !texto.trim()} onClick={crear}>
                    <Send className="mr-2 h-4 w-4" /> Enviar
                  </Button>
                </div>
              </div>
            </Panel>
          ) : actual ? (
            <Panel
              titulo={actual.asunto}
              bajada={`Abierto el ${fechaHora(actual.mensajes[0]?.fecha ?? actual.fecha)} · ${CATEGORIAS.find((c) => c.id === actual.categoria)?.label ?? actual.categoria}`}
              acciones={
                actual.estado === "abierto" ? (
                  <Button size="sm" variant="outline" onClick={resolver}>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Marcar resuelto
                  </Button>
                ) : (
                  <EstadoTicket t={actual} />
                )
              }
              bodyClassName="p-0"
            >
              <div className="max-h-[55vh] min-h-[16rem] space-y-3 overflow-y-auto bg-muted/30 p-4">
                {actual.mensajes.map((m, i) => (
                  <div key={i} className={cn("flex", m.de === "cliente" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                        m.de === "cliente" ? "rounded-br-md bg-[var(--brand)] text-white" : "rounded-bl-md border border-border bg-card"
                      )}
                    >
                      {m.de === "soporte" && <p className="mb-0.5 text-xs font-semibold text-[var(--brand-700)]">Soporte ROPA</p>}
                      <p className="whitespace-pre-wrap">{m.texto}</p>
                      <p className={cn("mt-1 text-[10px]", m.de === "cliente" ? "text-white/70" : "text-muted-foreground")}>{fechaHora(m.fecha)}</p>
                    </div>
                  </div>
                ))}
                {escribiendo === actual.id && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
                      <span className="flex gap-1">
                        {[0, 1, 2].map((k) => (
                          <span key={k} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${k * 150}ms` }} />
                        ))}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={fin} />
              </div>
              <div className="flex items-end gap-2 border-t border-border p-3">
                <Textarea
                  rows={2}
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      enviar();
                    }
                  }}
                  placeholder="Escribí tu mensaje…"
                  className="min-h-0 resize-none"
                />
                <Button size="icon" disabled={!respuesta.trim()} onClick={enviar} aria-label="Enviar">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </Panel>
          ) : (
            <Panel>
              <Vacio icono={LifeBuoy} titulo="Elegí una consulta" />
            </Panel>
          )}
          </div>
        </div>
      </PageBody>
    </>
  );
}

function EstadoTicket({ t }: { t: Ticket }) {
  return t.estado === "abierto" ? (
    <Chip className="border-amber-200 bg-amber-50 text-amber-800">Abierto</Chip>
  ) : (
    <Chip className="border-[var(--brand-300)] bg-[var(--brand-50)] text-[var(--brand-700)]">Resuelto</Chip>
  );
}
