"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import {
  CAMPOS_TALLA, FICHA_VACIA, catalogoFicha, guardarFicha, obtenerFicha, vistaAForm,
  type FichaForm, type FichaVista,
} from "@/app/lib/ficha-deportiva";
import { CATEGORIAS, type Habilidad } from "@/app/lib/habilidades";
import FichaDeportivaForm from "./FichaDeportivaForm";

/** Pestaña "Ficha deportiva" del detalle: experiencia declarada y tallas, editable con modificar_deportista. */
export default function FichaDeportivaPanel({ deportistaId }: { deportistaId: number }) {
  const { permissions } = useUser();
  const puedeEditar = permissions.includes("modificar_deportista");
  const [vista, setVista] = useState<FichaVista | null>(null);
  const [form, setForm] = useState<FichaForm>(FICHA_VACIA);
  const [catalogo, setCatalogo] = useState<Habilidad[]>([]);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerFicha(deportistaId).then(setVista).catch(() => toast.error("No se pudo cargar la ficha deportiva"));
  }, [deportistaId]);

  const editar = async () => {
    try {
      if (catalogo.length === 0) setCatalogo(await catalogoFicha());
      if (vista) setForm(vistaAForm(vista));
      setEditando(true);
    } catch {
      toast.error("No se pudo cargar el glosario de habilidades");
    }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      setVista(await guardarFicha(deportistaId, form));
      setEditando(false);
      toast.success("Ficha guardada");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "No se pudo guardar la ficha");
    } finally {
      setGuardando(false);
    }
  };

  if (!vista) return <p className="text-muted-foreground">Cargando…</p>;

  if (editando) {
    return (
      <div className="space-y-4">
        <FichaDeportivaForm value={form} onChange={setForm} catalogo={catalogo} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditando(false)}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar ficha"}</Button>
        </div>
      </div>
    );
  }

  const porCategoria = Object.keys(CATEGORIAS)
    .map((c) => ({ c, items: vista.habilidades.filter((h) => h.categoria === c) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Experiencia previa</h4>
        {puedeEditar && <Button variant="outline" size="sm" onClick={editar}>Editar ficha</Button>}
      </div>
      {vista.tieneExperiencia === null && <p className="text-muted-foreground">Sin responder.</p>}
      {vista.tieneExperiencia === false && <p>Sin experiencia previa.</p>}
      {vista.tieneExperiencia && (
        <div className="space-y-2">
          <p>
            {vista.aniosExperiencia !== null ? `${vista.aniosExperiencia} año(s) · ` : ""}
            Nivel que dice tener: <b>{vista.nivelDeclarado ?? "—"}</b>
            {vista.nivelSugerido && <> · Habilidades declaradas hasta <b>{vista.nivelSugerido}</b></>}
          </p>
          {porCategoria.map((g) => (
            <div key={g.c}>
              <span className="text-xs text-muted-foreground">{CATEGORIAS[g.c]}</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {g.items.map((h) => <Badge key={h.id} variant="outline">{h.nivel} · {h.nombre}</Badge>)}
              </div>
            </div>
          ))}
          {vista.habilidades.length === 0 && <p className="text-muted-foreground">No marcó habilidades.</p>}
        </div>
      )}
      <h4 className="font-semibold pt-2">Tallas</h4>
      <div className="grid gap-2 sm:grid-cols-3">
        {CAMPOS_TALLA.map((c) => (
          <div key={c.clave}>
            <span className="text-xs text-muted-foreground">{c.etiqueta}</span>
            <div>{vista.tallas[c.clave] || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
