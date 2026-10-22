import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertCircle, Crown, Eye, EyeOff, ShieldCheck, Sparkles, Store, User } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Imagotipo } from "../components/logo";
import { INICIO_DE, USUARIOS_DEMO, login } from "../lib/auth";
import { MARCA } from "../lib/marca";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const u = login(email, password);
    if (!u) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    navigate(INICIO_DE[u.rol]);
  };

  const usarDemo = (emailDemo: string) => {
    const u = USUARIOS_DEMO.find((x) => x.email === emailDemo)!;
    setEmail(u.email);
    setPassword(u.password);
    setError(null);
  };

  const accesos = [
    {
      email: "sofi@ropa.app",
      icono: Crown,
      titulo: "Usuaria Premium",
      detalle: "Ve su talle en cada prenda y se las prueba virtualmente.",
    },
    {
      email: "lucas@ropa.app",
      icono: User,
      titulo: "Usuario gratuito",
      detalle: "Ve su talle; el probador le ofrece pasarse a Premium.",
    },
    {
      email: "nuevo@ropa.app",
      icono: Sparkles,
      titulo: "Usuario nuevo",
      detalle: "Arranca desde cero, cargando sus medidas.",
    },
    {
      email: "tienda@ropa.app",
      icono: Store,
      titulo: "Tienda asociada",
      detalle: "Tienda Norte: ventas, devoluciones, catálogo y comisiones.",
    },
    {
      email: "admin@ropa.app",
      icono: ShieldCheck,
      titulo: "Administración",
      detalle: "Toda la plataforma: tiendas, usuarios, ingresos e hipótesis.",
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* ── Lado de marca ── */}
      <div className="relative hidden overflow-hidden bg-[var(--ink)] lg:flex lg:w-1/2">
        <div className="ropa-grid absolute inset-0" />
        <div
          className="absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white">
          <Link to="/">
            <Imagotipo size={38} claro />
          </Link>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-300)]">
              {MARCA.bajada}
            </p>
            <h1 className="font-display max-w-lg text-5xl font-bold leading-[1.05]">
              Comprá ropa online sabiendo
              <span className="text-[var(--brand-300)]"> cómo te va a quedar.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/60">
              Tu talle en cada prenda de las tiendas asociadas, y un probador
              virtual para verte con la ropa antes de comprarla.
            </p>
          </div>

          <p className="text-sm text-white/35">© 2026 {MARCA.nombre} · Datos de ejemplo</p>
        </div>
      </div>

      {/* ── Formulario ── */}
      <div className="flex w-full items-center justify-center bg-card p-6 sm:p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/">
              <Imagotipo size={34} />
            </Link>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Iniciar sesión
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingresá con tu cuenta, o elegí un acceso de demostración.
            </p>
          </div>

          <form onSubmit={enviar} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder={`nombre@${MARCA.dominio}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={verPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="h-11 w-full bg-[var(--brand)] text-white hover:bg-[var(--brand-600)]"
            >
              Entrar
            </Button>
          </form>

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Accesos de demostración
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              {accesos.map(({ email: e, icono: Icono, titulo, detalle }) => {
                const u = USUARIOS_DEMO.find((x) => x.email === e)!;
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => usarDemo(e)}
                    className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-50)]"
                  >
                    <span className="mt-0.5 rounded-md bg-[var(--brand-100)] p-1.5">
                      <Icono className="h-4 w-4 text-[var(--brand-700)]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{titulo}</span>
                      <span className="block text-xs leading-snug text-muted-foreground">
                        {detalle}
                      </span>
                      <span className="tabular mt-1 block font-mono text-[11px] text-muted-foreground">
                        {u.email} · {u.password}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Para ver el alta de una tienda desde cero, entrá como{" "}
              <button
                type="button"
                onClick={() => usarDemo("nueva-tienda@ropa.app")}
                className="font-medium text-[var(--brand-700)] underline underline-offset-2"
              >
                tienda nueva
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
