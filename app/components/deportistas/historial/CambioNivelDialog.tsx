"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api";
import { registrarCambioNivel } from "@/lib/deportistas-historiales";
import type { Nivel } from "@/app/deportistas/types";

interface Props {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  deportistaId: number;
  niveles: Nivel[];
  onGuardado: () => void;
}

const VACIO = { nivelId: 0, motivo: "", fechaCambio: "" };

export default function CambioNivelDialog({ open, onOpenChange, deportistaId, niveles, onGuardado }: Props) {
  const [form, setForm] = useState(VACIO);

  const guardar = async () => {
    try {
      await registrarCambioNivel({
        deportistaId,
        nivelId: Number(form.nivelId),
        motivo: form.motivo || undefined,
        fechaCambio: form.fechaCambio || undefined,
      });
      toast.success("Cambio de nivel registrado");
      onOpenChange(false);
      setForm(VACIO);
      onGuardado();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "No se pudo registrar el cambio de nivel"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Cambio de Nivel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Nuevo Nivel</Label>
            <Select
              value={form.nivelId ? form.nivelId.toString() : ""}
              onValueChange={(value) => setForm({ ...form, nivelId: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar nivel" />
              </SelectTrigger>
              <SelectContent>
                {niveles.map((nivel) => (
                  <SelectItem key={nivel.id} value={nivel.id.toString()}>
                    {nivel.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fecha de Cambio (opcional)</Label>
            <Input
              type="date"
              value={form.fechaCambio}
              onChange={(e) => setForm({ ...form, fechaCambio: e.target.value })}
            />
          </div>
          <div>
            <Label>Motivo</Label>
            <Input value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={!form.nivelId}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
