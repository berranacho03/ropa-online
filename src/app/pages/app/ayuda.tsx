import { useEffect, useRef, useState } from "react";
import { MessageCircle, Plus, Send } from "lucide-react";
import { AppHeader, Avatar } from "../../components/app/comun";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Isotipo } from "../../components/logo";
import { useStore, useYo } from "../../lib/store";
import { fecha } from "../../lib/format";
import type { Ticket } from "../../data/seed";
import { cn } from "../../components/ui/utils";

const FAQ: { p: string; r: string }[] = [
  {
    p: "¿Cómo calculan mi talle?",
    r: "Comparamos tus medidas con la tabla de talles que cargó cada tienda para esa prenda. Cada categoría mira zonas distintas (en una remera pesa el pecho; en un jean, cintura y cadera) y tenemos en cuenta si te gusta la ropa ajustada o suelta. El porcentaje es qué tan claro es que ese talle te queda mejor que el de al lado.",
  },
  {
    p: "¿Por qué mi talle cambia de una tienda a otra?",
    r: "Porque el M de una tienda no es el M de otra: cada marca usa su propio molde. Por eso calculamos tu talle prenda por prenda.",
  },
  {
    p: "¿Qué pasa si me quedó mal el talle?",
    r: "La devolución la gestiona la tienda. Contanos en «Mis compras» si te quedó chico o grande: con eso ajustamos tus próximas recomendaciones.",
  },
  {
    p: "¿El probador virtual es exacto?",
    r: "Es una vista aproximada para que te hagas una idea de cómo cae la prenda en cada talle. La recomendación de talle es la que se basa en tus medidas.",
  },
  {
    p: "¿Qué incluye Premium y cómo lo cancelo?",
    r: "Premium habilita el probador virtual ilimitado (persona de ejemplo, tu foto y en vivo) y comparar talles. Lo cancelás cuando quieras desde Perfil → Premium.",
  },
  {
    p: "¿Las tiendas ven mis medidas o mi foto?",
    r: "No. Las tiendas sólo ven el talle que compraste. Tu foto queda guardada en tu teléfono y la podés borrar desde Privacidad.",
  },
];

type Categoria = Ticket["categoria"];

function categoriaDe(texto: string): Categoria {
  const t = texto.toLowerCase();
  if (/(pag|cobr|tarjeta|premium|suscrip|plan)/.test(t)) return "pago";
  if (/(prob|foto|c[aá]mara|virtual)/.test(t)) return "probador";
  if (/(cuenta|contrase|mail|borrar|datos)/.test(t)) return "cuenta";
  return "talle";
}

const RESPUESTA: Record<Categoria, string> = {
  talle:
    "¡Hola! Gracias por escribirnos. Si un talle no te convence, revisá que tus medidas estén al día en Perfil → Mis medidas: cualquier cambio actualiza todas las recomendaciones al momento. Y si ya compraste, contanos en Mis compras cómo te quedó.",
  probador:
    "¡Hola! Para el probador con foto, usá una de cuerpo entero, de frente y con buena luz. Si la prenda no queda bien ubicada, arrastrala y ajustá el tamaño con el control de abajo.",
  pago: "¡Hola! Los pagos de Premium se procesan al momento. Podés ver tu plan, la próxima renovación o cancelarlo desde Perfil → Premium.",
  cuenta: "¡Hola! Todo lo de tu cuenta y tus datos está en Perfil → Privacidad: ahí podés descargar tus datos, borrar tu foto o pedir la baja.",
  catalogo: "¡Hola! Ya le pasamos tu consulta al equipo.",
  comisiones: "¡Hola! Ya le pasamos tu consulta al equipo.",
};

