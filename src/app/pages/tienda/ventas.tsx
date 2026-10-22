import { useMemo, useState } from "react";
import { Camera, Check, MoreHorizontal, Search, ShoppingBag, Target, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar prenda" className="h-9 w-44 pl-8" />
              </div>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger className="h-9 w-36">
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
              <Select value={estado} onValueChange={(v) => setEstado(v as FiltroEstado)}>
                <SelectTrigger className="h-9 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos los estados</SelectItem>
                  <SelectItem value="confirmada">Confirmadas</SelectItem>
                  <SelectItem value="talle">Devueltas por talle</SelectItem>
                  <SelectItem value="otro">Devueltas por otro motivo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rec} onValueChange={(v) => setRec(v as FiltroRec)}>
                <SelectTrigger className="h-9 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Con o sin recomendación</SelectItem>
                  <SelectItem value="siguio">Siguieron la recomendación</SelectItem>
                  <SelectItem value="no">Eligieron otro talle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          {ventas.length === 0 ? (
            <Vacio icono={ShoppingBag} titulo="Todavía no hay ventas" detalle="Cuando alguien compre una de tus prendas desde la app, aparece acá." />
          ) : filtradas.length === 0 ? (
            <Vacio icono={Search} titulo="Ninguna venta con esos filtros" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Fecha</TableHead>
                    <TableHead>Prenda</TableHead>
                    <TableHead>Talle comprado</TableHead>
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
                        <TableCell>
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
                            <span className="text-xs text-muted-foreground">· {v.confianza} %</span>
                          </span>
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
                          {v.estado === "devuelta" ? (
                            <Chip
                              className={cn(
                                v.motivoDevolucion === "talle"
                                  ? "border-orange-200 bg-orange-50 text-orange-800"
                                  : "border-slate-200 bg-slate-100 text-slate-700"
                              )}
                            >
                              <Undo2 className="h-3 w-3" />
                              Devuelta · {v.motivoDevolucion === "talle" ? "talle" : "otro motivo"}
                            </Chip>
                          ) : (
                            <Chip className="border-border text-muted-foreground">Confirmada</Chip>
                          )}
                        </TableCell>
                        <TableCell className="pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
