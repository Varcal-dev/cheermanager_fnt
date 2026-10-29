"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api";
import { registrarCambioPlan, type PlanPago } from "@/lib/deportistas-historiales";

interface Props {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  deportistaId: number;
  planesPago: PlanPago[];
  onGuardado: () => void;
}

const VACIO = { planPagoId: 0, motivoCambio: "", fechaCambio: "" };

export default function CambioPlanDialog({ open, onOpenChange, deportistaId, planesPago, onGuardado }: Props) {
  const [form, setForm] = useState(VACIO);

  const guardar = async () => {
    try {
      await registrarCambioPlan({
        deportistaId,
        planPagoId: Number(form.planPagoId),
        motivoCambio: form.motivoCambio || undefined,
        fechaCambio: form.fechaCambio || undefined,
      });
      toast.success("Cambio de plan registrado");
      onOpenChange(false);
      setForm(VACIO);
      onGuardado();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, "No se pudo registrar el cambio de plan"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Cambio de Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Nuevo Plan</Label>
            <Select
              value={form.planPagoId ? form.planPagoId.toString() : ""}
              onValueChange={(value) => setForm({ ...form, planPagoId: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plan" />
              </SelectTrigger>
              <SelectContent>
                {planesPago.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.nombre}
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
            <Label>Motivo del Cambio</Label>
            <Input value={form.motivoCambio} onChange={(e) => setForm({ ...form, motivoCambio: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={!form.planPagoId}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
