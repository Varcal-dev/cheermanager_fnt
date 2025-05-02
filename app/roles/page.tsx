"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

// Datos de ejemplo para roles
const roles = [
  {
    id: 1,
    nombre: "Administrador",
    descripcion: "Acceso completo al sistema",
    usuarios: 1,
    permisos: 25,
  },
  {
    id: 2,
    nombre: "Entrenador",
    descripcion: "Gestión de deportistas, grupos y evaluaciones",
    usuarios: 3,
    permisos: 15,
  },
  {
    id: 3,
    nombre: "Recepcionista",
    descripcion: "Gestión de pagos y asistencias",
    usuarios: 1,
    permisos: 10,
  },
  {
    id: 4,
    nombre: "Contabilidad",
    descripcion: "Gestión financiera y reportes",
    usuarios: 1,
    permisos: 8,
  },
]

// Datos de ejemplo para permisos
const permisos = [
  { id: 1, nombre: "usuarios.ver", descripcion: "Ver usuarios", modulo: "Usuarios" },
  { id: 2, nombre: "usuarios.crear", descripcion: "Crear usuarios", modulo: "Usuarios" },
  { id: 3, nombre: "usuarios.editar", descripcion: "Editar usuarios", modulo: "Usuarios" },
  { id: 4, nombre: "usuarios.eliminar", descripcion: "Eliminar usuarios", modulo: "Usuarios" },
  { id: 5, nombre: "roles.ver", descripcion: "Ver roles", modulo: "Usuarios" },
  { id: 6, nombre: "roles.crear", descripcion: "Crear roles", modulo: "Usuarios" },
  { id: 7, nombre: "roles.editar", descripcion: "Editar roles", modulo: "Usuarios" },
  { id: 8, nombre: "roles.eliminar", descripcion: "Eliminar roles", modulo: "Usuarios" },
  { id: 9, nombre: "deportistas.ver", descripcion: "Ver deportistas", modulo: "Deportistas" },
  { id: 10, nombre: "deportistas.crear", descripcion: "Crear deportistas", modulo: "Deportistas" },
  { id: 11, nombre: "deportistas.editar", descripcion: "Editar deportistas", modulo: "Deportistas" },
  { id: 12, nombre: "deportistas.eliminar", descripcion: "Eliminar deportistas", modulo: "Deportistas" },
  { id: 13, nombre: "grupos.ver", descripcion: "Ver grupos", modulo: "Grupos" },
  { id: 14, nombre: "grupos.crear", descripcion: "Crear grupos", modulo: "Grupos" },
  { id: 15, nombre: "grupos.editar", descripcion: "Editar grupos", modulo: "Grupos" },
  { id: 16, nombre: "grupos.eliminar", descripcion: "Eliminar grupos", modulo: "Grupos" },
  { id: 17, nombre: "pagos.ver", descripcion: "Ver pagos", modulo: "Finanzas" },
  { id: 18, nombre: "pagos.crear", descripcion: "Crear pagos", modulo: "Finanzas" },
  { id: 19, nombre: "pagos.editar", descripcion: "Editar pagos", modulo: "Finanzas" },
  { id: 20, nombre: "facturas.ver", descripcion: "Ver facturas", modulo: "Finanzas" },
  { id: 21, nombre: "facturas.crear", descripcion: "Crear facturas", modulo: "Finanzas" },
  { id: 22, nombre: "facturas.editar", descripcion: "Editar facturas", modulo: "Finanzas" },
  { id: 23, nombre: "reportes.ver", descripcion: "Ver reportes", modulo: "Reportes" },
  { id: 24, nombre: "reportes.exportar", descripcion: "Exportar reportes", modulo: "Reportes" },
  { id: 25, nombre: "auditoria.ver", descripcion: "Ver auditoría", modulo: "Auditoría" },
]

// Datos de ejemplo para permisos por rol
const rolPermisos = {
  1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25], // Administrador
  2: [9, 10, 11, 13, 14, 15], // Entrenador
  3: [9, 13, 17, 18, 20, 21], // Recepcionista
  4: [17, 18, 19, 20, 21, 22, 23, 24], // Contabilidad
}

