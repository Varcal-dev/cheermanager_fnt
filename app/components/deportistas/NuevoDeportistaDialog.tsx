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
      {/* El formulario (datos + ficha deportiva) es más alto que muchas pantallas: la cabecera queda fija y el cuerpo
          hace scroll, igual que en EditarDeportistaDialog. */}
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 max-sm:top-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none">
        <DialogHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pt-6 max-sm:pr-12">
          <DialogTitle>Registrar Nuevo Deportista</DialogTitle>
          <DialogDescription>Completa el formulario para agregar un nuevo deportista al sistema.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
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