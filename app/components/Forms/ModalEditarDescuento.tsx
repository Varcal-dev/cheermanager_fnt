"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { Descuento } from "@/app/descuentos/page";

interface EditarDescuentoModalProps {
  descuento: Descuento;
  onUpdated: () => void;
}

// Convierte lo que venga del backend (fecha completa ISO o solo yyyy-MM-dd)
// al formato que espera <input type="date">.
const aInputDate = (valor: string | null) => (valor ? valor.slice(0, 10) : "");

export default function ModalEditarDescuento({ descuento, onUpdated }: EditarDescuentoModalProps) {
  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre: descuento.nombre,
    descripcion: descuento.descripcion ?? "",
    porcentaje: descuento.porcentaje,
    fechaInicio: aInputDate(descuento.fechaInicio),
    fechaFin: aInputDate(descuento.fechaFin),
  });

  // Si el usuario abre el modal de otro descuento sin que el componente se
  // desmonte (misma fila reutilizada), refrescamos el formulario con los
  // datos vigentes de ese descuento en concreto.
  useEffect(() => {
    if (!open) return;
    setForm({
      nombre: descuento.nombre,
      descripcion: descuento.descripcion ?? "",
      porcentaje: descuento.porcentaje,
      fechaInicio: aInputDate(descuento.fechaInicio),
      fechaFin: aInputDate(descuento.fechaFin),
    });
  }, [open, descuento]);

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
      await api.put(`/api/descuentos/${descuento.id}`, {
        ...form,
        porcentaje: Number(form.porcentaje),
        fechaFin: form.fechaFin || null,
        activo: descuento.activo,
      });
      onUpdated();
      setOpen(false);
      toast.success("Descuento actualizado");
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data || "No se pudo actualizar el descuento");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-1" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar descuento</DialogTitle>
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
            Guardar cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}