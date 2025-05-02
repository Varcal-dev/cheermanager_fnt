"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Datos de ejemplo para horarios
const horarios = [
  {
    id: 1,
    grupo: "Mini Estrellas",
    dia: "Lunes",
    hora_inicio: "16:00",
    hora_fin: "17:30",
    entrenador_principal: "Ana García",
    entrenadores_asistentes: ["Carlos Rodríguez"],
  },
  {
    id: 2,
    grupo: "Mini Estrellas",
    dia: "Miércoles",
    hora_inicio: "16:00",
    hora_fin: "17:30",
    entrenador_principal: "Ana García",
    entrenadores_asistentes: [],
  },
  {
    id: 3,
    grupo: "Youth Rockets",
    dia: "Martes",
    hora_inicio: "17:00",
    hora_fin: "19:00",
    entrenador_principal: "Carlos Rodríguez",
    entrenadores_asistentes: ["Ana García"],
  },
  {
    id: 4,
    grupo: "Youth Rockets",
    dia: "Jueves",
    hora_inicio: "17:00",
    hora_fin: "19:00",
    entrenador_principal: "Carlos Rodríguez",
    entrenadores_asistentes: [],
  },
  {
    id: 5,
    grupo: "Junior Elite",
    dia: "Lunes",
    hora_inicio: "18:00",
    hora_fin: "20:00",
    entrenador_principal: "Laura Martínez",
    entrenadores_asistentes: [],
  },
  {
    id: 6,
    grupo: "Junior Elite",
    dia: "Miércoles",
    hora_inicio: "18:00",
    hora_fin: "20:00",
    entrenador_principal: "Laura Martínez",
    entrenadores_asistentes: [],
  },
  {
    id: 7,
    grupo: "Junior Elite",
    dia: "Viernes",
    hora_inicio: "18:00",
    hora_fin: "20:00",
    entrenador_principal: "Laura Martínez",
    entrenadores_asistentes: [],
  },
]

// Datos de ejemplo para asistencias
const asistencias = [
  {
    id: 1,
    horario_id: 1,
    fecha: "2024-04-15",
    deportistas: [
      { id: 1, nombre: "Sofía Pérez", estado: "Presente" },
      { id: 2, nombre: "Lucas Martínez", estado: "Presente" },
      { id: 3, nombre: "Emma Rodríguez", estado: "Ausente" },
    ],
  },
  {
    id: 2,
    horario_id: 1,
    fecha: "2024-04-22",
    deportistas: [
      { id: 1, nombre: "Sofía Pérez", estado: "Presente" },
      { id: 2, nombre: "Lucas Martínez", estado: "Presente" },
      { id: 3, nombre: "Emma Rodríguez", estado: "Presente" },
    ],
  },
  {
    id: 3,
    horario_id: 3,
    fecha: "2024-04-16",
    deportistas: [
      { id: 4, nombre: "Mateo González", estado: "Presente" },
      { id: 5, nombre: "Valentina López", estado: "Ausente" },
      { id: 6, nombre: "Santiago Torres", estado: "Presente" },
    ],
  },
]

// Mapeo de días de la semana para ordenar
const ordenDias = {
  Lunes: 1,
  Martes: 2,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sábado: 6,
  Domingo: 7,
}

