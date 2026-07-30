"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProductoFormModal, { Producto } from "../components/inventario/ProductoFormModal";
import ProductoVariantesPanel from "../components/inventario/ProductoVariantesPanel";
import CategoriasProductoPanel from "../components/inventario/CategoriasProductoPanel";
import React from "react";

export default function InventarioPage() {
  const [cargando, setCargando] = useState(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [expandidos, setExpandidos] = useState<number[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<Producto | null>(null);

  const cargar = () => {
    setCargando(true);
    api
      .get("/api/productos")
      .then((res) => setProductos(res.data))
      .catch(() => toast.error("No se pudieron cargar los productos"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandidos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const abrirNuevo = () => {
    setProductoEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (producto: Producto) => {
    setProductoEnEdicion(producto);
    setModalAbierto(true);
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Desactivar este producto? No se borra físicamente, solo deja de estar disponible.")) return;
    try {
      await api.delete(`/api/productos/${id}`);
      toast.success("Producto desactivado");
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo desactivar el producto",
      );
    }
  };

  return (
    <ProtectedRoute requiredPermission="ver_producto">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
            <p className="text-muted-foreground">
              Productos, variantes y movimientos de stock
            </p>
          </div>
          <Button onClick={abrirNuevo}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
          </Button>
        </div>

        <Tabs defaultValue="productos">
          <TabsList>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="categorias">Categorías</TabsTrigger>
          </TabsList>

          <TabsContent value="productos" className="mt-4">
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
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Stock total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay productos para mostrar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        productos.map((producto) => {
                          const estaExpandido = expandidos.includes(producto.id);
                          return (
                            <React.Fragment key={producto.id}>
                              <TableRow>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleExpand(producto.id)}
                                  >
                                    {estaExpandido ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{producto.sku}</TableCell>
                                <TableCell className="font-medium">{producto.nombre}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{producto.categoriaNombre}</Badge>
                                </TableCell>
                                <TableCell>
                                  {producto.requiereControlStock ? (
                                    <Badge variant={(producto.stockTotal ?? 0) <= 5 ? "destructive" : "outline"}>
                                      {producto.stockTotal ?? 0}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">No aplica</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={producto.activo ? "default" : "secondary"}>
                                    {producto.activo ? "Activo" : "Inactivo"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => abrirEdicion(producto)}
                                    >
                                      <Pencil className="h-4 w-4 mr-1" /> Editar
                                    </Button>
                                    {producto.activo && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => eliminar(producto.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" /> Desactivar
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                              {estaExpandido && (
                                <TableRow className="bg-muted/50">
                                  <TableCell colSpan={7} className="p-0">
                                    <div className="p-4">
                                      <h4 className="font-semibold mb-3">Variantes</h4>
                                      <ProductoVariantesPanel
                                        productoId={producto.id}
                                        requiereControlStock={producto.requiereControlStock}
                                      />
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categorias" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <CategoriasProductoPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ProductoFormModal
        open={modalAbierto}
        onOpenChange={setModalAbierto}
        producto={productoEnEdicion}
        onGuardado={cargar}
      />
    </ProtectedRoute>
  );
}