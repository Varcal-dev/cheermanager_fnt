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
  FileText,
  Target,
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

import { Label } from "@/components/ui/label";

import axios from "axios";
import { toast } from "react-toastify";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Datos de ejemplo
const deportistas = [
  {
    id: 1,
    nombre: "Sofía Pérez",
    fecha_nacimiento: "2017-05-12",
    genero: "Femenino",
    telefono: "555-123-4567",
    estado: "Activo",
    nivel: "Nivel 1",
    fecha_inscripcion: "2023-01-15",
    contacto_emergencia: "María Pérez (Madre)",
    historial_medico: "Sin alergias conocidas",
    peso: 25,
    altura: 120,
    grupos: ["Mini Estrellas"],
  },
  {
    id: 5,
    nombre: "Valentina López",
    fecha_nacimiento: "2013-09-30",
    genero: "Femenino",
    telefono: "555-567-8901",
    estado: "Inactivo",
    nivel: "Nivel 2",
    fecha_inscripcion: "2021-11-20",
    contacto_emergencia: "Roberto López (Padre)",
    historial_medico: "Alergia a frutos secos",
    peso: 38,
    altura: 145,
    grupos: ["Youth Rockets"],
  },
];

// Datos de ejemplo para evaluaciones
const evaluaciones = [
  {
    id: 1,
    deportista_id: 1,
    fecha: "2023-10-15",
    criterio: "Flexibilidad",
    puntaje: 8,
  },
  {
    id: 2,
    deportista_id: 1,
    fecha: "2023-10-15",
    criterio: "Saltos",
    puntaje: 7,
  },
];

// Datos de ejemplo para objetivos
const objetivos = [
  {
    id: 1,
    deportista_id: 1,
    nombre: "Mejorar flexibilidad",
    descripcion: "Lograr split completo",
    fecha_creacion: "2023-09-01",
    fecha_final: "2023-12-01",
    estado: "En proceso",
  },
  {
    id: 2,
    deportista_id: 1,
    nombre: "Perfeccionar salto toe touch",
    descripcion: "Alcanzar altura y técnica adecuada",
    fecha_creacion: "2023-09-15",
    fecha_final: "2023-11-15",
    estado: "En proceso",
  },
];

// Datos de ejemplo para pagos
const pagos = [
  {
    id: 1,
    deportista_id: 1,
    concepto: "Mensualidad Enero 2024",
    monto: 150.0,
    fecha: "2024-01-05",
    estado: "Pagado",
  },
  {
    id: 2,
    deportista_id: 1,
    concepto: "Mensualidad Febrero 2024",
    monto: 150.0,
    fecha: "2024-02-07",
    estado: "Pagado",
  },
  {
    id: 3,
    deportista_id: 1,
    concepto: "Mensualidad Marzo 2024",
    monto: 150.0,
    fecha: "2024-03-10",
    estado: "Pendiente",
  },
];

// Datos de ejemplo para historial de niveles
const historialNiveles = [
  {
    id: 1,
    deportista_id: 1,
    nivel: "Nivel 1",
    fecha_cambio: "2023-01-15",
    motivo: "Inscripción inicial",
  },
];

// Datos de ejemplo para historial de planes
const historialPlanes = [
  {
    id: 1,
    deportista_id: 1,
    plan: "Plan Básico",
    fecha_inicio: "2023-01-15",
    fecha_fin: "2023-06-15",
    motivo_cambio: "Inscripción inicial",
  },
  {
    id: 2,
    deportista_id: 1,
    plan: "Plan Premium",
    fecha_inicio: "2023-06-16",
    fecha_fin: null,
    motivo_cambio: "Upgrade por participación en competencias",
  },
];

// Datos de ejemplo para historial de grupos
const historialGrupos = [
  {
    id: 1,
    deportista_id: 1,
    grupo: "Mini Estrellas",
    fecha_inicio: "2023-01-15",
    fecha_fin: null,
    observaciones: "Adaptación excelente al grupo",
  },
  {
    id: 2,
    deportista_id: 4,
    grupo: "Mini Avanzados",
    fecha_inicio: "2022-08-15",
    fecha_fin: "2023-06-10",
    observaciones: "Buen desempeño",
  },
  {
    id: 3,
    deportista_id: 4,
    grupo: "Youth Rockets",
    fecha_inicio: "2023-06-11",
    fecha_fin: null,
    observaciones: "Promoción por habilidades destacadas",
  },
];

