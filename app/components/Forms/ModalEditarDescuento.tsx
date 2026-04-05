// ModalEditarDescuento.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

interface Descuento {
  id: number;
  nombre: string;
  descripcion: string;
  porcentaje: number;
  fechaInicio: string;
  fechaFin: string;
}

interface ModalEditarProps {
  descuento: Descuento;
  onUpdated: () => void;
}

export default function ModalEditarDescuento({
  descuento,
  onUpdated,
}: ModalEditarProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(descuento);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/descuentos/${descuento.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onUpdated();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-1" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Descuento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input name="nombre" value={form.nombre} onChange={handleChange} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label>Porcentaje</Label>
            <Input
              name="porcentaje"
              type="number"
              value={form.porcentaje}
              onChange={handleChange}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Fecha inicio</Label>
              <Input
                name="fechaInicio"
                type="date"
                value={form.fechaInicio}
                onChange={handleChange}
              />
            </div>
            <div className="flex-1">
              <Label>Fecha fin</Label>
              <Input
                name="fechaFin"
                type="date"
                value={form.fechaFin}
                onChange={handleChange}
              />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
