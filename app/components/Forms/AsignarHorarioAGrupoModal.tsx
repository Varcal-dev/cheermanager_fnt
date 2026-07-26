"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GrupoSimple {
  id: number;
  nombre: string;
}

// Vincula un Horario que YA existe a otro grupo distinto. Útil para el
// escenario que menciona el backend: dos niveles que entrenan a la misma
// hora en gimnasios distintos pueden compartir el mismo bloque de horario.
export default function AsignarHorarioAGrupoModal({
  open,
  onOpenChange,
  horarioId,
  horarioLabel,
  grupos,
  gruposYaAsignados,
  onAsignado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  horarioId: number | null;
  horarioLabel?: string;
  grupos: GrupoSimple[];
  gruposYaAsignados: number[];
  onAsignado: () => void;
}) {
  const [grupoId, setGrupoId] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) setGrupoId("");
  }, [open]);

  const gruposDisponibles = grupos.filter(
    (g) => !gruposYaAsignados.includes(g.id),
  );

  const handleAsignar = async () => {
    if (!horarioId || !grupoId) return;
    setGuardando(true);
    try {
      await api.post(`/api/horarios/asignar-grupo`, {
        horarioId,
        grupoEntrenamientoId: Number(grupoId),
      });
      toast.success("Horario asignado al grupo correctamente");
      onAsignado();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al asignar horario a grupo:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Error al asignar el horario. Intenta de nuevo.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar horario a otro grupo</DialogTitle>
          <DialogDescription>
            {horarioLabel
              ? `Vincula "${horarioLabel}" a un grupo adicional.`
              : "Selecciona el grupo al que quieres vincular este horario."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label className="text-sm font-medium">Grupo</label>
          <Select onValueChange={setGrupoId} value={grupoId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar grupo" />
            </SelectTrigger>
            <SelectContent>
              {gruposDisponibles.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  Este horario ya está asignado a todos los grupos
                </div>
              ) : (
                gruposDisponibles.map((g) => (
                  <SelectItem key={g.id} value={g.id.toString()}>
                    {g.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAsignar} disabled={!grupoId || guardando}>
            {guardando ? "Asignando..." : "Asignar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}