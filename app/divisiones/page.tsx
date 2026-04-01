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
import axios from "axios";

// Datos de ejemplo para niveles
const niveles = [
  { id: 1, nombre: "Nivel 1", descripcion: "Nivel básico", color: "#4CAF50" },
  {
    id: 2,
    nombre: "Nivel 2",
    descripcion: "Nivel intermedio bajo",
    color: "#2196F3",
  },
  {
    id: 3,
    nombre: "Nivel 3",
    descripcion: "Nivel intermedio",
    color: "#FFC107",
  },
  {
    id: 4,
    nombre: "Nivel 4",
    descripcion: "Nivel intermedio alto",
    color: "#FF9800",
  },
  { id: 5, nombre: "Nivel 5", descripcion: "Nivel avanzado", color: "#F44336" },
  { id: 6, nombre: "Nivel 6", descripcion: "Nivel élite", color: "#9C27B0" },
  {
    id: 7,
    nombre: "Nivel 7",
    descripcion: "Nivel profesional",
    color: "#000000",
  },
];

// Datos de ejemplo para divisiones
const divisiones = [
  { id: 1, nombre: "TINY", descripcion: "2018 en adelante", color: "#E91E63" },
  { id: 2, nombre: "MINI", descripcion: "2016 en adelante", color: "#9C27B0" },
  { id: 3, nombre: "YOUTH", descripcion: "2012 a 2017", color: "#673AB7" },
  { id: 4, nombre: "JUNIOR", descripcion: "2009 a 2014", color: "#3F51B5" },
  { id: 5, nombre: "SENIOR", descripcion: "2007 a 2013", color: "#2196F3" },
  { id: 6, nombre: "OPEN", descripcion: "Hasta 2010", color: "#009688" },
  {
    id: 7,
    nombre: "OPEN FEM",
    descripcion: "Hasta 2010 Femenino",
    color: "#4CAF50",
  },
  {
    id: 8,
    nombre: "OPEN MEDIUM",
    descripcion: "Hasta 2010. 10 a 24 deportistas Hasta 8 hombres",
    color: "#8BC34A",
  },
  {
    id: 9,
    nombre: "OPEN LARGE",
    descripcion: "Hasta 2010. 10 a 32 deportistas De 9 Hombres en adelante",
    color: "#CDDC39",
  },
  {
    id: 10,
    nombre: "OPEN NON-TUMBLING",
    descripcion: "Hasta 2010",
    color: "#FFC107",
  },
];

