"use client";

import { useState } from "react";
import { Copy, Check, KeyRound } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, getErrorMessage } from "@/lib/api";

/**
 * Llama a POST /api/usuario/{id}/clave-temporal (permiso restablecer_clave_usuario).
 * El back devuelve la clave UNA sola vez: por eso se muestra en un diálogo que
 * no se puede reabrir. Devuelve la clave o null si falló (ya muestra el error).
 */
export async function generarClaveTemporal(usuarioId: number): Promise<string | null> {
  try {
    const res = await api.post(`/api/usuario/${usuarioId}/clave-temporal`);
    return res.data?.claveTemporal ?? null;
  } catch (error: any) {
    toast.error(getErrorMessage(error, "No se pudo generar la clave temporal"));
    return null;
  }
}

interface Props {
  /** Clave a mostrar; si es null el diálogo está cerrado. */
  clave: string | null;
  /** Usuario (username) al que pertenece, solo para el texto. */
  username?: string;
  onClose: () => void;
}

export default function ClaveTemporalDialog({ clave, username, onClose }: Props) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    if (!clave) return;
    try {
      await navigator.clipboard.writeText(clave);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No se pudo copiar; selecciónala y cópiala a mano");
    }
  };

  return (
    <Dialog open={clave !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Clave temporal generada
          </DialogTitle>
          <DialogDescription>
            {username ? `Usuario: ${username}. ` : ""}Esta clave se muestra <strong>una sola vez</strong>.
            Entrégala por un canal privado; la persona deberá cambiarla al iniciar sesión.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-3">
          <code className="flex-1 select-all break-all text-lg font-mono tracking-wider">{clave}</code>
          <Button type="button" size="icon" variant="outline" onClick={copiar} aria-label="Copiar clave">
            {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Ya la guardé</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}