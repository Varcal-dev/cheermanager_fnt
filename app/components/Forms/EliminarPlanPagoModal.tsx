"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

export function EliminarPlanPagoModal({
  planId,
  onEliminado,
}: {
  planId: number;
  onEliminado: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEliminar = async () => {
    setLoading(true);
    try {
      // Antes esto usaba axios "pelado" (sin el interceptor que agrega el
      // Bearer token), así que el borrado fallaba en silencio por falta de
      // autenticación. `api` sí lleva el token.
      await api.delete(`/api/planes-pago/${planId}`);
      toast.success("Plan eliminado correctamente");
      onEliminado();
      setOpen(false);
    } catch (error: any) {
      console.error("Error al eliminar plan:", error);
      toast.error(error.response?.data ?? "Error al eliminar el plan");
    } finally {
      setLoading(false);
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
          <DialogTitle>Confirmar eliminación</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          ¿Estás seguro de que deseas eliminar este plan? Esta acción no se
          puede deshacer.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleEliminar} disabled={loading}>
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}