"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Calendar, ArrowUpDown, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Datos de ejemplo para registros de auditoría
const registrosAuditoria = [
  {
    id: 1,
    usuario: "admin",
    tabla_afectada: "usuarios",
    accion: "INSERT",
    registro_id: 6,
    fecha: "2024-04-20T14:30:00",
    ip_usuario: "192.168.1.100",
    modulo: "Usuarios",
  },
  {
    id: 2,
    usuario: "admin",
    tabla_afectada: "roles_permisos",
    accion: "UPDATE",
    registro_id: 2,
    fecha: "2024-04-20T14:35:00",
    ip_usuario: "192.168.1.100",
    modulo: "Usuarios",
  },
  {
    id: 3,
    usuario: "entrenador1",
    tabla_afectada: "deportistas",
    accion: "INSERT",
    registro_id: 15,
    fecha: "2024-04-21T10:15:00",
    ip_usuario: "192.168.1.101",
    modulo: "Deportistas",
  },
  {
    id: 4,
    usuario: "entrenador1",
    tabla_afectada: "evaluaciones",
    accion: "INSERT",
    registro_id: 45,
    fecha: "2024-04-21T11:20:00",
    ip_usuario: "192.168.1.101",
    modulo: "Evaluaciones",
  },
  {
    id: 5,
    usuario: "recepcion",
    tabla_afectada: "pagos",
    accion: "INSERT",
    registro_id: 120,
    fecha: "2024-04-22T09:45:00",
    ip_usuario: "192.168.1.102",
    modulo: "Finanzas",
  },
  {
    id: 6,
    usuario: "contabilidad",
    tabla_afectada: "facturas",
    accion: "UPDATE",
    registro_id: 85,
    fecha: "2024-04-22T14:10:00",
    ip_usuario: "192.168.1.103",
    modulo: "Finanzas",
  },
  {
    id: 7,
    usuario: "admin",
    tabla_afectada: "usuarios",
    accion: "UPDATE",
    registro_id: 4,
    fecha: "2024-04-23T16:20:00",
    ip_usuario: "192.168.1.100",
    modulo: "Usuarios",
  },
  {
    id: 8,
    usuario: "entrenador2",
    tabla_afectada: "asistencias",
    accion: "INSERT",
    registro_id: 230,
    fecha: "2024-04-24T17:30:00",
    ip_usuario: "192.168.1.104",
    modulo: "Asistencias",
  },
  {
    id: 9,
    usuario: "admin",
    tabla_afectada: "usuarios",
    accion: "DELETE",
    registro_id: 7,
    fecha: "2024-04-25T11:15:00",
    ip_usuario: "192.168.1.100",
    modulo: "Usuarios",
  },
  {
    id: 10,
    usuario: "recepcion",
    tabla_afectada: "deportistas",
    accion: "UPDATE",
    registro_id: 12,
    fecha: "2024-04-25T12:40:00",
    ip_usuario: "192.168.1.102",
    modulo: "Deportistas",
  },
]

// Datos de ejemplo para detalles de cambios
const detallesCambios = {
  1: {
    valores_anteriores: null,
    nuevos_valores: {
      username: "entrenador3",
      email: "laura.martinez@cheergym.com",
      rol_id: 2,
      activo: true,
    },
  },
  2: {
    valores_anteriores: {
      permisos: [9, 10, 13, 14],
    },
    nuevos_valores: {
      permisos: [9, 10, 11, 13, 14, 15],
    },
  },
  7: {
    valores_anteriores: {
      activo: false,
    },
    nuevos_valores: {
      activo: true,
    },
  },
  9: {
    valores_anteriores: {
      username: "usuario_prueba",
      email: "prueba@cheergym.com",
      rol_id: 3,
      activo: true,
    },
    nuevos_valores: null,
  },
}

