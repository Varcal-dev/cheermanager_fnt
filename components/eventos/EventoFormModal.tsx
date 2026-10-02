"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

export interface Evento {
  id: number;
  nombre: string;
  fecha: string;
  tipoEventoId: number;
  tipoEvento: string;
  ubicacion: string;
  tieneResultados: boolean;
  cantidadGruposInscritos: number;
  cantidadPremios: number;
}

interface TipoEvento {
  id: number;
  evento: string;
}

const FORM_VACIO = {
  nombre: "",
  fecha: "",
  tipoEventoId: "",
  ubicacion: "",
  tieneResultados: true,
};

export default function EventoFormModal({
  open,
  onOpenChange,
  evento,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evento: Evento | null;
  onGuardado: () => void;
}) {
  const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    api
      .get("/api/tipos-evento")
      .then((res) => setTiposEvento(res.data))
      .catch(() => toast.error("No se pudieron cargar los tipos de evento"));

    if (evento) {
      setForm({
        nombre: evento.nombre,
        fecha: evento.fecha,
        tipoEventoId: String(evento.tipoEventoId),
        ubicacion: evento.ubicacion ?? "",
        tieneResultados: evento.tieneResultados,
      });
    } else {
      setForm(FORM_VACIO);
    }
  }, [open, evento]);

  const guardar = async () => {
    if (!form.nombre.trim() || !form.fecha || !form.tipoEventoId) {
      toast.error("Nombre, fecha y tipo de evento son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      const payload = {
        nombre: form.nombre,
        fecha: form.fecha,
        tipoEventoId: Number(form.tipoEventoId),
        ubicacion: form.ubicacion,
        tieneResultados: form.tieneResultados,
      };
      if (evento) {
        await api.put(`/api/eventos/${evento.id}`, payload);
        toast.success("Evento actualizado");
      } else {
        await api.post("/api/eventos", payload);
        toast.success("Evento creado");
      }
      onOpenChange(false);
      onGuardado();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo guardar el evento",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{evento ? "Editar evento" : "Nuevo evento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label>Nombre</Label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Copa Andina 2026"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Tipo de evento</Label>
            <Select
              value={form.tipoEventoId}
              onValueChange={(v) => setForm({ ...form, tipoEventoId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposEvento.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.evento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Ubicación</Label>
            <Input
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              placeholder="Ej. Coliseo El Campín, Bogotá"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="tiene-resultados"
              checked={form.tieneResultados}
              onCheckedChange={(v) => setForm({ ...form, tieneResultados: v })}
            />
            <Label htmlFor="tiene-resultados">
              El organizador publica resultados oficiales
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando}>
            {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}