"use client";

import { useEffect, useState } from "react";

//import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Ajusta si usas otro modal

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  Filter,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import ProtectedRoute from "@/components/ProtectedRoute";
import React from "react";

interface Grupo {
  id: number;
  nombre: string;
  tipoGrupo: {
    id: number;
    nombre: string;
  };
  categoriaNivel: {
    id: number;
    nombre: string;
    nivel: {
      id: number;
      nombre: string;
    };
    division: {
      id: number;
      nombre: string;
    };
    estadoCategoriaNivel: {
      id: number;
      nombre: string;
    };
    deportistas: {
      id: number;
      nombre: string;
      edad: number;
      nivel_id: number;
    };
  };
  deportistas?: { id: number; nombre: string }[]; // Si aplica
}

interface Props {
  grupos: Grupo[];
  onGrupoUpdated: () => void; // Para refrescar los datos tras editar/borrar
}

export default function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  const [editGrupo, setEditGrupo] = useState<Grupo | null>(null);
  const [deleteGrupoId, setDeleteGrupoId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/grupos/con-deportistas")
      .then((response) => {
        setGrupos(response.data);
      })
      .catch((error) => {
        console.error("Error al obtener los grupos:", error);
      });
  }, []);

  const handleDelete = async () => {
    if (!deleteGrupoId) return;
    try {
      await fetch(`/api/grupos/${deleteGrupoId}`, {
        method: "DELETE",
      });
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error("Error al eliminar grupo:", error);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editGrupo) return;
    try {
      await fetch(`/api/grupos/${editGrupo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editGrupo),
      });
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error al editar grupo:", error);
    }
  };

  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleGroupExpand = (groupId: number) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Filtrar grupos por término de búsqueda
  const filteredGrupos = grupos.filter(
    (grupo) =>
      grupo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grupo.categoriaNivel?.nombre
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      grupo.tipoGrupo?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Grupos de Deportista
          </h1>
          <p className="text-muted-foreground">
            Gestiona los grupos de entrenamiento y competencia
          </p>
        </div>
      </div>

      <ProtectedRoute requiredPermission="ver_roles">
        <Tabs defaultValue="grupos" className="w-full">
          {/* Pestaña de Grupos */}
          <TabsContent value="grupos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div></div>
                <div className="flex space-x-2"></div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="flex items-center space-x-2 w-full max-w-sm">
                    <Input
                      placeholder="Buscar grupos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Nuevo Grupo
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="mr-2 h-4 w-4" />
                          Filtrar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Todos los grupos</DropdownMenuItem>
                        <DropdownMenuItem>
                          Grupos de entrenamiento
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Grupos de competencia
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Grupos de exhibición
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>División</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Deportistas</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrupos.map((grupo) => {
                      const categoria = grupo.categoriaNivel; // Ya tienes acceso directo a categoriaNivel desde grupo.
                      const divisionId = categoria ? categoria.division.id : 0;
                      const nivelId = categoria ? categoria.nivel.id : 0;

                      return (
                        <>
                          {grupos.map((grupo) => (
                            <React.Fragment key={grupo.id}>
                              <TableRow>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleGroupExpand(grupo.id)}
                                  >
                                    {expandedGroups.includes(grupo.id) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {grupo.nombre}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {grupo.tipoGrupo?.nombre}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {grupo.categoriaNivel?.nombre}
                                </TableCell>
                                <TableCell>
                                  {grupo.categoriaNivel?.division?.nombre}
                                </TableCell>
                                <TableCell>
                                  {grupo.categoriaNivel?.nivel?.nombre}
                                </TableCell>
                                <TableCell>
                                  {grupo.deportistas?.length ?? 0}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm">
                                      <Pencil className="h-4 w-4 mr-1" /> Editar
                                    </Button>
                                    <Button variant="destructive" size="sm">
                                      <Trash2 className="h-4 w-4 mr-1" />{" "}
                                      Eliminar
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>

                              {expandedGroups.includes(grupo.id) && (
                                <TableRow
                                  key={`${grupo.id}-deportistas`}
                                  className="bg-muted/50"
                                >
                                  <TableCell colSpan={8} className="p-0">
                                    <div className="p-4">
                                      <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold">
                                          Deportistas en este grupo
                                        </h3>
                                        <Button size="sm" variant="outline">
                                          <UserPlus className="h-4 w-4 mr-1" />{" "}
                                          Añadir Deportista
                                        </Button>
                                      </div>

                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Edad</TableHead>
                                            <TableHead>Nivel</TableHead>
                                            <TableHead>Acciones</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {grupo.deportistas?.map(
                                            (deportista) => (
                                              <TableRow key={deportista.id}>
                                                <TableCell>
                                                  {deportista.nombre}
                                                </TableCell>
                                                <TableCell>Edad
                                                </TableCell>
                                                <TableCell>N/A</TableCell>
                                                <TableCell>
                                                  <div className="flex space-x-2">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => {
                                                        setEditGrupo(grupo);
                                                        setEditModalOpen(true);
                                                      }}
                                                    >
                                                      <Pencil className="h-4 w-4 mr-1" />{" "}
                                                      Editar
                                                    </Button>
                                                    <Button
                                                      variant="destructive"
                                                      size="sm"
                                                      onClick={() => {
                                                        setDeleteGrupoId(
                                                          grupo.id
                                                        );
                                                        setConfirmDeleteOpen(
                                                          true
                                                        );
                                                      }}
                                                    >
                                                      <Trash2 className="h-4 w-4 mr-1" />{" "}
                                                      Quitar
                                                    </Button>
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            )
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ProtectedRoute>

      {/* Modal de Confirmación para eliminar */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar grupo?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>¿Estás seguro de que deseas eliminar este grupo?</p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para editar */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar grupo</DialogTitle>
          </DialogHeader>
          {editGrupo && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={editGrupo.nombre}
                onChange={(e) =>
                  setEditGrupo({ ...editGrupo, nombre: e.target.value })
                }
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar cambios</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
