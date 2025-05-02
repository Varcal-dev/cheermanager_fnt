"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Download, Search, Star, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Datos de ejemplo para evaluaciones
const evaluaciones = [
  {
    id: 1,
    deportista: "Isabella Sánchez",
    fecha: "2024-03-15",
    nivel_actual: "Intermedio",
    nivel_recomendado: "Avanzado",
    evaluador: "Carlos Mendoza",
    grupo: "Junior Elite",
  },
  {
    id: 2,
    deportista: "Nicolás Ramírez",
    fecha: "2024-03-15",
    nivel_actual: "Principiante",
    nivel_recomendado: "Intermedio",
    evaluador: "Ana Gutiérrez",
    grupo: "Mini Estrellas",
  },
  {
    id: 3,
    deportista: "Alejandro Díaz",
    fecha: "2024-02-20",
    nivel_actual: "Avanzado",
    nivel_recomendado: "Avanzado",
    evaluador: "Carlos Mendoza",
    grupo: "Senior Champions",
  },
  {
    id: 4,
    deportista: "Sofía Pérez",
    fecha: "2024-02-10",
    nivel_actual: "Principiante",
    nivel_recomendado: "Principiante",
    evaluador: "Ana Gutiérrez",
    grupo: "Mini Estrellas",
  },
]

// Datos de ejemplo para criterios de evaluación
const criteriosEvaluacion = [
  {
    id: 1,
    evaluacion_id: 1,
    criterio: "Flexibilidad",
    puntaje: 8,
    observaciones: "Buena flexibilidad en piernas, puede mejorar en espalda",
  },
  {
    id: 2,
    evaluacion_id: 1,
    criterio: "Fuerza",
    puntaje: 9,
    observaciones: "Excelente fuerza en brazos y core",
  },
  {
    id: 3,
    evaluacion_id: 1,
    criterio: "Técnica de Saltos",
    puntaje: 7,
    observaciones: "Necesita mejorar la altura en los saltos",
  },
  {
    id: 4,
    evaluacion_id: 1,
    criterio: "Stunts",
    puntaje: 9,
    observaciones: "Muy buena técnica y confianza",
  },
  {
    id: 5,
    evaluacion_id: 2,
    criterio: "Flexibilidad",
    puntaje: 6,
    observaciones: "Debe trabajar en mejorar la flexibilidad general",
  },
  {
    id: 6,
    evaluacion_id: 2,
    criterio: "Fuerza",
    puntaje: 7,
    observaciones: "Buena fuerza para su nivel",
  },
]

// Datos de ejemplo para recomendaciones
const recomendaciones = [
  {
    id: 1,
    evaluacion_id: 1,
    recomendacion: "Promover al nivel avanzado en el próximo ciclo",
    prioridad: "Alta",
  },
  {
    id: 2,
    evaluacion_id: 1,
    recomendacion: "Trabajar en mejorar la altura de los saltos",
    prioridad: "Media",
  },
  {
    id: 3,
    evaluacion_id: 2,
    recomendacion: "Continuar con ejercicios de flexibilidad",
    prioridad: "Alta",
  },
  {
    id: 4,
    evaluacion_id: 2,
    recomendacion: "Considerar promoción a nivel intermedio en 3 meses",
    prioridad: "Media",
  },
]

