"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search, DollarSign, Building } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Datos de ejemplo para descuentos
const descuentos = [
  {
    id: 1,
    nombre: "Descuento por Hermanos",
    descripcion: "10% de descuento para el segundo hermano inscrito",
    porcentaje: 10.0,
    fecha_inicio: "2024-01-01",
    fecha_fin: "2024-12-31",
    activo: true,
    aplicaciones: 15,
  },
  {
    id: 2,
    nombre: "Descuento por Pago Anual",
    descripcion: "15% de descuento por pago anual anticipado",
    porcentaje: 15.0,
    fecha_inicio: "2024-01-01",
    fecha_fin: "2024-12-31",
    activo: true,
    aplicaciones: 8,
  },
  {
    id: 3,
    nombre: "Descuento para Deportistas Destacados",
    descripcion: "20% de descuento para deportistas con logros destacados",
    porcentaje: 20.0,
    fecha_inicio: "2024-01-01",
    fecha_fin: "2024-12-31",
    activo: true,
    aplicaciones: 5,
  },
  {
    id: 4,
    nombre: "Promoción Inscripción",
    descripcion: "50% en la primera mensualidad para nuevos deportistas",
    porcentaje: 50.0,
    fecha_inicio: "2024-03-01",
    fecha_fin: "2024-04-30",
    activo: false,
    aplicaciones: 12,
  },
]

// Datos de ejemplo para convenios
const convenios = [
  {
    id: 1,
    nombre_empresa: "Colegio San Patricio",
    descuento_id: 1,
    descuento_nombre: "Descuento Colegio San Patricio",
    porcentaje: 15.0,
    fecha_inicio: "2024-01-01",
    fecha_fin: "2024-12-31",
    deportistas_beneficiados: 8,
  },
  {
    id: 2,
    nombre_empresa: "Club Deportivo Municipal",
    descuento_id: 2,
    descuento_nombre: "Descuento Club Deportivo",
    porcentaje: 10.0,
    fecha_inicio: "2024-01-01",
    fecha_fin: "2024-12-31",
    deportistas_beneficiados: 5,
  },
  {
    id: 3,
    nombre_empresa: "Empresa XYZ",
    descuento_id: 3,
    descuento_nombre: "Descuento Corporativo",
    porcentaje: 12.0,
    fecha_inicio: "2024-01-01",
    fecha_fin: "2024-12-31",
    deportistas_beneficiados: 3,
  },
]

export default function DescuentosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  // Filtrar descuentos por término de búsqueda y estado activo/inactivo
  const filteredDescuentos = descuentos.filter((descuento) => {
    const matchesSearch =
      descuento.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descuento.descripcion.toLowerCase().includes(searchTerm.toLowerCase())

    if (!mostrarInactivos) {
      return matchesSearch && descuento.activo
    }
    return matchesSearch
  })

  // Filtrar convenios por término de búsqueda
  const filteredConvenios = convenios.filter((convenio) => {
    return (
      convenio.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      convenio.descuento_nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Descuentos</h1>
          <p className="text-muted-foreground">Gestiona los descuentos para las Inscripciones</p>
        </div>
      </div>

      <Tabs defaultValue="descuentos" className="w-full">

        <TabsContent value="descuentos" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 w-full max-w-sm">
              <Input
                placeholder="Buscar descuentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex space-x-4 items-center">
              <div className="flex items-center space-x-2">
                <Switch id="mostrar-inactivos" checked={mostrarInactivos} onCheckedChange={setMostrarInactivos} />
                <Label htmlFor="mostrar-inactivos">Mostrar inactivos</Label>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Descuento
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Porcentaje</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Aplicaciones</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDescuentos.map((descuento) => (
                    <TableRow key={descuento.id}>
                      <TableCell className="font-medium">{descuento.nombre}</TableCell>
                      <TableCell>{descuento.descripcion}</TableCell>
                      <TableCell>{descuento.porcentaje}%</TableCell>
                      <TableCell>
                        {new Date(descuento.fecha_inicio).toLocaleDateString()} -{" "}
                        {new Date(descuento.fecha_fin).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{descuento.aplicaciones}</TableCell>
                      <TableCell>
                        <Badge variant={descuento.activo ? "default" : "secondary"}>
                          {descuento.activo ? "Activo" : "Inactivo"}
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
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total de Descuentos</CardTitle>
            <CardDescription>Descuentos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{descuentos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {descuentos.filter((d) => d.activo).length} activos, {descuentos.filter((d) => !d.activo).length}{" "}
              inactivos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Aplicaciones de Descuentos</CardTitle>
            <CardDescription>Total de descuentos aplicados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {descuentos.reduce((total, descuento) => total + descuento.aplicaciones, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <DollarSign className="inline h-3 w-3" /> En todos los descuentos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