export interface Deportista {
  deportistaId: number;
  personaId: number;
  nombre: string;
  apellidos: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  generoId: number;
  genero: string;
  altura: number;
  peso: number;
  fechaInscripcion: string;
  contactoEmergencia: string;
  estadoId: number;
  estadoNombre: string;
  nivelActualId: number;
  nivelNombre: string;
  convenioId: number | null;
  convenioNombre: string | null;
  grupos: string[]; // Suponiendo que el backend pronto los incluirá
}

export interface Nivel {
  id: number;
  nombre: string;
}

export interface Genero {
  id: number;
  nombre: string;
}

export interface Estado {
  id: number;
  nombre: string;
}

export default function DeportistasPage() {
  useEffect(() => {
    cargarDeportistas(); // Solo llama a la función
  }, []);

  const cargarDeportistas = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/deportistas",
        {
          withCredentials: true, // el backend requiere autenticación para esta acción
        }
      );
      setDeportistas(response.data); // Guarda los datos en el estado
    } catch (error) {
      console.error("Error al obtener los grupos:", error);
      toast.error("Error al cargar los grupos.");
    }
  };

  const obtenerNiveles = async () => {
    const res = await axios.get("http://localhost:8080/api/niveles");
    return res.data;
  };

  const obtenerGeneros = async () => {
    const res = await axios.get(
      "http://localhost:8080/api/usuario/genero/listar"
    );
    return res.data;
  };

  const obtenerEstadosPersona = async () => {
    const res = await axios.get("http://localhost:8080/api/personas/estados"); // este endpoint lo crearemos abajo
    return res.data;
  };

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
      const nivelesData = await obtenerNiveles();
      const generosData = await obtenerGeneros();
      const estadosData = await obtenerEstadosPersona();

      setNiveles(nivelesData);
      setGeneros(generosData);
      setEstados(estadosData);
    };
    cargarDatos();
  }, []);

  const eliminarDeportista = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8080/api/deportistas/${id}`, {
        withCredentials: true, // el backend requiere autenticación para esta acción
      });
      toast("Deportista eliminado correctamente");
      // Aquí puedes llamar a una función para recargar la lista de deportistas o actualizar el estado
      cargarDeportistas(); // asumiendo que tienes esta función para refrescar la lista
    } catch (error) {
      console.error("Error al eliminar deportista", error);
      toast("No se pudo eliminar el deportista");
    }
  };
  const [deportistaAEliminar, setDeportistaAEliminar] = useState<number | null>(
    null
  );

  const [deportistas, setDeportistas] = useState<Deportista[]>([]);
  const [expandedDeportistas, setExpandedDeportistas] = useState<number[]>([]);

  const toggleDeportistaExpand = (id: number) => {
    setExpandedDeportistas((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  //const [expandedDeportistas, setExpandedDeportistas] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

  {
    /* Función para alternar la expansión de los deportistas
  const toggleDeportistaExpand = (deportistaId: number) => {
    setExpandedDeportistas((prev) =>
      prev.includes(deportistaId)
        ? prev.filter((id) => id !== deportistaId)
        : [...prev, deportistaId]
    );
  }; */
  }

  // Filtrar deportistas por término de búsqueda y estado activo/inactivo
  const filteredDeportistas = deportistas.filter((deportista) => {
    const matchesSearch =
      deportista.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deportista.nivelNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deportista.grupos.some((g) =>
        g.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (activeTab === "todos") return matchesSearch;
    if (activeTab === "activos")
      return matchesSearch && deportista.estadoNombre === "Activo";
    if (activeTab === "inactivos")
      return matchesSearch && deportista.estadoNombre === "Inactivo";
    return matchesSearch;
  });

  // Obtener evaluaciones de un deportista
  const getEvaluacionesDeportista = (deportistaId: number) => {
    return evaluaciones.filter((e) => e.deportista_id === deportistaId);
  };

  // Obtener objetivos de un deportista
  const getObjetivosDeportista = (deportistaId: number) => {
    return objetivos.filter((o) => o.deportista_id === deportistaId);
  };

  // Obtener pagos de un deportista
  const getPagosDeportista = (deportistaId: number) => {
    return pagos.filter((p) => p.deportista_id === deportistaId);
  };

  // Obtener historial de niveles de un deportista
  const getHistorialNivelesDeportista = (deportistaId: number) => {
    return historialNiveles.filter((h) => h.deportista_id === deportistaId);
  };

  // Obtener historial de planes de un deportista
  const getHistorialPlanesDeportista = (deportistaId: number) => {
    return historialPlanes.filter((h) => h.deportista_id === deportistaId);
  };

  // Obtener historial de grupos de un deportista
  const getHistorialGruposDeportista = (deportistaId: number) => {
    return historialGrupos.filter((h) => h.deportista_id === deportistaId);
  };

  // Calcular edad a partir de fecha de nacimiento
  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }

    return edad;
  };

  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoDeportista, setNuevoDeportista] = useState({
    nombre: "",
    apellidos: "",
    direccion: "",
    telefono: "",
    fechaNacimiento: "",
    generoId: 1,
    estadoId: 1,
    altura: 0,
    peso: 0,
    nivelActualId: 1,
    fechaInscripcion: "",
    contactoEmergencia: "",
    convenioId: null,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNuevoDeportista((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const guardarDeportista = async () => {
    try {
      await axios.post(
        "http://localhost:8080/api/deportistas",
        {
          ...nuevoDeportista,
          altura: Number(nuevoDeportista.altura),
          peso: Number(nuevoDeportista.peso),
          generoId: Number(nuevoDeportista.generoId),
          estadoId: Number(nuevoDeportista.estadoId),
          nivelActualId: Number(nuevoDeportista.nivelActualId),
          convenioId: nuevoDeportista.convenioId
            ? Number(nuevoDeportista.convenioId)
            : null,
        },
        {
          withCredentials: true, // el backend requiere autenticación para esta acción
        }
      );
      //const dataActualizada = await obtenerDeportistas();
      //setDeportistas(dataActualizada);
      cargarDeportistas();
      toast.success("Deportista guardado exitosamente");
      setModalAbierto(false);
    } catch (error) {
      console.error("Error al guardar deportista", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deportistas</h1>
          <p className="text-muted-foreground">
            Gestiona la información de los deportistas registrados
          </p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Deportista
        </Button>
      </div>

      <div className="flex justify-between mb-4">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <Input
            placeholder="Buscar deportistas..."
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
          {/* tabla info deportista */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Género</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Grupos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* datos iniciales*/}
              {filteredDeportistas.map((deportista) => (
                <React.Fragment key={deportista.deportistaId}>
                  <TableRow key={deportista.deportistaId}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleDeportistaExpand(deportista.deportistaId)
                        }
                      >
                        {expandedDeportistas.includes(
                          deportista.deportistaId
                        ) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {deportista.nombre}
                    </TableCell>
                    <TableCell>
                      {calcularEdad(deportista.fechaNacimiento)} años
                    </TableCell>
                    <TableCell>{deportista.genero}</TableCell>
                    <TableCell>{deportista.nivelNombre}</TableCell>
                    <TableCell>
                      {deportista.grupos?.map((grupo, index) => (
                        <Badge key={index} variant="outline" className="mr-1">
                          {grupo}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          deportista.estadoNombre === "Activo"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {deportista.estadoNombre}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setDeportistaAEliminar(deportista.deportistaId)
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Detalles del deportista */}
                  {expandedDeportistas.includes(deportista.deportistaId) && (
                    <TableRow
                      key={`${deportista.deportistaId}-details`}
                      className="bg-muted/50"
                    >
                      <TableCell colSpan={8} className="p-0">
                        <div className="p-4">
                          <Tabs defaultValue="info" className="w-full">
                            <TabsList>
                              <TabsTrigger value="info">
                                Información Personal
                              </TabsTrigger>
                              <TabsTrigger value="historial">
                                Historial
                              </TabsTrigger>
                              <TabsTrigger value="evaluaciones">
                                Evaluaciones
                              </TabsTrigger>
                              <TabsTrigger value="objetivos">
                                Objetivos
                              </TabsTrigger>
                              <TabsTrigger value="pagos">Pagos</TabsTrigger>
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
                                        Fecha de Nacimiento:
                                      </span>
                                      <span>
                                        {new Date(
                                          deportista.fechaNacimiento
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Teléfono:
                                      </span>
                                      <span>{deportista.telefono}</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Fecha de Inscripción:
                                      </span>
                                      <span>
                                        {new Date(
                                          deportista.fechaInscripcion
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Peso:
                                      </span>
                                      <span>{deportista.peso} kg</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Altura:
                                      </span>
                                      <span>{deportista.altura} cm</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Información Médica
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Contacto de Emergencia:
                                      </span>
                                      <span>
                                        {deportista.contactoEmergencia}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Historial Médico:
                                      </span>
                                      <span>
                                        {deportista.contactoEmergencia}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            {/* Historial */}
                            <TabsContent value="historial" className="mt-4">
                              <Tabs defaultValue="niveles">
                                <TabsList>
                                  <TabsTrigger value="niveles">
                                    Historial de Niveles
                                  </TabsTrigger>
                                  <TabsTrigger value="planes">
                                    Historial de Planes
                                  </TabsTrigger>
                                  <TabsTrigger value="grupos">
                                    Historial de Grupos
                                  </TabsTrigger>
                                </TabsList>

                                {/* Historial de Niveles */}
                                <TabsContent value="niveles" className="mt-4">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold">
                                      Historial de Niveles
                                    </h4>
                                    <Button size="sm" variant="outline">
                                      <Plus className="h-4 w-4 mr-1" />{" "}
                                      Registrar Cambio de Nivel
                                    </Button>
                                  </div>
                                  {getHistorialNivelesDeportista(
                                    deportista.deportistaId
                                  ).length > 0 ? (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Nivel</TableHead>
                                          <TableHead>Fecha de Cambio</TableHead>
                                          <TableHead>Motivo</TableHead>
                                          <TableHead>Acciones</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {getHistorialNivelesDeportista(
                                          deportista.deportistaId
                                        ).map((historial) => (
                                          <TableRow key={historial.id}>
                                            <TableCell>
                                              {historial.nivel}
                                            </TableCell>
                                            <TableCell>
                                              {new Date(
                                                historial.fecha_cambio
                                              ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                              {historial.motivo}
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
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                      No hay historial de niveles registrado
                                    </div>
                                  )}
                                </TabsContent>

                                {/* Historial de Planes */}
                                <TabsContent value="planes" className="mt-4">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold">
                                      Historial de Planes
                                    </h4>
                                    <Button size="sm" variant="outline">
                                      <Plus className="h-4 w-4 mr-1" />{" "}
                                      Registrar Cambio de Plan
                                    </Button>
                                  </div>
                                  {getHistorialPlanesDeportista(
                                    deportista.deportistaId
                                  ).length > 0 ? (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Plan</TableHead>
                                          <TableHead>Fecha Inicio</TableHead>
                                          <TableHead>Fecha Fin</TableHead>
                                          <TableHead>
                                            Motivo de Cambio
                                          </TableHead>
                                          <TableHead>Acciones</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {getHistorialPlanesDeportista(
                                          deportista.deportistaId
                                        ).map((historial) => (
                                          <TableRow key={historial.id}>
                                            <TableCell>
                                              {historial.plan}
                                            </TableCell>
                                            <TableCell>
                                              {new Date(
                                                historial.fecha_inicio
                                              ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                              {historial.fecha_fin
                                                ? new Date(
                                                    historial.fecha_fin
                                                  ).toLocaleDateString()
                                                : "Activo"}
                                            </TableCell>
                                            <TableCell>
                                              {historial.motivo_cambio}
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
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                      No hay historial de planes registrado
                                    </div>
                                  )}
                                </TabsContent>

                                {/* Historial de Grupos */}
                                <TabsContent value="grupos" className="mt-4">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold">
                                      Historial de Grupos
                                    </h4>
                                    <Button size="sm" variant="outline">
                                      <Plus className="h-4 w-4 mr-1" />{" "}
                                      Registrar Cambio de Grupo
                                    </Button>
                                  </div>
                                  {getHistorialGruposDeportista(
                                    deportista.deportistaId
                                  ).length > 0 ? (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Grupo</TableHead>
                                          <TableHead>Fecha Inicio</TableHead>
                                          <TableHead>Fecha Fin</TableHead>
                                          <TableHead>Observaciones</TableHead>
                                          <TableHead>Acciones</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {getHistorialGruposDeportista(
                                          deportista.deportistaId
                                        ).map((historial) => (
                                          <TableRow key={historial.id}>
                                            <TableCell>
                                              {historial.grupo}
                                            </TableCell>
                                            <TableCell>
                                              {new Date(
                                                historial.fecha_inicio
                                              ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                              {historial.fecha_fin
                                                ? new Date(
                                                    historial.fecha_fin
                                                  ).toLocaleDateString()
                                                : "Activo"}
                                            </TableCell>
                                            <TableCell>
                                              {historial.observaciones}
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
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                      No hay historial de grupos registrado
                                    </div>
                                  )}
                                </TabsContent>
                              </Tabs>
                            </TabsContent>

                            {/* Evaluaciones, Objetivos y Pagos */}
                            <TabsContent value="evaluaciones" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Evaluaciones</h4>
                                <Button size="sm" variant="outline">
                                  <Plus className="h-4 w-4 mr-1" /> Nueva
                                  Evaluación
                                </Button>
                              </div>
                              {getEvaluacionesDeportista(
                                deportista.deportistaId
                              ).length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Fecha</TableHead>
                                      <TableHead>Criterio</TableHead>
                                      <TableHead>Puntaje</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getEvaluacionesDeportista(
                                      deportista.deportistaId
                                    ).map((evaluacion) => (
                                      <TableRow key={evaluacion.id}>
                                        <TableCell>
                                          {new Date(
                                            evaluacion.fecha
                                          ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                          {evaluacion.criterio}
                                        </TableCell>
                                        <TableCell>
                                          {evaluacion.puntaje}/10
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex space-x-2">
                                            <Button variant="outline" size="sm">
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
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  No hay evaluaciones registradas
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="objetivos" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Objetivos</h4>
                                <Button size="sm" variant="outline">
                                  <Target className="h-4 w-4 mr-1" /> Nuevo
                                  Objetivo
                                </Button>
                              </div>
                              {getObjetivosDeportista(deportista.deportistaId)
                                .length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Objetivo</TableHead>
                                      <TableHead>Descripción</TableHead>
                                      <TableHead>Fecha Creación</TableHead>
                                      <TableHead>Fecha Final</TableHead>
                                      <TableHead>Estado</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getObjetivosDeportista(
                                      deportista.deportistaId
                                    ).map((objetivo) => (
                                      <TableRow key={objetivo.id}>
                                        <TableCell>{objetivo.nombre}</TableCell>
                                        <TableCell>
                                          {objetivo.descripcion}
                                        </TableCell>
                                        <TableCell>
                                          {new Date(
                                            objetivo.fecha_creacion
                                          ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                          {new Date(
                                            objetivo.fecha_final
                                          ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              objetivo.estado === "Cumplido"
                                                ? "default"
                                                : objetivo.estado ===
                                                  "En proceso"
                                                ? "outline"
                                                : "secondary"
                                            }
                                          >
                                            {objetivo.estado}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex space-x-2">
                                            <Button variant="outline" size="sm">
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
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  No hay objetivos registrados
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="pagos" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Pagos</h4>
                                <Button size="sm" variant="outline">
                                  <FileText className="h-4 w-4 mr-1" />{" "}
                                  Registrar Pago
                                </Button>
                              </div>
                              {getPagosDeportista(deportista.deportistaId)
                                .length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Concepto</TableHead>
                                      <TableHead>Monto</TableHead>
                                      <TableHead>Fecha</TableHead>
                                      <TableHead>Estado</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getPagosDeportista(
                                      deportista.deportistaId
                                    ).map((pago) => (
                                      <TableRow key={pago.id}>
                                        <TableCell>{pago.concepto}</TableCell>
                                        <TableCell>
                                          ${pago.monto.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                          {new Date(
                                            pago.fecha
                                          ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              pago.estado === "Pagado"
                                                ? "default"
                                                : "secondary"
                                            }
                                          >
                                            {pago.estado}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex space-x-2">
                                            <Button variant="outline" size="sm">
                                              <Pencil className="h-4 w-4 mr-1" />{" "}
                                              Editar
                                            </Button>
                                            <Button variant="outline" size="sm">
                                              <FileText className="h-4 w-4 mr-1" />{" "}
                                              Ver Factura
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  No hay pagos registrados
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
          <DialogTitle>Registrar Nuevo Deportista</DialogTitle>
          <DialogDescription>
            Completa el formulario para agregar un nuevo deportista al sistema.
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Deportista</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  name="nombre"
                  value={nuevoDeportista.nombre}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Apellidos</Label>
                <Input
                  name="apellidos"
                  value={nuevoDeportista.apellidos}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Dirección</Label>
                <Input
                  name="direccion"
                  value={nuevoDeportista.direccion}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input
                  name="telefono"
                  value={nuevoDeportista.telefono}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Fecha Nacimiento</Label>
                <Input
                  type="date"
                  name="fechaNacimiento"
                  value={nuevoDeportista.fechaNacimiento}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Fecha Inscripción</Label>
                <Input
                  type="date"
                  name="fechaInscripcion"
                  value={nuevoDeportista.fechaInscripcion}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Altura (cm)</Label>
                <Input
                  type="number"
                  name="altura"
                  value={nuevoDeportista.altura}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  name="peso"
                  value={nuevoDeportista.peso}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="genero-select">Género</Label>
                <Select
                  name="generoId"
                  value={nuevoDeportista.generoId?.toString() ?? ""}
                  onValueChange={(value) =>
                    setNuevoDeportista({
                      ...nuevoDeportista,
                      generoId: Number(value),
                    })
                  }
                >
                  <SelectTrigger id="genero-select" className="w-full">
                    <SelectValue placeholder="Seleccionar género" />
                  </SelectTrigger>
                  <SelectContent>
                    {generos.map((genero) => (
                      <SelectItem key={genero.id} value={genero.id.toString()}>
                        {genero.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Versión corregida para el componente Nivel */}
              <div>
                <Label htmlFor="nivel-select">Nivel</Label>
                <Select
                  name="nivelActualId"
                  onValueChange={(value) =>
                    setNuevoDeportista({
                      ...nuevoDeportista,
                      nivelActualId: Number(value),
                    })
                  }
                >
                  <SelectTrigger id="nivel-select" className="w-full">
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveles.map((nivel) => (
                      <SelectItem key={nivel.id} value={nivel.id.toString()}>
                        {nivel.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Versión corregida para el componente Estado */}
              <Select
                name="estadoId"
                value={nuevoDeportista.estadoId?.toString() ?? ""}
                onValueChange={(value) =>
                  setNuevoDeportista({
                    ...nuevoDeportista,
                    estadoId: Number(value),
                  })
                }
              >
                <SelectTrigger id="estado-select" className="w-full">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((estado) => (
                    <SelectItem key={estado.id} value={estado.id.toString()}>
                      {estado.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="col-span-2">
                <Label>Contacto Emergencia</Label>
                <Input
                  name="contactoEmergencia"
                  value={nuevoDeportista.contactoEmergencia}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={guardarDeportista}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deportistaAEliminar !== null}
        onOpenChange={() => setDeportistaAEliminar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p>¿Estás seguro que deseas eliminar este deportista?</p>
          <DialogFooter className="mt-4">
            <Button
              variant="secondary"
              onClick={() => setDeportistaAEliminar(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deportistaAEliminar !== null) {
                  await eliminarDeportista(deportistaAEliminar);
                  setDeportistaAEliminar(null);
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
