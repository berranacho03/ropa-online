import { useState } from "react";
import { toast } from "sonner";
import { Camera, Check, Download, FileClock, ImageOff, Ruler, ShoppingBag, Sparkles, Trash2, UserX } from "lucide-react";
import { AppHeader } from "../../components/app/comun";
import { Button } from "../../components/ui/button";
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
import { useStore, useYo } from "../../lib/store";
import { fecha } from "../../lib/format";
import { MARCA } from "../../lib/marca";

const TIPO = {
  "borrar-foto": "Borrar foto",
  "borrar-cuenta": "Eliminar cuenta",
  exportar: "Descargar mis datos",
};

export function Privacidad() {
  const { fotos, ventas, pruebas, favoritos, suscripciones, privacidad, setFoto, nuevaSolicitud, actualizarPerfil } = useStore();
  const { usuario } = useYo();
  const [borrarFoto, setBorrarFoto] = useState(false);
  const [borrarCuenta, setBorrarCuenta] = useState(false);
  if (!usuario) return null;

  const foto = fotos[usuario.id];
  const misVentas = ventas.filter((v) => v.usuarioId === usuario.id);
  const misPruebas = pruebas.filter((p) => p.usuarioId === usuario.id);
  const solicitudes = privacidad.filter((s) => s.usuarioId === usuario.id);
  const bajaPendiente = solicitudes.some((s) => s.tipo === "borrar-cuenta" && s.estado === "pendiente");

  function descargar() {
    if (!usuario) return;
    const datos = {
      generado: new Date().toISOString(),
      perfil: { ...usuario, foto: foto ? "(guardada sólo en este dispositivo, no se incluye)" : null },
      suscripciones: suscripciones.filter((s) => s.usuarioId === usuario.id),
      compras: misVentas,
      pruebas: misPruebas,
      favoritos: favoritos[usuario.id] ?? [],
    };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mis-datos-${MARCA.nombre.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    nuevaSolicitud(usuario.id, "exportar");
    toast.success("Descargamos tus datos", { description: "Un archivo JSON con todo lo que guardamos de vos." });
  }

  const datos = [
    { icono: Ruler, titulo: "Medidas y calce", detalle: usuario.medidas ? `${usuario.medidasMedidas ? "Tomadas con cinta" : "Estimadas"} · para calcular tu talle` : "Sin cargar" },
    { icono: Camera, titulo: "Foto para el probador", detalle: foto ? "Guardada sólo en este dispositivo" : "No tenés foto guardada" },
    { icono: ShoppingBag, titulo: "Compras", detalle: `${misVentas.length} compras derivadas a tiendas` },
    { icono: Sparkles, titulo: "Pruebas virtuales", detalle: `${misPruebas.length} pruebas en el historial` },
  ];

  return (
    <div className="pb-8">
      <AppHeader titulo="Privacidad" atras="/app/perfil" bajada="Qué guardamos de vos y cómo borrarlo." />

      <div className="mx-4 mt-4 rounded-3xl bg-[var(--brand-50)] p-4 text-[13px] text-[var(--brand-700)]">
        <p className="font-semibold">Lo básico</p>
        <ul className="mt-2 space-y-1.5">
          {["Tus medidas se usan sólo para recomendarte talles.", "Las tiendas nunca ven tus medidas ni tu foto.", "Tu foto no sale de tu teléfono."].map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t}
            </li>
          ))}
        </ul>
        {usuario.consentimiento && (
          <p className="mt-3 text-[11px] opacity-75">Diste tu consentimiento al registrarte, el {fecha(usuario.fechaAlta)}.</p>
        )}
      </div>

      <h2 className="mx-4 mt-6 font-display text-lg font-bold">Qué datos guardamos</h2>
      <div className="mx-4 mt-2 divide-y divide-border overflow-hidden rounded-3xl bg-card ring-1 ring-border">
        {datos.map((d) => (
          <div key={d.titulo} className="flex items-center gap-3 px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-[var(--ink-700)]">
              <d.icono className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{d.titulo}</span>
              <span className="block text-xs text-muted-foreground">{d.detalle}</span>
            </span>
          </div>
        ))}
      </div>

      <h2 className="mx-4 mt-6 font-display text-lg font-bold">Tu foto</h2>
      <div className="mx-4 mt-2 flex gap-3 rounded-3xl bg-card p-3 ring-1 ring-border">
        {foto ? (
          <>
            <img src={foto} alt="Tu foto guardada" className="h-32 w-24 shrink-0 rounded-2xl object-cover" />
            <div className="flex flex-col">
              <p className="text-sm font-semibold">Foto guardada</p>
              <p className="text-xs text-muted-foreground">La usás en el probador. Si la borrás, se elimina de este dispositivo al instante.</p>
              <Button variant="outline" size="sm" className="mt-auto w-fit rounded-xl text-[var(--danger)]" onClick={() => setBorrarFoto(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Borrar foto
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 p-1">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface)] text-muted-foreground">
              <ImageOff className="h-5 w-5" />
            </span>
            <p className="text-sm text-muted-foreground">No tenés ninguna foto guardada. {usuario.conFoto ? "" : "Podés subir una desde el probador."}</p>
          </div>
        )}
      </div>

      <h2 className="mx-4 mt-6 font-display text-lg font-bold">Tus derechos</h2>
      <div className="mx-4 mt-2 space-y-2">
        <button type="button" onClick={descargar} className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left ring-1 ring-border">
          <Download className="h-5 w-5 text-[var(--brand)]" />
          <span className="flex-1">
            <span className="block text-sm font-semibold">Descargar mis datos</span>
            <span className="block text-xs text-muted-foreground">Un archivo con todo lo que sabemos de vos</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setBorrarCuenta(true)}
          disabled={bajaPendiente}
          className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left ring-1 ring-border disabled:opacity-60"
        >
          <UserX className="h-5 w-5 text-[var(--danger)]" />
          <span className="flex-1">
            <span className="block text-sm font-semibold text-[var(--danger)]">Eliminar mi cuenta</span>
            <span className="block text-xs text-muted-foreground">
              {bajaPendiente ? "Ya pediste la baja: está en proceso" : "Borramos tus datos en un plazo de 30 días"}
            </span>
          </span>
        </button>
      </div>

      {solicitudes.length > 0 && (
        <>
          <h2 className="mx-4 mt-6 font-display text-lg font-bold">Tus solicitudes</h2>
          <div className="mx-4 mt-2 divide-y divide-border overflow-hidden rounded-3xl bg-card ring-1 ring-border">
            {solicitudes.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <FileClock className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">
                  {TIPO[s.tipo]}
                  <span className="block text-xs text-muted-foreground">{fecha(s.fecha)}</span>
                </span>
                <span
                  className={
                    s.estado === "cumplida"
                      ? "rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-[var(--ok)]"
                      : "rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                  }
                >
                  {s.estado === "cumplida" ? "Cumplida" : "En proceso"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <AlertDialog open={borrarFoto} onOpenChange={setBorrarFoto}>
        <AlertDialogContent className="max-w-[340px] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar tu foto?</AlertDialogTitle>
            <AlertDialogDescription>Se elimina al instante. Para usar el probador con foto vas a tener que subir otra.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-[var(--danger)] hover:bg-[var(--danger)]/90"
              onClick={() => {
                setFoto(usuario.id, null);
                nuevaSolicitud(usuario.id, "borrar-foto");
                actualizarPerfil(usuario.id, { conFoto: false });
                toast.success("Borramos tu foto");
              }}
            >
              Borrar foto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={borrarCuenta} onOpenChange={setBorrarCuenta}>
        <AlertDialogContent className="max-w-[340px] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Vamos a borrar tus medidas, tu foto, tus pruebas y tus favoritos en un plazo de 30 días. Las compras quedan en las tiendas por motivos legales. Si
              tenés Premium, se cancela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Me arrepentí</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-[var(--danger)] hover:bg-[var(--danger)]/90"
              onClick={() => {
                nuevaSolicitud(usuario.id, "borrar-cuenta");
                toast("Recibimos tu pedido de baja", { description: "Se completa en 30 días. En esta demo no se borra nada." });
              }}
            >
              Eliminar cuenta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
