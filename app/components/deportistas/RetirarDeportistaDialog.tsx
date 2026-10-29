"use client";

import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, getErrorMessage } from "@/lib/api";

interface Props {
  /** Id del deportista a retirar; null = diálogo cerrado. */
  deportistaId: number | null;
  onClose: () => void;
  onRetirado: () => void;
}

export default function RetirarDeportistaDialog({ deportistaId, onClose, onRetirado }: Props) {
  const retirar = async () => {
    if (deportistaId === null) return;
    try {
      await api.patch(`/api/deportistas/${deportistaId}`);
      toast.success("Deportista retirado: inscripción cerrada y fuera de su grupo");
      onRetirado();
    } catch (error) {
      console.error("Error al retirar deportista", error);
      toast.error(getErrorMessage(error, "No se pudo retirar el deportista"));
    }
    onClose();
  };

  return (
    <Dialog open={deportistaId !== null} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirar deportista</DialogTitle>
        </DialogHeader>
        <p>¿Retirar al deportista del club?</p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Su estado pasa a <strong>Retirado</strong> (queda en el historial).</li>
          <li>Se <strong>cierra su inscripción</strong>: no se le generan más cobros mensuales.</li>
          <li>Sale de su grupo de entrenamiento.</li>
          <li>Las facturas ya emitidas se conservan: la deuda pendiente sigue visible en Facturas.</li>
          <li>Su usuario se desactiva.</li>
        </ul>
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
