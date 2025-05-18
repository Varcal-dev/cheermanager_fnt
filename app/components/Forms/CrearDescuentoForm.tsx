import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";

interface CrearDescuentoModalProps {
  onCreated: () => void;
}

export default function ModalCrearDescuento({ onCreated }: CrearDescuentoModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    porcentaje: 0,
    fechaInicio: "",
    fechaFin: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    console.log("Datos: ", form)
    await fetch("http://localhost:8080/api/descuentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onCreated(); // recargar descuentos
    setOpen(false); // cerrar modal
    setForm({ nombre: "", descripcion: "", porcentaje: 0, fechaInicio: "", fechaFin: "" }); // limpiar
    toast.success("Nuevo descuento Agregado")
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
              <Label>Fecha fin</Label>
              <Input name="fechaFin" type="date" value={form.fechaFin} onChange={handleChange} />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
