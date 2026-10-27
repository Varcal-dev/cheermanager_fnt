"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";

interface Criterio {
  id: number;
  nombre: string;
  categoriaId: number;
  categoria: string;
  enUso: boolean; // ya tiene evaluaciones: no se borra ni cambia de categoría
}

interface Categoria {
  id: number;
  categoria: string;
}

const TODAS = "todas";

export default function CriteriosEvaluacionPage() {
  const { permissions } = useUser();
  const puedeCrear = permissions.includes("crear_criterio_evaluacion");
  const puedeEditar = permissions.includes("modificar_criterio_evaluacion");
  const puedeEliminar = permissions.includes("eliminar_criterio_evaluacion");

  const [cargando, setCargando] = useState(true);
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState(TODAS);
  const [busqueda, setBusqueda] = useState("");

  // Formulario crear / editar
  const [formAbierto, setFormAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Criterio | null>(null);
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Eliminar
  const [aEliminar, setAEliminar] = useState<Criterio | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = () => {
    setCargando(true);
    Promise.allSettled([api.get("/api/criterios-evaluacion"), api.get("/api/tipos-categoria")]).then(
      ([resCriterios, resCategorias]) => {
        if (resCriterios.status === "fulfilled") setCriterios(resCriterios.value.data);
        else toast.error("No se pudieron cargar los criterios");
        if (resCategorias.status === "fulfilled") setCategorias(resCategorias.value.data);
        else toast.error("No se pudieron cargar las categorías");
        setCargando(false);
      },
    );
  };

  useEffect(() => {
    cargar();
  }, []);

  const visibles = useMemo(
    () =>
      criterios
        .filter((c) => filtroCategoria === TODAS || String(c.categoriaId) === filtroCategoria)
        .filter((c) => c.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()))
        .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre)),
    [criterios, filtroCategoria, busqueda],
  );

  const abrirCrear = () => {
    setEnEdicion(null);
    setNombre("");
    setCategoriaId(filtroCategoria !== TODAS ? filtroCategoria : "");
    setFormAbierto(true);
  };

  const abrirEditar = (c: Criterio) => {
    setEnEdicion(c);
    setNombre(c.nombre);
    setCategoriaId(String(c.categoriaId));
    setFormAbierto(true);
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      toast.error("Escribe el nombre del criterio");
      return;
    }
    if (!categoriaId) {
      toast.error("Selecciona la categoría");
      return;
    }
    setGuardando(true);
    try {
      const body = { nombre: nombre.trim(), categoriaId: Number(categoriaId) };
      if (enEdicion) {
        await api.put(`/api/criterios-evaluacion/${enEdicion.id}`, body);
        toast.success("Criterio actualizado");
      } else {
        await api.post("/api/criterios-evaluacion", body);
        toast.success("Criterio creado");
      }
      setFormAbierto(false);
      cargar();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudo guardar el criterio"));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!aEliminar) return;
    setEliminando(true);
    try {
      await api.delete(`/api/criterios-evaluacion/${aEliminar.id}`);
      toast.success("Criterio eliminado");
      setAEliminar(null);
      cargar();
    } catch (error: any) {
      toast.error(getErrorMessage(error, "No se pudo eliminar el criterio"));
    } finally {
      setEliminando(false);
    }
  };

  const categoriaBloqueada = !!enEdicion?.enUso;

  return (
    <ProtectedRoute requiredPermission="ver_evaluacion">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Criterios de evaluación</h1>
            <p className="text-muted-foreground">
              Lo que se mide al evaluar a un deportista, agrupado por categoría (física, técnica, …).
            </p>
          </div>
          {puedeCrear && (
            <Button onClick={abrirCrear}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo criterio
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar criterio..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-9 w-64"
          />
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas las categorías</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.categoria}
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
                    <TableHead>Criterio</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Uso</TableHead>
                    {(puedeEditar || puedeEliminar) && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {criterios.length === 0
                          ? "Aún no hay criterios. Crea el primero para poder evaluar."
                          : "Ningún criterio coincide con el filtro."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibles.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.nombre}</TableCell>
                        <TableCell>{c.categoria}</TableCell>
                        <TableCell>
                          {c.enUso ? (
                            <Badge variant="secondary">Con evaluaciones</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin usar</span>
                          )}
                        </TableCell>
                        {(puedeEditar || puedeEliminar) && (
                          <TableCell>
                            <div className="flex space-x-2">
                              {puedeEditar && (
                                <Button variant="outline" size="sm" onClick={() => abrirEditar(c)}>
                                  <Pencil className="h-4 w-4 mr-1" /> Editar
                                </Button>
                              )}
                              {puedeEliminar && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={c.enUso}
                                  title={c.enUso ? "Ya tiene evaluaciones: no se puede eliminar" : undefined}
                                  onClick={() => setAEliminar(c)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
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
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={formAbierto} onOpenChange={setFormAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{enEdicion ? "Editar criterio" : "Nuevo criterio"}</DialogTitle>
            <DialogDescription>
              {enEdicion
                ? "Cambiar el nombre actualiza también las evaluaciones ya registradas con este criterio."
                : "Ej.: Flexibilidad, Sincronía, Altura del salto."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="criterio-nombre">Nombre</Label>
              <Input
                id="criterio-nombre"
                value={nombre}
                maxLength={150}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Categoría</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId} disabled={categoriaBloqueada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoriaBloqueada && (
                <p className="text-xs text-muted-foreground">
                  Ya tiene evaluaciones: no se puede cambiar de categoría. Crea uno nuevo si lo necesitas en otra.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormAbierto(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!aEliminar} onOpenChange={(abierto) => !abierto && setAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar criterio</DialogTitle>
            <DialogDescription>
              ¿Eliminar &quot;{aEliminar?.nombre}&quot; ({aEliminar?.categoria})? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAEliminar(null)} disabled={eliminando}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={eliminar} disabled={eliminando}>
              {eliminando && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}