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
  Calendar,
  Users,
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
import axios from "axios";
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
import { useUser } from "@/context/UserContext";

// Datos de ejemplo para entrenadores
const entrenadores = [
  {
    id: 1,
    nombre: "Ana García",
    especializacion: "Tumbling",
    experiencia: "5 años",
    certificaciones: "Nivel 3 USASF",
    fecha_contratacion: "2019-06-15",
    estado: "Activo",
    telefono: "555-123-4567",
    email: "ana.garcia@example.com",
  },
];

// Datos de ejemplo para asignaciones de entrenadores a grupos
const asignacionesGrupos = [
  {
    id: 1,
    entrenador_id: 1,
    grupo: "Mini Estrellas",
    fecha_inicio: "2023-01-15",
    fecha_fin: null,
    rol: "Entrenador Principal",
  },
  {
    id: 2,
    entrenador_id: 2,
    grupo: "Youth Rockets",
    fecha_inicio: "2022-08-10",
    fecha_fin: null,
    rol: "Entrenador Principal",
  },
];

// Datos de ejemplo para horarios de entrenadores
const horariosEntrenadores = [
  {
    id: 1,
    entrenador_id: 1,
    grupo: "Mini Estrellas",
    dia: "Lunes",
    hora_inicio: "16:00",
    hora_fin: "17:30",
    es_principal: true,
  },
  {
    id: 2,
    entrenador_id: 1,
    grupo: "Mini Estrellas",
    dia: "Miércoles",
    hora_inicio: "16:00",
    hora_fin: "17:30",
    es_principal: true,
  },
];

interface Entrenador {
  id: number;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  email: string | null;
  fecha_contratacion: string | null;
  especializacion: string | null;
  experiencia: string | null;
  certificaciones: string | null;
  estado: string;
}

export interface Genero {
  id: number;
  genero: string;
}

export interface Estado {
  id: number;
  estado: string;
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

