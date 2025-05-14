"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Filter,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
//import { Input } from "@/components/ui/input"
//import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "react-toastify";

export interface Categoria {
  id: number;
  nombre: string;
  division: string;
  añoNacimientoMin: number;
  añoNacimientoMax: number | null;
  cantidadMin: number;
  cantidadMax: number;
  restricciones: string;
}

export interface Nivel {
  id: number;
  nombre: string;
  descripcion: string | null;
  categorias: Categoria[];
}

export default function NivelesPage() {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [expandedNiveles, setExpandedNiveles] = useState<number[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/niveles/detallado")
      .then((res) => {
        setNiveles(res.data);
      })
      .catch((err) => {
        console.error("Error cargando niveles:", err);
      });
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("niveles");

  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const onCreated = () => {
    axios
      .get("http://localhost:8080/api/niveles/detallado")
      .then((res) => {
        setNiveles(res.data);
      })
      .catch((err) => {
        console.error("Error cargando niveles:", err);
      });
  };

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/categorias-nivel")
      .then((res) => setCategorias(res.data))
      .catch((err) => console.error("Error cargando categorías:", err));
  }, []);

  const [modalAbierto, setModalAbierto] = useState(false);

  const abrirModal = () => {
    setModalAbierto(true);
  };

  const handleSubmit = () => {
    if (!categoriaId || !nombre) return;

    const payload = {
      nombre,
      categoriaId: parseInt(categoriaId),
    };

    axios
      .post("http://localhost:8080/api/niveles", payload)
      .then(() => {
        toast(`El nivel ${nombre} fue creado correctamente.`);

        onCreated();
        setModalAbierto(false);
        setNombre("");
        setDescripcion("");
        setCategoriaId("");
      })

      .catch((err) => {
        console.error("Error Creando el nivel:", err);
        toast("No se pudo crear el nivel. Intenta nuevamente.");
      });
  };

  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [nivelAEliminar, setNivelAEliminar] = useState<number | null>(null);

  // Función para abrir el diálogo y guardar el ID del nivel a eliminar
  const abrirDialogoEliminar = (id: number) => {
    setNivelAEliminar(id);
    setDialogAbierto(true);
  };

  const handleDelete = () => {
    if (nivelAEliminar === null) return;

    axios
      .delete(`http://localhost:8080/api/niveles/${nivelAEliminar}`)
      .then(() => {
        toast.error(`El nivel fue eliminado correctamente.`);

        setDialogAbierto(false);
        setNivelAEliminar(null);
        onCreated(); // Refresca la lista
      })
      .catch((err) => {
        console.error("Error eliminando nivel:", err);
        toast("Error al eliminar");
      });
  };

  // Función para alternar la expansión de un nivel
  const toggleNivelExpand = (id: number) => {
    setExpandedNiveles((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filtrar niveles por término de búsqueda
  const filteredNiveles = niveles; // o aplicar filtros según tu lógica

  return (
    <ProtectedRoute requiredPermission="ver_roles">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Pestaña de Niveles */}
          <TabsContent value="niveles">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Niveles</CardTitle>
                  <CardDescription>
                    Gestiona los niveles de dificultad y experiencia para los
                    deportistas
                  </CardDescription>
                </div>
                <ProtectedRoute requiredPermission="crear_nivel">
                  <Button onClick={abrirModal}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Nivel
                  </Button>
                </ProtectedRoute>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="flex items-center space-x-2 w-full max-w-sm">
                    <Input
                      placeholder="Buscar niveles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex space-x-2">
                    {/*
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>*/}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categorías</TableHead>
                      <TableHead>Accion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNiveles.map((nivel) => {
                      const categorias = nivel.categorias || [];

                      return (
                        <React.Fragment key={nivel.id}>
                          {/* Fila del nivel */}
                          <TableRow>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleNivelExpand(nivel.id)}
                              >
                                {expandedNiveles.includes(nivel.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="font-medium">
                                  {nivel.nombre}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {nivel.descripcion || "Sin descripción"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {categorias.length}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {/*
                              <Button variant="outline" size="sm">
                                <Pencil className="h-4 w-4 mr-1" /> Editar
                              </Button>*/}
                                <ProtectedRoute requiredPermission="eliminar_nivel">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      abrirDialogoEliminar(nivel.id)
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                  </Button>
                                </ProtectedRoute>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Subtabla de categorías */}
                          {expandedNiveles.includes(nivel.id) && (
                            <TableRow
                              key={`${nivel.id}-categorias`}
                              className="bg-muted/50"
                            >
                              <TableCell colSpan={5} className="p-0">
                                <div className="p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold">
                                      Categorías en {nivel.nombre}
                                    </h3>
                                  </div>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>División</TableHead>
                                        <TableHead>Año Nacimiento</TableHead>
                                        <TableHead>Cantidad</TableHead>
                                        <TableHead>Restricciones</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {categorias.map((categoria) => (
                                        <TableRow key={categoria.id}>
                                          <TableCell className="font-medium">
                                            {categoria.nombre}
                                          </TableCell>
                                          <TableCell>
                                            {categoria.division}
                                          </TableCell>
                                          <TableCell>
                                            {categoria.añoNacimientoMin
                                              ? categoria.añoNacimientoMax
                                                ? `${categoria.añoNacimientoMin} a ${categoria.añoNacimientoMax}`
                                                : `${categoria.añoNacimientoMin} en adelante`
                                              : categoria.añoNacimientoMax
                                              ? `Hasta ${categoria.añoNacimientoMax}`
                                              : "Sin restricción"}
                                          </TableCell>
                                          <TableCell>
                                            {categoria.cantidadMin} a{" "}
                                            {categoria.cantidadMax} deportistas
                                          </TableCell>
                                          <TableCell>
                                            {categoria.restricciones}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Pestaña de Categorías */}
        <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Nivel</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nombre" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  className="col-span-3"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Categoría</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSubmit}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este nivel?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El nivel y sus asociaciones
                serán eliminados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
