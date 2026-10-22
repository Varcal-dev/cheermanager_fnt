"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Diálogo genérico para ANULAR (facturas y pagos no se borran: se anulan con
// motivo, y el servidor guarda además la fecha y el usuario).
export default function AnularDialog({
  open,
  onOpenChange,
  titulo,
  descripcion,
  onConfirmar,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descripcion: string;
  /** Debe lanzar si falla (el diálogo se queda abierto); si resuelve, se cierra. */
  onConfirmar: (motivo: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) setMotivo("");
  }, [open]);

  const valido = motivo.trim().length >= 5;

  const confirmar = async () => {
    if (!valido) return;
    setGuardando(true);
    try {
      await onConfirmar(motivo.trim());
      onOpenChange(false);
    } catch {
      // el llamador ya mostró el error; se deja abierto para reintentar
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motivo-anulacion">Motivo (obligatorio)</Label>
          <Textarea
            id="motivo-anulacion"
            value={motivo}
            maxLength={300}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej.: pago duplicado, error de digitación, deportista retirado…"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmar} disabled={!valido || guardando}>
            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Anular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
