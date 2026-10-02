"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

const ROLES = ["Entrenador Principal", "Entrenador Asistente"];

interface EditarAsignacionEntrenadorModalProps {
  asignacionId: number;
  grupoNombre: string;
  rolActual: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActualizado: () => void;
}

export default function EditarAsignacionEntrenadorModal({
  asignacionId,
  grupoNombre,
  rolActual,
  open,
  onOpenChange,
  onActualizado,
}: EditarAsignacionEntrenadorModalProps) {
  const [rol, setRol] = useState(rolActual);
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async () => {
    setGuardando(true);
    try {
      await api.put(`/api/grupos/asignaciones-entrenador/${asignacionId}`, { rol });
      toast.success("Asignación actualizada");
      onOpenChange(false);
      onActualizado();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo actualizar la asignación",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar rol en "{grupoNombre}"</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Rol</Label>
            <Select value={rol} onValueChange={setRol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Para cambiar los horarios (día/hora) de este grupo, hazlo desde el módulo
            Horarios — acá solo se edita el rol de este entrenador en el grupo, porque
            el horario es compartido por todo el grupo, no solo por este entrenador.
          </p>
          <Button onClick={handleSubmit} className="w-full" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}