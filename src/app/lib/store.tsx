import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CAMPANAS,
  HOY,
  PRIVACIDAD_SEED,
  PRUEBAS_SEED,
  SUPUESTOS_DEFECTO,
  SUSCRIPCIONES_SEED,
  TICKETS_SEED,
  USUARIOS,
  VENTAS_SEED,
  type Campana,
  type Feedback,
  type MensajeTicket,
  type PlanPremium,
  type Prueba,
  type SolicitudPrivacidad,
  type Supuestos,
  type Suscripcion,
  type Ticket,
  type Venta,
} from "../data/seed";
import { PRENDAS_SEED, type Prenda } from "../data/prendas";
import { TIENDAS, type Tienda } from "../data/tiendas";
import { ID_DEMO, type UsuarioApp } from "../data/usuarios";
import { recomendar } from "./talles";
import { getUsuario } from "./auth";

// ─────────────────────────────────────────────────────────────
// Estado de la demo.
//
// Un solo store alimenta los tres portales: lo que hace la usuaria en
// la app (comprar, probarse algo, pasarse a Premium) aparece en el
// portal de la tienda y en el admin en la misma sesión.
//
// En localStorage se guarda sólo lo que cambia respecto del seed.
// Si el esquema cambia, se sube VERSION y se descarta lo viejo.
// ─────────────────────────────────────────────────────────────

const VERSION = "v1";
const KEY = `ropa.estado.${VERSION}`;
const KEY_FOTOS = `ropa.fotos.${VERSION}`;

interface Persistido {
  perfiles: Record<string, Partial<UsuarioApp>>;
  subsNuevas: Suscripcion[];
  subsPatch: Record<string, Partial<Suscripcion>>;
  ventasNuevas: Venta[];
  ventasPatch: Record<string, Partial<Venta>>;
  pruebasNuevas: Prueba[];
  favoritos: Record<string, string[]>;
  prendasNuevas: Prenda[];
  prendasPatch: Record<string, Partial<Prenda>>;
  tiendasPatch: Record<string, Partial<Tienda>>;
  ticketsNuevos: Ticket[];
  ticketsPatch: Record<string, Partial<Ticket>>;
  privacidadNuevas: SolicitudPrivacidad[];
  privacidadPatch: Record<string, Partial<SolicitudPrivacidad>>;
  supuestos: Supuestos;
}

const VACIO: Persistido = {
  perfiles: {},
  subsNuevas: [],
  subsPatch: {},
  ventasNuevas: [],
  ventasPatch: {},
  pruebasNuevas: [],
  favoritos: {},
  prendasNuevas: [],
  prendasPatch: {},
  tiendasPatch: {},
  ticketsNuevos: [],
  ticketsPatch: {},
  privacidadNuevas: [],
  privacidadPatch: {},
  supuestos: SUPUESTOS_DEFECTO,
};

function cargar(): Persistido {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return VACIO;
    return { ...VACIO, ...JSON.parse(raw) };
  } catch {
    return VACIO;
  }
}

function cargarFotos(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY_FOTOS) ?? "{}");
  } catch {
    return {};
  }
}

const aplicar = <T extends { id: string }>(base: T[], nuevos: T[], patch: Record<string, Partial<T>>) =>
  [...base, ...nuevos].map((x) => (patch[x.id] ? { ...x, ...patch[x.id] } : x));