export function Ayuda() {
  const store = useStore();
  const { tickets, nuevoTicket, responderTicket } = store;
  const { usuario } = useYo();
  const [texto, setTexto] = useState("");
  const [activoId, setActivoId] = useState<string | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const fin = useRef<HTMLDivElement>(null);

  // Siempre la versión más nueva del store, para la respuesta diferida.
  const ref = useRef(store);
  ref.current = store;

  const mios = usuario ? tickets.filter((t) => t.origen === "usuario" && t.autorId === usuario.id) : [];
  const activo = mios.find((t) => t.id === activoId) ?? (activoId === "nuevo" ? undefined : mios.find((t) => t.estado === "abierto"));
  const anteriores = mios.filter((t) => t.id !== activo?.id);

  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current) {
      montado.current = true;
      return;
    }
    fin.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activo?.mensajes.length, escribiendo]);

  if (!usuario) return null;

  function enviar() {
    const t = texto.trim();
    if (!t || !usuario) return;
    setTexto("");
    let id: string;
    if (activo && activo.estado === "abierto") {
      id = activo.id;
      responderTicket(id, { de: "cliente", texto: t });
    } else {
      const nuevo = nuevoTicket({ origen: "usuario", autorId: usuario.id, asunto: t.slice(0, 60), categoria: categoriaDe(t), texto: t });
      id = nuevo.id;
      setActivoId(id);
    }
    setEscribiendo(true);
    setTimeout(() => {
      const tk = ref.current.tickets.find((x) => x.id === id);
      ref.current.responderTicket(id, { de: "soporte", texto: RESPUESTA[tk?.categoria ?? categoriaDe(t)] });
      setEscribiendo(false);
    }, 2000);
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader titulo="Ayuda" atras="/app/perfil" />

      <div className="px-4 pt-4">
        <h2 className="font-display text-lg font-bold">Preguntas frecuentes</h2>
        <Accordion type="single" collapsible className="mt-2 overflow-hidden rounded-3xl bg-card px-4 ring-1 ring-border">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`f${i}`} className="border-border">
              <AccordionTrigger className="py-3.5 text-left text-[13.5px] font-semibold hover:no-underline">{f.p}</AccordionTrigger>
              <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground">{f.r}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="mt-7 flex items-center justify-between px-4">
        <div>
          <h2 className="font-display text-lg font-bold">Chat con soporte</h2>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[var(--ok)]" /> En línea · respondemos en minutos
          </p>
        </div>
        {activo && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActivoId("nuevo")}>
            <Plus className="h-3.5 w-3.5" /> Nueva consulta
          </Button>
        )}
      </div>

      <div className="mx-4 mt-3 flex min-h-[220px] flex-col gap-2 rounded-3xl bg-card p-3 ring-1 ring-border">
        <Burbuja de="soporte" texto={`¡Hola, ${usuario.nombre.split(" ")[0]}! ¿En qué te podemos ayudar?`} />
        {activo?.mensajes.map((m, i) => <Burbuja key={i} de={m.de} texto={m.texto} hora={m.fecha.slice(11, 16)} />)}
        {escribiendo && (
          <div className="flex items-end gap-2">
            <Isotipo size={24} />
            <span className="flex gap-1 rounded-2xl rounded-bl-md bg-[var(--surface)] px-3 py-3">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          </div>
        )}
        <div ref={fin} />
      </div>

      <form
        className="sticky bottom-0 z-10 mt-3 flex gap-2 bg-background/95 px-4 pb-4 pt-2 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <Input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribí tu consulta…"
          className="h-12 flex-1 rounded-2xl bg-card"
        />
        <Button type="submit" className="h-12 w-12 rounded-2xl" disabled={!texto.trim()} aria-label="Enviar">
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {anteriores.length > 0 && (
        <div className="px-4 pb-8">
          <h3 className="mb-2 text-sm font-bold">Consultas anteriores</h3>
          <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-border">
            {anteriores.map((t) => (
              <button key={t.id} onClick={() => setActivoId(t.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
                <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{t.asunto}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {fecha(t.fecha)} · {t.mensajes.length} mensajes
                  </span>
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", t.estado === "resuelto" ? "bg-green-50 text-[var(--ok)]" : "bg-amber-50 text-amber-700")}>
                  {t.estado === "resuelto" ? "Resuelta" : "Abierta"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Burbuja({ de, texto, hora }: { de: "cliente" | "soporte"; texto: string; hora?: string }) {
  const { usuario } = useYo();
  const yo = de === "cliente";
  return (
    <div className={cn("flex items-end gap-2", yo && "flex-row-reverse")}>
      {yo ? <Avatar nombre={usuario?.nombre ?? "Yo"} size={24} /> : <Isotipo size={24} />}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-[13px] leading-snug",
          yo ? "rounded-br-md bg-[var(--brand)] text-white" : "rounded-bl-md bg-[var(--surface)] text-foreground"
        )}
      >
        {texto}
        {hora && <span className={cn("ml-2 text-[10px]", yo ? "text-white/60" : "text-muted-foreground")}>{hora}</span>}
      </div>
    </div>
  );
}
