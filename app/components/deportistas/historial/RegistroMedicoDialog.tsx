"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api";
import { crearHistorialMedico } from "@/lib/deportistas-historiales";

interface Props {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  deportistaId: number;
  onGuardado: () => void;
}

const VACIO = {
  descripcion: "",
  fechaRegistro: "",
  tipoRegistro: "",
  gravedad: "",
  medicoTratante: "",
};

export default function RegistroMedicoDialog({ open, onOpenChange, deportistaId, onGuardado }: Props) {
  const [form, setForm] = useState(VACIO);

  const guardar = async () => {
    try {
      await crearHistorialMedico(deportistaId, {
        descripcion: form.descripcion,
        fechaRegistro: form.fechaRegistro,
        tipoRegistro: form.tipoRegistro || undefined,
        gravedad: form.gravedad || undefined,
        medicoTratante: form.medicoTratante || undefined,
      });
      toast.success("Registro médico guardado");
      onOpenChange(false);
      setForm(VACIO);
      onGuardado();
    } catch (error) {
      console.error(error);
      // Si el club exige consentimiento de datos de salud, el back responde con el motivo
      // (hay que registrarlo antes en la pestaña "Acudientes y consentimientos").
      toast.error(getErrorMessage(error, "No se pudo guardar el registro médico"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Registro Médico</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Descripción</Label>
            <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div>
            <Label>Fecha de Registro</Label>
            <Input
              type="date"
              value={form.fechaRegistro}
              onChange={(e) => setForm({ ...form, fechaRegistro: e.target.value })}
            />
          </div>
          <div>
            <Label>Tipo de Registro</Label>
            <Input
              placeholder="Ej: Alergia, Lesión, Condición crónica..."
              value={form.tipoRegistro}
              onChange={(e) => setForm({ ...form, tipoRegistro: e.target.value })}
            />
          </div>
          <div>
            <Label>Gravedad</Label>
            <Input
              placeholder="Ej: Leve, Moderada, Grave"
              value={form.gravedad}
              onChange={(e) => setForm({ ...form, gravedad: e.target.value })}
            />
          </div>
          <div>
            <Label>Médico Tratante</Label>
            <Input value={form.medicoTratante} onChange={(e) => setForm({ ...form, medicoTratante: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={!form.descripcion || !form.fechaRegistro}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
