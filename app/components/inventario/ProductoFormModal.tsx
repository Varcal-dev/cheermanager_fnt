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
import { Textarea } from "@/components/ui/textarea";
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
import { CategoriaProducto } from "./CategoriasProductoPanel";

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string;
  categoriaProductoId: number;
  categoriaNombre: string;
  precioMinReferencia: number;
  precioMaxReferencia: number;
  origen: string;
  notasProveedor: string;
  requiereControlStock: boolean;
  activo: boolean;
  stockTotal: number | null;
}

const FORM_VACIO = {
  codigo: "",
  nombre: "",
  descripcion: "",
  categoriaProductoId: "",
  precioMinReferencia: "",
  precioMaxReferencia: "",
  origen: "",
  notasProveedor: "",
  requiereControlStock: true,
};

export default function ProductoFormModal({
  open,
  onOpenChange,
  producto,
  onGuardado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: Producto | null;
  onGuardado: () => void;
}) {
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    api
      .get("/api/categorias-producto")
      .then((res) => setCategorias(res.data))
      .catch(() => toast.error("No se pudieron cargar las categorías"));

    if (producto) {
      setForm({
        codigo: "",
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? "",
        categoriaProductoId: String(producto.categoriaProductoId),
        precioMinReferencia: String(producto.precioMinReferencia ?? ""),
        precioMaxReferencia: String(producto.precioMaxReferencia ?? ""),
        origen: producto.origen ?? "",
        notasProveedor: producto.notasProveedor ?? "",
        requiereControlStock: producto.requiereControlStock,
      });
    } else {
      setForm(FORM_VACIO);
    }
  }, [open, producto]);

  const guardar = async () => {
    if (!form.nombre.trim() || !form.categoriaProductoId) {
      toast.error("Nombre y categoría son obligatorios");
      return;
    }
    if (!producto && !form.codigo.trim()) {
      toast.error("El código del artículo es obligatorio (se usa para armar el SKU)");
      return;
    }
    setGuardando(true);
    try {
      const payload = {
        codigo: form.codigo || undefined,
        nombre: form.nombre,
        descripcion: form.descripcion,
        categoriaProductoId: Number(form.categoriaProductoId),
        precioMinReferencia: form.precioMinReferencia ? Number(form.precioMinReferencia) : null,
        precioMaxReferencia: form.precioMaxReferencia ? Number(form.precioMaxReferencia) : null,
        origen: form.origen,
        notasProveedor: form.notasProveedor,
        requiereControlStock: form.requiereControlStock,
      };
      if (producto) {
        await api.put(`/api/productos/${producto.id}`, payload);
        toast.success("Producto actualizado");
      } else {
        await api.post("/api/productos", payload);
        toast.success("Producto creado");
      }
      onOpenChange(false);
      onGuardado();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo guardar el producto",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{producto ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 py-4 overflow-y-auto flex-1">
          <div className="grid gap-1.5">
            <Label>Nombre</Label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Camiseta de entrenamiento"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Categoría</Label>
            <Select
              value={form.categoriaProductoId}
              onValueChange={(v) => setForm({ ...form, categoriaProductoId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!producto && (
            <div className="grid gap-1.5">
              <Label>Código del artículo (3 letras)</Label>
              <Input
                value={form.codigo}
                maxLength={3}
                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej. CAE"
              />
              <p className="text-xs text-muted-foreground">
                El SKU completo se arma solo (RAT + categoría + este código).
              </p>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 grid gap-1.5">
              <Label>Precio mín. referencia</Label>
              <Input
                type="number"
                value={form.precioMinReferencia}
                onChange={(e) => setForm({ ...form, precioMinReferencia: e.target.value })}
              />
            </div>
            <div className="flex-1 grid gap-1.5">
              <Label>Precio máx. referencia</Label>
              <Input
                type="number"
                value={form.precioMaxReferencia}
                onChange={(e) => setForm({ ...form, precioMaxReferencia: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Origen / Proveedor</Label>
            <Input
              value={form.origen}
              onChange={(e) => setForm({ ...form, origen: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Notas del proveedor</Label>
            <Textarea
              value={form.notasProveedor}
              onChange={(e) => setForm({ ...form, notasProveedor: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="requiere-stock"
              checked={form.requiereControlStock}
              onCheckedChange={(v) => setForm({ ...form, requiereControlStock: v })}
            />
            <Label htmlFor="requiere-stock">Controlar stock de este producto</Label>
          </div>
        </div>
        <DialogFooter className="gap-3 px-6 pb-6 pt-3 border-t">
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