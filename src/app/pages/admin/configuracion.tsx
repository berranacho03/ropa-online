import { useMemo, useState, type ReactNode } from "react";
import { Info, Palette, RotateCcw, Save, SlidersHorizontal, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Chip, PageBody, PageHeader, Panel } from "../../components/shell";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { fmt1 } from "../../components/admin2/graficos";
import { useStore } from "../../lib/store";
import { costoIaPorSuscriptor, finDeMes, subActivaEn } from "../../lib/metricas";
import { HOY, MESES, SUPUESTOS_DEFECTO, mesDe, type Supuestos } from "../../data/seed";
import { addDays } from "../../data/azar";
import { USUARIOS_DEMO } from "../../lib/auth";
import { MARCA } from "../../lib/marca";
import { money, moneyDec, num } from "../../lib/format";
import { cn } from "../../components/ui/utils";

type Borrador = Record<keyof Supuestos, string>;

const CAMPOS: { k: keyof Supuestos; etiqueta: string; ayuda: string; prefijo?: string; sufijo?: string; paso: string }[] = [
  { k: "precioMensual", etiqueta: "Premium mensual", ayuda: "Lo que paga por mes el plan mensual.", prefijo: "$", paso: "1" },
  { k: "precioAnual", etiqueta: "Premium anual", ayuda: "Pago único por 12 meses.", prefijo: "$", paso: "10" },
  { k: "comisionDefecto", etiqueta: "Comisión por defecto", ayuda: "Sobre cada venta derivada, para tiendas nuevas.", sufijo: "%", paso: "0.5" },
  { k: "costoIaUsd", etiqueta: "Costo de IA por prueba", ayuda: "Lo que cobra el proveedor por imagen generada.", prefijo: "USD", paso: "0.005" },
  { k: "dolar", etiqueta: "Cotización del dólar", ayuda: "Pesos uruguayos por dólar.", prefijo: "$", paso: "0.5" },
  { k: "pruebasCortesia", etiqueta: "Pruebas de cortesía", ayuda: "Pruebas gratis para usuarios sin Premium.", sufijo: "pruebas", paso: "1" },
];

const aBorrador = (s: Supuestos): Borrador =>
  Object.fromEntries(Object.entries(s).map(([k, v]) => [k, String(v)])) as Borrador;

