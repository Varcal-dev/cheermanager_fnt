// ModalEliminarDescuento.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ModalEliminarProps {
  descuentoId: number;
  onDeleted: () => void;
}

export default function ModalEliminarDescuento({
  descuentoId,
  onDeleted,
}: ModalEliminarProps) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    await fetch(`http://localhost:8080/api/descuentos/${descuentoId}`, { method: "DELETE" });
    onDeleted();
    setOpen(false);
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
          <DialogTitle>Eliminar descuento</DialogTitle>
        </DialogHeader>
        <p>
          ¿Estás seguro de que deseas eliminar este descuento? Esta acción no se
          puede deshacer.
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
