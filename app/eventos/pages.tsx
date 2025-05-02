"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Filter, Download, Search, Trophy, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Datos de ejemplo para eventos
const eventos = [
  {
    id: 1,
    nombre: "Competencia Regional 2024",
    fecha: "2024-06-15",
    tipo: "Competencia",
    ubicacion: "Polideportivo Central",
    costo_inscripcion: 150.0,
    tiene_resultados: true,
  },
  {
    id: 2,
    nombre: "Exhibición Aniversario",
    fecha: "2024-07-22",
    tipo: "Exhibición",
    ubicacion: "Plaza Principal",
    costo_inscripcion: 0.0,
    tiene_resultados: false,
  },
  {
    id: 3,
    nombre: "Campeonato Nacional",
    fecha: "2024-09-10",
    tipo: "Competencia",
    ubicacion: "Centro de Convenciones",
    costo_inscripcion: 250.0,
    tiene_resultados: true,
  },
  {
    id: 4,
    nombre: "Taller de Stunts",
    fecha: "2024-05-05",
    tipo: "Taller",
    ubicacion: "Gimnasio Principal",
    costo_inscripcion: 75.0,
    tiene_resultados: false,
  },
]

// Datos de ejemplo para grupos en eventos
const gruposEventos = [
  {
    id: 1,
    evento_id: 1,
    grupo: "Junior Elite",
  },
  {
    id: 2,
    evento_id: 1,
    grupo: "Senior Champions",
  },
  {
    id: 3,
    evento_id: 2,
    grupo: "Mini Estrellas",
  },
  {
    id: 4,
    evento_id: 2,
    grupo: "Youth Rockets",
  },
  {
    id: 5,
    evento_id: 2,
    grupo: "Junior Elite",
  },
  {
    id: 6,
    evento_id: 3,
    grupo: "Senior Champions",
  },
]

// Datos de ejemplo para deportistas en eventos
const deportistasEventos = [
  {
    id: 1,
    evento_id: 1,
    deportista: "Isabella Sánchez",
    grupo: "Junior Elite",
    asistio: true,
    observaciones: "Excelente desempeño",
  },
  {
    id: 2,
    evento_id: 1,
    deportista: "Nicolás Ramírez",
    grupo: "Junior Elite",
    asistio: true,
    observaciones: "",
  },
  {
    id: 3,
    evento_id: 1,
    deportista: "Alejandro Díaz",
    grupo: "Senior Champions",
    asistio: false,
    observaciones: "Lesión en el tobillo",
  },
  {
    id: 4,
    evento_id: 2,
    deportista: "Sofía Pérez",
    grupo: "Mini Estrellas",
    asistio: true,
    observaciones: "",
  },
]

// Datos de ejemplo para resultados de competencias
const resultadosCompetencias = [
  {
    id: 1,
    evento_id: 1,
    grupo: "Junior Elite",
    posicion: 2,
    puntaje: 87.5,
    premio: "Medalla de Plata",
    observaciones: "Excelente ejecución de stunts",
  },
  {
    id: 2,
    evento_id: 1,
    grupo: "Senior Champions",
    posicion: 1,
    puntaje: 92.3,
    premio: "Medalla de Oro",
    observaciones: "Rutina impecable",
  },
  {
    id: 3,
    evento_id: 3,
    grupo: "Senior Champions",
    posicion: 3,
    puntaje: 85.8,
    premio: "Medalla de Bronce",
    observaciones: "Pequeño error en pirámide final",
  },
]