export default function EvaluacionPage() {
  const [expandedEvaluaciones, setExpandedEvaluaciones] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroNivel, setFiltroNivel] = useState("todos")
  const [filtroGrupo, setFiltroGrupo] = useState("todos")

  const toggleEvaluacionExpand = (evaluacionId: number) => {
    setExpandedEvaluaciones((prev) =>
      prev.includes(evaluacionId) ? prev.filter((id) => id !== evaluacionId) : [...prev, evaluacionId],
    )
  }

  // Filtrar evaluaciones por término de búsqueda, nivel y grupo
  const filteredEvaluaciones = evaluaciones.filter((evaluacion) => {
    const matchesSearch =
      evaluacion.deportista.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluacion.evaluador.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesNivel =
      filtroNivel === "todos" || evaluacion.nivel_actual === filtroNivel || evaluacion.nivel_recomendado === filtroNivel

    const matchesGrupo = filtroGrupo === "todos" || evaluacion.grupo === filtroGrupo

    return matchesSearch && matchesNivel && matchesGrupo
  })

  // Obtener criterios para una evaluación
  const getCriteriosEvaluacion = (evaluacionId: number) => {
    return criteriosEvaluacion.filter((c) => c.evaluacion_id === evaluacionId)
  }

  // Obtener recomendaciones para una evaluación
  const getRecomendaciones = (evaluacionId: number) => {
    return recomendaciones.filter((r) => r.evaluacion_id === evaluacionId)
  }

  // Calcular promedio de puntajes
  const calcularPromedio = (evaluacionId: number): string => {
    const criterios = getCriteriosEvaluacion(evaluacionId)
    if (criterios.length === 0) return "0"
    const suma = criterios.reduce((acc, criterio) => acc + criterio.puntaje, 0)
    return (suma / criterios.length).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluación de Deportistas</h1>
          <p className="text-muted-foreground">Gestiona las evaluaciones y seguimiento de progreso</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nueva Evaluación
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <Input
            placeholder="Buscar por deportista o evaluador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9"
          />
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={filtroNivel} onValueChange={setFiltroNivel}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filtrar por nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los niveles</SelectItem>
              <SelectItem value="Principiante">Principiante</SelectItem>
              <SelectItem value="Intermedio">Intermedio</SelectItem>
              <SelectItem value="Avanzado">Avanzado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Filtrar por grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los grupos</SelectItem>
              <SelectItem value="Mini Estrellas">Mini Estrellas</SelectItem>
              <SelectItem value="Junior Elite">Junior Elite</SelectItem>
              <SelectItem value="Senior Champions">Senior Champions</SelectItem>
            </SelectContent>
          </Select>
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
                <TableHead>Deportista</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Nivel Actual</TableHead>
                <TableHead>Nivel Recomendado</TableHead>
                <TableHead>Promedio</TableHead>
                <TableHead>Evaluador</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvaluaciones.map((evaluacion) => (
                <>
                  <TableRow key={evaluacion.id}>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleEvaluacionExpand(evaluacion.id)}>
                        {expandedEvaluaciones.includes(evaluacion.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{evaluacion.deportista}</TableCell>
                    <TableCell>{new Date(evaluacion.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>{evaluacion.grupo}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          evaluacion.nivel_actual === "Avanzado"
                            ? "default"
                            : evaluacion.nivel_actual === "Intermedio"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {evaluacion.nivel_actual}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          evaluacion.nivel_recomendado === "Avanzado"
                            ? "default"
                            : evaluacion.nivel_recomendado === "Intermedio"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {evaluacion.nivel_recomendado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star
                          className={`h-4 w-4 mr-1 ${
                            Number.parseFloat(calcularPromedio(evaluacion.id)) >= 8
                              ? "text-yellow-500"
                              : Number.parseFloat(calcularPromedio(evaluacion.id)) >= 6
                                ? "text-blue-500"
                                : "text-gray-500"
                          }`}
                          fill="currentColor"
                        />
                        {calcularPromedio(evaluacion.id)}
                      </div>
                    </TableCell>
                    <TableCell>{evaluacion.evaluador}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" /> Reporte
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedEvaluaciones.includes(evaluacion.id) && (
                    <TableRow key={`${evaluacion.id}-details`} className="bg-muted/50">
                      <TableCell colSpan={9} className="p-0">
                        <div className="p-4">
                          <Tabs defaultValue="criterios" className="w-full">
                            <TabsList>
                              <TabsTrigger value="criterios">Criterios Evaluados</TabsTrigger>
                              <TabsTrigger value="recomendaciones">Recomendaciones</TabsTrigger>
                            </TabsList>

                            <TabsContent value="criterios" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Criterios de Evaluación</h4>
                                <Button size="sm" variant="outline">
                                  <Plus className="h-4 w-4 mr-1" /> Agregar Criterio
                                </Button>
                              </div>
                              {getCriteriosEvaluacion(evaluacion.id).length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Criterio</TableHead>
                                      <TableHead>Puntaje (1-10)</TableHead>
                                      <TableHead>Observaciones</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getCriteriosEvaluacion(evaluacion.id).map((criterio) => (
                                      <TableRow key={criterio.id}>
                                        <TableCell>{criterio.criterio}</TableCell>
                                        <TableCell>
                                          <div className="flex items-center">
                                            <span
                                              className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                                                criterio.puntaje >= 8
                                                  ? "bg-green-100 text-green-800"
                                                  : criterio.puntaje >= 6
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-red-100 text-red-800"
                                              }`}
                                            >
                                              {criterio.puntaje}
                                            </span>
                                            <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5">
                                              <div
                                                className={`h-2.5 rounded-full ${
                                                  criterio.puntaje >= 8
                                                    ? "bg-green-600"
                                                    : criterio.puntaje >= 6
                                                      ? "bg-blue-600"
                                                      : "bg-red-600"
                                                }`}
                                                style={{ width: `${criterio.puntaje * 10}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell>{criterio.observaciones}</TableCell>
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
                                  No hay criterios registrados para esta evaluación
                                </div>
                              )}
                            </TabsContent>

                            <TabsContent value="recomendaciones" className="mt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold">Recomendaciones</h4>
                                <Button size="sm" variant="outline">
                                  <Plus className="h-4 w-4 mr-1" /> Agregar Recomendación
                                </Button>
                              </div>
                              {getRecomendaciones(evaluacion.id).length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Recomendación</TableHead>
                                      <TableHead>Prioridad</TableHead>
                                      <TableHead>Acciones</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getRecomendaciones(evaluacion.id).map((recomendacion) => (
                                      <TableRow key={recomendacion.id}>
                                        <TableCell>{recomendacion.recomendacion}</TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={
                                              recomendacion.prioridad === "Alta"
                                                ? "destructive"
                                                : recomendacion.prioridad === "Media"
                                                  ? "default"
                                                  : "outline"
                                            }
                                          >
                                            {recomendacion.prioridad}
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
                                  No hay recomendaciones registradas para esta evaluación
                                </div>
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
