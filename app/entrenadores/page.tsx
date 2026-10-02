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
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Filter,
  Download,
  Search,
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
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";
import AsignarGrupoAEntrenadorModal from "../components/Forms/AsignarGrupoAEntrenadorModal";
import EditarAsignacionEntrenadorModal from "../components/Forms/EditarAsignacionEntrenadorModal";
import FinalizarAsignacionEntrenadorModal from "../components/Forms/FinalizarAsignacionEntrenadorModal";
import { set } from "date-fns";

interface Persona {
  id: number;
  nombre: string;
  apellidos: string;
  direccion?: string;
  telefono?: string;
  fechaNacimiento?: string;
  generoId?: number;
}

interface EstadoPersona {
  id: number;
  estado: string;
}

interface Entrenador {
  id: number;
  persona: Persona;
  especializacion?: string;
  experiencia?: string;
  certificaciones?: string;
  fechaContratacion?: string;
  estado?: EstadoPersona;
}

interface AsignacionEntrenador {
  id: number;
  grupoId: number;
  grupoNombre: string;
  rol: string;
  fechaInicio: string;
  fechaFin: string | null;
}

interface HorarioEntrenador {
  asignacionId: number;
  grupoId: number;
  grupoNombre: string;
  rol: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
}

// Estado local para los modales de Editar/Finalizar — lleva entrenadorId
// además de los datos de la asignación, para saber qué entrada de caché
// refrescar cuando el modal termina con éxito (los datos de la API en sí no
// necesitan cargar ese dato, ya viene implícito en qué entrenador se expandió).
interface AsignacionEnAccion extends AsignacionEntrenador {
  entrenadorId: number;
}
export interface Genero {
  id: number;
  genero: string;
}

