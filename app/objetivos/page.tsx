"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, Target, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface DeportistaOpcion {
  deportistaId: number;
  nombre: string;
  apellidos: string;
}

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

const FORM_VACIO = {
  deportistaId: "",
  nombre: "",
  descripcion: "",
  estadoObjetivoId: "",
};

function badgeVariant(estado: string) {
  const e = estado.toLowerCase();
  if (e.includes("cumpl")) return "default" as const;
  if (e.includes("proceso") || e.includes("progreso")) return "outline" as const;
  return "secondary" as const;
}

export default function ObjetivosPage() {
  const [cargando, setCargando] = useState(true);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [estados, setEstados] = useState<EstadoObjetivo[]>([]);
  const [deportistas, setDeportistas] = useState<DeportistaOpcion[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [objetivoEnEdicion, setObjetivoEnEdicion] = useState<Objetivo | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    Promise.allSettled([
      api.get("/api/objetivos"),
      api.get("/api/estados-objetivo"),
      api.get("/api/deportistas"),
    ]).then(([resObjetivos, resEstados, resDeportistas]) => {
      if (resObjetivos.status === "fulfilled") setObjetivos(resObjetivos.value.data);
      else toast.error("No se pudieron cargar los objetivos");

      if (resEstados.status === "fulfilled") setEstados(resEstados.value.data);
      if (resDeportistas.status === "fulfilled") setDeportistas(resDeportistas.value.data);

      setCargando(false);
    });
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = useMemo(() => {
    return objetivos.filter((o) => {
      const matchesSearch = o.nombreDeportista
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesEstado =
        filtroEstado === "todos" || String(o.estadoObjetivoId) === filtroEstado;
      return matchesSearch && matchesEstado;
    });
  }, [objetivos, searchTerm, filtroEstado]);

  const abrirNuevo = () => {
    setObjetivoEnEdicion(null);
    setForm({
      deportistaId: "",
      nombre: "",
      descripcion: "",
      estadoObjetivoId: estados[0] ? String(estados[0].id) : "",
    });
    setModalAbierto(true);
  };

  const abrirEdicion = (objetivo: Objetivo) => {
    setObjetivoEnEdicion(objetivo);
    setForm({
      deportistaId: String(objetivo.deportistaId),
      nombre: objetivo.nombre,
      descripcion: objetivo.descripcion ?? "",
      estadoObjetivoId: String(objetivo.estadoObjetivoId),
    });
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.deportistaId) {
      toast.error("Selecciona un deportista");
      return;
    }
    if (!form.nombre.trim()) {
      toast.error("El nombre del objetivo es obligatorio");
      return;
    }
    setGuardando(true);
    try {
      const payload = {
        deportistaId: Number(form.deportistaId),
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
    <ProtectedRoute requiredPermission="ver_objetivo">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Objetivos</h1>
            <p className="text-muted-foreground">
              Metas de todos los deportistas, en un solo lugar
            </p>
          </div>
          <Button onClick={abrirNuevo}>
            <Target className="mr-2 h-4 w-4" /> Nuevo Objetivo
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center space-x-2 w-full max-w-sm">
            <Input
              placeholder="Buscar por deportista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {estados.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.nombreEstado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {cargando ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deportista</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay objetivos para mostrar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtrados.map((objetivo) => (
                      <TableRow key={objetivo.id}>
                        <TableCell className="font-medium">
                          {objetivo.nombreDeportista}
                        </TableCell>
                        <TableCell>{objetivo.nombre}</TableCell>
                        <TableCell>{objetivo.descripcion}</TableCell>
                        <TableCell>
                          {new Date(objetivo.fechaCreacion).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
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
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {objetivoEnEdicion ? "Editar objetivo" : "Nuevo objetivo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Deportista</Label>
              <Select
                value={form.deportistaId}
                onValueChange={(v) => setForm({ ...form, deportistaId: v })}
                disabled={!!objetivoEnEdicion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un deportista" />
                </SelectTrigger>
                <SelectContent>
                  {deportistas.map((d) => (
                    <SelectItem key={d.deportistaId} value={String(d.deportistaId)}>
                      {d.nombre} {d.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
    </ProtectedRoute>
  );
}