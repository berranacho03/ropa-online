import { useMemo, useState } from "react";
import { Camera, Check, MoreHorizontal, Search, ShoppingBag, Target, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Chip, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import { ConTienda, useDatosTienda } from "../../components/tienda/comun";
import { Buscador, CampoFiltro, DatoTarjeta, DatosTarjeta, FiltrosMovil, LISTA_TARJETAS } from "../../components/tienda/movil";
import type { Prenda } from "../../data/prendas";
import { useStore } from "../../lib/store";
import { tasaDevTalle } from "../../lib/metricas";
import { mesDe, type Venta } from "../../data/seed";
import { nombreCompleto } from "../../data/prendas";
import type { Tienda } from "../../data/tiendas";
import { fecha, mesCorto, money, num, pct } from "../../lib/format";
import { cn } from "../../components/ui/utils";

export function TiendaVentas() {
  return <ConTienda titulo="Ventas y devoluciones">{(t) => <Ventas tienda={t} />}</ConTienda>;
}

type FiltroEstado = "todas" | "confirmada" | "talle" | "otro";
type FiltroRec = "todas" | "siguio" | "no";

function Ventas({ tienda }: { tienda: Tienda }) {
  const { marcarDevolucion } = useStore();
  const { prendas, ventas } = useDatosTienda(tienda.id);
  const porId = useMemo(() => new Map(prendas.map((p) => [p.id, p])), [prendas]);

  const [q, setQ] = useState("");
  const [mes, setMes] = useState("todos");
  const [estado, setEstado] = useState<FiltroEstado>("todas");
  const [rec, setRec] = useState<FiltroRec>("todas");
  const [ver, setVer] = useState(25);

  const meses = useMemo(() => [...new Set(ventas.map((v) => mesDe(v.fecha)))].sort().reverse(), [ventas]);

  const filtradas = ventas.filter((v) => {
    const p = porId.get(v.prendaId);
    if (q && !(p ? nombreCompleto(p) : v.prendaId).toLowerCase().includes(q.trim().toLowerCase())) return false;
    if (mes !== "todos" && mesDe(v.fecha) !== mes) return false;
    if (estado === "confirmada" && v.estado !== "confirmada") return false;
    if ((estado === "talle" || estado === "otro") && v.motivoDevolucion !== estado) return false;
    if (rec === "siguio" && !v.siguio) return false;
    if (rec === "no" && v.siguio) return false;
    return true;
  });

  const siguieron = ventas.filter((v) => v.siguio);
  const noSiguieron = ventas.filter((v) => !v.siguio);
  const conPrueba = ventas.filter((v) => v.conPrueba);

  const marcar = (v: Venta, motivo: "talle" | "otro" | null) => {
    marcarDevolucion(v.id, motivo);
    const p = porId.get(v.prendaId);
    if (motivo)
      toast.success(`Devolución registrada${motivo === "talle" ? " por talle" : ""}`, {
        description: `${p ? nombreCompleto(p) : ""} talle ${v.talle}. No comisiona y ${motivo === "talle" ? "ajusta la precisión del recomendador" : "no afecta la precisión del talle"}.`,
      });
    else toast(`Devolución deshecha`, { description: "La venta vuelve a estar confirmada." });
  };

  const activos = Number(mes !== "todos") + Number(estado !== "todas") + Number(rec !== "todas");

  const selMes = (cls: string) => (
    <Select value={mes} onValueChange={setMes}>
      <SelectTrigger className={cls}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos">Todos los meses</SelectItem>
        {meses.map((m) => (
          <SelectItem key={m} value={m}>
            {mesCorto(m)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  const selEstado = (cls: string) => (
    <Select value={estado} onValueChange={(v) => setEstado(v as FiltroEstado)}>
      <SelectTrigger className={cls}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">Todos los estados</SelectItem>
        <SelectItem value="confirmada">Confirmadas</SelectItem>
        <SelectItem value="talle">Devueltas por talle</SelectItem>
        <SelectItem value="otro">Devueltas por otro motivo</SelectItem>
      </SelectContent>
    </Select>
  );
  const selRec = (cls: string) => (
    <Select value={rec} onValueChange={(v) => setRec(v as FiltroRec)}>
      <SelectTrigger className={cls}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">Con o sin recomendación</SelectItem>
        <SelectItem value="siguio">Siguieron la recomendación</SelectItem>
        <SelectItem value="no">Eligieron otro talle</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <>
      <PageHeader
        titulo="Ventas y devoluciones"
        bajada="Las ventas que te llegaron desde la app. Marcá las devoluciones y su motivo: así sabemos si el talle que recomendamos fue el correcto, y la venta devuelta no te comisiona."
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <Kpi etiqueta="Ventas desde la app" valor={num(ventas.length)} detalle={`desde ${mesCorto(mesDe(tienda.fechaAlta))}`} icono={ShoppingBag} acento="verde" />
          <Kpi
            etiqueta="Siguieron la recomendación"
            valor={ventas.length ? pct((siguieron.length / ventas.length) * 100) : "—"}
            detalle="compraron el talle sugerido"
            icono={Target}
          />
          <Kpi
            etiqueta="Con prueba virtual"
            valor={ventas.length ? pct((conPrueba.length / ventas.length) * 100) : "—"}
            detalle="se la probaron antes"
            icono={Camera}
          />
          <Kpi
            etiqueta="Devolución por talle"
            valor={ventas.length ? pct(tasaDevTalle(ventas), 1) : "—"}
            detalle={
              ventas.length
                ? `${pct(tasaDevTalle(siguieron))} si siguieron · ${pct(tasaDevTalle(noSiguieron))} si no`
                : `antes ${pct(tienda.devTalleAntes)}`
            }
            icono={Undo2}
          />
        </div>

        <Panel
          bodyClassName="p-0"
          titulo={`${num(filtradas.length)} ventas`}
          acciones={
            <div className="hidden flex-wrap items-center gap-2 md:flex">
              <Buscador valor={q} onCambio={setQ} className="w-44" />
              {selMes("w-40")}
              {selEstado("w-44")}
              {selRec("w-48")}
            </div>
          }
        >
          {ventas.length > 0 && (
            <FiltrosMovil
              busqueda={<Buscador valor={q} onCambio={setQ} />}
              activos={activos}
              onLimpiar={() => {
                setMes("todos");
                setEstado("todas");
                setRec("todas");
              }}
            >
              <CampoFiltro etiqueta="Mes">{selMes("h-10 w-full")}</CampoFiltro>
              <CampoFiltro etiqueta="Estado">{selEstado("h-10 w-full")}</CampoFiltro>
              <CampoFiltro etiqueta="Recomendación">{selRec("h-10 w-full")}</CampoFiltro>
            </FiltrosMovil>
          )}
          {ventas.length === 0 ? (
            <Vacio icono={ShoppingBag} titulo="Todavía no hay ventas" detalle="Cuando alguien compre una de tus prendas desde la app, aparece acá." />
          ) : filtradas.length === 0 ? (
            <Vacio icono={Search} titulo="Ninguna venta con esos filtros" />
          ) : (
            <>
              <ul className={LISTA_TARJETAS}>
                {filtradas.slice(0, ver).map((v) => (
                  <TarjetaVenta key={v.id} v={v} p={porId.get(v.prendaId)} marcar={marcar} />
                ))}
              </ul>
              <div className="hidden xl:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Fecha</TableHead>
                    <TableHead>Prenda</TableHead>
                    <TableHead>Talle</TableHead>
                    <TableHead>Recomendado</TableHead>
                    <TableHead>Prueba virtual</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-12 pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.slice(0, ver).map((v) => {
                    const p = porId.get(v.prendaId);
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="pl-4 whitespace-nowrap text-muted-foreground">{fecha(v.fecha)}</TableCell>
                        <TableCell className="min-w-[11rem] whitespace-normal">
                          <div className="flex items-center gap-2.5">
                            {p && <PrendaIlustracion prenda={p} className="h-9 w-7 shrink-0 rounded" />}
                            <span className="font-medium">{p ? nombreCompleto(p) : v.prendaId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{v.talle}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5">
                            {v.talleRecomendado}
                            {v.siguio ? (
                              <span className="inline-flex items-center gap-0.5 text-xs text-[var(--brand-700)]">
                                <Check className="h-3 w-3" /> lo siguió
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                                <X className="h-3 w-3" /> eligió otro
                              </span>
                            )}
                          </span>
                          <span className="block text-xs text-muted-foreground">confianza {v.confianza} %</span>
                        </TableCell>
                        <TableCell>
                          {v.conPrueba ? (
                            <span className="inline-flex items-center gap-1 text-sm">
                              <Camera className="h-3.5 w-3.5 text-[var(--brand-700)]" /> Sí
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell className="tabular text-right">{money(v.precio)}</TableCell>
                        <TableCell>
                          <EstadoVenta v={v} />
                        </TableCell>
                        <TableCell className="pr-4">
                          <MenuDevolucion v={v} marcar={marcar} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
              {filtradas.length > ver && (
                <div className="border-t border-border p-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setVer(ver + 50)}>
                    Mostrar más ({num(filtradas.length - ver)} restantes)
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


type Marcar = (v: Venta, motivo: "talle" | "otro" | null) => void;

function EstadoVenta({ v }: { v: Venta }) {
  return v.estado === "devuelta" ? (
    <Chip
      className={cn(
        v.motivoDevolucion === "talle" ? "border-orange-200 bg-orange-50 text-orange-800" : "border-slate-200 bg-slate-100 text-slate-700"
      )}
    >
      <Undo2 className="h-3 w-3" />
      Devuelta · {v.motivoDevolucion === "talle" ? "talle" : "otro motivo"}
    </Chip>
  ) : (
    <Chip className="border-border text-muted-foreground">Confirmada</Chip>
  );
}

function MenuDevolucion({ v, marcar, movil }: { v: Venta; marcar: Marcar; movil?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {movil ? (
          <Button variant="outline" size="sm" className="h-8 shrink-0">
            <Undo2 className="mr-1.5 h-3.5 w-3.5" /> {v.estado === "devuelta" ? "Cambiar" : "Devolución"}
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Marcar devolución</DropdownMenuLabel>
        <DropdownMenuItem disabled={v.motivoDevolucion === "talle"} onSelect={() => marcar(v, "talle")}>
          Devuelta por talle
        </DropdownMenuItem>
        <DropdownMenuItem disabled={v.motivoDevolucion === "otro"} onSelect={() => marcar(v, "otro")}>
          Devuelta por otro motivo
        </DropdownMenuItem>
        {v.estado === "devuelta" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => marcar(v, null)}>Deshacer devolución</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Una venta en el celular: prenda, precio y estado arriba; el resto en una grilla. */
function TarjetaVenta({ v, p, marcar }: { v: Venta; p?: Prenda; marcar: Marcar }) {
  return (
    <li className="px-4 py-3.5">
      <div className="flex gap-3">
        {p && <PrendaIlustracion prenda={p} className="h-14 w-11 shrink-0 rounded-md" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium leading-snug">{p ? nombreCompleto(p) : v.prendaId}</p>
            <p className={cn("tabular shrink-0 text-sm font-semibold", v.estado === "devuelta" && "text-muted-foreground line-through")}>
              {money(v.precio)}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fecha(v.fecha)} · talle <span className="font-semibold text-foreground">{v.talle}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <EstadoVenta v={v} />
            <MenuDevolucion v={v} marcar={marcar} movil />
          </div>
        </div>
      </div>
      <DatosTarjeta className="mt-2.5 rounded-lg bg-muted/50 px-3 py-2">
        <DatoTarjeta etiqueta="Recomendado">
          <span className="font-semibold">{v.talleRecomendado}</span>{" "}
          {v.siguio ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-[var(--brand-700)]">
              <Check className="h-3 w-3" /> lo siguió
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">eligió otro</span>
          )}
          <span className="text-xs text-muted-foreground"> · {v.confianza} %</span>
        </DatoTarjeta>
        <DatoTarjeta etiqueta="Prueba virtual">
          {v.conPrueba ? (
            <span className="inline-flex items-center gap-1">
              <Camera className="h-3.5 w-3.5 text-[var(--brand-700)]" /> Sí
            </span>
          ) : (
            <span className="text-muted-foreground">No</span>
          )}
        </DatoTarjeta>
      </DatosTarjeta>
    </li>
  );
}
