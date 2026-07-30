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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

export interface CategoriaProducto {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
}

const FORM_VACIO = { nombre: "", codigo: "", descripcion: "" };

export default function CategoriasProductoPanel() {
  const [cargando, setCargando] = useState(true);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<CategoriaProducto | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    api
      .get("/api/categorias-producto")
      .then((res) => setCategorias(res.data))
      .catch(() => toast.error("No se pudieron cargar las categorías"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirNueva = () => {
    setEnEdicion(null);
    setForm(FORM_VACIO);
    setModalAbierto(true);
  };

  const abrirEdicion = (c: CategoriaProducto) => {
    setEnEdicion(c);
    setForm({ nombre: c.nombre, codigo: c.codigo, descripcion: c.descripcion ?? "" });
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.codigo.trim()) {
      toast.error("Nombre y código son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      if (enEdicion) {
        await api.put(`/api/categorias-producto/${enEdicion.id}`, form);
        toast.success("Categoría actualizada");
      } else {
        await api.post("/api/categorias-producto", form);
        toast.success("Categoría creada");
      }
      setModalAbierto(false);
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo guardar la categoría",
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await api.delete(`/api/categorias-producto/${id}`);
      toast.success("Categoría eliminada");
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo eliminar (puede tener productos asociados)",
      );
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={abrirNueva}>
          <Plus className="h-4 w-4 mr-1" /> Nueva Categoría
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categorias.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No hay categorías para mostrar.
              </TableCell>
            </TableRow>
          ) : (
            categorias.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono">{c.codigo}</TableCell>
                <TableCell className="font-medium">{c.nombre}</TableCell>
                <TableCell>{c.descripcion}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => abrirEdicion(c)}>
                      <Pencil className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => eliminar(c.id)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{enEdicion ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Ropa"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Código (3 letras)</Label>
              <Input
                value={form.codigo}
                maxLength={3}
                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej. ROP"
              />
              <p className="text-xs text-muted-foreground">
                Se usa para armar el SKU de los productos de esta categoría.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
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