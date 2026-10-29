"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, getErrorMessage } from "@/lib/api";

interface Props {
  /** Deportista retirado a reactivar; null = diálogo cerrado. */
  deportista: { id: number; nombre: string } | null;
  onClose: () => void;
  onReactivado: () => void;
}

// Reactivar: estado Activo + usuario; la inscripción se hace con una matrícula nueva.
export default function ReactivarDeportistaDialog({ deportista, onClose, onReactivado }: Props) {
  const [motivo, setMotivo] = useState("");
  const [reactivando, setReactivando] = useState(false);

  useEffect(() => {
    if (deportista) setMotivo("");
  }, [deportista]);

  const reactivar = async () => {
    if (!deportista) return;
    setReactivando(true);
    try {
      const { data } = await api.patch(`/api/deportistas/${deportista.id}/reactivar`, {
        motivo: motivo.trim() || null,
      });
      toast.success(
        data?.requiereMatricula
          ? `${deportista.nombre} reactivado. Falta matricularlo para que vuelva a tener inscripción y cobros.`
          : `${deportista.nombre} reactivado`,
      );
      onClose();
      onReactivado();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo reactivar el deportista"));
    } finally {
      setReactivando(false);
    }
  };

  return (
    <Dialog open={deportista !== null} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reactivar deportista</DialogTitle>
        </DialogHeader>
        <p>¿Reactivar a {deportista?.nombre}?</p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Su estado vuelve a <strong>Activo</strong> (queda en el historial).</li>
          <li>Su usuario se vuelve a activar, con la misma clave.</li>
          <li>
            <strong>No se reabre la inscripción ni vuelve a su grupo</strong>: después hay que matricularlo de nuevo
            (botón "Matricular").
          </li>
          <li>Las facturas del retiro quedan como estaban.</li>
        </ul>
        <div className="grid gap-1.5 mt-3">
          <Label>Motivo (opcional)</Label>
          <Input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. El retiro fue un error / vuelve a entrenar"
            maxLength={200}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={reactivar} disabled={reactivando}>
            {reactivando ? "Reactivando..." : "Sí, reactivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
