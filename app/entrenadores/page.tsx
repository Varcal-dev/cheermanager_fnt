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
  telefono: string | null;
  email: string | null;
  fecha_contratacion: string | null;
  especializacion: string | null;
  experiencia: string | null;
  certificaciones: string | null;
  estado: string;
}

export default function EntrenadoresPage() {
  const [expandedEntrenadores, setExpandedEntrenadores] = useState<number[]>(
    []
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
    const fetchEntrenadores = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/entrenadores",
          {
            withCredentials: true, // el backend requiere autenticación para esta acción
          }
        );
        const rawData = response.data;

        const mappedEntrenadores = rawData.map((entrenador: any) => ({
          id: entrenador.id,
          nombre: entrenador.persona?.nombre ?? "N/A",
          telefono: entrenador.persona?.telefono ?? "N/A", // viene de persona
          email: entrenador.persona?.email ?? "N/A", // si email está en persona
          fecha_contratacion: entrenador.fechaContratacion ?? "Sin Datos", // respetar nombre exacto y mayúsculas
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

    fetchEntrenadores();
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entrenadores</h1>
          <p className="text-muted-foreground">
            Gestiona la información de los entrenadores
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Entrenador
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
                      {entrenador.nombre}
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
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                        </Button>
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
    </div>
  );
}
