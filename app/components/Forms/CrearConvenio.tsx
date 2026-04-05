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
import { CalendarIcon, Plus } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface Descuento {
  id: number;
  nombre: string;
  porcentaje: number;
  activo: boolean;
}

export function ModalCrearConvenio({
  onConvenioCreado,
}: {
  onConvenioCreado?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [descuentoId, setDescuentoId] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState<Date | undefined>();
  const [fechaFin, setFechaFin] = useState<Date | undefined>();
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/descuentos`)
      .then((res) => res.json())
      .then((data: Descuento[]) => {
        const activos = data.filter((d) => d.activo);
        setDescuentos(activos);
      });
  }, []);

  const handleSubmit = async () => {
    const payload = {
      nombreEmpresa,
      descuentoId: parseInt(descuentoId),
      fechaInicio,
      fechaFin,
    };

    try {
        console.log("Data: ", payload);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/convenios`,
        payload
      );

      if (res.status === 200 || res.status === 201) {
        toast.success("Nuevo convenio registrado");
        setOpen(false);
        setNombreEmpresa("");
        setDescuentoId("");
        setFechaInicio(undefined);
        setFechaFin(undefined);
        onConvenioCreado?.();
      } else {
        toast.error("Respuesta inesperada al crear convenio");
        console.error("Respuesta inesperada al crear convenio:", res.status);
      }
    } catch (error) {
      toast.error("Error al crear convenio:");
      console.error("Error al crear convenio:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Convenio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Convenio</DialogTitle>
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
              !nombreEmpresa || !descuentoId || !fechaInicio || !fechaFin
            }
          >
            Registrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
