"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ModalEliminarConvenioProps {
  convenioId: number;
  nombreEmpresa: string;
  onEliminado: () => void;
}

export function ModalEliminarConvenio({
  convenioId,
  nombreEmpresa,
  onEliminado,
}: ModalEliminarConvenioProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const eliminarConvenio = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/convenios/${convenioId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        onEliminado();
        setOpen(false);
      } else {
        console.error("Error al eliminar convenio");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 mr-1" /> Eliminar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar convenio con {nombreEmpresa}?</DialogTitle>
          </DialogHeader>
          <p>
            Esta acción no se puede deshacer. ¿Estás seguro de que deseas
            continuar?
          </p>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={eliminarConvenio}
              disabled={loading}
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
