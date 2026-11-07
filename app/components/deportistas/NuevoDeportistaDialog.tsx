"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type Genero, type Nivel } from "@/app/deportistas/types";
import PreinscripcionForm from "./PreinscripcionForm";

interface Props {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  niveles: Nivel[];
  generos: Genero[];
  /** Se llama después de guardar (para recargar la lista). */
  onGuardado: () => void;
}

// El formulario vive en PreinscripcionForm (el mismo de la página /pre-inscribir).
export default function NuevoDeportistaDialog({ open, onOpenChange, niveles, generos, onGuardado }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Deportista</DialogTitle>
          <DialogDescription>Completa el formulario para agregar un nuevo deportista al sistema.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <PreinscripcionForm
            niveles={niveles}
            generos={generos}
            onGuardado={() => {
              onGuardado();
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}