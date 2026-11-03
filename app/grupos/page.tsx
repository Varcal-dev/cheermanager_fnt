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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/ProtectedRoute";
import React from "react";
import { toast } from "react-toastify";
import AsignarDeportistasModal from "../components/Forms/AsignarDeportistasModal";
import { ModalAsignarEntrenador } from "../components/Forms/AsignarEntrenadorModal";
import { api } from "@/lib/api";

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
    cantidadMin?: number | null;
    cantidadMax?: number | null;
  };
  deportistas?: {
    id: number;
    nombre: string;
    apellidos?: string;
    fechaNacimiento?: string;
  }[];
}

interface TipoGrupo {
  id: number;
  nombre: string;
}

interface HorarioSimple {
  id: number;
  dia: string;
  horaInicio: string; // "HH:mm:ss"
  horaFin: string;
  grupos: { grupoId: number }[];
}

const ORDEN_DIAS: Record<string, number> = {
  lunes: 1,
  martes: 2,
  miércoles: 3,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  sabado: 6,
  domingo: 7,
};

const formatHora = (hora: string) => hora?.slice(0, 5) ?? "";

interface CategoriaNivel {
  id: number;
  nombre: string;
}

export default function GruposPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [tiposGrupo, setTiposGrupo] = useState<TipoGrupo[]>([]);
  const [categoriasNivel, setCategoriasNivel] = useState<CategoriaNivel[]>([]);

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
    null,
  );
  const [modalDeportistasOpen, setModalDeportistasOpen] = useState(false);
  const [horarios, setHorarios] = useState<HorarioSimple[]>([]);

  useEffect(() => {
    fetchGrupos(); // Solo llama a la función
  }, []);

  useEffect(() => {
    // Se reutiliza el mismo endpoint que usa horarios/page.tsx para saber
    // qué horarios tiene asignados cada grupo, sin duplicar lógica en el back.
    api
      .get(`/api/horarios`)
      .then((res) => setHorarios(res.data))
      .catch((error) => {
        console.error("Error al obtener horarios:", error);
      });
  }, []);

  const horariosDeGrupo = (grupoId: number) =>
    horarios
      .filter((h) => h.grupos.some((g) => g.grupoId === grupoId))
      .sort((a, b) => {
        const diaA = ORDEN_DIAS[a.dia.toLowerCase()] ?? 99;
        const diaB = ORDEN_DIAS[b.dia.toLowerCase()] ?? 99;
        if (diaA !== diaB) return diaA - diaB;
        return a.horaInicio.localeCompare(b.horaInicio);
      });

  const fetchGrupos = async () => {
    try {
      const response = await api.get(`/api/grupos/con-deportistas`);
      setGrupos(response.data); // Guarda los datos en el estado
    } catch (error) {
      console.error("Error al obtener los grupos:", error);
      toast.error("Error al cargar los grupos.");
    }
  };

  useEffect(() => {
    const fetchAuxData = async () => {
      try {
        const [tipos, categorias] = await Promise.all([
          api.get(`/api/tipo-grupos`),
          api.get(`/api/categorias-nivel`),
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
      const res = await api.delete(`/api/grupos/${deleteGrupoId}`);
      toast.success("Grupo eliminado correctamente.");
      setConfirmDeleteOpen(false);
      fetchGrupos(); // 🔄 Refrescar la lista
    } catch (error: any) {
      console.error("Error al eliminar grupo:", error);
      toast.error(
        error.response?.data?.message || "Error al eliminar el grupo.",
      );
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editGrupo || !editGrupo.id) return;

    try {
      const response = await api.put(`/api/grupos/${editGrupo.id}`, {
        id: editGrupo.id,
        nombre: editGrupo.nombre,
        tipoGrupoId: editGrupo.tipoGrupo?.id, // ID del tipo de grupo
        categoriaNivelId: editGrupo.categoriaNivel?.id, // ID de la categoría de nivel
      });
      toast.success("Grupo actualizado correctamente");
      setEditModalOpen(false);
      fetchGrupos(); // Refrescar la lista de grupos si es necesario
    } catch (error) {
      console.error("Error al actualizar grupo:", error);
      toast.error("Error al actualizar el grupo.");
    }
  };

  const handleQuitarDeportista = async (
    grupoId: number,
    deportistaId: number,
  ) => {
    try {
      const response = await api.delete(
        `/api/grupos/${grupoId}/deportistas/${deportistaId}`,
      );
      toast.success(response.data || "Deportista removido del grupo");
      fetchGrupos();
    } catch (error: any) {
      console.error("Error al quitar deportista:", error);
      toast.error(
        error.response?.data ?? "Error al quitar al deportista del grupo.",
      );
    }
  };

  const calcularEdad = (fechaNacimiento?: string) => {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(fechaNacimiento);
    if (isNaN(nacimiento.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const cumplioEsteAño =
      hoy.getMonth() > nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() &&
        hoy.getDate() >= nacimiento.getDate());
    if (!cumplioEsteAño) edad -= 1;
    return edad;
  };

  const toggleGroupExpand = (groupId: number) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  // Filtrar grupos por término de búsqueda
  const filteredGrupos = grupos.filter(
    (grupo) =>
      grupo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grupo.categoriaNivel?.nombre
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      grupo.tipoGrupo?.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <ProtectedRoute requiredPermission="ver_grupo">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">
              Grupos de Deportista
            </h1>
            <p className="text-muted-foreground">
              Gestiona los grupos de entrenamiento y competencia
            </p>
          </div>
        </div>

        <ProtectedRoute requiredPermission="ver_grupo">
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
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                          Nombre
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                          Tipo
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                          Categoría
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                          División
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                          Nivel
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                          Deportistas
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                          Horario
                        </TableHead>
                        <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGrupos.map((grupo) => {
                        const categoria = grupo.categoriaNivel; // Ya tienes acceso directo a categoriaNivel desde grupo.
                        const divisionId = categoria
                          ? categoria.division.id
                          : 0;
                        const nivelId = categoria ? categoria.nivel.id : 0;
                        const cantidadActual = grupo.deportistas?.length ?? 0;
                        const cupoMaximo = categoria?.cantidadMax ?? null;
                        const grupoLleno =
                          cupoMaximo != null && cantidadActual >= cupoMaximo;

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
                                <Badge
                                  variant="outline"
                                  className={
                                    grupoLleno
                                      ? "bg-destructive/10 text-destructive border-destructive/30"
                                      : ""
                                  }
                                >
                                  {cantidadActual}
                                  {cupoMaximo != null ? `/${cupoMaximo}` : ""}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1 max-w-[220px]">
                                  {horariosDeGrupo(grupo.id).length === 0 ? (
                                    <span className="text-sm text-muted-foreground">
                                      Sin horario
                                    </span>
                                  ) : (
                                    horariosDeGrupo(grupo.id).map((h) => (
                                      <Badge
                                        key={h.id}
                                        variant="outline"
                                        className="text-xs whitespace-nowrap border-accent/30 bg-accent/5 text-accent"
                                      >
                                        {h.dia.slice(0, 3)}{" "}
                                        {formatHora(h.horaInicio)}-
                                        {formatHora(h.horaFin)}
                                      </Badge>
                                    ))
                                  )}
                                </div>
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
                                <TableCell colSpan={9} className="p-0">
                                  <div className="p-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <h3 className="font-display font-semibold">
                                        Deportistas en este grupo
                                      </h3>
                                      <div className="flex items-center gap-2">
                                        <ModalAsignarEntrenador
                                          grupoId={grupo.id}
                                          grupoNombre={grupo.nombre}
                                          onEntrenadorAsignado={fetchGrupos}
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={grupoLleno}
                                          title={
                                            grupoLleno
                                              ? "El grupo ya alcanzó su cupo máximo"
                                              : undefined
                                          }
                                          onClick={() => {
                                            setGrupoSeleccionado(grupo);
                                            setModalDeportistasOpen(true);
                                          }}
                                        >
                                          <UserPlus className="h-4 w-4 mr-1" />{" "}
                                          Añadir Deportista
                                        </Button>
                                      </div>
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
                                          (deportista) => {
                                            const edad = calcularEdad(
                                              deportista.fechaNacimiento,
                                            );
                                            return (
                                              <TableRow key={deportista.id}>
                                                <TableCell>
                                                  {deportista.nombre}{" "}
                                                  {deportista.apellidos ?? ""}
                                                </TableCell>
                                                <TableCell>
                                                  {edad != null
                                                    ? `${edad} años`
                                                    : "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                  {grupo.categoriaNivel
                                                    ?.nombre ?? "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                  <div className="flex space-x-2">
                                                    <Button
                                                      variant="destructive"
                                                      size="sm"
                                                      onClick={() =>
                                                        handleQuitarDeportista(
                                                          grupo.id,
                                                          deportista.id,
                                                        )
                                                      }
                                                    >
                                                      <Trash2 className="h-4 w-4 mr-1" />{" "}
                                                      Quitar
                                                    </Button>
                                                  </div>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          },
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
                  await api.post(`/api/grupos`, nuevoGrupo);
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
              <div className="space-y-2">
                <Label>Nombre del grupo</Label>
                <Input
                  placeholder="Nombre del grupo"
                  value={nuevoGrupo.nombre}
                  onChange={(e) =>
                    setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de grupo</Label>
                <Select
                  value={nuevoGrupo.tipoGrupoId ? String(nuevoGrupo.tipoGrupoId) : ""}
                  onValueChange={(value) =>
                    setNuevoGrupo({ ...nuevoGrupo, tipoGrupoId: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo de grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposGrupo.map((tipo: any) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={
                    nuevoGrupo.categoriaNivelId
                      ? String(nuevoGrupo.categoriaNivelId)
                      : ""
                  }
                  onValueChange={(value) =>
                    setNuevoGrupo({
                      ...nuevoGrupo,
                      categoriaNivelId: Number(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasNivel.map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <div className="space-y-2">
                  <Label>Nombre del grupo</Label>
                  <Input
                    value={editGrupo.nombre}
                    onChange={(e) =>
                      setEditGrupo({ ...editGrupo, nombre: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoGrupo">Tipo de Grupo</Label>
                  <Select
                    value={editGrupo.tipoGrupo?.id ? String(editGrupo.tipoGrupo.id) : ""}
                    onValueChange={(value) =>
                      setEditGrupo({
                        ...editGrupo,
                        tipoGrupo: {
                          id: parseInt(value),
                          nombre: "",
                        },
                      })
                    }
                  >
                    <SelectTrigger id="tipoGrupo">
                      <SelectValue placeholder="Selecciona un tipo de grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposGrupo.map((tipo) => (
                        <SelectItem key={tipo.id} value={String(tipo.id)}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoriaNivel">Categoría de Nivel</Label>
                  <Select
                    value={
                      editGrupo.categoriaNivel?.id
                        ? String(editGrupo.categoriaNivel.id)
                        : ""
                    }
                    onValueChange={(value) =>
                      setEditGrupo({
                        ...editGrupo,
                        categoriaNivel: {
                          ...editGrupo.categoriaNivel,
                          id: parseInt(value),
                          nombre: "",
                        },
                      })
                    }
                  >
                    <SelectTrigger id="categoriaNivel">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasNivel.map((categoria) => (
                        <SelectItem key={categoria.id} value={String(categoria.id)}>
                          {categoria.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

        {/* Modal para añadir deportista a grupo (1 sola llamada batch, cupo visible) */}
        {grupoSeleccionado && (
          <AsignarDeportistasModal
            grupoId={grupoSeleccionado.id}
            grupoNombre={grupoSeleccionado.nombre}
            open={modalDeportistasOpen}
            onOpenChange={setModalDeportistasOpen}
            onDeportistaAgregado={fetchGrupos}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}