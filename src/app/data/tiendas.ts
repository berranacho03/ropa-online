// Tiendas asociadas. Provisorio: en la fase 1 se suma el resto de la
// red, con su catálogo, comisión y métricas.

export interface Tienda {
  id: string;
  nombre: string;
  estado: "activa" | "onboarding" | "pausada";
}

export const TIENDAS: Tienda[] = [
  { id: "norte", nombre: "Tienda Norte", estado: "activa" },
  { id: "bruma", nombre: "Bruma", estado: "onboarding" },
];

export const tiendaById = (id?: string) => TIENDAS.find((t) => t.id === id);
