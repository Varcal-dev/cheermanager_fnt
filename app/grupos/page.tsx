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
import { toast } from "react-toastify";
import DeportistaElegibleItem from "../components/Forms/DeportistaElegibleItem";

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

interface TipoGrupo {
  id: number;
  nombre: string;
}

interface CategoriaNivel {
  id: number;
  nombre: string;
}

interface Deportista {
  id: number;
  nombre: string;
  nivel: string;
  // otros campos si aplican
}

interface Props {
  grupos: Grupo[];
  onGrupoUpdated: () => void; // Para refrescar los datos tras editar/borrar
}

export default function GruposPage() {
  const [deportistas, setDeportistas] = useState<Deportista[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [tiposGrupo, setTiposGrupo] = useState<TipoGrupo[]>([]);
  const [categoriasNivel, setCategoriasNivel] = useState<CategoriaNivel[]>([]);
  //const [editGrupo, setEditGrupo] = useState<any>(null); // Ajustar el tipo de acuerdo a la estructura de editGrupo

  const [editGrupo, setEditGrupo] = useState<Grupo | null>(null);
  const [deleteGrupoId, setDeleteGrupoId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [nuevoGrupo, setNuevoGrupo] = useState({
    nombre: "",
    tipoGrupoId: 0,
    categoriaNivelId: 0,
    estadoCategoriaNivel: 1, // valor por defecto si aplica
  });

  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Grupo | null>(
    null
  );
  const [modalDeportistasOpen, setModalDeportistasOpen] = useState(false);

  // Efecto para cargar deportistas inscritos cuando se abre el modal
  useEffect(() => {
    fetch("http://localhost:8080/api/inscripciones/inscritos")
      .then((res) => res.json())
      .then((data: any[][]) => {
        const adaptados = data.map((arr) => ({
          id: arr[0],
          nombre: arr[1],
          apellido: arr[2],
          genero: arr[5],
          nivel: arr[6],
        }));
        setDeportistas(
          adaptados); // 👈 debe ser tipo Deportista[]
      });
  }, []);

  useEffect(() => {
    fetchGrupos(); // Solo llama a la función
  }, []);

  const fetchGrupos = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/grupos/con-deportistas"
      );
      setGrupos(response.data); // Guarda los datos en el estado
    } catch (error) {
      console.error("Error al obtener los grupos:", error);
      toast.error("Error al cargar los grupos.");
    }
  };

  //const [tiposGrupo, setTiposGrupo] = useState([]);
  //const [categoriasNivel, setCategoriasNivel] = useState([]);

  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [tipos, categorias] = await Promise.all([
          axios.get("http://localhost:8080/api/tipo-grupos"),
          axios.get("http://localhost:8080/api/categorias-nivel"),
        ]);
        setTiposGrupo(tipos.data);
        setCategoriasNivel(categorias.data);
      } catch (error) {
        console.error("Error al cargar datos auxiliares", error);
      }
    };
    fetchAuxData();
  }, []);

  const handleDelete = async () => {
    if (!deleteGrupoId) return;

    try {
      const res = await axios.delete(
        `http://localhost:8080/api/grupos/${deleteGrupoId}`
      );
      toast.success("Grupo eliminado correctamente.");
      setConfirmDeleteOpen(false);
      fetchGrupos(); // 🔄 Refrescar la lista
    } catch (error: any) {
      console.error("Error al eliminar grupo:", error);
      toast.error(
        error.response?.data?.message || "Error al eliminar el grupo."
      );
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editGrupo || !editGrupo.id) return;

    try {
      const response = await axios.put(
        `http://localhost:8080/api/grupos/${editGrupo.id}`,
        {
          id: editGrupo.id,
          nombre: editGrupo.nombre,
          tipoGrupoId: editGrupo.tipoGrupo?.id, // ID del tipo de grupo
          categoriaNivelId: editGrupo.categoriaNivel?.id, // ID de la categoría de nivel
          // Puedes añadir más campos si es necesario
        }
      );
      toast.success("Grupo actualizado correctamente");
      setEditModalOpen(false);
      fetchGrupos(); // Refrescar la lista de grupos si es necesario
    } catch (error) {
      console.error("Error al actualizar grupo:", error);
      toast.error("Error al actualizar el grupo.");
    }
  };

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
    <ProtectedRoute requiredPermission="ver_roles">
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
                      <Button onClick={() => setCreateModalOpen(true)}>
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
                        const divisionId = categoria
                          ? categoria.division.id
                          : 0;
                        const nivelId = categoria ? categoria.nivel.id : 0;

                        return (
                          // Usa el ID del grupo como key para la fila principal
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
                                  {/* Acceso directo a las propiedades anidadas */}
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
                                {/* Asegúrate de que deportistas sea un array y accede a su length */}
                                {grupo.deportistas?.length ?? 0}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  {/* Botones de Editar y Eliminar */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditGrupo(grupo); // Establece el grupo a editar
                                      setEditModalOpen(true); // Abre el modal de edición
                                    }}
                                  >
                                    <Pencil className="h-4 w-4 mr-1" /> Editar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setDeleteGrupoId(grupo.id); // Establece el ID del grupo a eliminar
                                      setConfirmDeleteOpen(true); // Abre el modal de confirmación
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {expandedGroups.includes(grupo.id) && (
                              // Usa una key única para la fila expandida también
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
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setGrupoSeleccionado(grupo);
                                          setModalDeportistasOpen(true);
                                        }}
                                      >
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
                                        {/* Mapea sobre los deportistas del grupo ACTUAL */}
                                        {grupo.deportistas?.map(
                                          // Asegúrate de que deportistas sea un array
                                          (deportista) => (
                                            // Usa el ID del deportista como key
                                            <TableRow key={deportista.id}>
                                              <TableCell>
                                                {deportista.nombre}
                                              </TableCell>
                                              {/* Accede a la edad del deportista directamente */}
                                              <TableCell> años</TableCell>
                                              <TableCell>
                                                {/* Asumiendo que el objeto deportista tiene una propiedad 'nivel' */}
                                                NA
                                                {/*deportista.nivel?.nombre || "N/A"*/}
                                              </TableCell>
                                              <TableCell>
                                                <div className="flex space-x-2">
                                                  {/* Botones para el deportista dentro del grupo */}
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    // onClick={() => handleEditDeportistaInGroup(deportista.id, grupo.id)} // Ejemplo: Si tuvieras lógica para editar deportista en grupo
                                                  >
                                                    <Pencil className="h-4 w-4 mr-1" />{" "}
                                                    Editar
                                                  </Button>
                                                  <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    // onClick={() => handleRemoveDeportistaFromGroup(deportista.id, grupo.id)} // Ejemplo: Si tuvieras lógica para quitar deportista
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ProtectedRoute>

        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Grupo</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await axios.post(
                    "http://localhost:8080/api/grupos",
                    nuevoGrupo
                  );
                  console.log("Grupo creado:", nuevoGrupo);
                  toast.success("Grupo creado exitosamente");
                  setCreateModalOpen(false);
                  setNuevoGrupo({
                    nombre: "",
                    tipoGrupoId: 0,
                    categoriaNivelId: 0,
                    estadoCategoriaNivel: 1,
                  });
                  fetchGrupos(); // recarga la lista
                } catch (error) {
                  console.error("Error al crear grupo:", error);
                  toast.error("Error al crear grupo");
                }
              }}
              className="space-y-4"
            >
              <input
                type="text"
                className="w-full border p-2 rounded"
                placeholder="Nombre del grupo"
                value={nuevoGrupo.nombre}
                onChange={(e) =>
                  setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value })
                }
                required
              />

              <select
                className="w-full border p-2 rounded"
                value={nuevoGrupo.tipoGrupoId}
                onChange={(e) =>
                  setNuevoGrupo({
                    ...nuevoGrupo,
                    tipoGrupoId: Number(e.target.value),
                  })
                }
                required
              >
                <option value="">Seleccione tipo de grupo</option>
                {tiposGrupo.map((tipo: any) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>

              <select
                className="w-full border p-2 rounded"
                value={nuevoGrupo.categoriaNivelId}
                onChange={(e) =>
                  setNuevoGrupo({
                    ...nuevoGrupo,
                    categoriaNivelId: Number(e.target.value),
                  })
                }
                required
              >
                <option value="">Seleccione categoría</option>
                {categoriasNivel.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Crear</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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
                {/* Selector para Tipo de Grupo */}
                <div>
                  <label
                    htmlFor="tipoGrupo"
                    className="block text-sm font-medium"
                  >
                    Tipo de Grupo
                  </label>
                  <select
                    id="tipoGrupo"
                    className="w-full border p-2 rounded"
                    value={editGrupo.tipoGrupo?.id || ""}
                    onChange={(e) =>
                      setEditGrupo({
                        ...editGrupo,
                        tipoGrupo: {
                          id: parseInt(e.target.value),
                          nombre: "",
                        },
                      })
                    }
                  >
                    <option value="" disabled>
                      Selecciona un tipo de grupo
                    </option>
                    {tiposGrupo.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector para Categoría de Nivel */}
                <div>
                  <label
                    htmlFor="categoriaNivel"
                    className="block text-sm font-medium"
                  >
                    Categoría de Nivel
                  </label>
                  <select
                    id="categoriaNivel"
                    className="w-full border p-2 rounded"
                    value={editGrupo.categoriaNivel?.id || ""}
                    onChange={(e) =>
                      setEditGrupo({
                        ...editGrupo,
                        categoriaNivel: {
                          id: parseInt(e.target.value),
                          nombre: "",
                          nivel: {
                            id: 0,
                            nombre: "",
                          },
                          division: {
                            id: 0,
                            nombre: "",
                          },
                          estadoCategoriaNivel: {
                            id: 0,
                            nombre: "",
                          },
                          deportistas: {
                            id: 0,
                            nombre: "",
                            edad: 0,
                            nivel_id: 0,
                          },
                        },
                      })
                    }
                  >
                    <option value="" disabled>
                      Selecciona una categoría
                    </option>
                    {categoriasNivel.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                </div>

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

        {/* Modal para añadir deportista a grupo*/}
        <Dialog
          open={modalDeportistasOpen}
          onOpenChange={setModalDeportistasOpen}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                Añadir Deportista al Grupo: {grupoSeleccionado?.nombre}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {grupoSeleccionado &&
                deportistas.map((deportista) => (
                  <DeportistaElegibleItem
                    key={deportista.id}
                    deportista={deportista}
                    grupoId={grupoSeleccionado.id}
                    onSuccess={() => {
                      toast.success("Deportista añadido con éxito");
                      setModalDeportistasOpen(false);
                    }}
                  />
                ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
