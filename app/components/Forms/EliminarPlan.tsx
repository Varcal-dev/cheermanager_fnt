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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

// 1) Schema y tipos (reutilizados del crear)
const planSchema = z.object({
  tipoPlan: z.string().min(1),
  descripcion: z.string().optional(),
  valorMensual: z.coerce.number().positive(),
  fechaVigenciaInicio: z.string().min(1),
  fechaVigenciaFin: z.string().min(1),
  activo: z.boolean(),
});
type PlanForm = z.infer<typeof planSchema>;

// 2) Modal para editar
export function ModalEditarPlan({
  plan,
  fetchPlanes,
}: {
  plan: {
    id: number;
    tipoPlan: string;
    descripcion: string;
    valorMensual: number;
    fechaVigenciaInicio: string;
    fechaVigenciaFin: string;
    activo: boolean;
  };
  
  fetchPlanes: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      tipoPlan: plan.tipoPlan,
      descripcion: plan.descripcion,
      valorMensual: plan.valorMensual,
      fechaVigenciaInicio: plan.fechaVigenciaInicio,
      fechaVigenciaFin: plan.fechaVigenciaFin,
      activo: plan.activo,
    },
  });
  const [open, setOpen] = useState(false); 

  const onSubmit = async (data: PlanForm) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/planes-pago/${plan.id}`,
        data,
        { withCredentials: true }
      );
      fetchPlanes();
      //await fetchPlanes();
      reset(data);
      //reset();
    } catch (error) {
      console.error("Error al actualizar plan:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Plan</DialogTitle>
          <DialogDescription>Modifica los datos del plan</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Tipo de plan</Label>
            <Input {...register("tipoPlan")} />
            {errors.tipoPlan && (
              <p className="text-sm text-red-500">{errors.tipoPlan.message}</p>
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
              <p className="text-sm text-red-500">
                {errors.valorMensual.message}
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            <div className="flex-1">
              <Label>Inicio de vigencia</Label>
              <Input type="date" {...register("fechaVigenciaInicio")} />
              {errors.fechaVigenciaInicio && (
                <p className="text-sm text-red-500">
                  {errors.fechaVigenciaInicio.message}
                </p>
              )}
            </div>
            <div className="flex-1">
              <Label>Fin de vigencia</Label>
              <Input type="date" {...register("fechaVigenciaFin")} />
              {errors.fechaVigenciaFin && (
                <p className="text-sm text-red-500">
                  {errors.fechaVigenciaFin.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>
              <input type="checkbox" {...register("activo")} /> Activo
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => reset()}>
              Cancelar
            </Button>
            <Button type="submit">Guardar Cambios</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 3) Modal para eliminar
export function ModalEliminarPlan({
  planId,
  fetchPlanes,
}: {
  planId: number;
  fetchPlanes: () => void;
}) {
  const handleEliminar = async () => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/planes-pago/${planId}`, {
        withCredentials: true,
      });
      fetchPlanes();
      //await fetchPlanes();
    } catch (error) {
      console.error("Error al eliminar plan:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          ¿Estás seguro de que deseas eliminar este plan? Esta acción no se
          puede deshacer.
        </DialogDescription>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline">Cancelar</Button>
          <Button variant="destructive" onClick={handleEliminar}>
            Sí, eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
