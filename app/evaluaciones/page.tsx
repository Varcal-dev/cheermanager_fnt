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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

interface DeportistaOpcion {
  deportistaId: number;
  nombre: string;
  apellidos: string;
}

interface CriterioEvaluacion {
  id: number;
  nombre: string;
  categoriaId: number;
  categoria: string;
}

interface Evaluacion {
  id: number;
  deportistaId: number;
  nombreDeportista: string;
  criterioId: number;
  nombreCriterio: string;
  categoria: string;
  fecha: string;
  puntajeObtenido: number;
}

const FORM_VACIO = {
  deportistaId: "",
  criterioId: "",
  puntajeObtenido: "",
  fecha: new Date().toISOString().slice(0, 10),
};

export default function EvaluacionesPage() {
  const [cargando, setCargando] = useState(true);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [criterios, setCriterios] = useState<CriterioEvaluacion[]>([]);
  const [deportistas, setDeportistas] = useState<DeportistaOpcion[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCriterio, setFiltroCriterio] = useState("todos");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    Promise.allSettled([
      api.get("/api/evaluaciones"),
      api.get("/api/criterios-evaluacion"),
      api.get("/api/deportistas"),
    ]).then(([resEvaluaciones, resCriterios, resDeportistas]) => {
      if (resEvaluaciones.status === "fulfilled") setEvaluaciones(resEvaluaciones.value.data);
      else toast.error("No se pudieron cargar las evaluaciones");

      if (resCriterios.status === "fulfilled") setCriterios(resCriterios.value.data);
      if (resDeportistas.status === "fulfilled") setDeportistas(resDeportistas.value.data);

      setCargando(false);
    });
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtradas = useMemo(() => {
    return evaluaciones
      .filter((e) => {
        const matchesSearch = e.nombreDeportista
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCriterio =
          filtroCriterio === "todos" || String(e.criterioId) === filtroCriterio;
        return matchesSearch && matchesCriterio;
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [evaluaciones, searchTerm, filtroCriterio]);

  const abrirNueva = () => {
    setForm({ ...FORM_VACIO, criterioId: criterios[0] ? String(criterios[0].id) : "" });
    setModalAbierto(true);
  };

  const guardar = async () => {
    const puntaje = Number(form.puntajeObtenido);
    if (!form.deportistaId) {
      toast.error("Selecciona un deportista");
      return;
    }
    if (!form.criterioId) {
      toast.error("Selecciona un criterio");
      return;
    }
    if (!form.puntajeObtenido || Number.isNaN(puntaje)) {
      toast.error("Ingresa un puntaje válido");
      return;
    }

    setGuardando(true);
    try {
      await api.post("/api/evaluaciones", {
        deportistaId: Number(form.deportistaId),
        criterioId: Number(form.criterioId),
        fecha: form.fecha,
        puntajeObtenido: puntaje,
      });
      toast.success("Evaluación registrada");
      setModalAbierto(false);
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo registrar la evaluación",
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta evaluación? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/api/evaluaciones/${id}`);
      toast.success("Evaluación eliminada");
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo eliminar la evaluación",
      );
    }
  };

  return (
    <ProtectedRoute requiredPermission="ver_evaluacion">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Evaluaciones</h1>
            <p className="text-muted-foreground">
              Evaluaciones técnicas de todos los deportistas
            </p>
          </div>
          <Button onClick={abrirNueva}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Evaluación
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
          <Select value={filtroCriterio} onValueChange={setFiltroCriterio}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="Criterio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los criterios</SelectItem>
              {criterios.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.nombre} ({c.categoria})
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
                    <TableHead>Fecha</TableHead>
                    <TableHead>Deportista</TableHead>
                    <TableHead>Criterio</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Puntaje</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay evaluaciones para mostrar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtradas.map((evaluacion) => (
                      <TableRow key={evaluacion.id}>
                        <TableCell>
                          {new Date(evaluacion.fecha).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          {evaluacion.nombreDeportista}
                        </TableCell>
                        <TableCell>{evaluacion.nombreCriterio}</TableCell>
                        <TableCell>{evaluacion.categoria}</TableCell>
                        <TableCell>{evaluacion.puntajeObtenido}/10</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => eliminar(evaluacion.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                          </Button>
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
            <DialogTitle>Nueva evaluación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Deportista</Label>
              <Select
                value={form.deportistaId}
                onValueChange={(v) => setForm({ ...form, deportistaId: v })}
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
              <Label>Criterio</Label>
              <Select
                value={form.criterioId}
                onValueChange={(v) => setForm({ ...form, criterioId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un criterio" />
                </SelectTrigger>
                <SelectContent>
                  {criterios.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre} ({c.categoria})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {criterios.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay criterios configurados todavía en /api/criterios-evaluacion.
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label>Puntaje (0-10)</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={form.puntajeObtenido}
                onChange={(e) => setForm({ ...form, puntajeObtenido: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
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