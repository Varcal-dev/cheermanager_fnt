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
  Filter,
  Download,
  Search,
  Lock,
  Shield,
  UserCog,
  Eye,
  EyeOff,
  Key,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Datos de ejemplo para usuarios
const usuarios = [
  {
    id: 1,
    username: "admin",
    email: "admin@cheergym.com",
    rol: "Administrador",
    ultimo_acceso: "2024-04-25T10:30:00",
    activo: true,
  },
  {
    id: 2,
    username: "entrenador1",
    email: "ana.garcia@cheergym.com",
    rol: "Entrenador",
    ultimo_acceso: "2024-04-24T15:45:00",
    activo: true,
  },
  {
    id: 3,
    username: "entrenador2",
    email: "carlos.rodriguez@cheergym.com",
    rol: "Entrenador",
    ultimo_acceso: "2024-04-25T09:15:00",
    activo: true,
  },
  {
    id: 4,
    username: "recepcion",
    email: "recepcion@cheergym.com",
    rol: "Recepcionista",
    ultimo_acceso: "2024-04-25T08:00:00",
    activo: true,
  },
  {
    id: 5,
    username: "contabilidad",
    email: "contabilidad@cheergym.com",
    rol: "Contabilidad",
    ultimo_acceso: "2024-04-23T14:20:00",
    activo: true,
  },
  {
    id: 6,
    username: "entrenador3",
    email: "laura.martinez@cheergym.com",
    rol: "Entrenador",
    ultimo_acceso: "2024-04-20T16:30:00",
    activo: false,
  },
]

export default function UsuariosPage() {
  const [expandedUsuarios, setExpandedUsuarios] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [rolFiltro, setRolFiltro] = useState<string | null>(null)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  const toggleUsuarioExpand = (usuarioId: number) => {
    setExpandedUsuarios((prev) =>
      prev.includes(usuarioId) ? prev.filter((id) => id !== usuarioId) : [...prev, usuarioId],
    )
  }

  // Obtener roles únicos
  const roles = Array.from(new Set(usuarios.map((u) => u.rol)))

  // Filtrar usuarios por término de búsqueda, rol y estado activo/inactivo
  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rol.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRol = rolFiltro ? usuario.rol === rolFiltro : true
    const matchesActivo = mostrarInactivos ? true : usuario.activo

    return matchesSearch && matchesRol && matchesActivo
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      <div className="flex justify-between mb-4">
        <div className="flex items-center space-x-2 w-full max-w-sm">
          <Input
            placeholder="Buscar usuarios..."
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {rolFiltro || "Filtrar por Rol"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRolFiltro(null)}>Todos los roles</DropdownMenuItem>
              {roles.map((rol) => (
                <DropdownMenuItem key={rol} onClick={() => setRolFiltro(rol)}>
                  {rol}
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
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => (
                <>
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleUsuarioExpand(usuario.id)}>
                        {expandedUsuarios.includes(usuario.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{usuario.username}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          usuario.rol === "Administrador"
                            ? "default"
                            : usuario.rol === "Entrenador"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {usuario.rol}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(usuario.ultimo_acceso).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={usuario.activo ? "default" : "secondary"}>
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <UserCog className="h-4 w-4 mr-1" /> Acciones
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Key className="h-4 w-4 mr-2" /> Cambiar Contraseña
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="h-4 w-4 mr-2" /> Cambiar Rol
                            </DropdownMenuItem>
                            {usuario.activo ? (
                              <DropdownMenuItem>
                                <EyeOff className="h-4 w-4 mr-2" /> Desactivar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" /> Activar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedUsuarios.includes(usuario.id) && (
                    <TableRow key={`${usuario.id}-details`} className="bg-muted/50">
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Información de Usuario</h4>
                              <div className="space-y-2">
                                <div className="grid grid-cols-2">
                                  <span className="text-muted-foreground">ID:</span>
                                  <span>{usuario.id}</span>
                                </div>
                                <div className="grid grid-cols-2">
                                  <span className="text-muted-foreground">Nombre de Usuario:</span>
                                  <span>{usuario.username}</span>
                                </div>
                                <div className="grid grid-cols-2">
                                  <span className="text-muted-foreground">Email:</span>
                                  <span>{usuario.email}</span>
                                </div>
                                <div className="grid grid-cols-2">
                                  <span className="text-muted-foreground">Rol:</span>
                                  <span>{usuario.rol}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Acciones Rápidas</h4>
                              <div className="space-y-2">
                                <Button size="sm" variant="outline" className="w-full justify-start">
                                  <Key className="h-4 w-4 mr-2" /> Cambiar Contraseña
                                </Button>
                                <Button size="sm" variant="outline" className="w-full justify-start">
                                  <Shield className="h-4 w-4 mr-2" /> Gestionar Permisos
                                </Button>
                                <Button size="sm" variant="outline" className="w-full justify-start">
                                  <Lock className="h-4 w-4 mr-2" /> Ver Historial de Acceso
                                </Button>
                              </div>
                            </div>
                          </div>
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
