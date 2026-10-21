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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { api, getErrorMessage } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { toast } from "react-toastify";
import { CrearRolForm } from "@/app/components/Forms/CrearRolForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

// Permisos reservados a la plataforma (superadmin). El back rechaza asignarlos a un rol de un club
// (RolesPlantilla.SOLO_PLATAFORMA); aquí se ocultan para que el admin del club no los vea ni intente.
const PERMISOS_SOLO_PLATAFORMA = [
  "gestionar_clubes",
  "gestionar_catalogos",
  "configurar_rubrica",
  "administrar_roles",
  "administrar_permisos",
  "configurar_sistema",
  "gestionar_parametros",
  "importar_datos",
  "exportar_datos",
  "ver_dashboard_global",
  "ver_logs_sistema",
];

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
  usuarios?: any[];
  permisos: Permiso[];
}

type ConteoRol = {
  id: number;
  usuariosCount: number;
};

export default function RolesPage() {
  const { permissions, esPlataforma } = useUser();
  const puedeGestionarRoles = permissions.includes("gestionar_roles");
  const puedeAsignarPermisos = permissions.includes("asignar_permiso");
  // Crear/editar/borrar permisos (catálogo global) ahora es solo de la plataforma.
  const puedeGestionarCatalogo = permissions.includes("gestionar_catalogos");
  const [roles, setRoles] = useState<Rol[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Rol[]>([]);
  const [selectedRol, setSelectedRol] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rolToDelete, setRolToDelete] = useState<Rol | null>(null);
  const [guardandoPermiso, setGuardandoPermiso] = useState(false);

  const [searchPermiso, setSearchPermiso] = useState("");
  const [conteos, setConteos] = useState<ConteoRol[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [openCrearRol, setOpenCrearRol] = useState(false);

  // --- Editar rol (antes el botón "Editar" no tenía onClick) ---
  const [rolEnEdicion, setRolEnEdicion] = useState<Rol | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [guardandoRol, setGuardandoRol] = useState(false);

  // --- CRUD de Permisos (antes "Nuevo/Editar/Eliminar" no tenían onClick) ---
  const [permisoEnEdicion, setPermisoEnEdicion] = useState<Permiso | "nuevo" | null>(null);
  const [formPermiso, setFormPermiso] = useState({ nombre: "", descripcion: "", modulo: "" });
  const [permisoAEliminar, setPermisoAEliminar] = useState<Permiso | null>(null);
  const [guardandoPermisoForm, setGuardandoPermisoForm] = useState(false);

  const fetchRoles = async () => {
    try {
      const res = await api.get("/api/roles");
      setRoles(res.data);
    } catch (error) {
      console.error("Error al cargar roles", error);
      toast.error("No se pudieron cargar los roles");
    }
  };

  const fetchConteos = async () => {
    try {
      const res = await api.get("/api/usuario/rol/listar-con-usuarios");
      setConteos(res.data);
    } catch (error) {
      console.error("Error cargando conteos:", error);
    }
  };

  const fetchPermisos = async () => {
    try {
      const res = await api.get("/api/permisos/listar");
      setPermisos(res.data);
    } catch (error) {
      console.error("Error al cargar permisos", error);
      toast.error("No se pudieron cargar los permisos");
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchConteos();
    fetchPermisos();
  }, []);

  useEffect(() => {
    const filtered = roles.filter((rol) =>
      rol.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredRoles(filtered);
  }, [searchTerm, roles]);

  const handleRolCreated = () => {
    fetchRoles();
    fetchConteos();
  };

  const deleteRol = async (id: number) => {
    try {
      await api.delete(`/api/roles/${id}`);
      toast.success("Rol eliminado");
      if (selectedRol === id) setSelectedRol(null);
      fetchRoles();
      fetchConteos();
    } catch (error) {
      console.error("Error al eliminar rol", error);
      toast.error(getErrorMessage(error, "No se pudo eliminar el rol"));
    }
  };

  const handleConfirmDelete = () => {
    if (rolToDelete) {
      deleteRol(rolToDelete.id);
      setIsDeleteModalOpen(false);
      setRolToDelete(null);
    }
  };

  const abrirEdicionRol = (rol: Rol) => {
    setRolEnEdicion(rol);
    setEditNombre(rol.nombre);
    setEditDescripcion(rol.descripcion ?? "");
  };

  const guardarEdicionRol = async () => {
    if (!rolEnEdicion) return;
    setGuardandoRol(true);
    try {
      await api.put(`/api/roles/${rolEnEdicion.id}`, {
        nombre: editNombre,
        descripcion: editDescripcion,
      });
      toast.success("Rol actualizado");
      setRolEnEdicion(null);
      fetchRoles();
    } catch (error) {
      console.error("Error al actualizar rol", error);
      toast.error(getErrorMessage(error, "No se pudo actualizar el rol"));
    } finally {
      setGuardandoRol(false);
    }
  };

  // El endpoint reemplaza el conjunto completo de permisos del rol, así que
  // togglear un checkbox arma la lista completa (actual +/- el que cambió)
  // y la envía entera.
  const togglePermiso = async (permisoId: number, asignadoActualmente: boolean) => {
    if (!selectedRol) return;
    const rolActual = roles.find((r) => r.id === selectedRol);
    if (!rolActual) return;

    const idsActuales = rolActual.permisos.map((p) => p.id);
    const nuevosIds = asignadoActualmente
      ? idsActuales.filter((id) => id !== permisoId)
      : [...idsActuales, permisoId];

    setGuardandoPermiso(true);
    try {
      const res = await api.post("/api/roles/asignar-permisos", {
        rolId: selectedRol,
        permisoIds: nuevosIds,
      });
      setRoles((prev) => prev.map((r) => (r.id === selectedRol ? res.data : r)));
    } catch (error) {
      console.error("Error al actualizar permisos del rol", error);
      toast.error(getErrorMessage(error, "No se pudo actualizar el permiso"));
    } finally {
      setGuardandoPermiso(false);
    }
  };

  const abrirNuevoPermiso = () => {
    setFormPermiso({ nombre: "", descripcion: "", modulo: "" });
    setPermisoEnEdicion("nuevo");
  };

  const abrirEdicionPermiso = (permiso: Permiso) => {
    setFormPermiso({
      nombre: permiso.nombre,
      descripcion: permiso.descripcion,
      modulo: permiso.modulo,
    });
    setPermisoEnEdicion(permiso);
  };

  const guardarPermiso = async () => {
    if (!formPermiso.nombre.trim()) {
      toast.error("El nombre del permiso es requerido");
      return;
    }
    setGuardandoPermisoForm(true);
    try {
      if (permisoEnEdicion === "nuevo") {
        await api.post("/api/permisos", formPermiso);
        toast.success("Permiso creado");
      } else if (permisoEnEdicion) {
        await api.put(`/api/permisos/${permisoEnEdicion.id}`, formPermiso);
        toast.success("Permiso actualizado");
      }
      setPermisoEnEdicion(null);
      fetchPermisos();
      fetchRoles(); // los permisos embebidos en cada rol pueden haber cambiado de nombre/descripción
    } catch (error) {
      console.error("Error al guardar permiso", error);
      toast.error(getErrorMessage(error, "No se pudo guardar el permiso"));
    } finally {
      setGuardandoPermisoForm(false);
    }
  };

  const eliminarPermiso = async () => {
    if (!permisoAEliminar) return;
    try {
      await api.delete(`/api/permisos/${permisoAEliminar.id}`);
      toast.success("Permiso eliminado");
      setPermisoAEliminar(null);
      fetchPermisos();
      fetchRoles();
    } catch (error) {
      console.error("Error al eliminar permiso", error);
      toast.error(getErrorMessage(error, "No se pudo eliminar el permiso (puede estar en uso)"));
    }
  };

  const filteredPermisos = permisos.filter((permiso) =>
    permiso.nombre.toLowerCase().includes(searchPermiso.toLowerCase()),
  );

  const modulos = [...new Set(filteredPermisos.map((p) => p.modulo))];

  const isPermisoAsignado = (permisoId: number): boolean => {
    const rolActual = roles.find((r) => r.id === selectedRol);
    return rolActual?.permisos?.some((p) => p.id === permisoId) ?? false;
  };

  const rolPermisos: Record<number, number[]> = roles.reduce((acc, rol) => {
    acc[rol.id] = rol.permisos.map((p) => p.id);
    return acc;
  }, {} as Record<number, number[]>);

  const conteoMap = new Map(conteos.map((rol) => [rol.id, rol.usuariosCount]));

  const rolSeleccionado = roles.find((r) => r.id === selectedRol);
  const permisosAsignables = esPlataforma
    ? permisos
    : permisos.filter((p) => !PERMISOS_SOLO_PLATAFORMA.includes(p.nombre));
  const permisosAgrupados = agruparPermisosPorEntidad(permisosAsignables);

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">
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
              <div className="relative flex items-center w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
              {puedeGestionarRoles && (
              <Dialog open={openCrearRol} onOpenChange={setOpenCrearRol}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Rol
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Rol</DialogTitle>
                    <DialogDescription>
                      Ingrese el nombre del nuevo rol.
                    </DialogDescription>
                  </DialogHeader>
                  <CrearRolForm
                    onRolCreated={handleRolCreated}
                    onClose={() => setOpenCrearRol(false)}
                  />
                </DialogContent>
              </Dialog>
              )}
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Nombre
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Descripción
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Usuarios
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Permisos
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map((rol) => (
                      <TableRow
                        key={rol.id}
                        className={selectedRol === rol.id ? "bg-muted/50" : ""}
                      >
                        <TableCell className="font-medium">{rol.nombre}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {rol.descripcion || "N/A"}
                        </TableCell>
                        <TableCell className="font-figures">
                          {conteoMap.get(rol.id) ?? "—"}
                        </TableCell>
                        <TableCell className="font-figures">
                          {rol.permisos?.length || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {puedeGestionarRoles && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirEdicionRol(rol)}
                            >
                              <Pencil className="h-4 w-4 mr-1" /> Editar
                            </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedRol((prev) => (prev === rol.id ? null : rol.id))
                              }
                            >
                              <Shield className="h-4 w-4 mr-1" /> Permisos
                            </Button>
                            {puedeGestionarRoles && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setIsDeleteModalOpen(true);
                                setRolToDelete(rol);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                            </Button>
                            )}
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
                  <CardTitle className="font-display">
                    Permisos del rol: {roles.find((r) => r.id === selectedRol)?.nombre}
                  </CardTitle>
                  <CardDescription>
                    {puedeAsignarPermisos
                      ? "Marca o desmarca para asignar o quitar permisos de este rol."
                      : "Solo lectura: no tienes permiso para asignar permisos."}
                    {guardandoPermiso && " Guardando…"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Buscar permisos..."
                    value={searchPermiso}
                    onChange={(e) => setSearchPermiso(e.target.value)}
                    className="mb-4"
                  />
                  {Object.entries(permisosAgrupados).map(([entidad, permisosDeEntidad]) => {
                    const filteredPermisosDeEntidad = permisosDeEntidad.filter(
                      (permiso) =>
                        permiso.nombre.toLowerCase().includes(searchPermiso.toLowerCase()) ||
                        permiso.descripcion?.toLowerCase().includes(searchPermiso.toLowerCase()),
                    );
                    if (filteredPermisosDeEntidad.length === 0) return null;

                    return (
                      <div key={entidad} className="space-y-2 mb-4">
                        <h3 className="font-display font-semibold text-lg capitalize">
                          {entidad.replaceAll("_", " ")}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {filteredPermisosDeEntidad.map((permiso) => {
                            const asignado = isPermisoAsignado(permiso.id);
                            return (
                              <div
                                key={permiso.id}
                                className="flex items-center space-x-2 border rounded-md p-2"
                              >
                                <Checkbox
                                  id={`permiso-${selectedRol}-${permiso.id}`}
                                  checked={asignado}
                                  disabled={guardandoPermiso || !puedeAsignarPermisos}
                                  onCheckedChange={() => togglePermiso(permiso.id, asignado)}
                                />
                                <label
                                  htmlFor={`permiso-${selectedRol}-${permiso.id}`}
                                  className="text-sm font-medium leading-none flex-1 cursor-pointer"
                                >
                                  {permiso.descripcion}
                                  <span className="block text-xs text-muted-foreground mt-1">
                                    {permiso.nombre}
                                  </span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          </ProtectedRoute>

          <ProtectedRoute requiredPermission="ver_permisos">
          <TabsContent value="permisos" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative flex items-center w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar permisos..."
                  value={searchPermiso}
                  onChange={(e) => setSearchPermiso(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
              {puedeGestionarCatalogo && (
                <Button onClick={abrirNuevoPermiso}>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Permiso
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Nombre
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Descripción
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Módulo
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Roles Asignados
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermisos.map((permiso) => {
                      const rolesAsignados = Object.entries(rolPermisos).filter(([, ids]) =>
                        ids.includes(permiso.id),
                      ).length;

                      return (
                        <TableRow key={permiso.id}>
                          <TableCell className="font-medium">{permiso.nombre}</TableCell>
                          <TableCell>{permiso.descripcion}</TableCell>
                          <TableCell>
                            <span className="text-xs rounded-full bg-accent/10 text-accent px-2 py-0.5">
                              {permiso.modulo}
                            </span>
                          </TableCell>
                          <TableCell className="font-figures">{rolesAsignados}</TableCell>
                          <TableCell>
                            {puedeGestionarCatalogo ? (
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => abrirEdicionPermiso(permiso)}
                              >
                                <Pencil className="h-4 w-4 mr-1" /> Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setPermisoAEliminar(permiso)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                              </Button>
                            </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Solo plataforma</span>
                            )}
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

        {/* Editar rol */}
        <Dialog open={!!rolEnEdicion} onOpenChange={(open) => !open && setRolEnEdicion(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Rol</DialogTitle>
              <DialogDescription>Actualiza el nombre o la descripción del rol.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRolEnEdicion(null)}>
                Cancelar
              </Button>
              <Button onClick={guardarEdicionRol} disabled={guardandoRol}>
                {guardandoRol ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Crear / Editar permiso */}
        <Dialog
          open={!!permisoEnEdicion}
          onOpenChange={(open) => !open && setPermisoEnEdicion(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {permisoEnEdicion === "nuevo" ? "Nuevo Permiso" : "Editar Permiso"}
              </DialogTitle>
              <DialogDescription>
                Los nombres de permiso se usan tal cual en el backend (ej.
                "ver_deportistas") — evita espacios o mayúsculas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre (clave técnica)</Label>
                <Input
                  value={formPermiso.nombre}
                  onChange={(e) => setFormPermiso({ ...formPermiso, nombre: e.target.value })}
                  placeholder="ver_deportistas"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={formPermiso.descripcion}
                  onChange={(e) =>
                    setFormPermiso({ ...formPermiso, descripcion: e.target.value })
                  }
                  placeholder="Ver el listado de deportistas"
                />
              </div>
              <div className="space-y-2">
                <Label>Módulo</Label>
                <Input
                  value={formPermiso.modulo}
                  onChange={(e) => setFormPermiso({ ...formPermiso, modulo: e.target.value })}
                  placeholder="deportistas"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPermisoEnEdicion(null)}>
                Cancelar
              </Button>
              <Button onClick={guardarPermiso} disabled={guardandoPermisoForm}>
                {guardandoPermisoForm ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Eliminar permiso */}
        <Dialog
          open={!!permisoAEliminar}
          onOpenChange={(open) => !open && setPermisoAEliminar(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Eliminar el permiso "{permisoAEliminar?.nombre}"? Si algún rol lo tiene
                asignado, perderá ese acceso.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button variant="destructive" onClick={eliminarPermiso}>
                Eliminar
              </Button>
              <Button variant="secondary" onClick={() => setPermisoAEliminar(null)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Eliminar rol */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar el rol "{rolToDelete?.nombre}"?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Eliminar
              </Button>
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}

function agruparPermisosPorEntidad(permisos: Permiso[]): Record<string, Permiso[]> {
  const agrupados: Record<string, Permiso[]> = {};
  for (const permiso of permisos) {
    const entidad = getEntidadFromNombre(permiso.nombre);
    if (!agrupados[entidad]) agrupados[entidad] = [];
    agrupados[entidad].push(permiso);
  }
  return agrupados;
}

function getEntidadFromNombre(nombre: string): string {
  const partes = nombre.split("_");
  const entidadPartes = partes.slice(1);
  return entidadPartes.length > 0 && partes.length > 1 ? entidadPartes.join("_") : "otros";
}