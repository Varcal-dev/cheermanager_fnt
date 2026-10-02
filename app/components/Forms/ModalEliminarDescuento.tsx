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

interface EliminarDescuentoModalProps {
  descuentoId: number;
  nombreDescuento: string;
  onDeleted: () => void;
}

export default function ModalEliminarDescuento({
  descuentoId,
  nombreDescuento,
  onDeleted,
}: EliminarDescuentoModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEliminar = async () => {
    setLoading(true);
    try {
      await api.delete(`/api/descuentos/${descuentoId}`);
      toast.success("Descuento eliminado");
      onDeleted();
      setOpen(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo eliminar el descuento",
      );
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
          <DialogTitle>¿Eliminar "{nombreDescuento}"?</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Esta acción no se puede deshacer. Si el descuento está en uso por algún convenio,
          el backend rechazará el borrado — en ese caso, considera desactivarlo en vez de eliminarlo.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
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