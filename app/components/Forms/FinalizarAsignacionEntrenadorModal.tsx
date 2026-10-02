"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface FinalizarAsignacionEntrenadorModalProps {
  asignacionId: number;
  grupoNombre: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinalizado: () => void;
}

export default function FinalizarAsignacionEntrenadorModal({
  asignacionId,
  grupoNombre,
  open,
  onOpenChange,
  onFinalizado,
}: FinalizarAsignacionEntrenadorModalProps) {
  const [loading, setLoading] = useState(false);

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      await api.delete(`/api/grupos/asignaciones-entrenador/${asignacionId}`);
      toast.success("Asignación finalizada");
      onOpenChange(false);
      onFinalizado();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo finalizar la asignación",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Finalizar asignación a "{grupoNombre}"?</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          No se borra el historial — se marca la fecha de hoy como fecha de fin. El
          entrenador dejará de aparecer en este grupo (y en su horario) desde ahora,
          pero la asignación seguirá visible como histórica.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleFinalizar} disabled={loading}>
            {loading ? "Finalizando..." : "Sí, finalizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}