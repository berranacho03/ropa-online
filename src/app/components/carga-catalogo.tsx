/**
 * Carga asistida de catálogo (CSV): la usan el portal de tienda y el
 * admin (que carga en nombre de una tienda).
 */
export function CargaCatalogo({ tiendaId }: { tiendaId: string }) {
  return <div className="text-sm text-muted-foreground">Carga de catálogo para {tiendaId}: en construcción.</div>;
}