export default function HorariosPage() {
  const [expandedHorarios, setExpandedHorarios] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("horarios")
  const [grupoFiltrado, setGrupoFiltrado] = useState<string | null>(null)

  const toggleHorarioExpand = (horarioId: number) => {
    setExpandedHorarios((prev) =>
      prev.includes(horarioId) ? prev.filter((id) => id !== horarioId) : [...prev, horarioId],
    )
  }

  // Obtener lista única de grupos
  const grupos = Array.from(new Set(horarios.map((h) => h.grupo)))

  // Filtrar horarios por término de búsqueda y grupo
  const filteredHorarios = horarios
    .filter((horario) => {
      const matchesSearch =
        horario.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        horario.entrenador_principal.toLowerCase().includes(searchTerm.toLowerCase())

      if (grupoFiltrado) {
        return matchesSearch && horario.grupo === grupoFiltrado
      }
      return matchesSearch
    })
    .sort((a, b) => {
      // Ordenar por grupo, luego por día de la semana
      if (a.grupo !== b.grupo) {
        return a.grupo.localeCompare(b.grupo)
      }
      return ordenDias[a.dia as keyof typeof ordenDias] - ordenDias[b.dia as keyof typeof ordenDias]
    })

  // Obtener asistencias para un horario
  const getAsistenciasHorario = (horarioId: number) => {
    return asistencias.filter((a) => a.horario_id === horarioId)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Horarios y Asistencias</h1>
          <p className="text-muted-foreground">Gestiona los horarios de entrenamiento y registra asistencias</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Horario
        </Button>
      </div>

      <Tabs defaultValue="horarios" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="horarios">Horarios</TabsTrigger>
          <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
        </TabsList>

        <TabsContent value="horarios">
          <div className="flex justify-between mb-4">
            <div className="flex items-center space-x-2 w-full max-w-sm">
              <Input
                placeholder="Buscar horarios..."
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
                    {grupoFiltrado || "Filtrar por Grupo"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setGrupoFiltrado(null)}>Todos los grupos</DropdownMenuItem>
                  {grupos.map((grupo) => (
                    <DropdownMenuItem key={grupo} onClick={() => setGrupoFiltrado(grupo)}>
                      {grupo}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Entrenador Principal</TableHead>
                    <TableHead>Asistentes</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHorarios.map((horario) => (
                    <>
                      <TableRow key={horario.id}>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => toggleHorarioExpand(horario.id)}>
                            {expandedHorarios.includes(horario.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{horario.grupo}</TableCell>
                        <TableCell>{horario.dia}</TableCell>
                        <TableCell>
                          {horario.hora_inicio} - {horario.hora_fin}
                        </TableCell>
                        <TableCell>{horario.entrenador_principal}</TableCell>
                        <TableCell>
                          {horario.entrenadores_asistentes.length > 0
                            ? horario.entrenadores_asistentes.join(", ")
                            : "-"}
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
                      {expandedHorarios.includes(horario.id) && (
                        <TableRow key={`${horario.id}-details`} className="bg-muted/50">
                          <TableCell colSpan={7} className="p-0">
                            <div className="p-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Asistencias Recientes</h4>
                                <Button size="sm" variant="outline">
                                  <Calendar className="h-4 w-4 mr-1" /> Registrar Asistencia
                                </Button>
                              </div>
                              {getAsistenciasHorario(horario.id).length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Fecha</TableHead>
                                      <TableHead>Presentes</TableHead>
                                      <TableHead>Ausentes</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getAsistenciasHorario(horario.id).map((asistencia) => {
                                      const presentes = asistencia.deportistas.filter((d) => d.estado === "Presente")
                                        .length
                                      const ausentes = asistencia.deportistas.filter((d) => d.estado === "Ausente").length
                                      const total = asistencia.deportistas.length

                                      return (
                                        <TableRow key={asistencia.id}>
                                          <TableCell>{new Date(asistencia.fecha).toLocaleDateString()}</TableCell>
                                          <TableCell>
                                            {presentes} de {total} ({Math.round((presentes / total) * 100)}%)
                                          </TableCell>
                                          <TableCell>
                                            {ausentes} de {total} ({Math.round((ausentes / total) * 100)}%)
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex space-x-2">
                                              <Button variant="outline" size="sm">
                                                <Pencil className="h-4 w-4 mr-1" /> Editar
                                              </Button>
                                              <Button variant="outline" size="sm">
                                                <Users className="h-4 w-4 mr-1" /> Ver Detalle
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    })}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  No hay asistencias registradas para este horario
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asistencias">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Asistencias</CardTitle>
              <CardDescription>Registra y consulta las asistencias de los deportistas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Calendar className="mr-2 h-4 w-4" />
                          Seleccionar Fecha
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem>Hoy</DropdownMenuItem>
                        <DropdownMenuItem>Ayer</DropdownMenuItem>
                        <DropdownMenuItem>Esta semana</DropdownMenuItem>
                        <DropdownMenuItem>Semana pasada</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Users className="mr-2 h-4 w-4" />
                          Seleccionar Grupo
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {grupos.map((grupo) => (
                          <DropdownMenuItem key={grupo}>{grupo}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Asistencia
                  </Button>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Presentes</TableHead>
                        <TableHead>Ausentes</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asistencias.map((asistencia) => {
                        const horario = horarios.find((h) => h.id === asistencia.horario_id)
                        const presentes = asistencia.deportistas.filter((d) => d.estado === "Presente").length
                        const ausentes = asistencia.deportistas.filter((d) => d.estado === "Ausente").length
                        const total = asistencia.deportistas.length

                        return (
                          <TableRow key={asistencia.id}>
                            <TableCell>{new Date(asistencia.fecha).toLocaleDateString()}</TableCell>
                            <TableCell>{horario?.grupo}</TableCell>
                            <TableCell>
                              {horario?.dia} {horario?.hora_inicio} - {horario?.hora_fin}
                            </TableCell>
                            <TableCell>
                              {presentes} de {total} ({Math.round((presentes / total) * 100)}%)
                            </TableCell>
                            <TableCell>
                              {ausentes} de {total} ({Math.round((ausentes / total) * 100)}%)
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Users className="h-4 w-4 mr-1" /> Ver Detalle
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Pencil className="h-4 w-4 mr-1" /> Editar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Estadísticas Generales</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-md">
                      <h4 className="text-sm font-semibold">Total de Asistencias</h4>
                      <p className="text-xl font-bold">
                        {asistencias.reduce((acc, asistencia) => acc + asistencia.deportistas.filter(d => d.estado === "Presente").length, 0)}
                      </p>
                    </div>
                    <div className="p-4 border rounded-md">
                      <h4 className="text-sm font-semibold">Total de Ausencias</h4>
                      <p className="text-xl font-bold">
                        {asistencias.reduce((acc, asistencia) => acc + asistencia.deportistas.filter(d => d.estado === "Ausente").length, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
