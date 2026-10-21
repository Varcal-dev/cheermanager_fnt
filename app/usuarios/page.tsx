"use client";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useEffect, useState } from "react";
import React from "react";
import { api, getErrorMessage } from "@/lib/api";
import ClaveTemporalDialog, { generarClaveTemporal } from "@/app/components/Forms/ClaveTemporalDialog";
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
  Search,
  Lock,
  Shield,
  UserCog,
  Eye,
  EyeOff,
  Key,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewUserData {
  username: string;
  passwordHash: string;
  email: string;
  rol: number;
  ultimoAcceso: Date | null;
  activo: boolean;
  personaId?: number | null;
  nombre?: string;
  apellidos?: string;
  direccion?: string;
  telefono?: string;
  fechaNacimiento?: string;
  generoId?: number | null;
}

export default function UsuariosPage() {
  const { permissions } = useUser();
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  const [expandedUsuarios, setExpandedUsuarios] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [rolFiltro, setRolFiltro] = useState<string | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [rolesList, setRolesList] = useState<any[]>([]);
  const [gendersList, setGendersList] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState<NewUserData>({
    username: "",
    passwordHash: "",
    email: "",
    rol: 0,
    ultimoAcceso: null,
    activo: true,
    personaId: null,
    nombre: "",
    apellidos: "",
  });

  const [asociarPersona, setAsociarPersona] = useState(false);
  const [personas, setPersonas] = useState<any[]>([]);
  const [searchTermPersona, setSearchTermPersona] = useState("");
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(null);

  const [tipoAsociacion, setTipoAsociacion] = useState<"ninguna" | "nueva" | "existente">(
    "ninguna",
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Acciones rápidas sobre un usuario existente (antes decorativas) ---
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState<any | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRolId, setEditRolId] = useState<string>("");

  // Clave temporal (reemplaza la antigua clave por defecto "0000")
  const [usuarioParaPassword, setUsuarioParaPassword] = useState<any | null>(null);
  const [claveGenerada, setClaveGenerada] = useState<{ clave: string; username: string } | null>(null);

  const [usuarioParaEliminar, setUsuarioParaEliminar] = useState<any | null>(null);
  const [accionEnCurso, setAccionEnCurso] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewUserData((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/usuario/listar");
      const data = response.data.map((u: any) => {
        const fechaRaw = u.ultimoAcceso ? new Date(u.ultimoAcceso) : null;
        return {
          id: u.id,
          username: u.username,
          email: u.email,
          rolId: u.rolId,
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
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.error("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get("/api/usuario/rol/listar");
      if (response.data) setRolesList(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchGenders = async () => {
    try {
      const response = await api.get("/api/usuario/genero/listar");
      if (response.data) setGendersList(response.data);
    } catch (error) {
      console.error("Error fetching genders:", error);
    }
  };

  const fetchPersonas = async () => {
    try {
      // GET /api/personas (antes /api/personas/listar, que ya no existe en el back)
      const response = await api.get("/api/personas");
      setPersonas(response.data);
    } catch (error) {
      console.error("Error al obtener personas:", error);
      toast.error("No se pudieron cargar las personas");
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
  }, []);

  // /api/personas exige ver_persona: solo se pide si el usuario lo tiene.
  const puedeVerPersonas = permissions.includes("ver_persona");
  useEffect(() => {
    if (puedeVerPersonas) fetchPersonas();
  }, [puedeVerPersonas]);

  useEffect(() => {
    if (isModalOpen) {
      fetchRoles();
      fetchGenders();
    }
  }, [isModalOpen]);

  // Clave aleatoria que nadie ve: la persona entra con la clave temporal que se genera justo después.
  const claveAleatoria = () => {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleAddUser = async () => {
    if (!newUserData.username.trim()) {
      toast.error("El nombre de usuario es obligatorio");
      return;
    }
    if (!newUserData.rol) {
      toast.error("Selecciona un rol");
      return;
    }
    setIsSubmitting(true);
    try {
      // El username y el email son únicos en TODA la plataforma (no solo en tu club).
      // Si no se escribe un correo real se usa uno ficticio: sirve para iniciar sesión,
      // pero la recuperación de clave por correo no funcionará con él.
      const emailFinal = newUserData.email.trim() || `${newUserData.username.trim()}@cheermanager.com`;

      let dataToSend: any = {
        username: newUserData.username.trim(),
        password: claveAleatoria(),
        email: emailFinal,
        rolId: newUserData.rol,
      };

      if (tipoAsociacion === "nueva") {
        dataToSend = {
          ...dataToSend,
          personaId: null,
          nombre: newUserData.nombre,
          apellidos: newUserData.apellidos,
          direccion: newUserData.direccion,
          telefono: newUserData.telefono,
          fechaNacimiento: newUserData.fechaNacimiento,
          generoId: newUserData.generoId,
        };
      } else if (tipoAsociacion === "existente") {
        dataToSend.personaId = selectedPersonaId;
      } else {
        dataToSend.personaId = null;
      }

      const response = await api.post("/api/usuario/registrar", dataToSend);

      if (response.status === 200) {
        toast.success("Usuario agregado exitosamente");
        fetchUsuarios();
        setIsModalOpen(false);
        setNewUserData({
          username: "",
          passwordHash: "",
          email: "",
          rol: 0,
          ultimoAcceso: null,
          activo: true,
          personaId: null,
          nombre: "",
          apellidos: "",
          direccion: "",
          telefono: "",
          fechaNacimiento: "",
          generoId: null,
        });
        setTipoAsociacion("ninguna");

        // El usuario recién creado todavía no tiene una clave que alguien conozca:
        // se genera una temporal (con cambio obligatorio en el primer ingreso).
        if (permissions.includes("restablecer_clave_usuario") && response.data?.id) {
          const clave = await generarClaveTemporal(response.data.id);
          if (clave) setClaveGenerada({ clave, username: response.data.username });
        } else {
          toast.info(
            "Pide a un administrador que genere la clave temporal de este usuario para que pueda ingresar.",
          );
        }
      }
    } catch (error: any) {
      console.error("Error al agregar usuario:", error);
      toast.error(getErrorMessage(error, "Error al registrar usuario"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cada acción rápida hace PUT a /api/usuario/actualizar/{id}. Ese endpoint
  // siempre re-asigna username y email desde el DTO (no los deja intactos si
  // vienen vacíos) — por eso todas estas llamadas parten de los valores
  // actuales del usuario para no borrarlos accidentalmente.
  const actualizarUsuario = async (
    usuario: any,
    cambios: Partial<{ username: string; email: string; rolId: number; activo: boolean; password: string }>,
  ) => {
    setAccionEnCurso(true);
    try {
      await api.put(`/api/usuario/actualizar/${usuario.id}`, {
        username: usuario.username,
        email: usuario.email,
        rolId: usuario.rolId,
        activo: usuario.activo,
        ...cambios,
      });
      await fetchUsuarios();
      return true;
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);
      toast.error(getErrorMessage(error, "No se pudo actualizar el usuario"));
      return false;
    } finally {
      setAccionEnCurso(false);
    }
  };

  const abrirEdicion = (usuario: any) => {
    setUsuarioEnEdicion(usuario);
    setEditUsername(usuario.username);
    setEditEmail(usuario.email);
    setEditRolId(usuario.rolId ? String(usuario.rolId) : "");
  };

  const guardarEdicion = async () => {
    if (!usuarioEnEdicion) return;
    const ok = await actualizarUsuario(usuarioEnEdicion, {
      username: editUsername,
      email: editEmail,
      rolId: editRolId ? parseInt(editRolId) : undefined,
    });
    if (ok) {
      toast.success("Usuario actualizado");
      setUsuarioEnEdicion(null);
    }
  };

  const generarClave = async () => {
    if (!usuarioParaPassword) return;
    setAccionEnCurso(true);
    const clave = await generarClaveTemporal(usuarioParaPassword.id);
    setAccionEnCurso(false);
    if (clave) {
      setClaveGenerada({ clave, username: usuarioParaPassword.username });
      setUsuarioParaPassword(null);
    }
  };

  const alternarActivo = async (usuario: any) => {
    const ok = await actualizarUsuario(usuario, { activo: !usuario.activo });
    if (ok) {
      toast.success(usuario.activo ? "Usuario desactivado" : "Usuario activado");
    }
  };

  const eliminarUsuario = async () => {
    if (!usuarioParaEliminar) return;
    setAccionEnCurso(true);
    try {
      await api.delete(`/api/usuario/eliminar/${usuarioParaEliminar.id}`);
      toast.success("Usuario eliminado");
      setUsuarioParaEliminar(null);
      fetchUsuarios();
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      toast.error(getErrorMessage(error, "No se pudo eliminar el usuario"));
    } finally {
      setAccionEnCurso(false);
    }
  };

  const toggleUsuarioExpand = (usuarioId: number) => {
    setExpandedUsuarios((prev) =>
      prev.includes(usuarioId) ? prev.filter((id) => id !== usuarioId) : [...prev, usuarioId],
    );
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rol?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRol = rolFiltro ? usuario.rol === rolFiltro : true;
    const matchesActivo = mostrarInactivos ? true : usuario.activo;
    return matchesSearch && matchesRol && matchesActivo;
  });

  const filteredPersonas = personas.filter(
    (persona) =>
      persona.nombre?.toLowerCase().includes(searchTermPersona.toLowerCase()) ||
      persona.apellidos?.toLowerCase().includes(searchTermPersona.toLowerCase()),
  );

  if (loading) {
    return <p className="text-center mt-10 text-muted-foreground">Cargando usuarios…</p>;
  }

  return (
    <ProtectedRoute requiredPermission="ver_usuarios">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Usuarios</h1>
            <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
          </div>
          {permissions.includes("crear_usuario") && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
            </Button>
          )}
        </div>

        <div className="flex justify-between mb-4">
          <div className="relative flex items-center w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9"
            />
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
                {rolesList.map((rol) => (
                  <DropdownMenuItem key={rol.id} onClick={() => setRolFiltro(rol.nombre)}>
                    {rol.nombre}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                    Usuario
                  </TableHead>
                  <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                    Rol
                  </TableHead>
                  <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                    Último Acceso
                  </TableHead>
                  <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <React.Fragment key={usuario.id}>
                    <TableRow>
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
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-xs font-semibold text-accent">
                            {usuario.username?.slice(0, 2).toUpperCase()}
                          </span>
                          <span>{usuario.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{usuario.rol}</Badge>
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
                        <Badge variant={usuario.activo ? "success" : "secondary"}>
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {permissions.includes("modificar_usuario") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirEdicion(usuario)}
                            >
                              <Pencil className="h-4 w-4 mr-1" /> Editar
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <UserCog className="h-4 w-4 mr-1" /> Acciones
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {permissions.includes("restablecer_clave_usuario") && (
                                <DropdownMenuItem
                                  onClick={() => setUsuarioParaPassword(usuario)}
                                >
                                  <Key className="h-4 w-4 mr-2" /> Generar clave temporal
                                </DropdownMenuItem>
                              )}
                              {permissions.includes("modificar_usuario") && (
                                <>
                                  <DropdownMenuItem onClick={() => abrirEdicion(usuario)}>
                                    <Shield className="h-4 w-4 mr-2" /> Cambiar Rol
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => alternarActivo(usuario)}>
                                    {usuario.activo ? (
                                      <>
                                        <EyeOff className="h-4 w-4 mr-2" /> Desactivar
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-4 w-4 mr-2" /> Activar
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {permissions.includes("eliminar_usuario") && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setUsuarioParaEliminar(usuario)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
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
                                <h4 className="font-display font-semibold mb-2">
                                  Información de Usuario
                                </h4>
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">ID:</span>
                                    <span className="font-figures">{usuario.id}</span>
                                  </div>
                                  <div className="grid grid-cols-2">
                                    <span className="text-muted-foreground">
                                      Nombre de Usuario:
                                    </span>
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
                                  {usuario.nombre && (
                                    <div className="grid grid-cols-2">
                                      <span className="text-muted-foreground">
                                        Persona asociada:
                                      </span>
                                      <span>
                                        {usuario.nombre} {usuario.apellidos}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-display font-semibold mb-2">
                                  Acciones Rápidas
                                </h4>
                                <div className="space-y-2">
                                  {permissions.includes("restablecer_clave_usuario") && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full justify-start"
                                      onClick={() => setUsuarioParaPassword(usuario)}
                                    >
                                      <Key className="h-4 w-4 mr-2" /> Generar clave temporal
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => abrirEdicion(usuario)}
                                  >
                                    <Shield className="h-4 w-4 mr-2" /> Cambiar Rol
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

        {/* Nuevo usuario */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Ingresa los datos del nuevo usuario. Haz clic en guardar cuando termines.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Nombre de Usuario
                </Label>
                <Input
                  id="username"
                  value={newUserData.username}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Correo
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={handleInputChange}
                  placeholder="Opcional (si no, se usa uno ficticio)"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rol" className="text-right">
                  Rol
                </Label>
                <Select
                  onValueChange={(value) =>
                    setNewUserData({ ...newUserData, rol: parseInt(value) })
                  }
                  value={newUserData.rol.toString()}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesList.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id.toString()}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <Label className="font-semibold">Asociación de Persona</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="asociacion"
                      value="ninguna"
                      checked={tipoAsociacion === "ninguna"}
                      onChange={() => {
                        setTipoAsociacion("ninguna");
                        setNewUserData({ ...newUserData, personaId: null });
                      }}
                    />
                    Sin persona
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="asociacion"
                      value="nueva"
                      checked={tipoAsociacion === "nueva"}
                      onChange={() => {
                        setTipoAsociacion("nueva");
                        setNewUserData({ ...newUserData, personaId: undefined });
                      }}
                    />
                    Nueva persona
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="asociacion"
                      value="existente"
                      checked={tipoAsociacion === "existente"}
                      onChange={() => {
                        setTipoAsociacion("existente");
                        setNewUserData({ ...newUserData, personaId: null });
                      }}
                    />
                    Persona existente
                  </label>
                </div>
              </div>
              {tipoAsociacion === "existente" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="searchPersona" className="text-right col-span-1">
                    Buscar Persona
                  </Label>
                  <Input
                    id="searchPersona"
                    type="text"
                    value={searchTermPersona}
                    onChange={(e) => setSearchTermPersona(e.target.value)}
                    className="col-span-3"
                    placeholder="Escribe nombre o apellido"
                  />
                  {filteredPersonas.length > 0 && (
                    <>
                      <Label htmlFor="selectPersona" className="text-right col-span-1">
                        Seleccionar
                      </Label>
                      <Select
                        value={selectedPersonaId ? String(selectedPersonaId) : ""}
                        onValueChange={(v) => setSelectedPersonaId(v ? parseInt(v) : null)}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Seleccione una persona" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredPersonas.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.nombre} {p.apellidos}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              )}
              {tipoAsociacion === "nueva" && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nombre" className="text-right">
                      Nombre Persona
                    </Label>
                    <Input
                      id="nombre"
                      value={newUserData.nombre || ""}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="apellidos" className="text-right">
                      Apellidos Persona
                    </Label>
                    <Input
                      id="apellidos"
                      value={newUserData.apellidos || ""}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="direccion" className="text-right">
                      Dirección
                    </Label>
                    <Input
                      id="direccion"
                      value={newUserData.direccion || ""}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="telefono" className="text-right">
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      value={newUserData.telefono || ""}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fechaNacimiento" className="text-right">
                      Fecha de Nacimiento
                    </Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={newUserData.fechaNacimiento || ""}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="generoId" className="text-right">
                      Género
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setNewUserData({ ...newUserData, generoId: parseInt(value) })
                      }
                      value={newUserData.generoId?.toString() || ""}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona un género" />
                      </SelectTrigger>
                      <SelectContent>
                        {gendersList.map((genero) => (
                          <SelectItem key={genero.id} value={genero.id.toString()}>
                            {genero.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAddUser} disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Usuario"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Editar usuario (username / email / rol) */}
        <Dialog open={!!usuarioEnEdicion} onOpenChange={(open) => !open && setUsuarioEnEdicion(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Actualiza el usuario, correo o rol de {usuarioEnEdicion?.username}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre de Usuario</Label>
                <Input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={editRolId} onValueChange={setEditRolId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesList.map((rol) => (
                      <SelectItem key={rol.id} value={String(rol.id)}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUsuarioEnEdicion(null)}>
                Cancelar
              </Button>
              <Button onClick={guardarEdicion} disabled={accionEnCurso}>
                {accionEnCurso ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generar clave temporal */}
        <Dialog
          open={!!usuarioParaPassword}
          onOpenChange={(open) => !open && setUsuarioParaPassword(null)}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Generar clave temporal</DialogTitle>
              <DialogDescription>
                Se creará una clave nueva para {usuarioParaPassword?.username}, que reemplaza la actual y
                desbloquea la cuenta. Deberá cambiarla al iniciar sesión. Las sesiones ya abiertas siguen
                válidas hasta que venza su token.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUsuarioParaPassword(null)}>
                Cancelar
              </Button>
              <Button onClick={generarClave} disabled={accionEnCurso}>
                {accionEnCurso ? "Generando..." : "Generar clave"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ClaveTemporalDialog
          clave={claveGenerada?.clave ?? null}
          username={claveGenerada?.username}
          onClose={() => setClaveGenerada(null)}
        />

        {/* Confirmar eliminación */}
        <Dialog
          open={!!usuarioParaEliminar}
          onOpenChange={(open) => !open && setUsuarioParaEliminar(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres eliminar al usuario "
                {usuarioParaEliminar?.username}"? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button variant="destructive" onClick={eliminarUsuario} disabled={accionEnCurso}>
                {accionEnCurso ? "Eliminando..." : "Eliminar"}
              </Button>
              <Button variant="secondary" onClick={() => setUsuarioParaEliminar(null)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}