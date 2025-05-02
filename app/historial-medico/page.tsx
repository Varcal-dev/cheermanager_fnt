"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Datos de ejemplo
const historialMedico = [
  {
    id: 1,
    deportista_id: 1,
    deportista_nombre: "Sofía Pérez",
    tipo: "Lesión",
    fecha: "2023-10-15",
    descripcion: "Esguince de tobillo durante entrenamiento",
    estado: "Recuperado",
    documentos: ["radiografia.pdf", "receta_medica.pdf"],
    restricciones: "No realizar saltos por 2 semanas",
    medico: "Dr. Martínez",
    seguimiento: [
      { fecha: "2023-10-20", nota: "Mejorando, continuar con reposo" },
      { fecha: "2023-11-05", nota: "Alta médica, puede retomar actividades gradualmente" },
    ],
  },
  {
    id: 2,
    deportista_id: 7,
    deportista_nombre: "Isabella Sánchez",
    tipo: "Condición Crónica",
    fecha: "2023-08-03",
    descripcion: "Asma leve, controlada con inhalador",
    estado: "En tratamiento",
    documentos: ["informe_medico.pdf"],
    restricciones: "Monitorear durante ejercicios de alta intensidad",
    medico: "Dra. Rodríguez",
    seguimiento: [{ fecha: "2023-09-10", nota: "Control rutinario, condición estable" }],
  },
  {
    id: 3,
    deportista_id: 10,
    deportista_nombre: "Alejandro Díaz",
    tipo: "Lesión",
    fecha: "2023-11-20",
    descripcion: "Contusión en hombro derecho durante competencia",
    estado: "En recuperación",
    documentos: ["resonancia.pdf", "plan_fisioterapia.pdf"],
    restricciones: "Evitar cargas en el hombro por 3 semanas",
    medico: "Dr. Gómez",
    seguimiento: [{ fecha: "2023-11-27", nota: "Iniciando fisioterapia, dolor reducido" }],
  },
  {
    id: 4,
    deportista_id: 5,
    deportista_nombre: "Valentina López",
    tipo: "Alergia",
    fecha: "2023-07-12",
    descripcion: "Alergia a ciertos materiales sintéticos",
    estado: "Controlado",
    documentos: ["test_alergia.pdf"],
    restricciones: "Evitar contacto con uniformes de material sintético específico",
    medico: "Dra. Fernández",
    seguimiento: [],
  },
  {
    id: 5,
    deportista_id: 8,
    deportista_nombre: "Nicolás Ramírez",
    tipo: "Lesión",
    fecha: "2023-09-05",
    descripcion: "Distensión muscular en muslo izquierdo",
    estado: "Recuperado",
    documentos: ["evaluacion_fisioterapia.pdf"],
    restricciones: "Completó rehabilitación, sin restricciones actuales",
    medico: "Dr. Torres",
    seguimiento: [
      { fecha: "2023-09-15", nota: "Progreso favorable con fisioterapia" },
      { fecha: "2023-10-01", nota: "Alta médica, puede retomar todas las actividades" },
    ],
  },
]

// Componente para mostrar el estado con un badge de color
const EstadoBadge = ({ estado }: { estado: string }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default"

  switch (estado) {
    case "Recuperado":
      variant = "default"
      break
    case "En recuperación":
      variant = "secondary"
      break
    case "En tratamiento":
      variant = "outline"
      break
    default:
      variant = "default"
  }

  return <Badge variant={variant}>{estado}</Badge>
}