const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];
const mesLargo = (ym: string) => `${MESES_LARGOS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

const leer = (b: Borrador, base: Supuestos): Supuestos => {
  const out = { ...base };
  for (const k of Object.keys(base) as (keyof Supuestos)[]) {
    const n = Number(String(b[k] ?? "").replace(",", "."));
    if (Number.isFinite(n) && n >= 0) out[k] = n;
  }
  return out;
};

export function AdminConfiguracion() {
  const { supuestos, setSupuestos, suscripciones, pruebas, ventas, usuarios, restablecer } = useStore();
  const [borrador, setBorrador] = useState<Borrador>(() => aBorrador(supuestos));
  const [confirmando, setConfirmando] = useState(false);
  const nuevo = useMemo(() => leer(borrador, supuestos), [borrador, supuestos]);
  const cambiado = (Object.keys(supuestos) as (keyof Supuestos)[]).some((k) => nuevo[k] !== supuestos[k]);

  // Bases que no dependen de los supuestos: se calculan una vez.
  const base = useMemo(() => {
    const activas = suscripciones.filter((s) => subActivaEn(s, HOY));
    const mensuales = activas.filter((s) => s.plan === "mensual").length;
    const anuales = activas.length - mensuales;
    // Pruebas por suscriptor por mes, a partir del costo observado.
    const desde = addDays(HOY, -90);
    const rec = pruebas.filter((p) => p.fecha >= desde);
    const usdMedio = rec.length ? rec.reduce((a, p) => a + p.costoUsd, 0) / rec.length : supuestos.costoIaUsd;
    const pruebasSubMes = costoIaPorSuscriptor(pruebas, suscripciones, supuestos) / (usdMedio * supuestos.dolar || 1);
    // GMV del último mes completo y altas de gratuitos por mes (para el costo de cortesía).
    const completos = MESES.filter((m) => finDeMes(m) < HOY);
    const ultimo = completos[completos.length - 1] ?? mesDe(HOY);
    const gmv = ventas
      .filter((v) => mesDe(v.fecha) === ultimo && v.estado === "confirmada")
      .reduce((a, v) => a + v.precio, 0);
    const altasMes = usuarios.filter((u) => !u.demo && mesDe(u.fechaAlta) === ultimo).length;
    return { mensuales, anuales, activas: activas.length, pruebasSubMes, gmv, altasMes, ultimo };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suscripciones, pruebas, ventas, usuarios]);

  const impacto = (s: Supuestos) => {
    const costoPrueba = s.costoIaUsd * s.dolar;
    const costoSub = base.pruebasSubMes * costoPrueba;
    const mrr = base.mensuales * s.precioMensual + base.anuales * (s.precioAnual / 12);
    const comisiones = base.gmv * (s.comisionDefecto / 100);
    const cortesia = base.altasMes * s.pruebasCortesia * costoPrueba;
    const costoIa = base.activas * costoSub + cortesia;
    return {
      costoPrueba,
      costoSub,
      margenSub: s.precioMensual - costoSub,
      margenPct: s.precioMensual ? ((s.precioMensual - costoSub) / s.precioMensual) * 100 : 0,
      mrr,
      comisiones,
      cortesia,
      ingreso: mrr + comisiones,
      neto: mrr + comisiones - costoIa,
      descuentoAnual: s.precioMensual ? (1 - s.precioAnual / (s.precioMensual * 12)) * 100 : 0,
    };
  };
  const antes = useMemo(() => impacto(supuestos), [supuestos, base]); // eslint-disable-line react-hooks/exhaustive-deps
  const despues = useMemo(() => impacto(nuevo), [nuevo, base]); // eslint-disable-line react-hooks/exhaustive-deps

  const guardar = () => {
    setSupuestos(nuevo);
    setBorrador(aBorrador(nuevo));
    toast.success("Supuestos guardados", { description: "Los indicadores del panel ya usan los valores nuevos." });
  };

  const hacerRestablecer = () => {
    restablecer();
    setBorrador(aBorrador(SUPUESTOS_DEFECTO));
    setConfirmando(false);
    toast.success("Demostración restablecida", {
      description: "Se borraron las compras, pruebas, tickets y cambios de la sesión. Los datos volvieron al estado inicial.",
    });
  };

  return (
    <>
      <PageHeader
        titulo="Configuración"
        bajada="Supuestos de negocio, identidad de marca y herramientas de la demostración."
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <Panel
            className="xl:col-span-3"
            titulo="Supuestos de negocio"
            bajada="Alimentan los ingresos, el MRR y el costo de IA de todo el panel."
            acciones={<SlidersHorizontal className="h-4 w-4 text-muted-foreground" />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CAMPOS.map((c) => {
                const distinto = nuevo[c.k] !== supuestos[c.k];
                return (
                  <div key={c.k}>
                    <Label htmlFor={c.k} className="text-sm">
                      {c.etiqueta}
                    </Label>
                    <div
                      className={cn(
                        "mt-1.5 flex items-center rounded-md border bg-card focus-within:ring-2 focus-within:ring-[var(--brand)]",
                        distinto ? "border-[var(--brand-300)]" : "border-input"
                      )}
                    >
                      {c.prefijo && <span className="pl-3 text-sm text-muted-foreground">{c.prefijo}</span>}
                      <Input
                        id={c.k}
                        type="number"
                        min={0}
                        step={c.paso}
                        value={borrador[c.k]}
                        onChange={(e) => setBorrador((b) => ({ ...b, [c.k]: e.target.value }))}
                        className="tabular border-0 shadow-none focus-visible:ring-0"
                      />
                      {c.sufijo && <span className="pr-3 text-sm text-muted-foreground">{c.sufijo}</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.ayuda}
                      {nuevo[c.k] !== SUPUESTOS_DEFECTO[c.k] && (
                        <span> Por defecto: {String(SUPUESTOS_DEFECTO[c.k]).replace(".", ",")}.</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Button onClick={guardar} disabled={!cambiado}>
                <Save className="h-4 w-4" /> Guardar supuestos
              </Button>
              <Button variant="ghost" onClick={() => setBorrador(aBorrador(supuestos))} disabled={!cambiado}>
                Descartar
              </Button>
              <Button variant="ghost" className="sm:ml-auto" onClick={() => setBorrador(aBorrador(SUPUESTOS_DEFECTO))}>
                Valores por defecto
              </Button>
            </div>
          </Panel>

          <Panel
            className="xl:col-span-2"
            titulo="Impacto en vivo"
            bajada={`Con ${num(base.activas)} suscriptores y las ventas de ${mesLargo(base.ultimo)}. ${cambiado ? "Comparado con lo guardado." : "Editá un supuesto para ver cómo cambia."}`}
          >
            <dl className="divide-y divide-border">
              <Fila etiqueta="Costo por prueba" antes={moneyDec(antes.costoPrueba)} despues={moneyDec(despues.costoPrueba)} cambia={cambiado} />
              <Fila
                etiqueta="Costo de IA por suscriptor"
                detalle={`${fmt1(base.pruebasSubMes)} pruebas por mes`}
                antes={money(antes.costoSub)}
                despues={money(despues.costoSub)}
                cambia={cambiado}
              />
              <Fila
                etiqueta="Margen por suscriptor"
                detalle={`${fmt1(despues.margenPct, 0)} % del precio mensual`}
                antes={money(antes.margenSub)}
                despues={money(despues.margenSub)}
                cambia={cambiado}
                destacado
                negativo={despues.margenSub < 0}
              />
              <Fila etiqueta="MRR" antes={money(antes.mrr)} despues={money(despues.mrr)} cambia={cambiado} />
              <Fila
                etiqueta="Comisiones por mes"
                detalle={`${fmt1(nuevo.comisionDefecto)} % sobre ${money(base.gmv)} vendidos`}
                antes={money(antes.comisiones)}
                despues={money(despues.comisiones)}
                cambia={cambiado}
              />
              <Fila
                etiqueta="Costo de la cortesía"
                detalle={`${num(base.altasMes)} altas por mes`}
                antes={money(antes.cortesia)}
                despues={money(despues.cortesia)}
                cambia={cambiado}
              />
              <Fila
                etiqueta="Ingreso mensual estimado"
                detalle={`neto de IA: ${money(despues.neto)}`}
                antes={money(antes.ingreso)}
                despues={money(despues.ingreso)}
                cambia={cambiado}
                destacado
              />
            </dl>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              El plan anual sale {fmt1(despues.descuentoAnual, 0)} % más barato que pagar 12 meses. La comisión por defecto se
              usa como estimación: cada tienda tiene la suya pactada.
            </p>
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel titulo="Identidad de marca" acciones={<Palette className="h-4 w-4 text-muted-foreground" />}>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand)] font-display text-lg font-bold text-white">
                {MARCA.nombre.slice(0, 1)}
              </div>
              <div>
                <p className="font-display text-2xl font-bold tracking-tight">{MARCA.nombre}</p>
                <p className="text-sm text-muted-foreground">{MARCA.bajada}</p>
              </div>
              <Chip className="ml-auto border-amber-200 bg-amber-50 text-amber-800">Provisorio</Chip>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Muestra nombre="Marca" variable="--brand" hex="#5b3df5" />
              <Muestra nombre="Marca oscura" variable="--brand-700" hex="#3a24ab" />
              <Muestra nombre="Marca suave" variable="--brand-100" hex="#e6e1fe" />
              <Muestra nombre="Tinta" variable="--ink" hex="#111014" />
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border p-3">
              <span className="h-8 w-8 shrink-0 rounded-md" style={{ background: "#0e9384" }} />
              <p className="text-xs text-muted-foreground">
                El portal de tiendas usa el mismo sistema con acento turquesa (<code>#0e9384</code>) para que se distinga del admin.
              </p>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Títulos</dt>
                <dd className="font-display text-lg font-semibold">Bricolage Grotesque</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Texto</dt>
                <dd className="text-lg">Sans del sistema</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              El nombre «{MARCA.nombre}» es provisorio: se cambia en <code>src/app/lib/marca.ts</code> y los colores en{" "}
              <code>src/styles/theme.css</code>.
            </p>
          </Panel>

          <Panel titulo="Cuentas de demostración" bodyClassName="p-0" acciones={<UserCircle2 className="h-4 w-4 text-muted-foreground" />}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Cuenta</TableHead>
                  <TableHead className="pr-4">Contraseña</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {USUARIOS_DEMO.map((u) => (
                  <TableRow key={u.email}>
                    <TableCell className="pl-4">
                      <p className="font-medium">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.nombre} · {u.rol === "admin" ? "panel de administración" : u.rol === "tienda" ? `portal de tienda (${u.tiendaId === "bruma" ? "Bruma, en alta" : "Tienda Norte"})` : `app, ${u.cargo.toLowerCase()}`}
                      </p>
                    </TableCell>
                    <TableCell className="pr-4">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{u.password}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        </div>

        <section className="rounded-xl border border-red-200 bg-card">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Restablecer la demostración</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Borra todo lo que se hizo en esta sesión (compras, pruebas, suscripciones, prendas cargadas, tickets, solicitudes,
                fotos y supuestos) y vuelve a los datos de ejemplo iniciales. Útil antes de presentar.
              </p>
            </div>
            <Button variant="outline" className="shrink-0 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setConfirmando(true)}>
              <RotateCcw className="h-4 w-4" /> Restablecer
            </Button>
          </div>
        </section>
      </PageBody>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restablecer la demostración?</AlertDialogTitle>
            <AlertDialogDescription>
              Se pierden todos los cambios de la sesión en los tres portales. Los datos de ejemplo vuelven al estado inicial. No
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={hacerRestablecer}>
              Restablecer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Fila({
  etiqueta,
  detalle,
  antes,
  despues,
  cambia,
  destacado,
  negativo,
}: {
  etiqueta: string;
  detalle?: string;
  antes: string;
  despues: string;
  cambia: boolean;
  destacado?: boolean;
  negativo?: boolean;
}): ReactNode {
  const distinto = cambia && antes !== despues;
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <dt className={cn("text-sm", destacado ? "font-medium text-foreground" : "text-foreground")}>{etiqueta}</dt>
        {detalle && <dd className="text-xs text-muted-foreground">{detalle}</dd>}
      </div>
      <dd className="shrink-0 text-right">
        {distinto && <span className="tabular mr-2 text-xs text-muted-foreground line-through">{antes}</span>}
        <span
          className={cn(
            "tabular",
            destacado ? "text-base font-semibold" : "text-sm font-medium",
            negativo && "text-red-700",
            distinto && !negativo && "text-[var(--brand-700)]"
          )}
        >
          {despues}
        </span>
      </dd>
    </div>
  );
}

function Muestra({ nombre, variable, hex }: { nombre: string; variable: string; hex: string }) {
  return (
    <div>
      <div className="h-12 rounded-lg border border-border" style={{ background: `var(${variable})` }} />
      <p className="mt-1.5 text-xs font-medium">{nombre}</p>
      <p className="text-[11px] text-muted-foreground">
        <code>{variable}</code> · {hex}
      </p>
    </div>
  );
}