export default function AuditoriaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [moduloFiltro, setModuloFiltro] = useState<string | null>(null)
  const [accionFiltro, setAccionFiltro] = useState<string | null>(null)
  const [usuarioFiltro, setUsuarioFiltro] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "ascending" | "descending"
  } | null>(null)
  const [selectedRegistro, setSelectedRegistro] = useState<number | null>(null)

  // Función para ordenar registros
  const sortRegistros = (key: string) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })
  }

  // Aplicar ordenamiento a los registros
  const sortedRegistros = [...registrosAuditoria].sort((a, b) => {
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key as keyof typeof a]
    const bValue = b[sortConfig.key as keyof typeof b]

    if (aValue < bValue) {
      return sortConfig.direction === "ascending" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === "ascending" ? 1 : -1
    }
    return 0
  })

  // Obtener módulos únicos
  const modulos = Array.from(new Set(registrosAuditoria.map((r) => r.modulo)))

  // Obtener usuarios únicos
  const usuarios = Array.from(new Set(registrosAuditoria.map((r) => r.usuario)))

  // Obtener acciones únicas
  const acciones = Array.from(new Set(registrosAuditoria.map((r) => r.accion)))

  // Filtrar registros por término de búsqueda y filtros
  const filteredRegistros = sortedRegistros.filter((registro) => {
    const matchesSearch =
      registro.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.tabla_afectada.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.ip_usuario.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesModulo = moduloFiltro ? registro.modulo === moduloFiltro : true
    const matchesAccion = accionFiltro ? registro.accion === accionFiltro : true
    const matchesUsuario = usuarioFiltro ? registro.usuario === usuarioFiltro : true

    return matchesSearch && matchesModulo && matchesAccion && matchesUsuario
  })

  // Obtener detalles de un registro
  const getDetallesRegistro = (registroId: number) => {
    return detallesCambios[registroId as keyof typeof detallesCambios] || null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoría</h1>
          <p className="text-muted-foreground">Registro de actividades y cambios en el sistema</p>
        </div>
      </div>

      <Tabs defaultValue="registros" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="registros">Registros de Auditoría</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center space-x-2 w-full max-w-sm">
              <Input
                placeholder="Buscar registros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={moduloFiltro || "all"}
                onValueChange={(value) => setModuloFiltro(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {modulos.map((modulo) => (
                    <SelectItem key={modulo} value={modulo}>
                      {modulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={accionFiltro || "all"}
                onValueChange={(value) => setAccionFiltro(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {acciones.map((accion) => (
                    <SelectItem key={accion} value={accion}>
                      {accion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={usuarioFiltro || "all"}
                onValueChange={(value) => setUsuarioFiltro(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario} value={usuario}>
                      {usuario}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Rango de Fechas
              </Button>
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
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortRegistros("id")}>
                        ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortRegistros("usuario")}>
                        Usuario
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortRegistros("tabla_afectada")}>
                        Tabla
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortRegistros("accion")}>
                        Acción
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center cursor-pointer" onClick={() => sortRegistros("fecha")}>
                        Fecha
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistros.map((registro) => (
                    <TableRow key={registro.id} className={selectedRegistro === registro.id ? "bg-muted" : ""}>
                      <TableCell>{registro.id}</TableCell>
                      <TableCell>{registro.usuario}</TableCell>
                      <TableCell>{registro.tabla_afectada}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            registro.accion === "INSERT"
                              ? "default"
                              : registro.accion === "UPDATE"
                                ? "outline"
                                : "destructive"
                          }
                        >
                          {registro.accion}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(registro.fecha).toLocaleString()}</TableCell>
                      <TableCell>{registro.ip_usuario}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRegistro(selectedRegistro === registro.id ? null : registro.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedRegistro && (
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Registro #{selectedRegistro}</CardTitle>
                <CardDescription>Información detallada sobre los cambios realizados</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const registro = registrosAuditoria.find((r) => r.id === selectedRegistro)
                  const detalles = getDetallesRegistro(registro?.id || 0)

                  if (!registro || !detalles) {
                    return <div className="text-muted-foreground">No hay detalles disponibles para este registro</div>
                  }

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold mb-2">Información del Registro</h3>
                          <div className="space-y-2">
                            <div className="grid grid-cols-2">
                              <span className="text-muted-foreground">ID:</span>
                              <span>{registro.id}</span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-muted-foreground">Usuario:</span>
                              <span>{registro.usuario}</span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-muted-foreground">Tabla:</span>
                              <span>{registro.tabla_afectada}</span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-muted-foreground">Acción:</span>
                              <span>{registro.accion}</span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-muted-foreground">Fecha:</span>
                              <span>{new Date(registro.fecha).toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-2">
                              <span className="text-muted-foreground">IP:</span>
                              <span>{registro.ip_usuario}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">Cambios Realizados</h3>
                          <div className="space-y-4">
                            {detalles.valores_anteriores && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Valores Anteriores:</h4>
                                <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-auto">
                                  {JSON.stringify(detalles.valores_anteriores, null, 2)}
                                </pre>
                              </div>
                            )}
                            {detalles.nuevos_valores && (
                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground">Nuevos Valores:</h4>
                                <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-auto">
                                  {JSON.stringify(detalles.nuevos_valores, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total de Registros</CardTitle>
                <CardDescription>Actividad registrada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{registrosAuditoria.length}</div>
                <p className="text-xs text-muted-foreground mt-1">En los últimos 30 días</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Usuario Más Activo</CardTitle>
                <CardDescription>Mayor número de acciones</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const usuariosCount = registrosAuditoria.reduce(
                    (acc, registro) => {
                      acc[registro.usuario] = (acc[registro.usuario] || 0) + 1
                      return acc
                    },
                    {} as Record<string, number>,
                  )

                  const usuarioMasActivo = Object.entries(usuariosCount).sort((a, b) => b[1] - a[1])[0]

                  return (
                    <>
                      <div className="text-3xl font-bold">{usuarioMasActivo[0]}</div>
                      <p className="text-xs text-muted-foreground mt-1">{usuarioMasActivo[1]} acciones registradas</p>
                    </>
                  )
                })()}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Módulo Más Activo</CardTitle>
                <CardDescription>Mayor número de cambios</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const modulosCount = registrosAuditoria.reduce(
                    (acc, registro) => {
                      acc[registro.modulo] = (acc[registro.modulo] || 0) + 1
                      return acc
                    },
                    {} as Record<string, number>,
                  )

                  const moduloMasActivo = Object.entries(modulosCount).sort((a, b) => b[1] - a[1])[0]

                  return (
                    <>
                      <div className="text-3xl font-bold">{moduloMasActivo[0]}</div>
                      <p className="text-xs text-muted-foreground mt-1">{moduloMasActivo[1]} cambios registrados</p>
                    </>
                  )
                })()}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribución de Acciones</CardTitle>
              <CardDescription>Tipos de acciones realizadas en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {acciones.map((accion) => {
                  const count = registrosAuditoria.filter((r) => r.accion === accion).length
                  const percentage = Math.round((count / registrosAuditoria.length) * 100)

                  return (
                    <Card key={accion}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <Badge
                            variant={accion === "INSERT" ? "default" : accion === "UPDATE" ? "outline" : "destructive"}
                          >
                            {accion}
                          </Badge>
                          <span className="text-2xl font-bold">{count}</span>
                        </div>
                        <div className="mt-2 w-full bg-muted rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">{percentage}% del total</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