/** Hora actual "dentro" del día fijo de la demo. */
export function ahora() {
  const d = new Date();
  return `${HOY}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

let contador = 0;
const nuevoId = (prefijo: string) => `${prefijo}-${Date.now().toString(36)}${(contador++).toString(36)}`;

export interface Store {
  usuarios: UsuarioApp[];
  suscripciones: Suscripcion[];
  ventas: Venta[];
  pruebas: Prueba[];
  prendas: Prenda[];
  tiendas: Tienda[];
  tickets: Ticket[];
  privacidad: SolicitudPrivacidad[];
  campanas: Campana[];
  supuestos: Supuestos;
  favoritos: Record<string, string[]>;
  fotos: Record<string, string>;

  actualizarPerfil: (usuarioId: string, patch: Partial<UsuarioApp>) => void;
  suscribir: (usuarioId: string, plan: PlanPremium) => void;
  cancelarSuscripcion: (usuarioId: string) => void;
  registrarVenta: (d: { usuarioId: string; prendaId: string; talle: string; conPrueba: boolean }) => Venta | null;
  darFeedback: (ventaId: string, feedback: Feedback) => void;
  marcarDevolucion: (ventaId: string, motivo: "talle" | "otro" | null) => void;
  registrarPrueba: (d: Omit<Prueba, "id" | "fecha" | "costoUsd" | "ok"> & { ok?: boolean }) => Prueba;
  toggleFavorito: (usuarioId: string, prendaId: string) => void;
  guardarPrenda: (p: Prenda) => void;
  actualizarPrenda: (id: string, patch: Partial<Prenda>) => void;
  actualizarTienda: (id: string, patch: Partial<Tienda>) => void;
  nuevoTicket: (t: Omit<Ticket, "id" | "fecha" | "estado" | "respuestaHoras" | "mensajes"> & { texto: string }) => Ticket;
  responderTicket: (id: string, m: Omit<MensajeTicket, "fecha">, cerrar?: boolean) => void;
  nuevaSolicitud: (usuarioId: string, tipo: SolicitudPrivacidad["tipo"]) => void;
  cumplirSolicitud: (id: string) => void;
  setSupuestos: (s: Partial<Supuestos>) => void;
  setFoto: (usuarioId: string, dataUrl: string | null) => void;
  restablecer: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<Persistido>(cargar);
  const [fotos, setFotos] = useState<Record<string, string>>(cargarFotos);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch {
      /* sin almacenamiento: la demo sigue andando en memoria */
    }
  }, [st]);

  useEffect(() => {
    try {
      localStorage.setItem(KEY_FOTOS, JSON.stringify(fotos));
    } catch {
      /* foto demasiado grande: queda sólo en memoria */
    }
  }, [fotos]);

  const usuarios = useMemo(
    () => USUARIOS.map((u) => (st.perfiles[u.id] ? { ...u, ...st.perfiles[u.id] } : u)),
    [st.perfiles]
  );
  const suscripciones = useMemo(() => aplicar(SUSCRIPCIONES_SEED, st.subsNuevas, st.subsPatch), [st.subsNuevas, st.subsPatch]);
  const ventas = useMemo(() => aplicar(VENTAS_SEED, st.ventasNuevas, st.ventasPatch), [st.ventasNuevas, st.ventasPatch]);
  const pruebas = useMemo(() => [...PRUEBAS_SEED, ...st.pruebasNuevas], [st.pruebasNuevas]);
  const prendas = useMemo(() => aplicar(PRENDAS_SEED, st.prendasNuevas, st.prendasPatch), [st.prendasNuevas, st.prendasPatch]);
  const tiendas = useMemo(
    () => TIENDAS.map((t) => (st.tiendasPatch[t.id] ? { ...t, ...st.tiendasPatch[t.id] } : t)),
    [st.tiendasPatch]
  );
  const tickets = useMemo(
    () => aplicar(TICKETS_SEED, st.ticketsNuevos, st.ticketsPatch).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [st.ticketsNuevos, st.ticketsPatch]
  );
  const privacidad = useMemo(
    () => aplicar(PRIVACIDAD_SEED, st.privacidadNuevas, st.privacidadPatch).sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [st.privacidadNuevas, st.privacidadPatch]
  );

  const actualizarPerfil = useCallback((usuarioId: string, patch: Partial<UsuarioApp>) => {
    setSt((s) => ({ ...s, perfiles: { ...s.perfiles, [usuarioId]: { ...s.perfiles[usuarioId], ...patch } } }));
  }, []);

  const suscribir = useCallback((usuarioId: string, plan: PlanPremium) => {
    setSt((s) => ({
      ...s,
      subsNuevas: [...s.subsNuevas, { id: nuevoId("s"), usuarioId, plan, inicio: HOY }],
    }));
  }, []);

  const cancelarSuscripcion = useCallback(
    (usuarioId: string) => {
      const activa = suscripciones.find((x) => x.usuarioId === usuarioId && !x.fin);
      if (!activa) return;
      setSt((s) => ({ ...s, subsPatch: { ...s.subsPatch, [activa.id]: { fin: HOY } } }));
    },
    [suscripciones]
  );

  const registrarVenta: Store["registrarVenta"] = useCallback(
    ({ usuarioId, prendaId, talle, conPrueba }) => {
      const u = usuarios.find((x) => x.id === usuarioId);
      const p = prendas.find((x) => x.id === prendaId);
      const t = tiendas.find((x) => x.id === p?.tiendaId);
      if (!u?.medidas || !p || !t) return null;
      const rec = recomendar(p.tabla, p.categoria, u.medidas);
      const venta: Venta = {
        id: nuevoId("v"),
        usuarioId,
        prendaId,
        tiendaId: p.tiendaId,
        fecha: HOY,
        talle,
        talleRecomendado: rec?.talle ?? talle,
        confianza: rec?.confianza ?? 0,
        siguio: rec?.talle === talle,
        conPrueba,
        precio: p.precio,
        comisionPct: t.comisionPct,
        estado: "confirmada",
      };
      setSt((s) => ({ ...s, ventasNuevas: [...s.ventasNuevas, venta] }));
      return venta;
    },
    [usuarios, prendas, tiendas]
  );

  const darFeedback = useCallback((ventaId: string, feedback: Feedback) => {
    setSt((s) => ({ ...s, ventasPatch: { ...s.ventasPatch, [ventaId]: { ...s.ventasPatch[ventaId], feedback } } }));
  }, []);

  const marcarDevolucion = useCallback((ventaId: string, motivo: "talle" | "otro" | null) => {
    setSt((s) => ({
      ...s,
      ventasPatch: {
        ...s.ventasPatch,
        [ventaId]: {
          ...s.ventasPatch[ventaId],
          estado: motivo ? "devuelta" : "confirmada",
          motivoDevolucion: motivo ?? undefined,
        },
      },
    }));
  }, []);

  const registrarPrueba: Store["registrarPrueba"] = useCallback(
    (d) => {
      const prueba: Prueba = {
        id: nuevoId("p"),
        fecha: HOY,
        ok: d.ok ?? true,
        costoUsd: st.supuestos.costoIaUsd,
        ...d,
      };
      setSt((s) => ({ ...s, pruebasNuevas: [...s.pruebasNuevas, prueba] }));
      return prueba;
    },
    [st.supuestos.costoIaUsd]
  );

  const toggleFavorito = useCallback((usuarioId: string, prendaId: string) => {
    setSt((s) => {
      const actual = s.favoritos[usuarioId] ?? [];
      const nuevo = actual.includes(prendaId) ? actual.filter((x) => x !== prendaId) : [...actual, prendaId];
      return { ...s, favoritos: { ...s.favoritos, [usuarioId]: nuevo } };
    });
  }, []);

  const guardarPrenda = useCallback((p: Prenda) => {
    setSt((s) => {
      const existe = PRENDAS_SEED.some((x) => x.id === p.id) || s.prendasNuevas.some((x) => x.id === p.id);
      if (!existe) return { ...s, prendasNuevas: [...s.prendasNuevas, p] };
      if (s.prendasNuevas.some((x) => x.id === p.id))
        return { ...s, prendasNuevas: s.prendasNuevas.map((x) => (x.id === p.id ? p : x)) };
      return { ...s, prendasPatch: { ...s.prendasPatch, [p.id]: p } };
    });
  }, []);

  const actualizarPrenda = useCallback((id: string, patch: Partial<Prenda>) => {
    setSt((s) => {
      if (s.prendasNuevas.some((x) => x.id === id))
        return { ...s, prendasNuevas: s.prendasNuevas.map((x) => (x.id === id ? { ...x, ...patch } : x)) };
      return { ...s, prendasPatch: { ...s.prendasPatch, [id]: { ...s.prendasPatch[id], ...patch } } };
    });
  }, []);

  const actualizarTienda = useCallback((id: string, patch: Partial<Tienda>) => {
    setSt((s) => ({ ...s, tiendasPatch: { ...s.tiendasPatch, [id]: { ...s.tiendasPatch[id], ...patch } } }));
  }, []);

  const nuevoTicket: Store["nuevoTicket"] = useCallback(({ texto, ...t }) => {
    const ticket: Ticket = {
      ...t,
      id: nuevoId("t"),
      fecha: HOY,
      estado: "abierto",
      respuestaHoras: 0,
      mensajes: [{ de: "cliente", texto, fecha: ahora() }],
    };
    setSt((s) => ({ ...s, ticketsNuevos: [...s.ticketsNuevos, ticket] }));
    return ticket;
  }, []);

  const responderTicket = useCallback(
    (id: string, m: Omit<MensajeTicket, "fecha">, cerrar = false) => {
      const t = tickets.find((x) => x.id === id);
      if (!t) return;
      setSt((s) => ({
        ...s,
        ticketsPatch: {
          ...s.ticketsPatch,
          [id]: {
            ...s.ticketsPatch[id],
            mensajes: [...t.mensajes, { ...m, fecha: ahora() }],
            estado: cerrar ? "resuelto" : t.estado,
            respuestaHoras: t.respuestaHoras || (m.de === "soporte" ? 0.1 : 0),
          },
        },
      }));
    },
    [tickets]
  );

  const nuevaSolicitud = useCallback((usuarioId: string, tipo: SolicitudPrivacidad["tipo"]) => {
    const inmediata = tipo === "borrar-foto";
    const sol: SolicitudPrivacidad = {
      id: nuevoId("pr"),
      usuarioId,
      tipo,
      fecha: HOY,
      estado: inmediata ? "cumplida" : "pendiente",
      cumplida: inmediata ? HOY : undefined,
    };
    setSt((s) => ({ ...s, privacidadNuevas: [...s.privacidadNuevas, sol] }));
  }, []);

  const cumplirSolicitud = useCallback((id: string) => {
    setSt((s) => ({
      ...s,
      privacidadPatch: { ...s.privacidadPatch, [id]: { estado: "cumplida", cumplida: HOY } },
    }));
  }, []);

  const setSupuestos = useCallback((p: Partial<Supuestos>) => {
    setSt((s) => ({ ...s, supuestos: { ...s.supuestos, ...p } }));
  }, []);

  const setFoto = useCallback((usuarioId: string, dataUrl: string | null) => {
    setFotos((f) => {
      const n = { ...f };
      if (dataUrl) n[usuarioId] = dataUrl;
      else delete n[usuarioId];
      return n;
    });
  }, []);

  const restablecer = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(KEY_FOTOS);
    } catch {
      /* nada que borrar */
    }
    setSt(VACIO);
    setFotos({});
  }, []);

  const value: Store = {
    usuarios,
    suscripciones,
    ventas,
    pruebas,
    prendas,
    tiendas,
    tickets,
    privacidad,
    campanas: CAMPANAS,
    supuestos: st.supuestos,
    favoritos: st.favoritos,
    fotos,
    actualizarPerfil,
    suscribir,
    cancelarSuscripcion,
    registrarVenta,
    darFeedback,
    marcarDevolucion,
    registrarPrueba,
    toggleFavorito,
    guardarPrenda,
    actualizarPrenda,
    actualizarTienda,
    nuevoTicket,
    responderTicket,
    nuevaSolicitud,
    cumplirSolicitud,
    setSupuestos,
    setFoto,
    restablecer,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore fuera de StoreProvider");
  return s;
}

// ── Atajos por portal ────────────────────────────────────────

/** El usuario de la app logueado, con su plan vigente. */
export function useYo() {
  const { usuarios, suscripciones } = useStore();
  const auth = getUsuario();
  const id = auth ? ID_DEMO[auth.email] : undefined;
  const usuario = usuarios.find((u) => u.id === id);
  const suscripcion = suscripciones.find((s) => s.usuarioId === id && !s.fin && s.inicio <= HOY);
  return { usuario, suscripcion, premium: !!suscripcion };
}

/** La tienda del usuario logueado en el portal de tienda. */
export function useMiTienda() {
  const { tiendas } = useStore();
  const auth = getUsuario();
  return tiendas.find((t) => t.id === auth?.tiendaId);
}

/** Prendas que ve un usuario de la app: publicadas, de tiendas activas. */
export function usePrendasVisibles() {
  const { prendas, tiendas } = useStore();
  return useMemo(() => {
    const activas = new Set(tiendas.filter((t) => t.estado === "activa").map((t) => t.id));
    return prendas.filter((p) => p.estado === "publicada" && activas.has(p.tiendaId));
  }, [prendas, tiendas]);
}
