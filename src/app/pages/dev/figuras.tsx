import { Maniqui, PERSONAS } from "../../components/figura/maniqui";
import { PrendaIlustracion } from "../../components/figura/prenda-ilustracion";
import { PRENDAS_SEED } from "../../data/prendas";
import { recomendar } from "../../lib/talles";

export function DevFiguras() {
  const dest = PRENDAS_SEED.filter((p) => p.destacada);
  const remera = dest.find((p) => p.categoria === "remera")!;
  const jean = dest.find((p) => p.categoria === "jean")!;
  const ana = PERSONAS[0];
  return (
    <div className="space-y-6 bg-white p-4">
      <div className="flex gap-2">
        {PERSONAS.map((p, i) => (
          <div key={p.id} className="h-[420px] w-[190px] rounded bg-neutral-100">
            <Maniqui persona={p} puestas={[{ prenda: dest[i * 3] }, { prenda: dest[i * 3 + 1] }]} />
          </div>
        ))}
        {remera.talles.map((t) => (
          <div key={t} className="h-[420px] w-[190px] rounded bg-neutral-100 text-center text-xs">
            {t} {recomendar(remera.tabla, remera.categoria, ana.medidas)?.talle}
            <Maniqui persona={ana} puestas={[{ prenda: remera, talle: t }, { prenda: jean, talle: jean.talles[2] }]} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-2">
        {PRENDAS_SEED.slice(0, 48).map((p) => (
          <div key={p.id} className="text-[10px]">
            <PrendaIlustracion prenda={p} className="aspect-[4/5] rounded" />
            {p.nombre}
          </div>
        ))}
      </div>
    </div>
  );
}
