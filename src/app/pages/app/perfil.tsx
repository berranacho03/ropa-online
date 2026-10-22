import { useNavigate, Link } from "react-router";
import { Crown, Heart, LifeBuoy, LogOut, Ruler, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { Avatar, FilaMenu } from "../../components/app/comun";
import { NOMBRE_CALCE } from "../../components/app/medidas";
import { Maniqui, personaPara } from "../../components/figura/maniqui";
import { useStore, useYo } from "../../lib/store";
import { logout } from "../../lib/auth";
import { money } from "../../lib/format";
import { MARCA } from "../../lib/marca";

export function Perfil() {
  const navigate = useNavigate();
  const { usuario, premium, suscripcion } = useYo();
  const { pruebas, ventas, favoritos, supuestos } = useStore();
  if (!usuario?.medidas) return null;
  const m = usuario.medidas;
  const nPruebas = pruebas.filter((p) => p.usuarioId === usuario.id).length;
  const nCompras = ventas.filter((v) => v.usuarioId === usuario.id).length;
  const nFavs = (favoritos[usuario.id] ?? []).length;

  return (
    <div className="pb-8">
      <div className="relative overflow-hidden px-4 pb-5 pt-6" style={{ background: "linear-gradient(180deg, var(--brand-50) 0%, transparent 100%)" }}>
        <div className="flex items-center gap-4">
          <Avatar nombre={usuario.nombre} size={68} className="ring-4 ring-white" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-[24px] font-bold leading-tight tracking-tight">{usuario.nombre}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {usuario.email} · {usuario.edad} años · {usuario.ciudad}
            </p>
            {premium ? (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                <Crown className="h-3 w-3" /> Premium {suscripcion?.plan}
              </span>
            ) : (
              <span className="mt-1.5 inline-flex rounded-full bg-black/[0.06] px-2.5 py-0.5 text-[11px] font-bold text-[var(--ink-700)]">Plan gratuito</span>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-border rounded-2xl bg-card py-3 text-center ring-1 ring-border">
          <Link to="/app/pruebas">
            <p className="font-display text-xl font-bold">{nPruebas}</p>
            <p className="text-[11px] text-muted-foreground">pruebas</p>
          </Link>
          <Link to="/app/compras">
            <p className="font-display text-xl font-bold">{nCompras}</p>
            <p className="text-[11px] text-muted-foreground">compras</p>
          </Link>
          <Link to="/app/pruebas">
            <p className="font-display text-xl font-bold">{nFavs}</p>
            <p className="text-[11px] text-muted-foreground">favoritos</p>
          </Link>
        </div>
      </div>

      {/* Medidas */}
      <Link to="/app/medidas" className="mx-4 flex items-center gap-4 rounded-3xl bg-card p-4 ring-1 ring-border">
        <div className="h-[110px] w-[50px] shrink-0">
          <Maniqui persona={personaPara(m)} puestas={[]} sombraPiso={false} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="font-display text-base font-bold">Mis medidas</p>
            <span className="text-xs font-semibold text-[var(--brand)]">Editar</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1.5 text-[11px]">
            {[
              ["Altura", m.altura],
              ["Pecho", m.pecho],
              ["Cintura", m.cintura],
              ["Cadera", m.cadera],
              ["Peso", `${m.peso} kg`],
              ["Calce", NOMBRE_CALCE[m.preferencia]],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-muted-foreground">{k}</p>
                <p className="font-bold text-foreground tabular">{typeof v === "number" ? `${v} cm` : v}</p>
              </div>
            ))}
          </div>
          {!usuario.medidasMedidas && <p className="mt-2 text-[10.5px] text-amber-700">Estimadas · medite para más precisión</p>}
        </div>
      </Link>

      {!premium && (
        <Link
          to="/app/premium"
          className="mx-4 mt-3 flex items-center gap-3 rounded-2xl p-4 text-white"
          style={{ background: "linear-gradient(120deg, var(--ink), var(--brand-700))" }}
        >
          <Crown className="h-5 w-5 text-amber-300" />
          <span className="flex-1 text-sm">
            <b>Pasate a Premium</b>
            <span className="block text-xs text-white/70">Probador ilimitado desde {money(supuestos.precioMensual)}/mes</span>
          </span>
        </Link>
      )}

      <div className="mx-4 mt-4 divide-y divide-border overflow-hidden rounded-3xl bg-card ring-1 ring-border">
        <FilaMenu icono={Ruler} titulo="Mis medidas" detalle="Cambiá tus medidas y mirá cómo cambia tu talle" to="/app/medidas" />
        <FilaMenu icono={Sparkles} titulo="Mis pruebas" detalle="Historial del probador virtual" to="/app/pruebas" />
        <FilaMenu icono={Heart} titulo="Mi armario" detalle={`${nFavs} prendas guardadas`} to="/app/pruebas" />
        <FilaMenu icono={ShoppingBag} titulo="Mis compras" detalle="Contanos cómo te quedó cada talle" to="/app/compras" />
        <FilaMenu icono={Crown} titulo="Premium" detalle={premium ? "Tu plan y renovación" : "Planes mensual y anual"} to="/app/premium" />
      </div>

      <div className="mx-4 mt-4 divide-y divide-border overflow-hidden rounded-3xl bg-card ring-1 ring-border">
        <FilaMenu icono={ShieldCheck} titulo="Privacidad y datos" detalle="Tu foto, tus datos, tu cuenta" to="/app/privacidad" />
        <FilaMenu icono={LifeBuoy} titulo="Ayuda" detalle="Preguntas frecuentes y chat" to="/app/ayuda" />
        <FilaMenu
          icono={LogOut}
          titulo="Cerrar sesión"
          peligro
          onClick={() => {
            logout();
            navigate("/login");
          }}
        />
      </div>
      <p className="mt-6 text-center text-[11px] text-muted-foreground">{MARCA.nombre} · versión de demostración</p>
    </div>
  );
}
