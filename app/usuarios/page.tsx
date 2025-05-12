"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function UsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  const [expandedUsuarios, setExpandedUsuarios] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [rolFiltro, setRolFiltro] = useState<string | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/usuario/listar", {
        withCredentials: true,
      })
      .then((response) => {
        const data = response.data.map((u: any) => {
          const fechaRaw = u.ultimoAcceso
            ? new Date(u.ultimoAcceso)
            : null;

          return {
            id: u.id,
            username: u.username,
            email: u.email,
            rol: u.rolNombre || "Sin Rol",
            ultimo_acceso: u.ultimoAcceso,
            fechaUltimoAcceso: fechaRaw
              ? fechaRaw.toLocaleDateString("es-CO", { dateStyle: "short" })
              : "Sin acceso",
            horaUltimoAcceso: fechaRaw
              ? fechaRaw.toLocaleTimeString("es-CO", { timeStyle: "medium" })
              : "",
            activo: u.activo,
            nombre: u.nombre,
            apellidos: u.apellidos,
            direccion: u.direccion,
            telefono: u.telefono,
            fechaNacimiento: u.fechaNacimiento,
            generoId: u.generoId,
          };
        });
        setUsuarios(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al obtener usuarios:", error);
        setLoading(false);
      });
  }, []);

  const toggleUsuarioExpand = (usuarioId: number) => {
    setExpandedUsuarios((prev) =>
      prev.includes(usuarioId)
        ? prev.filter((id) => id !== usuarioId)
        : [...prev, usuarioId]
    );
  };

  // Obtener roles únicos
  const roles = Array.from(
    new Set(usuarios.map((u) => u.rolNombre || "Sin Rol"))
  );

  // Filtrar usuarios por término de búsqueda, rol y estado activo/inactivo
  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rolNombre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRol = rolFiltro ? usuario.rolNombre === rolFiltro : true;
    const matchesActivo = mostrarInactivos ? true : usuario.activo;

    return matchesSearch && matchesRol && matchesActivo;
  });

  if (loading) {
    return <p className="text-center mt-10">Cargando usuarios...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema
          </p>
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
            <Switch
              id="mostrar-inactivos"
              checked={mostrarInactivos}
              onCheckedChange={setMostrarInactivos}
            />
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
              <DropdownMenuItem onClick={() => setRolFiltro(null)}>
                Todos los roles
              </DropdownMenuItem>
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
                <React.Fragment key={usuario.id}>
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUsuarioExpand(usuario.id)}
                      >
                        {expandedUsuarios.includes(usuario.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {usuario.username}
                    </TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          usuario.rol === "Administrador"
                            ? "default"
                            : usuario.rol === "Director Técnico"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {usuario.rol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {usuario.fechaUltimoAcceso !== "Sin acceso" ? (
                        <>
                          <div>{usuario.fechaUltimoAcceso}</div>
                          <div className="text-sm text-muted-foreground">
                            {usuario.horaUltimoAcceso}
                          </div>
                        </>
                      ) : (
                        "Sin acceso"
                      )}
                    </TableCell>

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
                              <Key className="h-4 w-4 mr-2" /> Cambiar
                              Contraseña
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
                    <TableRow
                      key={`${usuario.id}-details`}
                      className="bg-muted/50"
                    >
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">
                                Información de Usuario
                              </h4>
                              <div className="space-y-2">
                                <div className="grid grid-cols-2">
                                  <span className="text-muted-foreground">
                                    ID:
                                  </span>
                                  <span>{usuario.id}</span>
                                </div>
                                <div className="grid grid-cols-2">
                                  <span className="text-muted-foreground">
                                    Nombre de Usuario:
                                  </span>
                                  <span>{usuario.username}</span>
                                </div>
                                <div className="grid grid-cols-2">
                                  <span className="text-muted-foreground">
                                    Email:
                                  </span>
                                  <span>{usuario.email}</span>
                                </div>
                                <div className="grid grid-cols-2">
                                  <span className="text-muted-foreground">
                                    Rol:
                                  </span>
                                  <span>{usuario.rolNombre}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">
                                Acciones Rápidas
                              </h4>
                              <div className="space-y-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full justify-start"
                                >
                                  <Key className="h-4 w-4 mr-2" /> Cambiar
                                  Contraseña
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full justify-start"
                                >
                                  <Shield className="h-4 w-4 mr-2" /> Gestionar
                                  Permisos
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full justify-start"
                                >
                                  <Lock className="h-4 w-4 mr-2" /> Ver
                                  Historial de Acceso
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