  const toggleEntrenadorExpand = (entrenadorId: number) => {
    setExpandedEntrenadores((prev) =>
      prev.includes(entrenadorId)
        ? prev.filter((id) => id !== entrenadorId)
        : [...prev, entrenadorId]
    );
  };

  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);

  useEffect(() => {
    fetchEntrenadores();
  }, []);

  const fetchEntrenadores = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/entrenadores",
        {
          withCredentials: true,
        }
      );

      const rawData = response.data;
      console.log("datos perosna:",   rawData);
      const mappedEntrenadores = rawData.map((entrenador: any) => ({
        id: entrenador.id,
        nombre: entrenador.persona?.nombre ?? "N/A",
        apellido: entrenador.persona?.apellidos ?? "N/A",
        telefono: entrenador.persona?.telefono ?? "N/A",
        email: entrenador.persona?.email ?? "N/A",
        fecha_contratacion: entrenador.fechaContratacion ?? "Sin Datos",
        especializacion: entrenador.especializacion ?? "N/A",
        experiencia: entrenador.experiencia ?? "N/A",
        certificaciones: entrenador.certificaciones ?? "N/A",
        estado: entrenador.estado?.estado ?? "N/A",
      }));

      setEntrenadores(mappedEntrenadores);
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
      await axios.post("http://localhost:8080/api/entrenadores", payload, {
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

  const eliminarEntrenador = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8080/api/entrenadores/${id}`, {
        withCredentials: true,
      });
      toast.success("Entrenado eliminado correctamente");
      // Aquí puedes llamar a una función para recargar la lista de deportistas o actualizar el estado
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
    estadoId: 0,
  });

  const obtenerEstadosPersona = async () => {
    const res = await axios.get("http://localhost:8080/api/personas/estados"); // este endpoint lo crearemos abajo
    return res.data;
  };

  const obtenerGeneros = async () => {
    const res = await axios.get(
      "http://localhost:8080/api/usuario/genero/listar"
    );
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
  const [estados, setEstados] = useState<Estado[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNuevoEntrenador((prev) => ({
      ...prev,
      [name]:
        name === "generoId" || name === "estadoId" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNuevoEntrenador((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // Filtrar entrenadores por término de búsqueda y estado activo/inactivo
  const filteredEntrenadores = entrenadores.filter((entrenador) => {
    const nombre = entrenador.nombre?.toLowerCase() ?? "";
    const especializacion = entrenador.especializacion?.toLowerCase() ?? "";

    const matchesSearch =
      nombre.includes(searchTerm.toLowerCase()) ||
      especializacion.includes(searchTerm.toLowerCase());

    if (activeTab === "todos") return matchesSearch;
    if (activeTab === "activos")
      return matchesSearch && entrenador.estado === "Activo";
    if (activeTab === "inactivos")
      return matchesSearch && entrenador.estado === "Inactivo";
    return matchesSearch;
  });

  // Obtener asignaciones de grupos para un entrenador
  const getAsignacionesGrupos = (entrenadorId: number) => {
    return asignacionesGrupos.filter((a) => a.entrenador_id === entrenadorId);
  };

  // Obtener horarios para un entrenador
  const getHorariosEntrenador = (entrenadorId: number) => {
    return horariosEntrenadores.filter((h) => h.entrenador_id === entrenadorId);
  };

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
                      {entrenador.nombre} {entrenador.apellido}
                    </TableCell>
                    <TableCell>{entrenador.especializacion}</TableCell>
                    <TableCell>{entrenador.experiencia}</TableCell>
                    <TableCell>{entrenador.certificaciones}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entrenador.estado === "Activo"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {entrenador.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        {permissions.includes("eliminar_deportista") && (
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
                                      <span>{entrenador.telefono}</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Email:
                                      </span>
                                      <span>{entrenador.email}</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Fecha de Contratación:
                                      </span>
                                      <span>
                                        {new Date(
                                          entrenador.fecha_contratacion ??
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
                                <Button size="sm" variant="outline">
                                  <Users className="h-4 w-4 mr-1" /> Asignar a
                                  Grupo
                                </Button>
                              </div>
                              {getAsignacionesGrupos(entrenador.id).length >
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
                                            {asignacion.grupo}
                                          </TableCell>
                                          <TableCell>
                                            {asignacion.rol}
                                          </TableCell>
                                          <TableCell>
                                            {new Date(
                                              asignacion.fecha_inicio
                                            ).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell>
                                            {asignacion.fecha_fin
                                              ? new Date(
                                                  asignacion.fecha_fin
                                                ).toLocaleDateString()
                                              : "Activo"}
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex space-x-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                              >
                                                <Pencil className="h-4 w-4 mr-1" />{" "}
                                                Editar
                                              </Button>
                                              <Button
                                                variant="destructive"
                                                size="sm"
                                              >
                                                <Trash2 className="h-4 w-4 mr-1" />{" "}
                                                Eliminar
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
                                  No hay grupos asignados a este entrenador
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="horarios" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Horarios</h4>
                                <Button size="sm" variant="outline">
                                  <Calendar className="h-4 w-4 mr-1" /> Asignar
                                  Horario
                                </Button>
                              </div>
                              {getHorariosEntrenador(entrenador.id).length >
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
                                      (horario) => (
                                        <TableRow key={horario.id}>
                                          <TableCell>{horario.grupo}</TableCell>
                                          <TableCell>{horario.dia}</TableCell>
                                          <TableCell>
                                            {horario.hora_inicio}
                                          </TableCell>
                                          <TableCell>
                                            {horario.hora_fin}
                                          </TableCell>
                                          <TableCell>
                                            <Badge
                                              variant={
                                                horario.es_principal
                                                  ? "default"
                                                  : "outline"
                                              }
                                            >
                                              {horario.es_principal
                                                ? "Principal"
                                                : "Asistente"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex space-x-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                              >
                                                <Pencil className="h-4 w-4 mr-1" />{" "}
                                                Editar
                                              </Button>
                                              <Button
                                                variant="destructive"
                                                size="sm"
                                              >
                                                <Trash2 className="h-4 w-4 mr-1" />{" "}
                                                Eliminar
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

      {/* Eliminar Entrenador */}
      <Dialog
        open={entrenadoAEliminar !== null}
        onOpenChange={() => setEntrenadoAEliminar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p>¿Estás seguro que deseas eliminar este deportista?</p>
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
    </div>
  );
}
