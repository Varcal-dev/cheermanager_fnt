"use client";

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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Pencil } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface Descuento {
  id: number;
  nombre: string;
  porcentaje: number;
  activo: boolean;
}

interface Convenio {
  id: number;
  nombreEmpresa: string;
  descuento: Descuento;
  fechaInicio: string;
  fechaFin: string;
}

export function ModalEditarConvenio({
  convenio,
  onConvenioActualizado,
}: {
  convenio: Convenio;
  onConvenioActualizado: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState(convenio.nombreEmpresa);
  const [descuentoId, setDescuentoId] = useState<string>(String(convenio.descuento.id));
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(new Date(convenio.fechaInicio));
  const [fechaFin, setFechaFin] = useState<Date | undefined>(new Date(convenio.fechaFin));
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);

  useEffect(() => {
    if (!open) return;
    // Precarga con los valores actuales del convenio cada vez que se abre,
    // e incluye el descuento actual en la lista aunque ya esté inactivo
    // (si no, desaparecería del selector y forzaría a cambiarlo sin querer).
    setNombreEmpresa(convenio.nombreEmpresa);
    setDescuentoId(String(convenio.descuento.id));
    setFechaInicio(new Date(convenio.fechaInicio));
    setFechaFin(new Date(convenio.fechaFin));

    api
      .get("/api/descuentos")
      .then((res) => {
        const data: Descuento[] = res.data;
        const activos = data.filter((d) => d.activo || d.id === convenio.descuento.id);
        setDescuentos(activos);
      })
      .catch(() => toast.error("No se pudieron cargar los descuentos"));
  }, [open, convenio]);

  const handleSubmit = async () => {
    if (!fechaInicio || !fechaFin) return;

    // Unificado con el backend: PUT y POST ahora usan el mismo shape
    // (ConvenioDto, descuentoId plano) en vez de que PUT esperara el
    // descuento anidado por id.
    const payload = {
      nombreEmpresa,
      descuentoId: parseInt(descuentoId),
      fechaInicio: format(fechaInicio, "yyyy-MM-dd"),
      fechaFin: format(fechaFin, "yyyy-MM-dd"),
    };

    setGuardando(true);
    try {
      await api.put(`/api/convenios/${convenio.id}`, payload);
      toast.success("Convenio actualizado");
      setOpen(false);
      onConvenioActualizado();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo actualizar el convenio",
      );
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar convenio</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Empresa/Institución</Label>
            <Input
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Descuento</Label>
            <Select value={descuentoId} onValueChange={setDescuentoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un descuento" />
              </SelectTrigger>
              <SelectContent>
                {descuentos.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.nombre} - {d.porcentaje}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Fecha Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !fechaInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaInicio
                      ? format(fechaInicio, "dd/MM/yyyy")
                      : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaInicio}
                    onSelect={setFechaInicio}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Fecha Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !fechaFin && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaFin
                      ? format(fechaFin, "dd/MM/yyyy")
                      : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaFin}
                    onSelect={setFechaFin}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !nombreEmpresa || !descuentoId || !fechaInicio || !fechaFin || guardando
            }
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}