export default function EntrenadoresPage() {

  const [expandedEntrenadores, setExpandedEntrenadores] = useState<number[]>(
    []
  );
  const [entrenadoAEliminar, setEntrenadoAEliminar] = useState<number | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

  // Alternar expansión de detalles del entrenador
  const toggleEntrenadorExpand = (entrenadorId: number) => {
    setExpandedEntrenadores((prev) =>
      prev.includes(entrenadorId)
        ? prev.filter((id) => id !== entrenadorId)
        : [...prev, entrenadorId]
    );
    cargarDetalleEntrenador(entrenadorId);
  };

  // Estado para la lista de entrenadores
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);

  useEffect(() => {
    fetchEntrenadores();
  }, []);

  const fetchEntrenadores = async () => {
    try {
      const response = await api.get<Entrenador[]>(
        `/api/entrenadores`,
        { withCredentials: true }
      );

      setEntrenadores(response.data);
    } catch (error) {
      console.error("Error al cargar entrenadores:", error);
    }
  };

  const guardarEntrenador = async () => {
    try {
      // Aquí mapea tu objeto según lo que espera tu API
      const payload = {
        rolIdE: nuevoEntrenador.rolId,
        nombre: nuevoEntrenador.nombre,
        apellidos: nuevoEntrenador.apellidos,
        direccion: nuevoEntrenador.direccion,
        telefono: nuevoEntrenador.telefono,
        fechaNacimiento: nuevoEntrenador.fechaNacimiento,
        generoId: nuevoEntrenador.generoId,
        fechaContratacion: new Date().toISOString(),
        especializacion: nuevoEntrenador.especializacion,
        estadoId: nuevoEntrenador.estadoId,
      };
      console.log("Entrenador guardado:", payload);
      await api.post(`/api/entrenadores`, payload, {
        withCredentials: true,
      });

      toast.success("Entrenador guardado con éxito");
      // Aquí puedes refrescar la lista de entrenadores
      setModalAbierto(false);
      fetchEntrenadores();
      // Aquí deberías refrescar la lista de entrenadores
    } catch (error) {
      console.error("Error guardando entrenador:", error);
      toast.error("Error guardando entrenador");
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] =
    useState<Entrenador | null>(null);

  const [formData, setFormData] = useState({
    id: entrenadorSeleccionado?.id || "",
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
    generoId: 1,
    direccion: "",
    telefono: "",
    fecha_contratacion: "",
    especializacion: "",
    experiencia: "",
    certificaciones: "",
    estado: "",
  });

  useEffect(() => {
    if (entrenadorSeleccionado) {
      setFormData({
        id: entrenadorSeleccionado.id,
        nombre: entrenadorSeleccionado.persona?.nombre || "",
        apellido: entrenadorSeleccionado.persona?.apellidos || "",
        direccion: entrenadorSeleccionado.persona?.direccion || "",
        telefono: entrenadorSeleccionado.persona?.telefono || "",
        fechaNacimiento: entrenadorSeleccionado.persona?.fechaNacimiento || "",
        generoId: entrenadorSeleccionado.persona?.generoId || 1,
        fecha_contratacion: entrenadorSeleccionado.fechaContratacion || "",
        especializacion: entrenadorSeleccionado.especializacion || "",
        experiencia: "",
        certificaciones: "",
        estado: entrenadorSeleccionado.estado?.estado || "",
      });
    }
  }, [entrenadorSeleccionado, isEditModalOpen]);

  const actualizarEntrenador = () => {
    api
      .put(`/api/entrenadores/${formData.id}`, formData, {
        withCredentials: true,
      })
      .then(() => {
        setIsEditModalOpen(false);
        fetchEntrenadores();
        toast.success("Entrenador actualizado correctamente");
      });
  };

  const eliminarEntrenador = async (id: number) => {
    try {
      await api.patch(`/api/entrenadores/${id}`, {
        withCredentials: true,
      });
      toast.success("Entrenador eliminado correctamente");
      // Aquí puedes llamar a una función para recargar la lista de entrenadores o actualizar el estado
      fetchEntrenadores(); // asumiendo que tienes esta función para refrescar la lista
    } catch (error) {
      console.error("Error al eliminar Entrenador", error);
      toast.error("No se pudo eliminar el Entrenador");
    }
  };

  const [modalAbierto, setModalAbierto] = useState(false);
  //const [generos, setGeneros] = useState<{ id: number; nombre: string }[]>([]);
  //const [estados, setEstados] = useState<{ id: number; nombre: string }[]>([]);
  const [nuevoEntrenador, setNuevoEntrenador] = useState({
    rolId: 0,
    nombre: "",
    apellidos: "",
    direccion: "",
    telefono: "",
    fechaNacimiento: "",
    generoId: 0,
    especializacion: "",
    experiencia: "",
    certificaciones: "",
    estadoId: 0,
  });
  

  const obtenerEstadosPersona = async () => {
    const res = await api.get(`/api/personas/estados`); // este endpoint lo crearemos abajo
    return res.data;
  }

  const obtenerGeneros = async () => {
    const res = await api.get(`/api/usuario/genero/listar`);
    return res.data;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      const generosData = await obtenerGeneros();
      const estadosData = await obtenerEstadosPersona();
      setGeneros(generosData);
      setEstados(estadosData);
    };
    cargarDatos();
  }, []);

  const [generos, setGeneros] = useState<Genero[]>([]);
  const [estados, setEstados] = useState<EstadoPersona[]>([]);

  // Manejar cambios en inputs de texto para nuevo entrenador
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Si el modal de edición está abierto, actualizar formData
    if (isEditModalOpen) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      // Si no, actualizar nuevoEntrenador
      setNuevoEntrenador((prev) => ({
        ...prev,
        [name]:
          name === "generoId" || name === "estadoId" ? Number(value) : value,
      }));
    }
  };

  // Manejar cambios en selects
  const handleSelectChange = (name: string, value: string) => {
    if (isEditModalOpen) {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "generoId" ? Number(value) : value,
      }));
    } else {
      setNuevoEntrenador((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
    }
  };

  // Filtrar entrenadores por término de búsqueda y estado activo/inactivo
  const filteredEntrenadores = entrenadores.filter((entrenador) => {
    const nombre = entrenador.persona?.nombre?.toLowerCase() ?? "";
    const apellidos = entrenador.persona?.apellidos?.toLowerCase() ?? "";
    const especializacion = entrenador.especializacion?.toLowerCase() ?? "";

    const matchesSearch =
      nombre.includes(searchTerm.toLowerCase()) ||
      apellidos.includes(searchTerm.toLowerCase()) ||
      especializacion.includes(searchTerm.toLowerCase());

    const estadoNombre =
      typeof entrenador.estado === "string"
        ? entrenador.estado
        : entrenador.estado?.estado ?? "";

    if (activeTab === "todos") return matchesSearch;
    if (activeTab === "activos")
      return matchesSearch && estadoNombre === "Activo";
    if (activeTab === "inactivos")
      return matchesSearch && estadoNombre === "Inactivo";
    return matchesSearch;
  });

  // Asignaciones y horario del entrenador expandido — se cargan desde el
  // backend solo cuando se expande la fila (no de entrada para todos), y se
  // cachean en memoria por entrenadorId para no repetir la petición si se
  // colapsa y se vuelve a expandir la misma fila.
  const [asignacionesPorEntrenador, setAsignacionesPorEntrenador] = useState<
    Record<number, AsignacionEntrenador[]>
  >({});
  const [horarioPorEntrenador, setHorarioPorEntrenador] = useState<
    Record<number, HorarioEntrenador[]>
  >({});
  const [cargandoDetalle, setCargandoDetalle] = useState<number | null>(null);

  // Compartido entre las pestañas "Grupos Asignados" y "Horarios" — ambas
  // editan/finalizan la misma asignación (GrupoEntrenador), solo se llega a
  // ella desde dos vistas distintas de los mismos datos.
  const [asignacionEnEdicion, setAsignacionEnEdicion] =
    useState<AsignacionEnAccion | null>(null);
  const [asignacionAFinalizar, setAsignacionAFinalizar] =
    useState<AsignacionEnAccion | null>(null);

  const cargarDetalleEntrenador = (entrenadorId: number) => {
    if (asignacionesPorEntrenador[entrenadorId]) return; // ya en caché
    setCargandoDetalle(entrenadorId);
    Promise.allSettled([
      api.get(`/api/grupos/entrenadores/${entrenadorId}/asignaciones`),
      api.get(`/api/grupos/entrenadores/${entrenadorId}/horario`),
    ]).then(([asignacionesRes, horarioRes]) => {
      setAsignacionesPorEntrenador((prev) => ({
        ...prev,
        [entrenadorId]: asignacionesRes.status === "fulfilled" ? asignacionesRes.value.data : [],
      }));
      setHorarioPorEntrenador((prev) => ({
        ...prev,
        [entrenadorId]: horarioRes.status === "fulfilled" ? horarioRes.value.data : [],
      }));
      if (asignacionesRes.status === "rejected" || horarioRes.status === "rejected") {
        toast.error("No se pudo cargar la información de grupos/horario de este entrenador");
      }
    }).finally(() => setCargandoDetalle(null));
  };

  const refrescarDetalleEntrenador = (entrenadorId: number) => {
    setAsignacionesPorEntrenador((prev) => {
      const { [entrenadorId]: _, ...resto } = prev;
      return resto;
    });
    setHorarioPorEntrenador((prev) => {
      const { [entrenadorId]: _, ...resto } = prev;
      return resto;
    });
    cargarDetalleEntrenador(entrenadorId);
  };

  const getAsignacionesGrupos = (entrenadorId: number) =>
    asignacionesPorEntrenador[entrenadorId] ?? [];

  const getHorariosEntrenador = (entrenadorId: number) =>
    horarioPorEntrenador[entrenadorId] ?? [];

  const { permissions } = useUser();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entrenadores</h1>
          <p className="text-muted-foreground">
            Gestiona la información de los entrenadores
          </p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>
          Agregar Entrenador
        </Button>
      </div>

      <div className="flex justify-between mb-4">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <Input
            placeholder="Buscar entrenadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveTab("todos")}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("activos")}>
                Activos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("inactivos")}>
                Inactivos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/*
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>*/}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Especialización</TableHead>
                <TableHead>Experiencia</TableHead>
                <TableHead>Certificaciones</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntrenadores.map((entrenador) => (
                <React.Fragment key={entrenador.id}>
                  <TableRow key={entrenador.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEntrenadorExpand(entrenador.id)}
                      >
                        {expandedEntrenadores.includes(entrenador.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entrenador.persona?.nombre}{" "}
                      {entrenador.persona?.apellidos}
                    </TableCell>
                    <TableCell>{entrenador.especializacion}</TableCell>
                    <TableCell>{entrenador.experiencia}</TableCell>
                    <TableCell>{entrenador.certificaciones}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entrenador.estado?.estado === "Activo"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {entrenador.estado?.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {permissions.includes("modificar_entrenador") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEntrenadorSeleccionado(entrenador);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                        )}
                        {permissions.includes("eliminar_entrenador") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setEntrenadoAEliminar(entrenador.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedEntrenadores.includes(entrenador.id) && (
                    <TableRow
                      key={`${entrenador.id}-details`}
                      className="bg-muted/50"
                    >
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4">
                          <Tabs defaultValue="info" className="w-full">
                            <TabsList>
                              <TabsTrigger value="info">
                                Información Personal
                              </TabsTrigger>
                              <TabsTrigger value="grupos">
                                Grupos Asignados
                              </TabsTrigger>
                              <TabsTrigger value="horarios">
                                Horarios
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="info" className="mt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Datos Personales
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Teléfono:
                                      </span>
                                      <span>
                                        {entrenador.persona?.telefono}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Direccion:
                                      </span>
                                      <span>
                                        {entrenador.persona?.direccion}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Fecha de Nacimiento:
                                      </span>
                                      <span>
                                        {new Date(
                                          entrenador.persona?.fechaNacimiento ??
                                            "Sin Datos"
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Fecha de Contratación:
                                      </span>
                                      <span>
                                        {new Date(
                                          entrenador.fechaContratacion ??
                                            "Sin Datos"
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Información Profesional
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Especialización:
                                      </span>
                                      <span>{entrenador.especializacion}</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Experiencia:
                                      </span>
                                      <span>{entrenador.experiencia}</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Certificaciones:
                                      </span>
                                      <span>{entrenador.certificaciones}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            <TabsContent value="grupos" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">
                                  Grupos Asignados
                                </h4>
                                <AsignarGrupoAEntrenadorModal
                                  entrenadorId={entrenador.id}
                                  onAsignado={() => refrescarDetalleEntrenador(entrenador.id)}
                                />
                              </div>
                              {cargandoDetalle === entrenador.id ? (
                                <div className="text-center py-4 text-muted-foreground">
                                  Cargando…
                                </div>
                              ) : getAsignacionesGrupos(entrenador.id).length >
                              0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Grupo</TableHead>
                                      <TableHead>Rol</TableHead>
                                      <TableHead>Fecha Inicio</TableHead>
                                      <TableHead>Fecha Fin</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getAsignacionesGrupos(entrenador.id).map(
                                      (asignacion) => (
                                        <TableRow key={asignacion.id}>
                                          <TableCell>
                                            {asignacion.grupoNombre}
                                          </TableCell>
                                          <TableCell>
                                            {asignacion.rol}
                                          </TableCell>
                                          <TableCell>
                                            {new Date(
                                              asignacion.fechaInicio
                                            ).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell>
                                            {asignacion.fechaFin
                                              ? new Date(
                                                  asignacion.fechaFin
                                                ).toLocaleDateString()
                                              : "Activo"}
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex space-x-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  setAsignacionEnEdicion({
                                                    ...asignacion,
                                                    entrenadorId: entrenador.id,
                                                  })
                                                }
                                              >
                                                <Pencil className="h-4 w-4 mr-1" />{" "}
                                                Editar
                                              </Button>
                                              {!asignacion.fechaFin && (
                                                <Button
                                                  variant="destructive"
                                                  size="sm"
                                                  onClick={() =>
                                                    setAsignacionAFinalizar({
                                                      ...asignacion,
                                                      entrenadorId: entrenador.id,
                                                    })
                                                  }
                                                >
                                                  <Trash2 className="h-4 w-4 mr-1" />{" "}
                                                  Finalizar
                                                </Button>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    )}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  No hay grupos asignados a este entrenador
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="horarios" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Horarios</h4>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">
                                Estos bloques vienen del horario real de cada grupo asignado.
                                Para agregar o cambiar días/horas, hazlo desde el módulo Horarios
                                — afecta a todo el grupo, no solo a este entrenador.
                              </p>
                              {cargandoDetalle === entrenador.id ? (
                                <div className="text-center py-4 text-muted-foreground">
                                  Cargando…
                                </div>
                              ) : getHorariosEntrenador(entrenador.id).length >
                              0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Grupo</TableHead>
                                      <TableHead>Día</TableHead>
                                      <TableHead>Hora Inicio</TableHead>
                                      <TableHead>Hora Fin</TableHead>
                                      <TableHead>Rol</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getHorariosEntrenador(entrenador.id).map(
                                      (horario, idx) => (
                                        <TableRow key={`${horario.asignacionId}-${idx}`}>
                                          <TableCell>{horario.grupoNombre}</TableCell>
                                          <TableCell>{horario.dia}</TableCell>
                                          <TableCell>
                                            {horario.horaInicio}
                                          </TableCell>
                                          <TableCell>
                                            {horario.horaFin}
                                          </TableCell>
                                          <TableCell>
                                            <Badge
                                              variant={
                                                horario.rol === "Entrenador Principal"
                                                  ? "default"
                                                  : "outline"
                                              }
                                            >
                                              {horario.rol}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex space-x-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  setAsignacionEnEdicion({
                                                    id: horario.asignacionId,
                                                    grupoId: horario.grupoId,
                                                    grupoNombre: horario.grupoNombre,
                                                    rol: horario.rol,
                                                    fechaInicio: "",
                                                    fechaFin: null,
                                                    entrenadorId: entrenador.id,
                                                  })
                                                }
                                              >
                                                <Pencil className="h-4 w-4 mr-1" />{" "}
                                                Editar rol
                                              </Button>
                                              <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                  setAsignacionAFinalizar({
                                                    id: horario.asignacionId,
                                                    grupoId: horario.grupoId,
                                                    grupoNombre: horario.grupoNombre,
                                                    rol: horario.rol,
                                                    fechaInicio: "",
                                                    fechaFin: null,
                                                    entrenadorId: entrenador.id,
                                                  })
                                                }
                                              >
                                                <Trash2 className="h-4 w-4 mr-1" />{" "}
                                                Finalizar
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    )}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  No hay horarios asignados a este entrenador
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Entrenador</DialogTitle>
            <DialogDescription>
              Completa el formulario para agregar un nuevo entrenador al
              sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 grid-cols-2">
            <div>
              <Label htmlFor="rolId">Rol</Label>
              <Select
                onValueChange={(value) => handleSelectChange("rolId", value)}
                value={nuevoEntrenador.rolId?.toString() || ""}
              >
                <SelectTrigger id="rolId" className="w-full">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Entrenador</SelectItem>
                  <SelectItem value="4">Asistente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={nuevoEntrenador.nombre}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                name="apellidos"
                value={nuevoEntrenador.apellidos}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                value={nuevoEntrenador.direccion}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={nuevoEntrenador.telefono}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="fechaNacimiento">Fecha Nacimiento</Label>
              <Input
                type="date"
                id="fechaNacimiento"
                name="fechaNacimiento"
                value={nuevoEntrenador.fechaNacimiento}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="especializacion">Especialización</Label>
              <Input
                id="especializacion"
                name="especializacion"
                value={nuevoEntrenador.especializacion}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="generoId">Género</Label>
              <Select
                onValueChange={(value) => handleSelectChange("generoId", value)}
                value={nuevoEntrenador.generoId.toString() || ""}
              >
                <SelectTrigger id="generoId" className="w-full">
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent>
                  {generos.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.genero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estadoId">Estado</Label>
              <Select
                onValueChange={(value) => handleSelectChange("estadoId", value)}
                value={nuevoEntrenador.estadoId.toString() || ""}
              >
                <SelectTrigger id="estadoId" className="w-full">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={guardarEntrenador}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Entrenador</DialogTitle>
            <DialogDescription>
              Completa el formulario para editar un entrenador existente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 grid-cols-2">
            <div>
              <Label htmlFor="rolId">Rol</Label>
              <Select
                onValueChange={(value) => handleSelectChange("id", value)}
                value={formData.id?.toString() || ""}
              >
                <SelectTrigger id="id" className="w-full">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Entrenador</SelectItem>
                  <SelectItem value="4">Asistente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                name="apellidos"
                value={formData.apellido || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                name="direccion"
                value={formData.direccion || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={formData.telefono || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="fechaNacimiento">Fecha Nacimiento</Label>
              <Input
                type="date"
                id="fechaNacimiento"
                name="fechaNacimiento"
                value={formData.fechaNacimiento || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="especializacion">Especialización</Label>
              <Input
                id="especializacion"
                name="especializacion"
                value={formData.especializacion || ""}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="generoId">Género</Label>
              <Select
                onValueChange={(value) => handleSelectChange("generoId", value)}
                value={formData.generoId?.toString() || ""}
              >
                <SelectTrigger id="generoId" className="w-full">
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent>
                  {generos.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.genero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={actualizarEntrenador}>Actualizar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Eliminar Entrenador */}
      <Dialog
        open={entrenadoAEliminar !== null}
        onOpenChange={() => setEntrenadoAEliminar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p>¿Estás seguro que deseas eliminar este Entrenador?</p>
          <DialogFooter className="mt-4">
            <Button
              variant="secondary"
              onClick={() => setEntrenadoAEliminar(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (entrenadoAEliminar !== null) {
                  await eliminarEntrenador(entrenadoAEliminar);
                  setEntrenadoAEliminar(null);
                }
              }}
            >
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {asignacionEnEdicion && (
        <EditarAsignacionEntrenadorModal
          asignacionId={asignacionEnEdicion.id}
          grupoNombre={asignacionEnEdicion.grupoNombre}
          rolActual={asignacionEnEdicion.rol}
          open={asignacionEnEdicion !== null}
          onOpenChange={(open) => {
            if (!open) setAsignacionEnEdicion(null);
          }}
          onActualizado={() => {
            const id = asignacionEnEdicion.entrenadorId;
            setAsignacionEnEdicion(null);
            refrescarDetalleEntrenador(id);
          }}
        />
      )}

      {asignacionAFinalizar && (
        <FinalizarAsignacionEntrenadorModal
          asignacionId={asignacionAFinalizar.id}
          grupoNombre={asignacionAFinalizar.grupoNombre}
          open={asignacionAFinalizar !== null}
          onOpenChange={(open) => {
            if (!open) setAsignacionAFinalizar(null);
          }}
          onFinalizado={() => {
            const id = asignacionAFinalizar.entrenadorId;
            setAsignacionAFinalizar(null);
            refrescarDetalleEntrenador(id);
          }}
        />
      )}
    </div>
  );
}