// Datos de ejemplo para categorías de nivel
const categoriasNivel = [
  // Nivel 1
  {
    id: 1,
    nivel_id: 1,
    division_id: 1,
    nombre: "TINY Nivel 1",
    año_nacimiento_min: 2018,
    año_nacimiento_max: null,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 2,
    nivel_id: 1,
    division_id: 2,
    nombre: "MINI Nivel 1",
    año_nacimiento_min: 2016,
    año_nacimiento_max: null,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 3,
    nivel_id: 1,
    division_id: 3,
    nombre: "YOUTH Nivel 1",
    año_nacimiento_min: 2012,
    año_nacimiento_max: 2017,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 4,
    nivel_id: 1,
    division_id: 4,
    nombre: "JUNIOR Nivel 1",
    año_nacimiento_min: 2009,
    año_nacimiento_max: 2014,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 5,
    nivel_id: 1,
    division_id: 5,
    nombre: "SENIOR Nivel 1",
    año_nacimiento_min: 2007,
    año_nacimiento_max: 2013,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },

  // Nivel 2
  {
    id: 6,
    nivel_id: 2,
    division_id: 3,
    nombre: "YOUTH Nivel 2",
    año_nacimiento_min: 2012,
    año_nacimiento_max: 2017,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 7,
    nivel_id: 2,
    division_id: 4,
    nombre: "JUNIOR Nivel 2",
    año_nacimiento_min: 2009,
    año_nacimiento_max: 2014,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 8,
    nivel_id: 2,
    division_id: 5,
    nombre: "SENIOR Nivel 2",
    año_nacimiento_min: 2007,
    año_nacimiento_max: 2013,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 9,
    nivel_id: 2,
    division_id: 6,
    nombre: "OPEN Nivel 2",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },

  // Nivel 3
  {
    id: 10,
    nivel_id: 3,
    division_id: 3,
    nombre: "YOUTH Nivel 3",
    año_nacimiento_min: 2012,
    año_nacimiento_max: 2017,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 11,
    nivel_id: 3,
    division_id: 4,
    nombre: "JUNIOR Nivel 3",
    año_nacimiento_min: 2009,
    año_nacimiento_max: 2014,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 12,
    nivel_id: 3,
    division_id: 5,
    nombre: "SENIOR Nivel 3",
    año_nacimiento_min: 2007,
    año_nacimiento_max: 2013,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 13,
    nivel_id: 3,
    division_id: 6,
    nombre: "OPEN Nivel 3",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 14,
    nivel_id: 3,
    division_id: 10,
    nombre: "OPEN NON-TUMBLING Nivel 3",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin tumbling",
    estado: "Activo",
  },

  // Nivel 4.2
  {
    id: 15,
    nivel_id: 4,
    division_id: 6,
    nombre: "OPEN Nivel 4.2",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Nivel 4 con restricciones",
    estado: "Activo",
  },

  // Nivel 4
  {
    id: 16,
    nivel_id: 4,
    division_id: 5,
    nombre: "SENIOR Nivel 4",
    año_nacimiento_min: 2007,
    año_nacimiento_max: 2013,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 17,
    nivel_id: 4,
    division_id: 7,
    nombre: "OPEN FEM Nivel 4",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Solo femenino",
    estado: "Activo",
  },
  {
    id: 18,
    nivel_id: 4,
    division_id: 8,
    nombre: "OPEN MEDIUM Nivel 4",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 24,
    restricciones: "Hasta 8 hombres",
    estado: "Activo",
  },
  {
    id: 19,
    nivel_id: 4,
    division_id: 9,
    nombre: "OPEN LARGE Nivel 4",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "De 9 hombres en adelante",
    estado: "Activo",
  },

  // Nivel 5
  {
    id: 20,
    nivel_id: 5,
    division_id: 6,
    nombre: "OPEN Nivel 5",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
  {
    id: 21,
    nivel_id: 5,
    division_id: 10,
    nombre: "OPEN NON-TUMBLING Nivel 5",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin tumbling",
    estado: "Activo",
  },

  // Nivel 6
  {
    id: 22,
    nivel_id: 6,
    division_id: 6,
    nombre: "OPEN Nivel 6",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },

  // Nivel 7.5
  {
    id: 23,
    nivel_id: 7,
    division_id: 6,
    nombre: "OPEN Nivel 7.5",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Nivel 7 con restricciones",
    estado: "Activo",
  },

  // Nivel 7
  {
    id: 24,
    nivel_id: 7,
    division_id: 6,
    nombre: "OPEN Nivel 7",
    año_nacimiento_min: null,
    año_nacimiento_max: 2010,
    cantidad_min: 10,
    cantidad_max: 32,
    restricciones: "Sin restricciones adicionales",
    estado: "Activo",
  },
];

export interface Division {
  id: number;
  nombre: string;
  descripcion: string;
}

export default function NivelesPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("divisiones");
  const [expandedNiveles, setExpandedNiveles] = useState<number[]>([]);

  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/divisiones`) // ajusta si usas un proxy o ruta absoluta
      .then((res) => {
        setDivisiones(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar las divisiones.");
      });
  }, []);

  // Función para alternar la expansión de un nivel
  const toggleNivelExpand = (nivelId: number) => {
    setExpandedNiveles((prev) =>
      prev.includes(nivelId)
        ? prev.filter((id) => id !== nivelId)
        : [...prev, nivelId]
    );
  };

  // Función para obtener el nombre de la división por ID
  const getDivisionName = (divisionId: number) => {
    const division = divisiones.find((d) => d.id === divisionId);
    return division ? division.nombre : "N/A";
  };

  // Función para obtener el nombre del nivel por ID
  const getNivelName = (nivelId: number) => {
    const nivel = niveles.find((n) => n.id === nivelId);
    return nivel ? nivel.nombre : "N/A";
  };

  // Función para obtener el color del nivel por ID
  const getNivelColor = (nivelId: number) => {
    const nivel = niveles.find((n) => n.id === nivelId);
    return nivel ? nivel.color : "#CCCCCC";
  };

  // Función para obtener las categorías de un nivel
  const getCategoriasNivel = (nivelId: number) => {
    return categoriasNivel.filter((c) => c.nivel_id === nivelId);
  };

  // Filtrar niveles por término de búsqueda
  const filteredNiveles = niveles.filter(
    (nivel) =>
      nivel.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nivel.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar divisiones por término de búsqueda
  const filteredDivisiones = divisiones.filter(
    (division) =>
      division.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      division.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar categorías por término de búsqueda
  const filteredCategorias = categoriasNivel.filter(
    (categoria) =>
      categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getNivelName(categoria.nivel_id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getDivisionName(categoria.division_id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Divisiones</h1>
          <p className="text-muted-foreground">
            Gestiona las diferentes divisiones que manejas en tu Gimnasio
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nueva División
        </Button>
      </div>
      <div className="flex justify-between mb-4">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <Input
            placeholder="Buscar divisiones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Pestaña de Divisiones */}
        <TabsContent value="divisiones">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDivisiones.map((division) => (
                    <TableRow key={division.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="font-medium">{division.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {division.descripcion || "Sin descripción"}
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