export default function HistorialMedicoPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("registros")

  // Filtrar registros por término de búsqueda
  const filteredRecords = historialMedico.filter(
    (record) =>
      record.deportista_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial Médico</h1>
          <p className="text-muted-foreground">
            Gestiona el historial médico, lesiones y condiciones de salud de los deportistas
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="registros">Registros Médicos</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas y Reportes</TabsTrigger>
        </TabsList>

        {/* Pestaña de Registros Médicos */}
        <TabsContent value="registros">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registros Médicos</CardTitle>
                <CardDescription>
                  Historial de lesiones, condiciones médicas y seguimiento de los deportistas
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Registro
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Añadir Nuevo Registro Médico</DialogTitle>
                    <DialogDescription>
                      Ingresa la información médica del deportista. Todos los campos marcados con * son obligatorios.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deportista">Deportista *</Label>
                        <Select>
                          <SelectTrigger id="deportista">
                            <SelectValue placeholder="Seleccionar deportista" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Sofía Pérez</SelectItem>
                            <SelectItem value="2">Lucas Martínez</SelectItem>
                            <SelectItem value="3">Emma Rodríguez</SelectItem>
                            <SelectItem value="4">Mateo González</SelectItem>
                            <SelectItem value="5">Valentina López</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo *</Label>
                        <Select>
                          <SelectTrigger id="tipo">
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lesion">Lesión</SelectItem>
                            <SelectItem value="condicion">Condición Crónica</SelectItem>
                            <SelectItem value="alergia">Alergia</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fecha">Fecha *</Label>
                        <Input id="fecha" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medico">Médico</Label>
                        <Input id="medico" placeholder="Nombre del médico" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción *</Label>
                      <Textarea id="descripcion" placeholder="Describe la condición médica o lesión" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="restricciones">Restricciones</Label>
                      <Textarea id="restricciones" placeholder="Restricciones de actividad si aplican" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado *</Label>
                      <Select>
                        <SelectTrigger id="estado">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="recuperado">Recuperado</SelectItem>
                          <SelectItem value="en_recuperacion">En recuperación</SelectItem>
                          <SelectItem value="en_tratamiento">En tratamiento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documentos">Documentos</Label>
                      <Input id="documentos" type="file" multiple />
                      <p className="text-xs text-muted-foreground">Puedes subir múltiples archivos (PDF, JPG, PNG)</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div className="flex items-center space-x-2 w-full max-w-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por deportista, tipo o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9"
                  />
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
                      <DropdownMenuItem>Todos los registros</DropdownMenuItem>
                      <DropdownMenuItem>Lesiones</DropdownMenuItem>
                      <DropdownMenuItem>Condiciones crónicas</DropdownMenuItem>
                      <DropdownMenuItem>Alergias</DropdownMenuItem>
                      <DropdownMenuItem>En recuperación</DropdownMenuItem>
                      <DropdownMenuItem>Recuperados</DropdownMenuItem>
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
                    <TableHead>Deportista</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Documentos</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.deportista_nombre}</TableCell>
                      <TableCell>{record.tipo}</TableCell>
                      <TableCell>{new Date(record.fecha).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-xs truncate">{record.descripcion}</TableCell>
                      <TableCell>
                        <EstadoBadge estado={record.estado} />
                      </TableCell>
                      <TableCell>
                        {record.documentos.length > 0 ? (
                          <Badge variant="outline" className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {record.documentos.length}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Ninguno</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(record)}>
                                <Eye className="h-4 w-4 mr-1" /> Ver
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px]">
                              <DialogHeader>
                                <DialogTitle>Detalles del Registro Médico</DialogTitle>
                                <DialogDescription>
                                  Información completa y seguimiento del registro médico
                                </DialogDescription>
                              </DialogHeader>
                              {selectedRecord && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h3 className="font-semibold text-sm">Deportista</h3>
                                      <p>{selectedRecord.deportista_nombre}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-sm">Tipo</h3>
                                      <p>{selectedRecord.tipo}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-sm">Fecha</h3>
                                      <p>{new Date(selectedRecord.fecha).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-sm">Estado</h3>
                                      <EstadoBadge estado={selectedRecord.estado} />
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="font-semibold text-sm">Descripción</h3>
                                    <p>{selectedRecord.descripcion}</p>
                                  </div>

                                  <div>
                                    <h3 className="font-semibold text-sm">Restricciones</h3>
                                    <p>{selectedRecord.restricciones || "Ninguna"}</p>
                                  </div>

                                  <div>
                                    <h3 className="font-semibold text-sm">Médico</h3>
                                    <p>{selectedRecord.medico}</p>
                                  </div>

                                  <div>
                                    <h3 className="font-semibold text-sm">Documentos</h3>
                                    {selectedRecord.documentos.length > 0 ? (
                                      <ul className="list-disc pl-5 space-y-1">
                                        {selectedRecord.documentos.map((doc: string, index: number) => (
                                          <li key={index}>
                                            <a href="#" className="text-blue-600 hover:underline flex items-center">
                                              <FileText className="h-3 w-3 mr-1" />
                                              {doc}
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p>No hay documentos adjuntos</p>
                                    )}
                                  </div>

                                  <div>
                                    <h3 className="font-semibold text-sm">Seguimiento</h3>
                                    {selectedRecord.seguimiento.length > 0 ? (
                                      <div className="border rounded-md p-3 space-y-3">
                                        {selectedRecord.seguimiento.map((seg: any, index: number) => (
                                          <div key={index} className="border-b pb-2 last:border-0 last:pb-0">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                              <Calendar className="h-3 w-3 mr-1" />
                                              {new Date(seg.fecha).toLocaleDateString()}
                                            </div>
                                            <p>{seg.nota}</p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p>No hay registros de seguimiento</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button variant="outline">
                                  <Pencil className="h-4 w-4 mr-1" /> Editar
                                </Button>
                                <Button variant="destructive">
                                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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

        {/* Pestaña de Estadísticas y Reportes */}
        <TabsContent value="estadisticas">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lesiones Activas</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Deportistas con lesiones en recuperación</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recuperados (Último mes)</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Deportistas recuperados en los últimos 30 días</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Condiciones Crónicas</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">Deportistas con condiciones médicas crónicas</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Lesiones</CardTitle>
                <CardDescription>Distribución de lesiones por tipo en los últimos 12 meses</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    Gráfico de distribución de lesiones
                    <p className="text-sm">(Datos de ejemplo)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Lesiones por Grupo</CardTitle>
                <CardDescription>Incidencia de lesiones por grupo de entrenamiento</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    Gráfico de lesiones por grupo
                    <p className="text-sm">(Datos de ejemplo)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
