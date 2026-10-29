"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, getErrorMessage } from "@/lib/api";
import type { Usuario } from "@/app/usuarios/types";

interface Props {
  /** Usuario a eliminar; null = diálogo cerrado. */
  usuario: Usuario | null;
  onClose: () => void;
  onEliminado: () => void;
}

export default function EliminarUsuarioDialog({ usuario, onClose, onEliminado }: Props) {
  const [eliminando, setEliminando] = useState(false);

  const eliminar = async () => {
    if (!usuario) return;
    setEliminando(true);
    try {
      await api.delete(`/api/usuario/eliminar/${usuario.id}`);
      toast.success("Usuario eliminado");
      onClose();
      onEliminado();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      toast.error(getErrorMessage(error, "No se pudo eliminar el usuario"));
    } finally {
      setEliminando(false);
    }
  };

  return (
    <Dialog open={usuario !== null} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar al usuario "{usuario?.username}"? Esta acción no se puede
            deshacer. Si solo quieres que no pueda ingresar, usa "Desactivar".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button variant="destructive" onClick={eliminar} disabled={eliminando}>
            {eliminando ? "Eliminando..." : "Eliminar"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
