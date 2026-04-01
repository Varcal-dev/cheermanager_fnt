import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import axios from "axios";

interface ModalCrearPlanInscripcionProps {
  fetchPlanes: () => void;
}

export function ModalCrearPlanInscripcion({
  fetchPlanes,
}: ModalCrearPlanInscripcionProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    valor: "",
    fechaVigenciaInicio: "",
    fechaVigenciaFin: "",
    activo: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, activo: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validar campos
      if (
        !formData.nombre ||
        !formData.valor ||
        !formData.fechaVigenciaInicio ||
        !formData.fechaVigenciaFin
      ) {
        throw new Error("Por favor complete todos los campos obligatorios");
      }

      // Validar fechas
      const fechaInicio = new Date(formData.fechaVigenciaInicio);
      const fechaFin = new Date(formData.fechaVigenciaFin);

      if (fechaInicio >= fechaFin) {
        throw new Error(
          "La fecha de inicio debe ser anterior a la fecha de fin"
        );
      }

      // Validar valor
      const valor = parseFloat(formData.valor);
      if (isNaN(valor) || valor <= 0) {
        throw new Error("El valor debe ser un número positivo");
      }

      // Enviar datos al servidor
      await axios.post(
        "http://localhost:8081/api/planes-inscripcion",
        {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          valor: valor,
          fechaVigenciaInicio: formData.fechaVigenciaInicio,
          fechaVigenciaFin: formData.fechaVigenciaFin,
          activo: formData.activo,
        },
        {
          withCredentials: true,
        }
      );

      // Cerrar modal y actualizar lista
      setOpen(false);
      fetchPlanes();

      // Resetear formulario
      setFormData({
        nombre: "",
        descripcion: "",
        valor: "",
        fechaVigenciaInicio: "",
        fechaVigenciaFin: "",
        activo: true,
      });
    } catch (error: any) {
      console.error("Error al crear plan:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Error al crear el plan"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Plan de Inscripción</DialogTitle>
          <DialogDescription>
            Completa los detalles para crear un nuevo plan de inscripción
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre*
              </Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descripcion" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="valor" className="text-right">
                Valor*
              </Label>
              <Input
                id="valor"
                name="valor"
                type="number"
                value={formData.valor}
                onChange={handleChange}
                className="col-span-3"
                required
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fechaVigenciaInicio" className="text-right">
                Inicio*
              </Label>
              <Input
                id="fechaVigenciaInicio"
                name="fechaVigenciaInicio"
                type="date"
                value={formData.fechaVigenciaInicio}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fechaVigenciaFin" className="text-right">
                Fin*
              </Label>
              <Input
                id="fechaVigenciaFin"
                name="fechaVigenciaFin"
                type="date"
                value={formData.fechaVigenciaFin}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activo" className="text-right">
                Activo
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={handleSwitchChange}
                />
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
