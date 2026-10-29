"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, getErrorMessage } from "@/lib/api";
import type { Entrenador, Genero } from "@/app/entrenadores/types";

interface FormEdicion {
  id: number;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  generoId: number;
  direccion: string;
  telefono: string;
  fechaContratacion: string;
  especializacion: string;
}

function desdeEntrenador(e: Entrenador): FormEdicion {
  return {
    id: e.id,
    nombre: e.persona?.nombre || "",
    apellidos: e.persona?.apellidos || "",
    direccion: e.persona?.direccion || "",
    telefono: e.persona?.telefono || "",
    fechaNacimiento: e.persona?.fechaNacimiento || "",
    generoId: e.persona?.generoId || 1,
    fechaContratacion: e.fechaContratacion || "",
    especializacion: e.especializacion || "",
  };
}

interface Props {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  entrenador: Entrenador | null;
  generos: Genero[];
  /** Se llama después de guardar (para recargar la lista). */
  onGuardado: () => void;
}

export default function EditarEntrenadorDialog({ open, onOpenChange, entrenador, generos, onGuardado }: Props) {
  const [form, setForm] = useState<FormEdicion | null>(entrenador ? desdeEntrenador(entrenador) : null);

  // Llena el formulario cada vez que se abre con un entrenador.
  useEffect(() => {
    if (entrenador) setForm(desdeEntrenador(entrenador));
  }, [entrenador, open]);

  if (!form) return null;

  const cambiarTexto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  // El back expone la edición como PATCH /api/entrenadores/{id}.
  const actualizar = () => {
    if (!form.nombre.trim() || !form.apellidos.trim()) {
      toast.error("Nombre y apellidos son obligatorios.");
      return;
    }
    api
      .patch(`/api/entrenadores/${form.id}`, {
        nombre: form.nombre,
        apellidos: form.apellidos,
        direccion: form.direccion,
        telefono: form.telefono,
        fechaNacimiento: form.fechaNacimiento || null,
        generoId: form.generoId,
        fechaContratacion: form.fechaContratacion || null,
        especializacion: form.especializacion,
      })
      .then(() => {
        onOpenChange(false);
        onGuardado();
        toast.success("Entrenador actualizado correctamente");
      })
      .catch((error) => {
        console.error("Error al actualizar entrenador", error);
        toast.error(getErrorMessage(error, "No se pudo actualizar el entrenador"));
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Entrenador</DialogTitle>
          <DialogDescription>Completa el formulario para editar un entrenador existente.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 grid-cols-2">
          <div>
            <Label htmlFor="e-nombre">Nombre</Label>
            <Input id="e-nombre" name="nombre" value={form.nombre} onChange={cambiarTexto} />
          </div>
          <div>
            <Label htmlFor="e-apellidos">Apellidos</Label>
            <Input id="e-apellidos" name="apellidos" value={form.apellidos} onChange={cambiarTexto} />
          </div>
          <div>
            <Label htmlFor="e-direccion">Dirección</Label>
            <Input id="e-direccion" name="direccion" value={form.direccion} onChange={cambiarTexto} />
          </div>
          <div>
            <Label htmlFor="e-telefono">Teléfono</Label>
            <Input id="e-telefono" name="telefono" value={form.telefono} onChange={cambiarTexto} />
          </div>
          <div>
            <Label htmlFor="e-fechaNacimiento">Fecha Nacimiento</Label>
            <Input
              type="date"
              id="e-fechaNacimiento"
              name="fechaNacimiento"
              value={form.fechaNacimiento}
              onChange={cambiarTexto}
            />
          </div>
          <div>
            <Label htmlFor="e-especializacion">Especialización</Label>
            <Input
              id="e-especializacion"
              name="especializacion"
              value={form.especializacion}
              onChange={cambiarTexto}
            />
          </div>
          <div>
            <Label htmlFor="e-generoId">Género</Label>
            <Select
              value={form.generoId?.toString() || ""}
              onValueChange={(value) => setForm({ ...form, generoId: Number(value) })}
            >
              <SelectTrigger id="e-generoId" className="w-full">
                <SelectValue placeholder="Seleccionar género" />
              </SelectTrigger>
              <SelectContent>
                {generos.map((g) => (
                  <SelectItem key={g.id} value={g.id.toString()}>
                    {g.genero}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={actualizar}>Actualizar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
