"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
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

const tipoSchema = z.object({
  nombre: z.string().min(1, "Requerido"),
  categoria: z.enum(["inscripcion", "mensualidad"], {
    errorMap: () => ({ message: "Selecciona una categoría" }),
  }),
  duracionMeses: z.coerce.number().int().positive("Debe ser mayor a 0"),
  descripcion: z.string().optional(),
});
type TipoForm = z.infer<typeof tipoSchema>;

export interface TipoPlanPago {
  id: number;
  nombre: string;
  categoria: "inscripcion" | "mensualidad";
  duracionMeses: number;
  descripcion?: string;
  planesAsociados: number;
}

export function TipoPlanPagoModal({
  tipo,
  onGuardado,
}: {
  // Si viene un tipo, el modal edita; si no, crea uno nuevo.
  tipo?: TipoPlanPago;
  onGuardado: () => void;
}) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TipoForm>({
    resolver: zodResolver(tipoSchema),
    defaultValues: {
      nombre: tipo?.nombre ?? "",
      categoria: tipo?.categoria ?? "mensualidad",
      duracionMeses: tipo?.duracionMeses ?? 1,
      descripcion: tipo?.descripcion ?? "",
    },
  });

  const onSubmit = async (data: TipoForm) => {
    try {
      if (tipo) {
        await api.put(`/api/tipos-planes-pago/${tipo.id}`, data);
        toast.success("Tipo de plan actualizado correctamente");
      } else {
        await api.post(`/api/tipos-planes-pago`, data);
        toast.success("Tipo de plan creado correctamente");
      }
      onGuardado();
      reset();
      setOpen(false);
    } catch (error: any) {
      console.error("Error al guardar tipo de plan:", error);
      toast.error(error.response?.data ?? "Error al guardar el tipo de plan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {tipo ? (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Tipo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tipo ? "Editar" : "Crear"} tipo de plan</DialogTitle>
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
            <Label>Categoría</Label>
            <select
              className="w-full border rounded-md p-2"
              {...register("categoria")}
              defaultValue={tipo?.categoria ?? "mensualidad"}
            >
              <option value="inscripcion">Inscripción (pago único)</option>
              <option value="mensualidad">Mensualidad (recurrente)</option>
            </select>
            {errors.categoria && (
              <span className="text-sm text-red-500">{errors.categoria.message}</span>
            )}
          </div>

          <div>
            <Label>Duración (meses)</Label>
            <Input type="number" min={1} {...register("duracionMeses")} />
            {errors.duracionMeses && (
              <span className="text-sm text-red-500">
                {errors.duracionMeses.message}
              </span>
            )}
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea {...register("descripcion")} />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{tipo ? "Guardar cambios" : "Crear tipo"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}