export default function RolesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRol, setSelectedRol] = useState<number | null>(null)
  const [searchPermiso, setSearchPermiso] = useState("")

  // Filtrar roles por término de búsqueda
  const filteredRoles = roles.filter((rol) => {
    return (
      rol.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rol.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Obtener módulos únicos
  const modulos = Array.from(new Set(permisos.map((p) => p.modulo)))

  // Filtrar permisos por término de búsqueda
  const filteredPermisos = permisos.filter((permiso) => {
    return (
      permiso.nombre.toLowerCase().includes(searchPermiso.toLowerCase()) ||
      permiso.descripcion.toLowerCase().includes(searchPermiso.toLowerCase()) ||
      permiso.modulo.toLowerCase().includes(searchPermiso.toLowerCase())
    )
  })

  // Verificar si un permiso está asignado al rol seleccionado
  const isPermisoAsignado = (permisoId: number) => {
    if (!selectedRol) return false
    return rolPermisos[selectedRol as keyof typeof rolPermisos]?.includes(permisoId) || false
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles y Permisos</h1>
          <p className="text-muted-foreground">Gestiona los roles y permisos del sistema</p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permisos">Permisos</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 w-full max-w-sm">
              <Input
                placeholder="Buscar roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Usuarios</TableHead>
                    <TableHead>Permisos</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((rol) => (
                    <TableRow key={rol.id} className={selectedRol === rol.id ? "bg-muted" : ""}>
                      <TableCell className="font-medium">{rol.nombre}</TableCell>
                      <TableCell>{rol.descripcion}</TableCell>
                      <TableCell>{rol.usuarios}</TableCell>
                      <TableCell>{rol.permisos}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedRol(rol.id)}>
                            <Shield className="h-4 w-4 mr-1" /> Permisos
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

          {selectedRol && (
            <Card>
              <CardHeader>
                <CardTitle>Permisos del Rol: {roles.find((r) => r.id === selectedRol)?.nombre}</CardTitle>
                <CardDescription>Gestiona los permisos asignados a este rol</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div className="flex items-center space-x-2 w-full max-w-sm">
                    <Input
                      placeholder="Buscar permisos..."
                      value={searchPermiso}
                      onChange={(e) => setSearchPermiso(e.target.value)}
                      className="h-9"
                    />
                    <Button variant="outline" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button>Guardar Cambios</Button>
                </div>

                <div className="space-y-6">
                  {modulos.map((modulo) => (
                    <div key={modulo} className="space-y-2">
                      <h3 className="font-semibold text-lg">{modulo}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {filteredPermisos
                          .filter((p) => p.modulo === modulo)
                          .map((permiso) => (
                            <div key={permiso.id} className="flex items-center space-x-2 border rounded-md p-2">
                              <Checkbox id={`permiso-${permiso.id}`} checked={isPermisoAsignado(permiso.id)} />
                              <label
                                htmlFor={`permiso-${permiso.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                              >
                                {permiso.descripcion}
                                <span className="block text-xs text-muted-foreground mt-1">{permiso.nombre}</span>
                              </label>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="permisos" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 w-full max-w-sm">
              <Input
                placeholder="Buscar permisos..."
                value={searchPermiso}
                onChange={(e) => setSearchPermiso(e.target.value)}
                className="h-9"
              />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Permiso
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Roles Asignados</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermisos.map((permiso) => {
                    // Contar cuántos roles tienen este permiso
                    const rolesAsignados = Object.entries(rolPermisos).filter(([_, permisoIds]) =>
                      permisoIds.includes(permiso.id),
                    ).length

                    return (
                      <TableRow key={permiso.id}>
                        <TableCell className="font-medium">{permiso.nombre}</TableCell>
                        <TableCell>{permiso.descripcion}</TableCell>
                        <TableCell>{permiso.modulo}</TableCell>
                        <TableCell>{rolesAsignados}</TableCell>
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
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
