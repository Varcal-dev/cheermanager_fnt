"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generarClaveTemporal } from "@/app/components/Forms/ClaveTemporalDialog";
import type { Usuario } from "@/app/usuarios/types";

interface Props {
  /** Usuario al que se le generará la clave; null = diálogo cerrado. */
  usuario: Usuario | null;
  onClose: () => void;
  /** Recibe la clave generada para mostrarla una sola vez. */
  onGenerada: (r: { clave: string; username: string }) => void;
}

export default function GenerarClaveDialog({ usuario, onClose, onGenerada }: Props) {
  const [generando, setGenerando] = useState(false);

  const generar = async () => {
    if (!usuario) return;
    setGenerando(true);
    const clave = await generarClaveTemporal(usuario.id);
    setGenerando(false);
    if (clave) {
      onGenerada({ clave, username: usuario.username });
      onClose();
    }
  };

  return (
    <Dialog open={usuario !== null} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Generar clave temporal</DialogTitle>
          <DialogDescription>
            Se creará una clave nueva para {usuario?.username}, que reemplaza la actual y desbloquea la cuenta.
            Deberá cambiarla al iniciar sesión. Las sesiones ya abiertas siguen válidas hasta que venza su token.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={generar} disabled={generando}>
            {generando ? "Generando..." : "Generar clave"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
