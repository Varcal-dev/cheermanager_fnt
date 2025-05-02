"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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

// Datos de ejemplo - normalmente vendrían de una base de datos
const divisiones = [
  { id: 1, nombre: "Mini", descripcion: "5-8 años" },
  { id: 2, nombre: "Youth", descripcion: "9-12 años" },
  { id: 3, nombre: "Junior", descripcion: "13-16 años" },
  { id: 4, nombre: "Senior", descripcion: "17+ años" },
];

const niveles = [
  { id: 1, nombre: "Nivel 1" },
  { id: 2, nombre: "Nivel 2" },
  { id: 3, nombre: "Nivel 3" },
  { id: 4, nombre: "Nivel 4" },
  { id: 5, nombre: "Nivel 5" },
];

const categoriasNivel = [
  {
    id: 1,
    nombre: "Mini Nivel 1",
    nivel_id: 1,
    division_id: 1,
    año_nacimiento_min: 2016,
    año_nacimiento_max: 2019,
    cantidad_min: 5,
    cantidad_max: 20,
    estado: "Activo",
  },
  {
    id: 2,
    nombre: "Youth Nivel 2",
    nivel_id: 2,
    division_id: 2,
    año_nacimiento_min: 2012,
    año_nacimiento_max: 2015,
    cantidad_min: 8,
    cantidad_max: 24,
    estado: "Activo",
  },
  {
    id: 3,
    nombre: "Junior Nivel 3",
    nivel_id: 3,
    division_id: 3,
    año_nacimiento_min: 2008,
    año_nacimiento_max: 2011,
    cantidad_min: 10,
    cantidad_max: 30,
    estado: "Activo",
  },
  {
    id: 4,
    nombre: "Senior Nivel 5",
    nivel_id: 5,
    division_id: 4,
    año_nacimiento_min: 2003,
    año_nacimiento_max: 2007,
    cantidad_min: 12,
    cantidad_max: 36,
    estado: "Activo",
  },
];

const tiposGrupo = [
  { id: 1, nombre: "Entrenamiento" },
  { id: 2, nombre: "Competencia" },
  { id: 3, nombre: "Exhibición" },
];

const deportistas = [
  { id: 1, nombre: "Sofía Pérez", edad: 7, nivel_id: 1 },
  { id: 2, nombre: "Lucas Martínez", edad: 6, nivel_id: 1 },
  { id: 3, nombre: "Emma Rodríguez", edad: 8, nivel_id: 1 },
  { id: 4, nombre: "Mateo González", edad: 10, nivel_id: 2 },
  { id: 5, nombre: "Valentina López", edad: 11, nivel_id: 2 },
  { id: 6, nombre: "Santiago Torres", edad: 9, nivel_id: 2 },
  { id: 7, nombre: "Isabella Sánchez", edad: 14, nivel_id: 3 },
  { id: 8, nombre: "Nicolás Ramírez", edad: 15, nivel_id: 3 },
  { id: 9, nombre: "Camila Flores", edad: 13, nivel_id: 3 },
  { id: 10, nombre: "Alejandro Díaz", edad: 18, nivel_id: 5 },
  { id: 11, nombre: "Valeria Castro", edad: 19, nivel_id: 5 },
  { id: 12, nombre: "Daniel Herrera", edad: 17, nivel_id: 5 },
];

const grupos = [
  {
    id: 1,
    nombre: "Mini Estrellas",
    tipo_grupo_id: 1,
    categoria_nivel_id: 1,
    deportistas: [1, 2, 3],
  },
  {
    id: 2,
    nombre: "Youth Rockets",
    tipo_grupo_id: 1,
    categoria_nivel_id: 2,
    deportistas: [4, 5, 6],
  },
  {
    id: 3,
    nombre: "Junior Elite",
    tipo_grupo_id: 2,
    categoria_nivel_id: 3,
    deportistas: [7, 8, 9],
  },
  {
    id: 4,
    nombre: "Senior Champions",
    tipo_grupo_id: 2,
    categoria_nivel_id: 4,
    deportistas: [10, 11, 12],
  },
];

export default function GruposPage() {
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleGroupExpand = (groupId: number) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
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

  // Función para obtener el nombre del tipo de grupo por ID
  const getTipoGrupoName = (tipoId: number) => {
    const tipo = tiposGrupo.find((t) => t.id === tipoId);
    return tipo ? tipo.nombre : "N/A";
  };

  // Función para obtener la categoría de nivel por ID
  const getCategoriaName = (categoriaId: number) => {
    const categoria = categoriasNivel.find((c) => c.id === categoriaId);
    return categoria ? categoria.nombre : "N/A";
  };

  // Función para obtener los deportistas de un grupo
  const getDeportistasGrupo = (deportistasIds: number[]) => {
    return deportistas.filter((d) => deportistasIds.includes(d.id));
  };

  // Filtrar grupos por término de búsqueda
  const filteredGrupos = grupos.filter(
    (grupo) =>
      grupo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoriaName(grupo.categoria_nivel_id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getTipoGrupoName(grupo.tipo_grupo_id)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
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
                      <DropdownMenuItem>Grupos de competencia</DropdownMenuItem>
                      <DropdownMenuItem>Grupos de exhibición</DropdownMenuItem>
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
                    const categoria = categoriasNivel.find(
                      (c) => c.id === grupo.categoria_nivel_id
                    );
                    const divisionId = categoria ? categoria.division_id : 0;
                    const nivelId = categoria ? categoria.nivel_id : 0;

                    return (
                      <>
                        <TableRow key={grupo.id}>
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
                              {getTipoGrupoName(grupo.tipo_grupo_id)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getCategoriaName(grupo.categoria_nivel_id)}
                          </TableCell>
                          <TableCell>{getDivisionName(divisionId)}</TableCell>
                          <TableCell>{getNivelName(nivelId)}</TableCell>
                          <TableCell>{grupo.deportistas.length}</TableCell>
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
                                    <UserPlus className="h-4 w-4 mr-1" /> Añadir
                                    Deportista
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
                                    {getDeportistasGrupo(grupo.deportistas).map(
                                      (deportista) => (
                                        <TableRow key={deportista.id}>
                                          <TableCell>
                                            {deportista.nombre}
                                          </TableCell>
                                          <TableCell>
                                            {deportista.edad} años
                                          </TableCell>
                                          <TableCell>
                                            {getNivelName(deportista.nivel_id)}
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
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
