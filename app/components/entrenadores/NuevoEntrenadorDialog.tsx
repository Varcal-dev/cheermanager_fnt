"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, getErrorMessage } from "@/lib/api";
import type { EstadoPersona, Genero } from "@/app/entrenadores/types";

const FORM_INICIAL = {
  rolId: 0,
  nombre: "",
  apellidos: "",
  direccion: "",
  telefono: "",
  fechaNacimiento: "",
  generoId: 0,
  especializacion: "",
  estadoId: 0,
};

interface Props {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  generos: Genero[];
  estados: EstadoPersona[];
  /** Se llama después de guardar (para recargar la lista). */
  onGuardado: () => void;
}

export default function NuevoEntrenadorDialog({ open, onOpenChange, generos, estados, onGuardado }: Props) {
  const [form, setForm] = useState(FORM_INICIAL);

  const cambiarTexto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.apellidos.trim() || !form.rolId || !form.generoId || !form.estadoId) {
      toast.error("Completa rol, nombre, apellidos, género y estado.");
      return;
    }
    try {
      await api.post(
        "/api/entrenadores",
        {
          rolIdE: form.rolId,
          nombre: form.nombre,
          apellidos: form.apellidos,
          direccion: form.direccion,
          telefono: form.telefono,
          fechaNacimiento: form.fechaNacimiento,
          generoId: form.generoId,
          fechaContratacion: new Date().toISOString(),
          especializacion: form.especializacion,
          estadoId: form.estadoId,
        },
        { withCredentials: true },
      );
      toast.success("Entrenador guardado con éxito");
      // Su usuario se crea con una clave aleatoria (ya no existe "0000"): el acceso se entrega
      // generando una clave temporal en Administración → Usuarios.
      toast.info("Para que pueda ingresar, genera su clave temporal en Administración → Usuarios.", {
        autoClose: 8000,
      });
      onOpenChange(false);
      setForm(FORM_INICIAL);
      onGuardado();
    } catch (error) {
      console.error("Error guardando entrenador:", error);
      toast.error(getErrorMessage(error, "Error guardando entrenador"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Entrenador</DialogTitle>
          <DialogDescription>Completa el formulario para agregar un nuevo entrenador al sistema.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 grid-cols-2">
          <div>
            <Label htmlFor="rolId">Rol</Label>
            <Select
              value={form.rolId ? form.rolId.toString() : ""}
              onValueChange={(value) => setForm({ ...form, rolId: Number(value) })}
            >
              <SelectTrigger id="rolId" className="w-full">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Entrenador</SelectItem>
                <SelectItem value="4">Asistente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" value={form.nombre} onChange={cambiarTexto} />
          </div>
          <div>
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input id="apellidos" name="apellidos" value={form.apellidos} onChange={cambiarTexto} />
          </div>
          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" name="direccion" value={form.direccion} onChange={cambiarTexto} />
          </div>
          <div>
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" name="telefono" value={form.telefono} onChange={cambiarTexto} />
          </div>
          <div>
            <Label htmlFor="fechaNacimiento">Fecha Nacimiento</Label>
            <Input
              type="date"
              id="fechaNacimiento"
              name="fechaNacimiento"
              value={form.fechaNacimiento}
              onChange={cambiarTexto}
            />
          </div>
          <div>
            <Label htmlFor="especializacion">Especialización</Label>
            <Input
              id="especializacion"
              name="especializacion"
              value={form.especializacion}
              onChange={cambiarTexto}
            />
          </div>
          <div>
            <Label htmlFor="generoId">Género</Label>
            <Select
              value={form.generoId ? form.generoId.toString() : ""}
              onValueChange={(value) => setForm({ ...form, generoId: Number(value) })}
            >
              <SelectTrigger id="generoId" className="w-full">
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
          <div>
            <Label htmlFor="estadoId">Estado</Label>
            <Select
              value={form.estadoId ? form.estadoId.toString() : ""}
              onValueChange={(value) => setForm({ ...form, estadoId: Number(value) })}
            >
              <SelectTrigger id="estadoId" className="w-full">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {estados.map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={guardar}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
