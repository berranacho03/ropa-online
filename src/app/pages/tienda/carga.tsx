import { CargaCatalogo } from "../../components/carga-catalogo";
import { PageBody, PageHeader } from "../../components/shell";
import { ConTienda } from "../../components/tienda/comun";

export function TiendaCarga() {
  return (
    <ConTienda titulo="Cargar catálogo">
      {(t) => (
        <>
          <PageHeader
            titulo="Cargar catálogo"
            bajada="Subí tu planilla de prendas: te ayudamos a ordenar las columnas, detectamos talles sin medidas y los completamos con la tabla estándar de cada categoría."
          />
          <PageBody>
            <CargaCatalogo tiendaId={t.id} />
          </PageBody>
        </>
      )}
    </ConTienda>
  );
}
