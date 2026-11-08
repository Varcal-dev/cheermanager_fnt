"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CAMPOS_TALLA, type FichaForm } from "@/app/lib/ficha-deportiva";
import { CATEGORIAS, ESTILOS, NIVELES, TIERS, type Habilidad } from "@/app/lib/habilidades";

interface Props {
  value: FichaForm;
  onChange: (v: FichaForm) => void;
  catalogo: Habilidad[];
}

const GIMNASIA = ["GIMNASIA_ESTATICA", "GIMNASIA_CARRERA"];
const OTRAS = ["ELEVACION", "LANZAMIENTO"];

function ListaHabilidades({ items, marcadas, alternar }: { items: Habilidad[]; marcadas: Set<number>; alternar: (id: number) => void }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Sin habilidades en este nivel.</p>;
  return (
    <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
      {items.map((h) => (
        <label key={h.id} className="flex items-start gap-2 text-sm cursor-pointer">
          <Checkbox checked={marcadas.has(h.id)} onCheckedChange={() => alternar(h.id)} className="mt-0.5" />
          <span>
            {h.nombre}
            {(h.estilo || h.tier) && (
              <span className="block text-xs text-muted-foreground">
                {[h.estilo ? ESTILOS[h.estilo] : null, h.tier ? TIERS[h.tier] : null].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}

/**
 * Ficha deportiva: ¿tiene experiencia?; si sí, el nivel que cree tener y las habilidades que dice tener (gimnasia
 * primero), y las tallas de uniforme. Lo marcado es una declaración: se valida después evaluando cada habilidad.
 */
export default function FichaDeportivaForm({ value, onChange, catalogo }: Props) {
  const [nivelVista, setNivelVista] = useState(value.nivelDeclarado || "N1");
  const marcadas = useMemo(() => new Set(value.habilidadIds), [value.habilidadIds]);
  const alternar = (id: number) =>
    onChange({
      ...value,
      habilidadIds: marcadas.has(id) ? value.habilidadIds.filter((x) => x !== id) : [...value.habilidadIds, id],
    });
  const delNivel = (cats: string[]) => catalogo.filter((h) => h.nivel === nivelVista && cats.includes(h.categoria));
  const marcadasDe = (n: string) => catalogo.filter((h) => h.nivel === n && marcadas.has(h.id)).length;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>¿Tiene experiencia en cheerleading?</Label>
        <div className="flex gap-2">
          {[
            { v: true, t: "Sí" },
            { v: false, t: "No" },
          ].map((o) => (
            <button
              key={o.t}
              type="button"
              onClick={() => onChange({ ...value, tieneExperiencia: o.v })}
              className={`h-9 min-w-20 rounded border px-4 text-sm ${
                value.tieneExperiencia === o.v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {o.t}
            </button>
          ))}
        </div>
      </div>

      {value.tieneExperiencia && (
        <div className="space-y-4 rounded-md border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Años de experiencia</Label>
              <Input type="number" min={0} max={40} value={value.aniosExperiencia}
                onChange={(e) => onChange({ ...value, aniosExperiencia: e.target.value })} />
            </div>
            <div>
              <Label>Nivel que cree tener</Label>
              <Select value={value.nivelDeclarado} onValueChange={(v) => { onChange({ ...value, nivelDeclarado: v }); setNivelVista(v); }}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar nivel" /></SelectTrigger>
                <SelectContent>{NIVELES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Habilidades que dice tener (marque las que realiza)</Label>
            <div className="flex flex-wrap gap-1.5">
              {NIVELES.map((n) => (
                <button key={n} type="button" onClick={() => setNivelVista(n)}
                  className={`rounded-full border px-3 py-1 text-xs ${nivelVista === n ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  {n}{marcadasDe(n) > 0 ? ` · ${marcadasDe(n)}` : ""}
                </button>
              ))}
            </div>
            {GIMNASIA.map((c) => (
              <div key={c} className="space-y-1.5">
                <h5 className="text-sm font-semibold">{CATEGORIAS[c]}</h5>
                <ListaHabilidades items={delNivel([c])} marcadas={marcadas} alternar={alternar} />
              </div>
            ))}
            {OTRAS.map((c) => (
              <details key={c} className="rounded border p-2">
                <summary className="cursor-pointer text-sm font-semibold">{CATEGORIAS[c]} (opcional)</summary>
                <div className="pt-2"><ListaHabilidades items={delNivel([c])} marcadas={marcadas} alternar={alternar} /></div>
              </details>
            ))}
            <p className="text-xs text-muted-foreground">
              Es lo que el deportista dice saber hacer; el nivel real se confirma evaluando cada habilidad.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Tallas (uniforme y ropa)</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {CAMPOS_TALLA.map((c) => (
            <div key={c.clave}>
              <span className="text-xs text-muted-foreground">{c.etiqueta}</span>
              <Input maxLength={10} list={`tallas-${c.clave}`} value={value.tallas[c.clave]}
                onChange={(e) => onChange({ ...value, tallas: { ...value.tallas, [c.clave]: e.target.value } })} />
              {c.sugerencias.length > 0 && (
                <datalist id={`tallas-${c.clave}`}>{c.sugerencias.map((s) => <option key={s} value={s} />)}</datalist>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
