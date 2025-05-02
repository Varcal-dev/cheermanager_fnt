"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Download, Search, DollarSign } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Datos de ejemplo para planes de pago
const planesPago = [
  {
    id: 1,
    nombre: "Plan Básico",
    descripcion: "Acceso a 2 clases por semana",
    valor_mensual: 120.0,
    fecha_vigencia_inicio: "2024-01-01",
    fecha_vigencia_fin: "2024-12-31",
    activo: true,
    deportistas_inscritos: 45,
  },
  {
    id: 2,
    nombre: "Plan Premium",
    descripcion: "Acceso ilimitado a clases y eventos especiales",
    valor_mensual: 180.0,
    fecha_vigencia_inicio: "2024-01-01",
    fecha_vigencia_fin: "2024-12-31",
    activo: true,
    deportistas_inscritos: 28,
  },
  {
    id: 3,
    nombre: "Plan Competencia",
    descripcion: "Acceso ilimitado a clases y entrenamiento para competencias",
    valor_mensual: 220.0,
    fecha_vigencia_inicio: "2024-01-01",
    fecha_vigencia_fin: "2024-12-31",
    activo: true,
    deportistas_inscritos: 15,
  },
  {
    id: 4,
    nombre: "Plan Familiar",
    descripcion: "Descuento para familias con 2 o más deportistas",
    valor_mensual: 100.0,
    fecha_vigencia_inicio: "2024-01-01",
    fecha_vigencia_fin: "2024-12-31",
    activo: true,
    deportistas_inscritos: 32,
  },
  {
    id: 5,
    nombre: "Plan Verano",
    descripcion: "Plan especial para temporada de verano",
    valor_mensual: 150.0,
    fecha_vigencia_inicio: "2024-06-01",
    fecha_vigencia_fin: "2024-08-31",
    activo: false,
    deportistas_inscritos: 0,
  },
]

export default function PlanesPagoPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  // Filtrar planes por término de búsqueda y estado activo/inactivo
  const filteredPlanes = planesPago.filter((plan) => {
    const matchesSearch =
      plan.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.descripcion.toLowerCase().includes(searchTerm.toLowerCase())

    if (!mostrarInactivos) {
      return matchesSearch && plan.activo
    }
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planes de Pago</h1>
          <p className="text-muted-foreground">Gestiona los planes de pago disponibles para los deportistas</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
        </Button>
      </div>

      <div className="flex justify-between mb-4">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <Input
            placeholder="Buscar planes..."
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
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Valor Mensual</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Deportistas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlanes.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.nombre}</TableCell>
                  <TableCell>{plan.descripcion}</TableCell>
                  <TableCell>${plan.valor_mensual.toFixed(2)}</TableCell>
                  <TableCell>
                    {new Date(plan.fecha_vigencia_inicio).toLocaleDateString()} -{" "}
                    {new Date(plan.fecha_vigencia_fin).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{plan.deportistas_inscritos}</TableCell>
                  <TableCell>
                    <Badge variant={plan.activo ? "default" : "secondary"}>{plan.activo ? "Activo" : "Inactivo"}</Badge>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total de Planes</CardTitle>
            <CardDescription>Planes de pago registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{planesPago.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {planesPago.filter((p) => p.activo).length} activos, {planesPago.filter((p) => !p.activo).length}{" "}
              inactivos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Deportistas Inscritos</CardTitle>
            <CardDescription>Total de inscripciones activas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {planesPago.reduce((total, plan) => total + plan.deportistas_inscritos, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">En todos los planes activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ingreso Mensual Estimado</CardTitle>
            <CardDescription>Basado en inscripciones actuales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              $
              {planesPago
                .reduce((total, plan) => total + plan.valor_mensual * plan.deportistas_inscritos, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <DollarSign className="inline h-3 w-3" /> Sin considerar descuentos aplicados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
