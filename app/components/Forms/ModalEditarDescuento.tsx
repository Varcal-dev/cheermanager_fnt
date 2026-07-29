"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface CrearDescuentoModalProps {
  onCreated: () => void;
}

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  porcentaje: 0,
  fechaInicio: "",
  fechaFin: "",
};

export default function ModalCrearDescuento({ onCreated }: CrearDescuentoModalProps) {
  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.fechaInicio) {
      toast.error("Nombre y fecha de inicio son obligatorios");
      return;
    }

    setGuardando(true);
    try {
      // Antes esto era un fetch() crudo sin el header de autorización —
      // el backend probablemente lo rechazaba con 401 y el error se perdía
      // en silencio porque no había try/catch.
      await api.post("/api/descuentos", {
        ...form,
        porcentaje: Number(form.porcentaje),
        fechaFin: form.fechaFin || null,
      });
      onCreated();
      setOpen(false);
      setForm(FORM_VACIO);
      toast.success("Nuevo descuento agregado");
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data || "No se pudo crear el descuento");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" />Nuevo Descuento</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear nuevo descuento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input name="nombre" value={form.nombre} onChange={handleChange} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea name="descripcion" value={form.descripcion} onChange={handleChange} />
          </div>
          <div>
            <Label>Porcentaje (%)</Label>
            <Input
              name="porcentaje"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={form.porcentaje}
              onChange={handleChange}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Fecha inicio</Label>
              <Input name="fechaInicio" type="date" value={form.fechaInicio} onChange={handleChange} />
            </div>
            <div className="flex-1">
              <Label>
                Fecha fin <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input name="fechaFin" type="date" value={form.fechaFin} onChange={handleChange} />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={guardando}>
            {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}