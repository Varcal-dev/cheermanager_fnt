"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  FileText,
  Target,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
]

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
  }
]

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
  }
]

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
]

// Datos de ejemplo para historial de niveles
const historialNiveles = [
  {
    id: 1,
    deportista_id: 1,
    nivel: "Nivel 1",
    fecha_cambio: "2023-01-15",
    motivo: "Inscripción inicial",
  }
]

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
]



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
]

export default function DeportistasPage() {
  const [expandedDeportistas, setExpandedDeportistas] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("todos")

  const toggleDeportistaExpand = (deportistaId: number) => {
    setExpandedDeportistas((prev) =>
      prev.includes(deportistaId) ? prev.filter((id) => id !== deportistaId) : [...prev, deportistaId],
    )
  }

  // Filtrar deportistas por término de búsqueda y estado activo/inactivo
  const filteredDeportistas = deportistas.filter((deportista) => {
    const matchesSearch =
      deportista.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deportista.nivel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deportista.grupos.some((g) => g.toLowerCase().includes(searchTerm.toLowerCase()))

    if (activeTab === "todos") return matchesSearch
    if (activeTab === "activos") return matchesSearch && deportista.estado === "Activo"
    if (activeTab === "inactivos") return matchesSearch && deportista.estado === "Inactivo"
    return matchesSearch
  })

  // Obtener evaluaciones de un deportista
  const getEvaluacionesDeportista = (deportistaId: number) => {
    return evaluaciones.filter((e) => e.deportista_id === deportistaId)
  }

  // Obtener objetivos de un deportista
  const getObjetivosDeportista = (deportistaId: number) => {
    return objetivos.filter((o) => o.deportista_id === deportistaId)
  }

  // Obtener pagos de un deportista
  const getPagosDeportista = (deportistaId: number) => {
    return pagos.filter((p) => p.deportista_id === deportistaId)
  }

  // Obtener historial de niveles de un deportista
  const getHistorialNivelesDeportista = (deportistaId: number) => {
    return historialNiveles.filter((h) => h.deportista_id === deportistaId)
  }

  // Obtener historial de planes de un deportista
  const getHistorialPlanesDeportista = (deportistaId: number) => {
    return historialPlanes.filter((h) => h.deportista_id === deportistaId)
  }

  // Obtener historial de grupos de un deportista
  const getHistorialGruposDeportista = (deportistaId: number) => {
    return historialGrupos.filter((h) => h.deportista_id === deportistaId)
  }

  // Calcular edad a partir de fecha de nacimiento
  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date()
    const fechaNac = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - fechaNac.getFullYear()
    const mes = hoy.getMonth() - fechaNac.getMonth()

    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--
    }

    return edad
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deportistas</h1>
          <p className="text-muted-foreground">Gestiona la información de los deportistas registrados</p>
        </div>
        <Button>
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
              <DropdownMenuItem onClick={() => setActiveTab("todos")}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("activos")}>Activos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("inactivos")}>Inactivos</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>{/*
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
                <>
                  <TableRow key={deportista.id}>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleDeportistaExpand(deportista.id)}>
                        {expandedDeportistas.includes(deportista.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{deportista.nombre}</TableCell>
                    <TableCell>{calcularEdad(deportista.fecha_nacimiento)} años</TableCell>
                    <TableCell>{deportista.genero}</TableCell>
                    <TableCell>{deportista.nivel}</TableCell>
                    <TableCell>
                      {deportista.grupos.map((grupo, index) => (
                        <Badge key={index} variant="outline" className="mr-1">
                          {grupo}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={deportista.estado === "Activo" ? "default" : "secondary"}>
                        {deportista.estado}
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

                  {/* Detalles del deportista */}
                  {expandedDeportistas.includes(deportista.id) && (
                    <TableRow key={`${deportista.id}-details`} className="bg-muted/50">
                      <TableCell colSpan={8} className="p-0">
                        <div className="p-4">
                          <Tabs defaultValue="info" className="w-full">
                            <TabsList>
                              <TabsTrigger value="info">Información Personal</TabsTrigger>
                              <TabsTrigger value="historial">Historial</TabsTrigger>
                              <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
                              <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
                              <TabsTrigger value="pagos">Pagos</TabsTrigger>
                            </TabsList>

                            <TabsContent value="info" className="mt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Datos Personales</h4>
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">Fecha de Nacimiento:</span>
                                      <span>{new Date(deportista.fecha_nacimiento).toLocaleDateString()}</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">Teléfono:</span>
                                      <span>{deportista.telefono}</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">Fecha de Inscripción:</span>
                                      <span>{new Date(deportista.fecha_inscripcion).toLocaleDateString()}</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">Peso:</span>
                                      <span>{deportista.peso} kg</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">Altura:</span>
                                      <span>{deportista.altura} cm</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Información Médica</h4>
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">Contacto de Emergencia:</span>
                                      <span>{deportista.contacto_emergencia}</span>
                                    </div>
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">Historial Médico:</span>
                                      <span>{deportista.historial_medico}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>

                            {/* Historial */}
                            <TabsContent value="historial" className="mt-4">
                              <Tabs defaultValue="niveles">
                                <TabsList>
                                  <TabsTrigger value="niveles">Historial de Niveles</TabsTrigger>
                                  <TabsTrigger value="planes">Historial de Planes</TabsTrigger>
                                  <TabsTrigger value="grupos">Historial de Grupos</TabsTrigger>
                                </TabsList>

                                {/* Historial de Niveles */}
                                <TabsContent value="niveles" className="mt-4">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold">Historial de Niveles</h4>
                                    <Button size="sm" variant="outline">
                                      <Plus className="h-4 w-4 mr-1" /> Registrar Cambio de Nivel
                                    </Button>
                                  </div>
                                  {getHistorialNivelesDeportista(deportista.id).length > 0 ? (
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
                                        {getHistorialNivelesDeportista(deportista.id).map((historial) => (
                                          <TableRow key={historial.id}>
                                            <TableCell>{historial.nivel}</TableCell>
                                            <TableCell>
                                              {new Date(historial.fecha_cambio).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{historial.motivo}</TableCell>
                                            <TableCell>
                                              <div className="flex space-x-2">
                                                <Button variant="outline" size="sm">
                                                  <Pencil className="h-4 w-4 mr-1" /> Editar
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
                                    <h4 className="font-semibold">Historial de Planes</h4>
                                    <Button size="sm" variant="outline">
                                      <Plus className="h-4 w-4 mr-1" /> Registrar Cambio de Plan
                                    </Button>
                                  </div>
                                  {getHistorialPlanesDeportista(deportista.id).length > 0 ? (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Plan</TableHead>
                                          <TableHead>Fecha Inicio</TableHead>
                                          <TableHead>Fecha Fin</TableHead>
                                          <TableHead>Motivo de Cambio</TableHead>
                                          <TableHead>Acciones</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {getHistorialPlanesDeportista(deportista.id).map((historial) => (
                                          <TableRow key={historial.id}>
                                            <TableCell>{historial.plan}</TableCell>
                                            <TableCell>
                                              {new Date(historial.fecha_inicio).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                              {historial.fecha_fin
                                                ? new Date(historial.fecha_fin).toLocaleDateString()
                                                : "Activo"}
                                            </TableCell>
                                            <TableCell>{historial.motivo_cambio}</TableCell>
                                            <TableCell>
                                              <div className="flex space-x-2">
                                                <Button variant="outline" size="sm">
                                                  <Pencil className="h-4 w-4 mr-1" /> Editar
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
                                    <h4 className="font-semibold">Historial de Grupos</h4>
                                    <Button size="sm" variant="outline">
                                      <Plus className="h-4 w-4 mr-1" /> Registrar Cambio de Grupo
                                    </Button>
                                  </div>
                                  {getHistorialGruposDeportista(deportista.id).length > 0 ? (
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
                                        {getHistorialGruposDeportista(deportista.id).map((historial) => (
                                          <TableRow key={historial.id}>
                                            <TableCell>{historial.grupo}</TableCell>
                                            <TableCell>
                                              {new Date(historial.fecha_inicio).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                              {historial.fecha_fin
                                                ? new Date(historial.fecha_fin).toLocaleDateString()
                                                : "Activo"}
                                            </TableCell>
                                            <TableCell>{historial.observaciones}</TableCell>
                                            <TableCell>
                                              <div className="flex space-x-2">
                                                <Button variant="outline" size="sm">
                                                  <Pencil className="h-4 w-4 mr-1" /> Editar
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
                                  <Plus className="h-4 w-4 mr-1" /> Nueva Evaluación
                                </Button>
                              </div>
                              {getEvaluacionesDeportista(deportista.id).length > 0 ? (
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
                                    {getEvaluacionesDeportista(deportista.id).map((evaluacion) => (
                                      <TableRow key={evaluacion.id}>
                                        <TableCell>{new Date(evaluacion.fecha).toLocaleDateString()}</TableCell>
                                        <TableCell>{evaluacion.criterio}</TableCell>
                                        <TableCell>{evaluacion.puntaje}/10</TableCell>
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
                                  No hay evaluaciones registradas
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="objetivos" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Objetivos</h4>
                                <Button size="sm" variant="outline">
                                  <Target className="h-4 w-4 mr-1" /> Nuevo Objetivo
                                </Button>
                              </div>
                              {getObjetivosDeportista(deportista.id).length > 0 ? (
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
                                    {getObjetivosDeportista(deportista.id).map((objetivo) => (
                                      <TableRow key={objetivo.id}>
                                        <TableCell>{objetivo.nombre}</TableCell>
                                        <TableCell>{objetivo.descripcion}</TableCell>
                                        <TableCell>{new Date(objetivo.fecha_creacion).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(objetivo.fecha_final).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              objetivo.estado === "Cumplido"
                                                ? "default"
                                                : objetivo.estado === "En proceso"
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
                                  No hay objetivos registrados
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="pagos" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Pagos</h4>
                                <Button size="sm" variant="outline">
                                  <FileText className="h-4 w-4 mr-1" /> Registrar Pago
                                </Button>
                              </div>
                              {getPagosDeportista(deportista.id).length > 0 ? (
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
                                    {getPagosDeportista(deportista.id).map((pago) => (
                                      <TableRow key={pago.id}>
                                        <TableCell>{pago.concepto}</TableCell>
                                        <TableCell>${pago.monto.toFixed(2)}</TableCell>
                                        <TableCell>{new Date(pago.fecha).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                          <Badge variant={pago.estado === "Pagado" ? "default" : "secondary"}>
                                            {pago.estado}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex space-x-2">
                                            <Button variant="outline" size="sm">
                                              <Pencil className="h-4 w-4 mr-1" /> Editar
                                            </Button>
                                            <Button variant="outline" size="sm">
                                              <FileText className="h-4 w-4 mr-1" /> Ver Factura
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">No hay pagos registrados</div>
                              )}
                            </TabsContent>
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
