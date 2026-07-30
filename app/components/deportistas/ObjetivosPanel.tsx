"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface EstadoObjetivo {
  id: number;
  nombreEstado: string;
}

interface Objetivo {
  id: number;
  deportistaId: number;
  nombreDeportista: string;
  nombre: string;
  descripcion: string;
  fechaCreacion: string;
  estadoObjetivoId: number;
  estadoObjetivo: string;
}

const FORM_VACIO = { nombre: "", descripcion: "", estadoObjetivoId: "" };

function badgeVariant(estado: string) {
  const e = estado.toLowerCase();
  if (e.includes("cumpl")) return "default" as const;
  if (e.includes("proceso") || e.includes("progreso")) return "outline" as const;
  return "secondary" as const;
}

export default function ObjetivosPanel({
  deportistaId,
}: {
  deportistaId: number;
}) {
  const [cargando, setCargando] = useState(true);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [estados, setEstados] = useState<EstadoObjetivo[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [objetivoEnEdicion, setObjetivoEnEdicion] = useState<Objetivo | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    Promise.allSettled([
      api.get(`/api/objetivos/deportista/${deportistaId}`),
      api.get("/api/estados-objetivo"),
    ]).then(([resObjetivos, resEstados]) => {
      if (resObjetivos.status === "fulfilled") setObjetivos(resObjetivos.value.data);
      else toast.error("No se pudieron cargar los objetivos");

      if (resEstados.status === "fulfilled") setEstados(resEstados.value.data);

      setCargando(false);
    });
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deportistaId]);

  const abrirNuevo = () => {
    setObjetivoEnEdicion(null);
    setForm({
      nombre: "",
      descripcion: "",
      estadoObjetivoId: estados[0] ? String(estados[0].id) : "",
    });
    setModalAbierto(true);
  };

  const abrirEdicion = (objetivo: Objetivo) => {
    setObjetivoEnEdicion(objetivo);
    setForm({
      nombre: objetivo.nombre,
      descripcion: objetivo.descripcion ?? "",
      estadoObjetivoId: String(objetivo.estadoObjetivoId),
    });
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre del objetivo es obligatorio");
      return;
    }
    setGuardando(true);
    try {
      const payload = {
        deportistaId,
        nombre: form.nombre,
        descripcion: form.descripcion,
        fechaCreacion:
          objetivoEnEdicion?.fechaCreacion ?? new Date().toISOString().slice(0, 10),
        estadoObjetivoId: form.estadoObjetivoId ? Number(form.estadoObjetivoId) : null,
      };

      if (objetivoEnEdicion) {
        await api.put(`/api/objetivos/${objetivoEnEdicion.id}`, payload);
        toast.success("Objetivo actualizado");
      } else {
        await api.post("/api/objetivos", payload);
        toast.success("Objetivo creado");
      }
      setModalAbierto(false);
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo guardar el objetivo",
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este objetivo? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/api/objetivos/${id}`);
      toast.success("Objetivo eliminado");
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo eliminar el objetivo",
      );
    }
  };

  const cambiarEstadoRapido = async (objetivo: Objetivo, nuevoEstadoId: string) => {
    try {
      await api.patch(`/api/objetivos/${objetivo.id}/estado`, {
        estadoObjetivoId: Number(nuevoEstadoId),
      });
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo cambiar el estado",
      );
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Objetivos</h4>
        <Button size="sm" variant="outline" onClick={abrirNuevo}>
          <Target className="h-4 w-4 mr-1" /> Nuevo Objetivo
        </Button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
        </div>
      ) : objetivos.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          No hay objetivos registrados
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Objetivo</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objetivos.map((objetivo) => (
              <TableRow key={objetivo.id}>
                <TableCell>{objetivo.nombre}</TableCell>
                <TableCell>{objetivo.descripcion}</TableCell>
                <TableCell>
                  {new Date(objetivo.fechaCreacion).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {estados.length > 0 ? (
                    <Select
                      value={String(objetivo.estadoObjetivoId)}
                      onValueChange={(v) => cambiarEstadoRapido(objetivo, v)}
                    >
                      <SelectTrigger className="h-8 w-[150px]">
                        <SelectValue>
                          <Badge variant={badgeVariant(objetivo.estadoObjetivo)}>
                            {objetivo.estadoObjetivo}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {estados.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            {e.nombreEstado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={badgeVariant(objetivo.estadoObjetivo)}>
                      {objetivo.estadoObjetivo}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirEdicion(objetivo)}
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => eliminar(objetivo.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {objetivoEnEdicion ? "Editar objetivo" : "Nuevo objetivo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Mejorar flexibilidad"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Estado</Label>
              <Select
                value={form.estadoObjetivoId}
                onValueChange={(v) => setForm({ ...form, estadoObjetivoId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nombreEstado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {estados.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay estados configurados todavía en /api/estados-objetivo.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAbierto(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}