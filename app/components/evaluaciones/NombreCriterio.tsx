import { partirNombreCriterio } from "@/app/lib/nombre-criterio";

/** Nombre legible del criterio; la nomenclatura (si la tiene) va debajo como guía. */
export default function NombreCriterio({ nombre, className }: { nombre: string; className?: string }) {
  const { codigo, texto } = partirNombreCriterio(nombre);
  if (!codigo) return <span className={className}>{texto}</span>;
  return (
    <span className={className}>
      {texto}
      <span className="block font-mono text-[11px] font-normal text-muted-foreground">{codigo}</span>
    </span>
  );
}
