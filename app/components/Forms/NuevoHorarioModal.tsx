"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DiaSemana {
  id: number;
  dia: string;
}

interface GrupoSimple {
  id: number;
  nombre: string;
}

interface HorarioEditar {
  id: number;
  diaId: number;
  horaInicio: string; // "HH:mm" o "HH:mm:ss"
  horaFin: string;
}

// Un solo modal para dos casos:
// - Crear: uno o varios días (checkboxes) + hora inicio + hora fin. Cada día
//   marcado genera un Horario independiente (el backend modela un Horario
//   como UN solo día), con opción de asignarlos todos de una vez al mismo
//   grupo.
// - Editar: un horario existente ya es un día puntual, así que aquí el
//   selector de día vuelve a ser único (no tendría sentido "editar y
//   convertir en 3 días" un registro que ya está vinculado a asistencias).
export default function NuevoHorarioModal({
  open,
  onOpenChange,
  horarioEditar,
  grupos,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  horarioEditar?: HorarioEditar | null;
  grupos: GrupoSimple[];
  onGuardado: () => void;
}) {
  const esEdicion = !!horarioEditar;

  const [dias, setDias] = useState<DiaSemana[]>([]);
  const [diaIdEdicion, setDiaIdEdicion] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [grupoIdAsignar, setGrupoIdAsignar] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      api
        .get(`/api/dias-semana`)
        .then((res) => setDias(res.data))
        .catch((err) => {
          console.error("Error al cargar días de la semana", err);
          toast.error("No se pudo cargar el catálogo de días");
        });

      if (horarioEditar) {
        setDiaIdEdicion(String(horarioEditar.diaId));
        setHoraInicio(horarioEditar.horaInicio.slice(0, 5));
        setHoraFin(horarioEditar.horaFin.slice(0, 5));
      } else {
        setDiaIdEdicion("");
        setDiasSeleccionados([]);
        setHoraInicio("");
        setHoraFin("");
      }
      setGrupoIdAsignar("");
    }
  }, [open, horarioEditar]);

  const toggleDia = (diaId: string, checked: boolean) => {
    setDiasSeleccionados((prev) =>
      checked ? [...prev, diaId] : prev.filter((d) => d !== diaId),
    );
  };

  const handleGuardarEdicion = async () => {
    if (!horarioEditar) return;
    setGuardando(true);
    try {
      await api.put(`/api/horarios/${horarioEditar.id}`, {
        diaId: Number(diaIdEdicion),
        horaInicio,
        horaFin,
      });
      toast.success("Horario actualizado correctamente");
      onGuardado();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error al actualizar horario:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Error al actualizar el horario.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleCrear = async () => {
    setGuardando(true);
    try {
      // Un POST /api/horarios por cada día marcado (allSettled: si un día
      // falla -ej. ya existe ese mismo bloque-, los demás se crean igual).
      const resultados = await Promise.allSettled(
        diasSeleccionados.map((diaId) =>
          api.post(`/api/horarios`, {
            diaId: Number(diaId),
            horaInicio,
            horaFin,
          }),
        ),
      );

      const creados = resultados
        .filter(
          (r): r is PromiseFulfilledResult<any> => r.status === "fulfilled",
        )
        .map((r) => r.value.data);

      const fallidos = resultados.filter((r) => r.status === "rejected");

      if (grupoIdAsignar && creados.length > 0) {
        const asignaciones = await Promise.allSettled(
          creados.map((horario) =>
            api.post(`/api/horarios/asignar-grupo`, {
              horarioId: horario.id,
              grupoEntrenamientoId: Number(grupoIdAsignar),
            }),
          ),
        );
        const asignacionesFallidas = asignaciones.filter(
          (a) => a.status === "rejected",
        );
        if (asignacionesFallidas.length > 0) {
          toast.warn(
            `${creados.length - asignacionesFallidas.length} de ${creados.length} horarios se asignaron al grupo. Los demás puedes asignarlos manualmente desde la tabla.`,
          );
        }
      }

      if (fallidos.length === 0) {
        toast.success(
          creados.length === 1
            ? "Horario creado correctamente"
            : `${creados.length} horarios creados correctamente`,
        );
      } else if (creados.length > 0) {
        toast.warn(
          `Se crearon ${creados.length} de ${diasSeleccionados.length} horarios. Revisa la consola para ver qué días fallaron.`,
        );
        console.error(
          "Días que no se pudieron crear:",
          fallidos.map((f: any) => f.reason?.response?.data ?? f.reason),
        );
      } else {
        toast.error("No se pudo crear ningún horario. Intenta de nuevo.");
        console.error(
          "Errores al crear horarios:",
          fallidos.map((f: any) => f.reason?.response?.data ?? f.reason),
        );
        return;
      }

      onGuardado();
      onOpenChange(false);
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardar = () => {
    if (esEdicion) {
      if (!diaIdEdicion || !horaInicio || !horaFin) {
        toast.error("Completa día, hora de inicio y hora de fin");
        return;
      }
    } else {
      if (diasSeleccionados.length === 0 || !horaInicio || !horaFin) {
        toast.error(
          "Selecciona al menos un día y completa las horas de inicio y fin",
        );
        return;
      }
    }
    if (horaInicio >= horaFin) {
      toast.error("La hora de inicio debe ser anterior a la hora de fin");
      return;
    }

    if (esEdicion) {
      handleGuardarEdicion();
    } else {
      handleCrear();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar horario" : "Nuevo bloque de horario"}
          </DialogTitle>
          <DialogDescription>
            {esEdicion
              ? "Ajusta el día u horas de este bloque."
              : "Marca uno o varios días (ej. Martes y Jueves) para crear un horario por cada uno, con las mismas horas."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {esEdicion ? (
            <div>
              <label className="text-sm font-medium">Día</label>
              <Select onValueChange={setDiaIdEdicion} value={diaIdEdicion}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar día" />
                </SelectTrigger>
                <SelectContent>
                  {dias.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">Días</label>
              <div className="grid grid-cols-2 gap-2 mt-1 border rounded-md p-3">
                {dias.length === 0 ? (
                  <span className="text-sm text-muted-foreground col-span-2">
                    Cargando días...
                  </span>
                ) : (
                  dias.map((d) => {
                    const idStr = d.id.toString();
                    const checked = diasSeleccionados.includes(idStr);
                    return (
                      <label
                        key={d.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleDia(idStr, !!v)}
                        />
                        {d.dia}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Hora de inicio</label>
              <Input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hora de fin</label>
              <Input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
              />
            </div>
          </div>

          {!esEdicion && (
            <div>
              <label className="text-sm font-medium">
                Asignar a un grupo (opcional)
              </label>
              <Select onValueChange={setGrupoIdAsignar} value={grupoIdAsignar}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin asignar por ahora" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {diasSeleccionados.length > 1 && grupoIdAsignar && (
                <p className="text-xs text-muted-foreground mt-1">
                  Se asignará al grupo en cada uno de los{" "}
                  {diasSeleccionados.length} días marcados.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={guardando}>
            {guardando
              ? "Guardando..."
              : esEdicion
                ? "Guardar cambios"
                : diasSeleccionados.length > 1
                  ? `Crear ${diasSeleccionados.length} horarios`
                  : "Crear"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}