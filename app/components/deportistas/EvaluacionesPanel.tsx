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
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface CriterioEvaluacion {
  id: number;
  nombre: string;
  categoriaId: number;
  categoria: string;
}

interface Evaluacion {
  id: number;
  deportistaId: number;
  criterioId: number;
  nombreCriterio: string;
  categoria: string;
  fecha: string;
  puntajeObtenido: number;
}

const FORM_VACIO = {
  criterioId: "",
  puntajeObtenido: "",
  fecha: new Date().toISOString().slice(0, 10),
};

export default function EvaluacionesPanel({
  deportistaId,
}: {
  deportistaId: number;
}) {
  const [cargando, setCargando] = useState(true);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [criterios, setCriterios] = useState<CriterioEvaluacion[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    Promise.allSettled([
      api.get(`/api/evaluaciones/deportista/${deportistaId}`),
      api.get("/api/criterios-evaluacion"),
    ]).then(([resEvaluaciones, resCriterios]) => {
      if (resEvaluaciones.status === "fulfilled") setEvaluaciones(resEvaluaciones.value.data);
      else toast.error("No se pudieron cargar las evaluaciones");

      if (resCriterios.status === "fulfilled") setCriterios(resCriterios.value.data);

      setCargando(false);
    });
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deportistaId]);

  const abrirNueva = () => {
    setForm({ ...FORM_VACIO, criterioId: criterios[0] ? String(criterios[0].id) : "" });
    setModalAbierto(true);
  };

  const guardar = async () => {
    const puntaje = Number(form.puntajeObtenido);
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
        deportistaId,
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Evaluaciones</h4>
        <Button size="sm" variant="outline" onClick={abrirNueva}>
          <Plus className="h-4 w-4 mr-1" /> Nueva Evaluación
        </Button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
        </div>
      ) : evaluaciones.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          No hay evaluaciones registradas
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Criterio</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Puntaje</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluaciones
              .slice()
              .sort((a, b) => b.fecha.localeCompare(a.fecha))
              .map((evaluacion) => (
                <TableRow key={evaluacion.id}>
                  <TableCell>
                    {new Date(evaluacion.fecha).toLocaleDateString()}
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
              ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva evaluación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
    </div>
  );
}