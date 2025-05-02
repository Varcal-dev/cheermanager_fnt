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
          <h1 className="text-3xl font-bold tracking-tight"> Convenios</h1>
          <p className="text-muted-foreground">Gestiona los convenios con otras instituciones</p>
        </div>
      </div>

      <Tabs defaultValue="convenios" className="w-full">

        <TabsContent value="convenios" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 w-full max-w-sm">
              <Input
                placeholder="Buscar convenios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Convenio
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa/Institución</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Porcentaje</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Beneficiados</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConvenios.map((convenio) => (
                    <TableRow key={convenio.id}>
                      <TableCell className="font-medium">{convenio.nombre_empresa}</TableCell>
                      <TableCell>{convenio.descuento_nombre}</TableCell>
                      <TableCell>{convenio.porcentaje}%</TableCell>
                      <TableCell>
                        {new Date(convenio.fecha_inicio).toLocaleDateString()} -{" "}
                        {new Date(convenio.fecha_fin).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{convenio.deportistas_beneficiados}</TableCell>
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
            <CardTitle className="text-lg">Total de Convenios</CardTitle>
            <CardDescription>Convenios con instituciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{convenios.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Building className="inline h-3 w-3" /> Con{" "}
              {convenios.reduce((total, convenio) => total + convenio.deportistas_beneficiados, 0)} deportistas
              beneficiados
            </p>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}
