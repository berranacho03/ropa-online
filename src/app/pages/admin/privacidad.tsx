import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Camera, CheckCircle2, FileCheck2, ShieldCheck, Timer } from "lucide-react";
import { toast } from "sonner";
import { Barra, Kpi, PageBody, PageHeader, Panel, Vacio } from "../../components/shell";
import { Button } from "../../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { EstadoMeta, fmt1 } from "../../components/admin2/graficos";
import { useStore } from "../../lib/store";
import { HOY, type SolicitudPrivacidad } from "../../data/seed";
import { addDays, diasEntre } from "../../data/azar";
import { fecha, num } from "../../lib/format";
import { cn } from "../../components/ui/utils";

const PLAZO = 10;

const TIPOS: Record<SolicitudPrivacidad["tipo"], string> = {
  "borrar-foto": "Borrar foto",
  "borrar-cuenta": "Borrar cuenta y datos",
  exportar: "Exportar mis datos",
};

export function AdminPrivacidad() {
  const { usuarios, privacidad, fotos, cumplirSolicitud } = useStore();
  const [filtro, setFiltro] = useState<"pendientes" | "todas">("todas");

  const d = useMemo(() => {
    const reales = usuarios.filter((u) => !u.demo);
    const consentimiento = reales.filter((u) => u.consentimiento).length;
    const conFoto = reales.filter((u) => u.conFoto).length;
    const conMedidas = reales.filter((u) => u.medidas).length;
    const cumplidas = privacidad.filter((p) => p.estado === "cumplida" && p.cumplida);
    const enPlazo = cumplidas.filter((p) => diasEntre(p.fecha, p.cumplida!) <= PLAZO).length;
    const demora = cumplidas.length ? cumplidas.reduce((a, p) => a + diasEntre(p.fecha, p.cumplida!), 0) / cumplidas.length : 0;
    return {
      total: reales.length,
      consentimiento,
      conFoto,
      conMedidas,
      pendientes: privacidad.filter((p) => p.estado === "pendiente").length,
      cumplidas: cumplidas.length,
      enPlazo,
      demora,
    };
  }, [usuarios, privacidad]);

  const nombre = useMemo(() => new Map(usuarios.map((u) => [u.id, u.nombre])), [usuarios]);
  const filas = useMemo(
    () =>
      privacidad
        .filter((p) => filtro === "todas" || p.estado === "pendiente")
        .sort((a, b) => Number(b.estado === "pendiente") - Number(a.estado === "pendiente") || b.fecha.localeCompare(a.fecha)),
    [privacidad, filtro]
  );

  const fotosSesion = Object.keys(fotos).length;

  const cumplir = (s: SolicitudPrivacidad) => {
    cumplirSolicitud(s.id);
    toast.success("Solicitud cumplida", {
      description: `${TIPOS[s.tipo]} · ${nombre.get(s.usuarioId) ?? s.usuarioId}. Se le avisa por correo.`,
    });
  };

  return (
    <>
      <PageHeader
        titulo="Privacidad y datos"
        bajada="Qué datos personales guardamos, con qué consentimiento y cómo respondemos a los pedidos de los usuarios. Es la hipótesis de factibilidad: guardar los datos de forma segura y cumplir la ley."
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            etiqueta="Con consentimiento"
            valor={`${fmt1((d.consentimiento / Math.max(1, d.total)) * 100)} %`}
            detalle={`${num(d.consentimiento)} de ${num(d.total)} usuarios`}
            icono={ShieldCheck}
            acento="verde"
          />
          <Kpi
            etiqueta="Fotos almacenadas"
            valor={num(d.conFoto + fotosSesion)}
            detalle={`${fmt1((d.conFoto / Math.max(1, d.total)) * 100)} % de los usuarios`}
            icono={Camera}
          />
          <Kpi
            etiqueta="Solicitudes pendientes"
            valor={String(d.pendientes)}
            detalle={`plazo legal: ${PLAZO} días`}
            icono={Timer}
            acento={d.pendientes ? "ambar" : "neutro"}
          />
          <Kpi
            etiqueta="Cumplidas en plazo"
            valor={`${d.enPlazo} de ${d.cumplidas}`}
            detalle={`demora media ${fmt1(d.demora)} días`}
            icono={FileCheck2}
            acento={d.enPlazo === d.cumplidas ? "verde" : "rojo"}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
          <Panel
            className="2xl:col-span-2"
            titulo="Solicitudes de los usuarios"
            bajada={`Borrado de foto o de cuenta y exportación de datos. Hay que cumplirlas dentro de ${PLAZO} días corridos.`}
            bodyClassName="p-0"
            acciones={
              <Tabs value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
                <TabsList>
                  <TabsTrigger value="todas">Todas</TabsTrigger>
                  <TabsTrigger value="pendientes">Pendientes ({d.pendientes})</TabsTrigger>
                </TabsList>
              </Tabs>
            }
          >
            {filas.length === 0 ? (
              <Vacio icono={CheckCircle2} titulo="No hay solicitudes pendientes" detalle="Todas las solicitudes se cumplieron." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Tipo</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Pedida</TableHead>
                    <TableHead>Plazo</TableHead>
                    <TableHead className="pr-4 text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((s) => {
                    const transcurridos = diasEntre(s.fecha, HOY);
                    const restan = PLAZO - transcurridos;
                    const tardo = s.cumplida ? diasEntre(s.fecha, s.cumplida) : null;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="pl-4 font-medium">{TIPOS[s.tipo]}</TableCell>
                        <TableCell>
                          <Link to={`/admin/usuarios/${s.usuarioId}`} className="hover:underline">
                            {nombre.get(s.usuarioId) ?? s.usuarioId}
                          </Link>
                        </TableCell>
                        <TableCell className="tabular text-muted-foreground">{fecha(s.fecha)}</TableCell>
                        <TableCell className="min-w-[9rem]">
                          {s.estado === "pendiente" ? (
                            <div>
                              <p className={cn("text-xs font-medium", restan <= 2 ? "text-red-700" : restan <= 5 ? "text-amber-700" : "text-foreground")}>
                                {restan > 0 ? `Quedan ${restan} día${restan === 1 ? "" : "s"}` : restan === 0 ? "Vence hoy" : `Vencida hace ${-restan} días`}
                              </p>
                              <Barra valor={transcurridos} max={PLAZO} alertaAlLlenar className="mt-1" />
                              <p className="mt-0.5 text-[11px] text-muted-foreground">vence {fecha(addDays(s.fecha, PLAZO))}</p>
                            </div>
                          ) : (
                            <EstadoMeta cumple={(tardo ?? 0) <= PLAZO}>
                              {tardo === 0 ? "En el día" : `En ${tardo} día${tardo === 1 ? "" : "s"}`}
                            </EstadoMeta>
                          )}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          {s.estado === "pendiente" ? (
                            <Button size="sm" onClick={() => cumplir(s)}>
                              Marcar cumplida
                            </Button>
                          ) : (
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              Cumplida{s.cumplida ? ` ${fecha(s.cumplida)}` : ""}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-6 items-start md:grid-cols-2 2xl:grid-cols-1 2xl:content-start">
            <Panel titulo="Datos que guardamos">
              <ul className="space-y-3 text-sm">
                <DatoGuardado titulo="Medidas del cuerpo" valor={d.conMedidas} total={d.total} />
                <DatoGuardado titulo="Foto para el probador" valor={d.conFoto} total={d.total} />
                <DatoGuardado titulo="Consentimiento informado" valor={d.consentimiento} total={d.total} />
              </ul>
              {fotosSesion > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  + {fotosSesion} foto{fotosSesion === 1 ? "" : "s"} subida{fotosSesion === 1 ? "" : "s"} en esta demostración (sólo en este navegador).
                </p>
              )}
            </Panel>

            <Panel titulo="Política de datos (resumen)">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Qué guardamos.</span> Nombre, correo, edad, medidas del cuerpo,
                  preferencias de calce, historial de compras derivadas y, si el usuario la sube, una foto para el probador.
                </p>
                <p>
                  <span className="font-medium text-foreground">Dónde.</span> En servidores con cifrado en reposo y en tránsito. Las
                  fotos se guardan aparte y sólo las procesa el proveedor de prueba virtual para generar la imagen; no se usan para
                  entrenar modelos ni se comparten con las tiendas.
                </p>
                <p>
                  <span className="font-medium text-foreground">Por cuánto tiempo.</span> La foto, hasta que el usuario la borre o
                  12 meses sin uso. Las medidas y el historial, mientras la cuenta esté activa; al borrarla se eliminan en {PLAZO} días.
                  Las tiendas sólo reciben datos agregados.
                </p>
                <p>
                  <span className="font-medium text-foreground">Marco legal.</span> Ley N.º 18.331 de Protección de Datos Personales
                  (Uruguay): consentimiento previo e informado, derechos de acceso, rectificación y supresión, y registro de la base
                  ante la URCDP.
                </p>
              </div>
            </Panel>
          </div>
        </div>
      </PageBody>
    </>
  );
}

function DatoGuardado({ titulo, valor, total }: { titulo: string; valor: number; total: number }) {
  const pct = total ? (valor / total) * 100 : 0;
  return (
    <li>
      <div className="mb-1 flex justify-between gap-2">
        <span>{titulo}</span>
        <span className="tabular text-muted-foreground">
          {num(valor)} · {fmt1(pct, 0)} %
        </span>
      </div>
      <Barra valor={valor} max={total} />
    </li>
  );
}