export default function EventosPage() {
  const [expandedEventos, setExpandedEventos] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("todos")

  const toggleEventoExpand = (eventoId: number) => {
    setExpandedEventos((prev) => (prev.includes(eventoId) ? prev.filter((id) => id !== eventoId) : [...prev, eventoId]))
  }

  // Filtrar eventos por término de búsqueda y tipo
  const filteredEventos = eventos.filter((evento) => {
    const matchesSearch =
      evento.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "todos") return matchesSearch
    if (activeTab === "competencias") return matchesSearch && evento.tipo === "Competencia"
    if (activeTab === "exhibiciones") return matchesSearch && evento.tipo === "Exhibición"
    if (activeTab === "talleres") return matchesSearch && evento.tipo === "Taller"
    return matchesSearch
  })

  // Obtener grupos para un evento
  const getGruposEvento = (eventoId: number) => {
    return gruposEventos.filter((g) => g.evento_id === eventoId)
  }

  // Obtener deportistas para un evento
  const getDeportistasEvento = (eventoId: number) => {
    return deportistasEventos.filter((d) => d.evento_id === eventoId)
  }

  // Obtener resultados para un evento
  const getResultadosEvento = (eventoId: number) => {
    return resultadosCompetencias.filter((r) => r.evento_id === eventoId)
  }

  // Verificar si un evento es futuro
  const esFuturo = (fecha: string) => {
    return new Date(fecha) > new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos y Competencias</h1>
          <p className="text-muted-foreground">Gestiona los eventos, competencias y exhibiciones</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Evento
        </Button>
      </div>

      <div className="flex justify-between mb-4">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <Input
            placeholder="Buscar eventos..."
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
              <DropdownMenuItem onClick={() => setActiveTab("todos")}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("competencias")}>Competencias</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("exhibiciones")}>Exhibiciones</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("talleres")}>Talleres</DropdownMenuItem>
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
                <TableHead>Nombre</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEventos.map((evento) => (
                <>
                  <TableRow key={evento.id}>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleEventoExpand(evento.id)}>
                        {expandedEventos.includes(evento.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{evento.nombre}</TableCell>
                    <TableCell>{new Date(evento.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          evento.tipo === "Competencia"
                            ? "default"
                            : evento.tipo === "Exhibición"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {evento.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{evento.ubicacion}</TableCell>
                    <TableCell>
                      {evento.costo_inscripcion > 0 ? `$${evento.costo_inscripcion.toFixed(2)}` : "Gratuito"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={esFuturo(evento.fecha) ? "outline" : "default"}>
                        {esFuturo(evento.fecha) ? "Próximo" : "Realizado"}
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
                  {expandedEventos.includes(evento.id) && (
                    <TableRow key={`${evento.id}-details`} className="bg-muted/50">
                      <TableCell colSpan={8} className="p-0">
                        <div className="p-4">
                          <Tabs defaultValue="grupos" className="w-full">
                            <TabsList>
                              <TabsTrigger value="grupos">Grupos Participantes</TabsTrigger>
                              <TabsTrigger value="deportistas">Deportistas</TabsTrigger>
                              {evento.tiene_resultados && <TabsTrigger value="resultados">Resultados</TabsTrigger>}
                            </TabsList>

                            <TabsContent value="grupos" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Grupos Participantes</h4>
                                <Button size="sm" variant="outline">
                                  <Users className="h-4 w-4 mr-1" /> Agregar Grupo
                                </Button>
                              </div>
                              {getGruposEvento(evento.id).length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Grupo</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getGruposEvento(evento.id).map((grupo) => (
                                      <TableRow key={grupo.id}>
                                        <TableCell>{grupo.grupo}</TableCell>
                                        <TableCell>
                                          <div className="flex space-x-2">
                                            <Button variant="destructive" size="sm">
                                              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  No hay grupos asignados a este evento
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="deportistas" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Deportistas Participantes</h4>
                                <Button size="sm" variant="outline">
                                  <Users className="h-4 w-4 mr-1" /> Agregar Deportista
                                </Button>
                              </div>
                              {getDeportistasEvento(evento.id).length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Deportista</TableHead>
                                      <TableHead>Grupo</TableHead>
                                      <TableHead>Asistencia</TableHead>
                                      <TableHead>Observaciones</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getDeportistasEvento(evento.id).map((deportista) => (
                                      <TableRow key={deportista.id}>
                                        <TableCell>{deportista.deportista}</TableCell>
                                        <TableCell>{deportista.grupo}</TableCell>
                                        <TableCell>
                                          <Badge variant={deportista.asistio ? "default" : "secondary"}>
                                            {deportista.asistio ? "Asistió" : "No asistió"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{deportista.observaciones || "-"}</TableCell>
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
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  No hay deportistas asignados a este evento
                                </div>
                              )}
                            </TabsContent>

                            {evento.tiene_resultados && (
                              <TabsContent value="resultados" className="mt-4">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-semibold">Resultados</h4>
                                  <Button size="sm" variant="outline">
                                    <Trophy className="h-4 w-4 mr-1" /> Registrar Resultado
                                  </Button>
                                </div>
                                {getResultadosEvento(evento.id).length > 0 ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Grupo</TableHead>
                                        <TableHead>Posición</TableHead>
                                        <TableHead>Puntaje</TableHead>
                                        <TableHead>Premio</TableHead>
                                        <TableHead>Observaciones</TableHead>
                                        <TableHead>Acciones</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {getResultadosEvento(evento.id).map((resultado) => (
                                        <TableRow key={resultado.id}>
                                          <TableCell>{resultado.grupo}</TableCell>
                                          <TableCell>{resultado.posicion}º</TableCell>
                                          <TableCell>{resultado.puntaje.toFixed(1)}</TableCell>
                                          <TableCell>{resultado.premio}</TableCell>
                                          <TableCell>{resultado.observaciones || "-"}</TableCell>
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
                                ) : (
                                  <div className="text-center py-4 text-muted-foreground">
                                    No hay resultados registrados para este evento
                                  </div>
                                )}
                              </TabsContent>
                            )}
                          </Tabs>
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
    </div>
  )
}
