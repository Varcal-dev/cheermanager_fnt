"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Play, Square } from "lucide-react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, getErrorMessage } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Temporadas del club. Solo una puede estar activa; las inscripciones nuevas quedan en la activa.

interface Temporada {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

const VACIA = { nombre: "", fechaInicio: "", fechaFin: "" };

const fmt = (d: string) => (d ? new Date(d + "T00:00:00").toLocaleDateString("es-CO") : "—");

export default function TemporadasPage() {
  const { permissions } = useUser();
  const puedeGestionar = permissions.includes("gestionar_temporadas");
  const [temporadas, setTemporadas] = useState<Temporada[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Temporada | "nueva" | null>(null);
  const [form, setForm] = useState(VACIA);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      const res = await api.get("/api/temporadas");
      setTemporadas(res.data ?? []);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron cargar las temporadas"));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirNueva = () => {
    setForm(VACIA);
    setEditando("nueva");
  };

  const abrirEdicion = (t: Temporada) => {
    setForm({ nombre: t.nombre, fechaInicio: t.fechaInicio, fechaFin: t.fechaFin });
    setEditando(t);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.fechaInicio || !form.fechaFin) {
      toast.error("Completa nombre, fecha de inicio y fecha de fin");
      return;
    }
    setGuardando(true);
    try {
      if (editando === "nueva") {
        await api.post("/api/temporadas", form);
        toast.success("Temporada creada");
      } else if (editando) {
        await api.put(`/api/temporadas/${editando.id}`, form);
        toast.success("Temporada actualizada");
      }
      setEditando(null);
      cargar();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar la temporada"));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (t: Temporada, accion: "activar" | "cerrar") => {
    try {
      await api.patch(`/api/temporadas/${t.id}/${accion}`);
      toast.success(accion === "activar" ? `"${t.nombre}" es ahora la temporada activa` : `"${t.nombre}" cerrada`);
      cargar();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo cambiar el estado de la temporada"));
    }
  };

  return (
    <ProtectedRoute requiredPermission="ver_temporadas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Temporadas</h1>
            <p className="text-muted-foreground">
              Solo una temporada está activa a la vez; las inscripciones nuevas quedan en la activa.
            </p>
          </div>
          {puedeGestionar && (
            <Button onClick={abrirNueva}>
              <Plus className="mr-2 h-4 w-4" /> Nueva temporada
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  {puedeGestionar && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : temporadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Aún no hay temporadas. Crea la primera y actívala.
                    </TableCell>
                  </TableRow>
                ) : (
                  temporadas.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.nombre}</TableCell>
                      <TableCell>{fmt(t.fechaInicio)}</TableCell>
                      <TableCell>{fmt(t.fechaFin)}</TableCell>
                      <TableCell>
                        <Badge variant={t.activa ? "default" : "secondary"}>{t.activa ? "Activa" : "Inactiva"}</Badge>
                      </TableCell>
                      {puedeGestionar && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => abrirEdicion(t)}>
                              <Pencil className="mr-1 h-4 w-4" /> Editar
                            </Button>
                            {t.activa ? (
                              <Button size="sm" variant="outline" onClick={() => cambiarEstado(t, "cerrar")}>
                                <Square className="mr-1 h-4 w-4" /> Cerrar
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => cambiarEstado(t, "activar")}>
                                <Play className="mr-1 h-4 w-4" /> Activar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={editando !== null} onOpenChange={(o) => !o && setEditando(null)}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>{editando === "nueva" ? "Nueva temporada" : "Editar temporada"}</DialogTitle>
              <DialogDescription>Ejemplo de nombre: "2026".</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Nombre</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Inicio</Label>
                  <Input type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
                </div>
                <div>
                  <Label>Fin</Label>
                  <Input type="date" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditando(null)}>
                Cancelar
              </Button>
              <Button onClick={guardar} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}