import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useEffect, useState } from "react";


const planSchema = z.object({
  tipoPlan: z.coerce
    .number()
    .int()
    .positive({ message: "Selecciona un tipo de plan válido" }),
  descripcion: z.string().optional(),
  valorMensual: z.coerce.number().positive(),
  fechaVigenciaInicio: z.string().min(1, "Requerido"),
  fechaVigenciaFin: z.string().min(1, "Requerido"),
  activo: z.boolean(),
});

export function ModalCrearPlan({ fetchPlanes }: { fetchPlanes: () => void }) {
  const [tiposPlan, setTiposPlan] = useState<{ id: number; nombre: string }[]>(
    []
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      tipoPlan: "",
      descripcion: "",
      valorMensual: 0,
      fechaVigenciaInicio: "",
      fechaVigenciaFin: "",
      activo: true,
    },
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Traer tipos plan desde backend
    axios
      .get("http://localhost:8080/api/planes-pago/tipos", {
        withCredentials: true,
      })
      .then((res) => {
        setTiposPlan(res.data);
        console.log("Tipos de plan recibidos:", res.data);
      })
      .catch((err) => {
        console.error("Error al cargar tipos de plan:", err);
      });
  }, []);

  const onSubmit = async (data: any) => {
    try {
      console.log("Datos del formulario:", data);
      await axios.post("http://localhost:8080/api/planes-pago", data, {
        withCredentials: true,
      });
      fetchPlanes();
      //onPlanCreado();
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Error al crear plan:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Nuevo Plan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Plan de Pago</DialogTitle>
          <DialogDescription>Completa los datos del plan</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Tipo de plan</Label>
            <select {...register("tipoPlan")} defaultValue="">
              <option key="default" value="" disabled>
                Selecciona un tipo
              </option>
              {tiposPlan.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>

            {errors.tipoPlan && (
              <span className="text-sm text-red-500">
                {errors.tipoPlan.message}
              </span>
            )}
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea {...register("descripcion")} />
          </div>

          <div>
            <Label>Valor mensual</Label>
            <Input type="number" step="0.01" {...register("valorMensual")} />
            {errors.valorMensual && (
              <span className="text-sm text-red-500">
                {errors.valorMensual.message}
              </span>
            )}
          </div>

          <div className="flex space-x-2">
            <div className="flex-1">
              <Label>Inicio de vigencia</Label>
              <Input type="date" {...register("fechaVigenciaInicio")} />
              {errors.fechaVigenciaInicio && (
                <span className="text-sm text-red-500">
                  {errors.fechaVigenciaInicio.message}
                </span>
              )}
            </div>
            <div className="flex-1">
              <Label>Fin de vigencia</Label>
              <Input type="date" {...register("fechaVigenciaFin")} />
              {errors.fechaVigenciaFin && (
                <span className="text-sm text-red-500">
                  {errors.fechaVigenciaFin.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <Label>
              <input type="checkbox" {...register("activo")} defaultChecked />{" "}
              Activo
            </Label>
          </div>

          <Button type="submit">Guardar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
