"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

// El backend (Models/Org_dep/Division.java) solo tiene "id" y "nombre" —
// no hay campo de descripción en la tabla `divisiones`, así que estos
// modales no lo piden (pedirlo sin poder guardarlo sería engañoso).
export interface Division {
  id: number;
  nombre: string;
}

export function ModalCrearDivision({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState("");

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setGuardando(true);
    try {
      await api.post("/api/divisiones", { nombre });
      toast.success("División creada");
      onCreated();
      setOpen(false);
      setNombre("");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo crear la división",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nueva División
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva división</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. SENIOR"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={guardando}>
            {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ModalEditarDivision({
  division,
  onUpdated,
}: {
  division: Division;
  onUpdated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState(division.nombre);

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setGuardando(true);
    try {
      await api.put(`/api/divisiones/${division.id}`, { nombre });
      toast.success("División actualizada");
      onUpdated();
      setOpen(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo actualizar la división",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-1" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar división</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={guardando}>
            {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ModalEliminarDivision({
  divisionId,
  nombre,
  onDeleted,
}: {
  divisionId: number;
  nombre: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const handleDelete = async () => {
    setEliminando(true);
    try {
      await api.delete(`/api/divisiones/${divisionId}`);
      toast.success("División eliminada");
      onDeleted();
      setOpen(false);
    } catch (error: any) {
      // Si hay categorías de nivel u otros registros que dependen de esta
      // división, el backend probablemente lo rechace por integridad
      // referencial — se lo mostramos tal cual en vez de un error genérico.
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo eliminar la división",
      );
    } finally {
      setEliminando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-1" /> Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar división "{nombre}"?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Esta acción no se puede deshacer.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={eliminando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={eliminando}>
            {eliminando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}