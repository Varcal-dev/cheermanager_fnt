"use client";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
interface Permiso {
  id: number;
  nombre: string;
  descripcion: string;
  modulo: string;
}

interface Rol {
  id: number;
  nombre: string;
  descripcion?: string;
  usuarios?: any[]; // cámbialo si tienes una estructura para usuarios
  permisos: Permiso[];
}

type ConteoRol = {
  id: number;
  usuariosCount: number;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Rol[]>([]);
  const [selectedRol, setSelectedRol] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchPermiso, setSearchPermiso] = useState("");
  const [conteos, setConteos] = useState<ConteoRol[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        console.log("Obteniendo roles...");
        const res = await axios.get(
          "http://localhost:8080/api/usuario/rol/listar"
        );
        setRoles(res.data);
      } catch (error) {
        console.error("Error al cargar roles", error);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/usuario/rol/listar-con-usuarios")
      .then((res) => setConteos(res.data)) // debe venir con { id, usuariosCount }
      .catch((err) => console.error("Error cargando conteos:", err));
  }, []);

  useEffect(() => {
    const fetchPermisos = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/permisos/listar");
        const data = await res.json();
        setPermisos(data);
      } catch (error) {
        console.error("Error al cargar permisos", error);
      }
    };

    fetchPermisos();
  }, []);

  useEffect(() => {
    const filtered = roles.filter((rol) =>
      rol.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRoles(filtered);
  }, [searchTerm, roles]);

  // Filtrar permisos por término de búsqueda
  const filteredPermisos = permisos.filter((permiso) => {
    return permiso.nombre.toLowerCase().includes(searchPermiso.toLowerCase());
  });

  // Obtener módulos únicos
  const modulos = [...new Set(filteredPermisos.map((p) => p.modulo))];

  // Verificar si un permiso está asignado al rol seleccionado
  const isPermisoAsignado = (permisoId: number): boolean => {
    const rolActual = roles.find((r) => r.id === selectedRol);
    return rolActual?.permisos?.some((p) => p.id === permisoId) ?? false;
  };

  const rolPermisos: Record<number, number[]> = roles.reduce((acc, rol) => {
  acc[rol.id] = rol.permisos.map(p => p.id);
  return acc;
}, {} as Record<number, number[]>);


  const conteoMap = new Map(conteos.map((rol) => [rol.id, rol.usuariosCount]));

  const rolSeleccionado = roles.find((r) => r.id === selectedRol);
  const permisosAgrupados = rolSeleccionado
    ? agruparPermisosPorEntidad(rolSeleccionado.permisos || [])
    : {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Roles y Permisos
          </h1>
          <p className="text-muted-foreground">
            Gestiona los roles y permisos del sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permisos">Permisos</TabsTrigger>
        </TabsList>

        <ProtectedRoute requiredPermission="ver_roles">
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
                      <TableRow
                        key={rol.id}
                        className={selectedRol === rol.id ? "bg-muted" : ""}
                      >
                        <TableCell className="font-medium">
                          {rol.nombre}
                        </TableCell>
                        <TableCell>{rol.descripcion || "N/A"}</TableCell>
                        <TableCell>
                          {conteoMap.get(rol.id) ?? "Desconocido"}
                        </TableCell>
                        <TableCell>{rol.permisos?.length || 0}</TableCell>

                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Pencil className="h-4 w-4 mr-1" /> Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedRol((prev) =>
                                  prev === rol.id ? null : rol.id
                                )
                              }
                            >
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
                  <CardTitle>
                    Permisos del rol:{" "}
                    {/* Asegúrate de encontrar el rol en el estado 'roles' */}
                    {roles.find((r) => r.id === selectedRol)?.nombre}
                  </CardTitle>
                  <CardDescription>
                    Lista de permisos asignados al rol seleccionado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Buscar permisos..."
                    value={searchPermiso}
                    onChange={(e) => setSearchPermiso(e.target.value)}
                    className="mb-4"
                  />
                  {Object.entries(permisosAgrupados).map(
                    ([entidad, permisosDeEntidad]) => {
                      // Filter the permissions within this entity group by the search term
                      const filteredPermisosDeEntidad =
                        permisosDeEntidad.filter(
                          (permiso) =>
                            permiso.nombre
                              .toLowerCase()
                              .includes(searchPermiso.toLowerCase()) ||
                            permiso.descripcion
                              .toLowerCase()
                              .includes(searchPermiso.toLowerCase())
                        );

                      // Don't render the entity heading if no permissions match the search within it
                      if (filteredPermisosDeEntidad.length === 0) return null;

                      return (
                        <div key={entidad} className="space-y-2">
                          {/* Display the entity heading */}
                          <h3 className="font-semibold text-lg capitalize">
                            {entidad.replaceAll("_", " ")}{" "}
                            {/* Format entity name */}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {/* Iterate over the filtered permissions for this entity */}
                            {filteredPermisosDeEntidad.map((permiso) => (
                              <div
                                key={permiso.id}
                                className="flex items-center space-x-2 border rounded-md p-2"
                              >
                                <Checkbox
                                  id={`permiso-${selectedRol}-${permiso.id}`}
                                  checked={isPermisoAsignado(permiso.id)}
                                  disabled
                                  // onCheckedChange={(checked) => handlePermissionChange(selectedRol, permiso.id, checked)}
                                />
                                <label
                                  htmlFor={`permiso-${selectedRol}-${permiso.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                >
                                  {permiso.descripcion}
                                  <span className="block text-xs text-muted-foreground mt-1">
                                    {permiso.nombre}
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </ProtectedRoute>

        <ProtectedRoute requiredPermission="ver_permisos">
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
                      const rolesAsignados = Object.entries(rolPermisos).filter(
                        ([_, permisoIds]) => permisoIds.includes(permiso.id)
                      ).length;

                      return (
                        <TableRow key={permiso.id}>
                          <TableCell className="font-medium">
                            {permiso.nombre}
                          </TableCell>
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
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </ProtectedRoute>
      </Tabs>
    </div>
  );
}

function agruparPermisosPorEntidad(
  permisos: Permiso[]
): Record<string, Permiso[]> {
  const agrupados: Record<string, Permiso[]> = {};

  for (const permiso of permisos) {
    const entidad = getEntidadFromNombre(permiso.nombre);
    if (!agrupados[entidad]) {
      agrupados[entidad] = [];
    }
    agrupados[entidad].push(permiso);
  }

  return agrupados;
}

function getEntidadFromNombre(nombre: string): string {
  // Esta función extrae la "entidad" del nombre del permiso.
  // Si tus nombres son como "ver_evento", la entidad sería "evento".
  const partes = nombre.split("_");
  // Toma todas las partes excepto la primera (la acción)
  const entidadPartes = partes.slice(1);
  // Si hay partes de entidad, únelas con underscore, de lo contrario usa 'otros'
  return entidadPartes.length > 0 && partes.length > 1
    ? entidadPartes.join("_")
    : "otros";
}
