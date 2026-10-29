"use client";

import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, getErrorMessage } from "@/lib/api";

interface Props {
  /** Id del entrenador a retirar; null = diálogo cerrado. */
  entrenadorId: number | null;
  /** Id del estado "Retirado" (se busca en el catálogo de estados). */
  estadoRetiradoId: number | undefined;
  onClose: () => void;
  onRetirado: () => void;
}

// El endpoint de "eliminar" del back está comentado; lo que sí existe es cambiar el estado, así que se
// pasa al entrenador a "Retirado". OJO: esto NO desactiva su usuario de acceso; eso se hace en
// Administración → Usuarios.
export default function RetirarEntrenadorDialog({ entrenadorId, estadoRetiradoId, onClose, onRetirado }: Props) {
  const retirar = async () => {
    if (entrenadorId === null) return;
    if (estadoRetiradoId === undefined) {
      toast.error('No se encontró el estado "Retirado" en el catálogo de estados.');
      return;
    }
    try {
      await api.patch(`/api/entrenadores/${entrenadorId}`, { estadoId: estadoRetiradoId });
      toast.success("Entrenador retirado correctamente");
      onRetirado();
    } catch (error) {
      console.error("Error al retirar entrenador", error);
      toast.error(getErrorMessage(error, "No se pudo retirar el entrenador"));
    }
    onClose();
  };

  return (
    <Dialog open={entrenadorId !== null} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirar entrenador</DialogTitle>
        </DialogHeader>
        <p>¿Estás seguro que deseas retirar a este entrenador? Pasará a estado "Retirado".</p>
        <p className="text-sm text-muted-foreground">
          Su usuario de acceso no se desactiva: eso se hace en Administración → Usuarios.
        </p>
        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={retirar}>
            Sí, retirar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
