// ─────────────────────────────────────────────────────────────
// Tiendas asociadas.
//
// Todas son ficticias a propósito: usar marcas reales haría parecer
// que esas marcas son socias de la app. Las cifras operativas
// (comisión, devoluciones antes de sumarse, fecha de alta) son de
// ejemplo y alimentan el motor de datos.
// ─────────────────────────────────────────────────────────────

export type EstadoTienda = "activa" | "onboarding" | "pausada";

export interface Tienda {
  id: string;
  nombre: string;
  estado: EstadoTienda;
  ciudad: string;
  /** Estilo de la tienda, para elegir qué prendas vende. */
  estilo: "urbano" | "basicos" | "deportivo" | "fiesta" | "vintage" | "denim";
  /** Comisión que cede por cada venta derivada, en %. */
  comisionPct: number;
  /** % de ventas online devueltas por talle antes de sumarse a la app. */
  devTalleAntes: number;
  /** Cuánto se corre su tabla de talles respecto de la estándar, en cm.
   *  Positivo: talla grande (su M es más amplio que el promedio). */
  sesgoTalle: number;
  fechaAlta: string;
  color: string;
  descripcion: string;
  web: string;
  contacto: string;
}

type Base = Omit<Tienda, "web" | "contacto">;

const BASE: Base[] = [
  { id: "norte", nombre: "Tienda Norte", estado: "activa", ciudad: "Montevideo", estilo: "urbano", comisionPct: 6, devTalleAntes: 31, sesgoTalle: -1, fechaAlta: "2025-11-04", color: "#1d1b22", descripcion: "Ropa urbana de diseño local, básicos con corte propio." },
  { id: "bruma", nombre: "Bruma", estado: "onboarding", ciudad: "Montevideo", estilo: "basicos", comisionPct: 6, devTalleAntes: 24, sesgoTalle: 1, fechaAlta: "2026-10-20", color: "#7a8a99", descripcion: "Tejidos y básicos en tonos neutros." },
  { id: "lado-b", nombre: "Lado B", estado: "activa", ciudad: "Montevideo", estilo: "vintage", comisionPct: 7, devTalleAntes: 31, sesgoTalle: -2, fechaAlta: "2025-11-18", color: "#c2410c", descripcion: "Prendas con onda retro, recuperadas y reversionadas." },
  { id: "marea", nombre: "Marea", estado: "activa", ciudad: "Punta del Este", estilo: "basicos", comisionPct: 6, devTalleAntes: 22, sesgoTalle: 1, fechaAlta: "2025-12-02", color: "#0369a1", descripcion: "Ropa liviana de verano y playa." },
  { id: "pampa", nombre: "Pampa Studio", estado: "activa", ciudad: "Montevideo", estilo: "urbano", comisionPct: 6, devTalleAntes: 29, sesgoTalle: -1, fechaAlta: "2025-12-10", color: "#a16207", descripcion: "Streetwear de edición limitada." },
  { id: "ciruela", nombre: "Ciruela", estado: "activa", ciudad: "Montevideo", estilo: "fiesta", comisionPct: 8, devTalleAntes: 34, sesgoTalle: -2, fechaAlta: "2025-12-15", color: "#86198f", descripcion: "Vestidos y looks para salir." },
  { id: "faro", nombre: "Faro Denim", estado: "activa", ciudad: "Montevideo", estilo: "denim", comisionPct: 6, devTalleAntes: 36, sesgoTalle: 0, fechaAlta: "2026-01-08", color: "#1e3a8a", descripcion: "Jeans de todos los calces, hechos en Uruguay." },
  { id: "rambla", nombre: "Rambla", estado: "activa", ciudad: "Montevideo", estilo: "deportivo", comisionPct: 5, devTalleAntes: 21, sesgoTalle: 2, fechaAlta: "2026-01-12", color: "#15803d", descripcion: "Ropa deportiva y de running." },
  { id: "siesta", nombre: "Siesta", estado: "activa", ciudad: "Colonia", estilo: "basicos", comisionPct: 6, devTalleAntes: 23, sesgoTalle: 1, fechaAlta: "2026-01-20", color: "#b45309", descripcion: "Ropa cómoda para todos los días." },
  { id: "tinta", nombre: "Tinta", estado: "activa", ciudad: "Montevideo", estilo: "urbano", comisionPct: 7, devTalleAntes: 28, sesgoTalle: -1, fechaAlta: "2026-02-03", color: "#111827", descripcion: "Remeras estampadas por artistas locales." },
  { id: "mostaza", nombre: "Mostaza", estado: "activa", ciudad: "Maldonado", estilo: "vintage", comisionPct: 6, devTalleAntes: 30, sesgoTalle: 0, fechaAlta: "2026-02-09", color: "#ca8a04", descripcion: "Colores fuertes y cortes de los 90." },
  { id: "gaviota", nombre: "Gaviota", estado: "activa", ciudad: "Punta del Este", estilo: "fiesta", comisionPct: 7, devTalleAntes: 32, sesgoTalle: -1, fechaAlta: "2026-02-16", color: "#be185d", descripcion: "Moda de temporada para la costa." },
  { id: "hilo-rojo", nombre: "Hilo Rojo", estado: "activa", ciudad: "Montevideo", estilo: "basicos", comisionPct: 6, devTalleAntes: 25, sesgoTalle: 0, fechaAlta: "2026-02-24", color: "#b91c1c", descripcion: "Tejidos de punto y abrigos." },
  { id: "cardo", nombre: "Cardo", estado: "activa", ciudad: "Paysandú", estilo: "urbano", comisionPct: 6, devTalleAntes: 26, sesgoTalle: 1, fechaAlta: "2026-03-02", color: "#6d28d9", descripcion: "Urbano del litoral." },
  { id: "nube", nombre: "Nube", estado: "activa", ciudad: "Montevideo", estilo: "basicos", comisionPct: 5, devTalleAntes: 20, sesgoTalle: 2, fechaAlta: "2026-03-09", color: "#64748b", descripcion: "Oversize y prendas sueltas." },
  { id: "lima-limon", nombre: "Lima Limón", estado: "activa", ciudad: "Canelones", estilo: "deportivo", comisionPct: 6, devTalleAntes: 22, sesgoTalle: 1, fechaAlta: "2026-03-16", color: "#65a30d", descripcion: "Deportivo con color." },
  { id: "tropa", nombre: "Tropa", estado: "activa", ciudad: "Montevideo", estilo: "urbano", comisionPct: 7, devTalleAntes: 30, sesgoTalle: -1, fechaAlta: "2026-03-23", color: "#3f6212", descripcion: "Cargo, utilitario y camperas." },
  { id: "arena", nombre: "Arena", estado: "activa", ciudad: "Maldonado", estilo: "basicos", comisionPct: 6, devTalleAntes: 23, sesgoTalle: 0, fechaAlta: "2026-03-30", color: "#a8a29e", descripcion: "Lino, algodón y tonos tierra." },
  { id: "cuarzo", nombre: "Cuarzo", estado: "activa", ciudad: "Montevideo", estilo: "fiesta", comisionPct: 8, devTalleAntes: 35, sesgoTalle: -2, fechaAlta: "2026-04-06", color: "#9d174d", descripcion: "Vestidos de fiesta y egresados." },
  { id: "vertigo", nombre: "Vértigo", estado: "activa", ciudad: "Montevideo", estilo: "deportivo", comisionPct: 5, devTalleAntes: 19, sesgoTalle: 1, fechaAlta: "2026-04-13", color: "#0f766e", descripcion: "Skate y ropa técnica." },
  { id: "corcho", nombre: "Corcho", estado: "activa", ciudad: "Salto", estilo: "vintage", comisionPct: 6, devTalleAntes: 29, sesgoTalle: 0, fechaAlta: "2026-04-20", color: "#92400e", descripcion: "Segunda mano curada." },
  { id: "puerto", nombre: "Puerto", estado: "activa", ciudad: "Montevideo", estilo: "denim", comisionPct: 6, devTalleAntes: 33, sesgoTalle: 1, fechaAlta: "2026-04-27", color: "#1e40af", descripcion: "Denim y camisas de trabajo." },
  { id: "ombu", nombre: "Ombú", estado: "activa", ciudad: "Florida", estilo: "basicos", comisionPct: 6, devTalleAntes: 24, sesgoTalle: 0, fechaAlta: "2026-05-04", color: "#166534", descripcion: "Básicos de algodón orgánico." },
  { id: "plaza", nombre: "Plaza", estado: "activa", ciudad: "Montevideo", estilo: "urbano", comisionPct: 6, devTalleAntes: 27, sesgoTalle: 0, fechaAlta: "2026-05-11", color: "#334155", descripcion: "Moda joven a precio accesible." },
  { id: "brisa", nombre: "Brisa", estado: "activa", ciudad: "Rocha", estilo: "basicos", comisionPct: 6, devTalleAntes: 22, sesgoTalle: 1, fechaAlta: "2026-05-18", color: "#0891b2", descripcion: "Ropa de playa y verano." },
  { id: "nomade", nombre: "Nómade", estado: "activa", ciudad: "Montevideo", estilo: "vintage", comisionPct: 7, devTalleAntes: 30, sesgoTalle: -1, fechaAlta: "2026-05-25", color: "#7c2d12", descripcion: "Prendas de viaje, bordados y ponchos." },
  { id: "barrio-sur", nombre: "Barrio Sur", estado: "activa", ciudad: "Montevideo", estilo: "urbano", comisionPct: 6, devTalleAntes: 28, sesgoTalle: 0, fechaAlta: "2026-06-01", color: "#4338ca", descripcion: "Streetwear con identidad montevideana." },
  { id: "tango", nombre: "Tango", estado: "activa", ciudad: "Montevideo", estilo: "fiesta", comisionPct: 7, devTalleAntes: 31, sesgoTalle: -1, fechaAlta: "2026-06-08", color: "#991b1b", descripcion: "Camisas y vestidos para eventos." },
  { id: "salvia", nombre: "Salvia", estado: "activa", ciudad: "Canelones", estilo: "basicos", comisionPct: 6, devTalleAntes: 23, sesgoTalle: 0, fechaAlta: "2026-06-15", color: "#4d7c0f", descripcion: "Moda sustentable." },
  { id: "kiosko", nombre: "Kiosko", estado: "activa", ciudad: "Montevideo", estilo: "urbano", comisionPct: 6, devTalleAntes: 26, sesgoTalle: 1, fechaAlta: "2026-06-22", color: "#db2777", descripcion: "Remeras y buzos con gráfica pop." },
  { id: "andes", nombre: "Andes", estado: "activa", ciudad: "Montevideo", estilo: "deportivo", comisionPct: 5, devTalleAntes: 20, sesgoTalle: 2, fechaAlta: "2026-07-06", color: "#0c4a6e", descripcion: "Outdoor y camperas técnicas." },
  { id: "indigo", nombre: "Índigo", estado: "activa", ciudad: "Paysandú", estilo: "denim", comisionPct: 6, devTalleAntes: 34, sesgoTalle: -1, fechaAlta: "2026-07-13", color: "#312e81", descripcion: "Jeans rígidos y elastizados." },
  { id: "polen", nombre: "Polen", estado: "activa", ciudad: "Montevideo", estilo: "fiesta", comisionPct: 7, devTalleAntes: 30, sesgoTalle: -1, fechaAlta: "2026-07-20", color: "#d97706", descripcion: "Vestidos estampados." },
  { id: "garua", nombre: "Garúa", estado: "activa", ciudad: "Montevideo", estilo: "basicos", comisionPct: 6, devTalleAntes: 24, sesgoTalle: 0, fechaAlta: "2026-08-03", color: "#475569", descripcion: "Abrigos e impermeables." },
  { id: "cometa", nombre: "Cometa", estado: "activa", ciudad: "Maldonado", estilo: "deportivo", comisionPct: 6, devTalleAntes: 21, sesgoTalle: 1, fechaAlta: "2026-08-17", color: "#ea580c", descripcion: "Ropa para entrenar." },
  { id: "musgo", nombre: "Musgo", estado: "activa", ciudad: "Tacuarembó", estilo: "vintage", comisionPct: 6, devTalleAntes: 29, sesgoTalle: 0, fechaAlta: "2026-08-31", color: "#3f6212", descripcion: "Tonos verdes y prendas de campo." },
  { id: "vitrina", nombre: "Vitrina", estado: "activa", ciudad: "Montevideo", estilo: "fiesta", comisionPct: 8, devTalleAntes: 33, sesgoTalle: -2, fechaAlta: "2026-09-14", color: "#be123c", descripcion: "Looks de noche." },
  { id: "rio", nombre: "Río", estado: "activa", ciudad: "Mercedes", estilo: "denim", comisionPct: 6, devTalleAntes: 32, sesgoTalle: 0, fechaAlta: "2026-09-28", color: "#1d4ed8", descripcion: "Denim clásico." },
  { id: "aurora", nombre: "Aurora", estado: "pausada", ciudad: "Montevideo", estilo: "fiesta", comisionPct: 7, devTalleAntes: 32, sesgoTalle: -1, fechaAlta: "2026-02-02", color: "#c026d3", descripcion: "Pausada a pedido de la tienda: renueva su e-commerce." },
  { id: "trigo", nombre: "Trigo", estado: "pausada", ciudad: "Durazno", estilo: "basicos", comisionPct: 6, devTalleAntes: 25, sesgoTalle: 0, fechaAlta: "2026-03-05", color: "#a16207", descripcion: "Pausada: tablas de talles incompletas." },
  { id: "loma", nombre: "Loma", estado: "onboarding", ciudad: "Minas", estilo: "urbano", comisionPct: 6, devTalleAntes: 27, sesgoTalle: 0, fechaAlta: "2026-10-12", color: "#57534e", descripcion: "En alta: cargando catálogo." },
  { id: "bahia", nombre: "Bahía", estado: "onboarding", ciudad: "Piriápolis", estilo: "basicos", comisionPct: 6, devTalleAntes: 23, sesgoTalle: 1, fechaAlta: "2026-10-16", color: "#0e7490", descripcion: "En alta: completando tablas de talles." },
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");

export const TIENDAS: Tienda[] = BASE.map((t) => ({
  ...t,
  web: `${slug(t.nombre)}.com.uy`,
  contacto: `hola@${slug(t.nombre)}.com.uy`,
}));

export const tiendaById = (id?: string) => TIENDAS.find((t) => t.id === id);

export const TIENDAS_ACTIVAS = TIENDAS.filter((t) => t.estado === "activa");
