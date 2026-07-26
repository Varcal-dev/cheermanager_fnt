"use client";

import { useEffect, useState } from "react";
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
import { Pencil, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

const planSchema = z.object({
  nombre: z.string().min(1, "Requerido"),
  tipoPlanId: z.coerce
    .number()
    .int()
    .positive({ message: "Selecciona un tipo de plan válido" }),
  descripcion: z.string().optional(),
  valorMensual: z.coerce.number().positive("Debe ser mayor a 0"),
  fechaVigenciaInicio: z.string().min(1, "Requerido"),
  fechaVigenciaFin: z.string().optional().or(z.literal("")),
  activo: z.boolean(),
});
type PlanForm = z.infer<typeof planSchema>;

export interface PlanPago {
  id: number;
  nombre: string;
  tipoPlanId: number;
  tipoPlanNombre?: string;
  categoria: string;
  descripcion?: string;
  valorMensual: number;
  fechaVigenciaInicio: string;
  fechaVigenciaFin?: string;
  activo: boolean;
}

export function PlanPagoModal({
  categoria,
  plan,
  onGuardado,
}: {
  // "inscripcion" | "mensualidad" — determina qué tipos de plan se listan
  // en el selector y qué categoría lleva el plan por defecto al crear.
  categoria: "inscripcion" | "mensualidad";
  // Si viene un plan, el modal edita; si no, crea uno nuevo.
  plan?: PlanPago;
  onGuardado: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tiposPlan, setTiposPlan] = useState<{ id: number; nombre: string }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      nombre: plan?.nombre ?? "",
      tipoPlanId: plan?.tipoPlanId ?? 0,
      descripcion: plan?.descripcion ?? "",
      valorMensual: plan?.valorMensual ?? 0,
      fechaVigenciaInicio: plan?.fechaVigenciaInicio ?? "",
      fechaVigenciaFin: plan?.fechaVigenciaFin ?? "",
      activo: plan?.activo ?? true,
    },
  });

  useEffect(() => {
    if (!open) return;
    api
      .get(`/api/planes-pago/tipos`, { params: { categoria } })
      .then((res) => setTiposPlan(res.data))
      .catch((err) => console.error("Error al cargar tipos de plan:", err));
  }, [open, categoria]);

  const onSubmit = async (data: PlanForm) => {
    const body = {
      ...data,
      fechaVigenciaFin: data.fechaVigenciaFin || null,
    };

    try {
      if (plan) {
        await api.put(`/api/planes-pago/${plan.id}`, body);
        toast.success("Plan actualizado correctamente");
      } else {
        await api.post(`/api/planes-pago`, body);
        toast.success("Plan creado correctamente");
      }
      onGuardado();
      reset();
      setOpen(false);
    } catch (error: any) {
      console.error("Error al guardar plan:", error);
      toast.error(error.response?.data ?? "Error al guardar el plan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {plan ? (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {plan ? "Editar plan" : "Registrar plan"} de{" "}
            {categoria === "inscripcion" ? "inscripción" : "mensualidad"}
          </DialogTitle>
          <DialogDescription>Completa los datos del plan</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input {...register("nombre")} />
            {errors.nombre && (
              <span className="text-sm text-red-500">{errors.nombre.message}</span>
            )}
          </div>

          <div>
            <Label>Tipo de plan</Label>
            <select
              className="w-full border rounded-md p-2"
              {...register("tipoPlanId")}
              defaultValue={plan?.tipoPlanId ?? ""}
            >
              <option key="default" value="" disabled>
                Selecciona un tipo
              </option>
              {tiposPlan.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            {errors.tipoPlanId && (
              <span className="text-sm text-red-500">
                {errors.tipoPlanId.message}
              </span>
            )}
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea {...register("descripcion")} />
          </div>

          <div>
            <Label>
              {categoria === "inscripcion" ? "Valor" : "Valor mensual"}
            </Label>
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
              <Label>Fin de vigencia (opcional)</Label>
              <Input type="date" {...register("fechaVigenciaFin")} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="activo" {...register("activo")} />
            <Label htmlFor="activo">Activo</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {plan ? "Guardar cambios" : "Crear plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}