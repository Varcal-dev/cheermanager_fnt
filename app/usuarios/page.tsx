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
import { toast } from 'react-toastify';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
//import { Checkbox } from "@radix-ui/react-checkbox";

// Define la interfaz para los datos del nuevo usuario
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
  generoId?: number | null; // ID del género, si es necesario
  // Agrega otros campos necesarios (contraseña, etc.)
}

export default function UsuariosPage() {
  const { permissions } = useUser();
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  const [expandedUsuarios, setExpandedUsuarios] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [rolFiltro, setRolFiltro] = useState<string | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [rolesList, setRolesList] = useState<any[]>([]); // State to store roles
  const [gendersList, setGendersList] = useState<any[]>([]); // State to store genders

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState<NewUserData>({
    username: "",
    passwordHash: "",
    email: "",
    rol: 0,
    ultimoAcceso: null,
    activo: true,
    // Initialize person fields as optional
    personaId: null,
    nombre: "",
    apellidos: "",
  });

  const [asociarPersona, setAsociarPersona] = useState(false);
  const [personas, setPersonas] = useState<any[]>([]);
  const [searchTermPersona, setSearchTermPersona] = useState(""); // Para el input de búsqueda
  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(
    null
  ); // Para la persona seleccionada del desplegable

  const [tipoAsociacion, setTipoAsociacion] = useState<
    "ninguna" | "nueva" | "existente"
  >("ninguna");

  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para deshabilitar el botón al enviar
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewUserData((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handleAddUser = async () => {
    setIsSubmitting(true);

    try {
      let dataToSend: any = {
        username: newUserData.username,
        password: "0000",
        email: `${newUserData.username}@cheermanager.com`,
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

      console.log("Datos a enviar al Backend:", dataToSend);
      // Aquí haces la llamada a tu endpoint de backend para crear un usuario
      const response = await axios.post(
        "http://localhost:8080/api/usuario/registrar",
        dataToSend,
        {
          withCredentials: true, // el backend requiere autenticación para esta acción
        }
      );

      if (response.status === 200) {
        toast.success("Usuario agregado exitosamente"); 
        fetchUsuarios(); // Recarga la lista de usuarios
        // Opcional: Refrescar la lista de usuarios si la muestras en la página
        // (Necesitarías una forma de recargar los datos, quizás llamando a la API de listado de usuarios)
        setIsModalOpen(false); // Cierra el modal
        setNewUserData({
          username: "",
          passwordHash: "",
          email: "",
          rol: 0,
          ultimoAcceso: null,
          activo: true,
          personaId: null,
          nombre: "", // Restablecer campos de persona también
          apellidos: "",
          direccion: "",
          telefono: "",
          fechaNacimiento: "", // O null, dependiendo de tu tipo de dato
          generoId: null,
        }); // Limpia el formulario
      } else {
        // *** Manejo de Otros Códigos de Estado Exitosos (menos comunes para creación) ***
        // Aunque 201 es lo estándar para "Created", si tu backend devuelve 200 u otro código
        // para un registro exitoso, puedes manejarlo aquí si es diferente a un error.
        console.warn(
          "Registro de usuario exitoso con código inesperado:",
          response.status
        );
        toast.info(`Usuario registrado con estado ${response.status}`);
        // ... (posiblemente cerrar modal y limpiar formulario si este estado también indica éxito) ...
      }
    } catch (error: any) {
      // *** Manejo de Errores de Petición (4xx, 5xx, error de red, etc.) ***
      console.error("Error al agregar usuario:", error);

      // Intentar obtener un mensaje de error más detallado de la respuesta del backend
      const errorMessage =
        error.response?.data?.message || // Mensaje específico del backend (si tu API lo envía)
        error.response?.data || // A veces, la respuesta completa de error está en data
        error.message || // Mensaje de error de Axios/JS
        "Error desconocido al procesar la solicitud."; // Mensaje genérico de fallback

      toast.error( "Error al registrar usuario"); 
    } finally {
      setIsSubmitting(false); // Siempre ocultar el indicador de carga/envío
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/usuario/rol/listar",
        {
          withCredentials: true,
        }
      );
      if (response.data) {
        setRolesList(response.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error( "Error");
    }
  };

  // Fetch genders (assuming a similar endpoint exists)
  const fetchGenders = async () => {
    try {
      // Replace with your actual gender list API endpoint
      const response = await axios.get(
        "http://localhost:8080/api/usuario/genero/listar",
        { withCredentials: true }
      );
      if (response.data) {
        setGendersList(response.data);
      }
    } catch (error) {
      console.error("Error fetching genders:", error);
      // Handle error
    }
  };

  // Define una función para cargar usuarios (si no la tienes ya separada)
  const fetchUsuarios = async () => {
    setLoading(true); // Opcional: mostrar un indicador de carga mientras se refresca
    try {
      const response = await axios.get(
        "http://localhost:8080/api/usuario/listar",
        {
          withCredentials: true,
        }
      );
      const data = response.data.map((u: any) => {
        // ... (tu lógica de mapeo de datos actual) ...
        const fechaRaw = u.ultimoAcceso ? new Date(u.ultimoAcceso) : null;

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
      setUsuarios(data); // Actualiza el estado con los nuevos datos
    } catch (error) {
      console.error("Error al recargar usuarios:", error);
      // Manejar error al recargar (quizás mostrar un toast)
    } finally {
      setLoading(false); // Ocultar indicador de carga
    }
  };

  useEffect(() => {
    fetchUsuarios(); // Carga inicial de usuarios
    fetchRoles(); // <-- Carga inicial de roles

    axios
      .get("http://localhost:8080/api/usuario/listar", {
        withCredentials: true,
      })
      .then((response) => {
        const data = response.data.map((u: any) => {
          const fechaRaw = u.ultimoAcceso ? new Date(u.ultimoAcceso) : null;

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
    // Obtener lista de personas
    axios
      .get("http://localhost:8080/api/personas/listar", {
        withCredentials: true,
      })
      .then((response) => {
        setPersonas(response.data);
        // Aquí podrías establecer loading a false si esta es la última llamada
        setLoading(false); // Por ejemplo, si la carga de personas es la última
      })
      .catch((error) => {
        console.error("Error al obtener personas:", error);
        setLoading(false); // Si ocurre un error en personas, puedes detener la carga
      });
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      fetchRoles();
      fetchGenders();
    }
  }, [isModalOpen]);

  const toggleUsuarioExpand = (usuarioId: number) => {
    setExpandedUsuarios((prev) =>
      prev.includes(usuarioId)
        ? prev.filter((id) => id !== usuarioId)
        : [...prev, usuarioId]
    );
  };

  // Obtener roles únicos
  //const roles = Array.from(    new Set(usuarios.map((u) => u.rolNombre || "Sin Rol"))  );

  // Filtrar usuarios por término de búsqueda, rol y estado activo/inactivo
  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.rol?.toLowerCase().includes(searchTerm.toLowerCase()); // Usa usuario.rol, que ya mapeaste a rolNombre

    // *** MODIFICA LA CONDICIÓN DE FILTRO DE ROL ***
    // Ahora comparas con el nombre del rol (usuario.rol) en lugar de u.rolNombre
    const matchesRol = rolFiltro ? usuario.rol === rolFiltro : true;
    const matchesActivo = mostrarInactivos ? true : usuario.activo;

    return matchesSearch && matchesRol && matchesActivo;
  });

  if (loading) {
    return <p className="text-center mt-10">Cargando usuarios...</p>;
  }

  const filteredPersonas = personas.filter(
    (persona) =>
      persona.nombre.toLowerCase().includes(searchTermPersona.toLowerCase()) ||
      persona.apellidos.toLowerCase().includes(searchTermPersona.toLowerCase())
    // Puedes añadir otros campos de búsqueda si son relevantes (ej. identificación)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios del sistema
          </p>
        </div>
        {permissions.includes("crear_usuario") && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
          </Button>
        )}
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
              {/* *** USA rolesList AQUÍ *** */}
              {rolesList.map((rol) => (
                <DropdownMenuItem
                  key={rol.id}
                  // Al seleccionar, guardamos el NOMBRE del rol, no el ID, porque filtras por nombre
                  onClick={() => setRolFiltro(rol.nombre)}
                >
                  {rol.nombre}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo usuario. Haz clic en guardar cuando
              termines.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Campos del formulario */}
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
              {/* check radio */}
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
            {/* Campos para nueva persona (condicional) */}
            {tipoAsociacion === "existente" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="searchPersona"
                  className="text-right col-span-1"
                >
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
                    <Label
                      htmlFor="selectPersona"
                      className="text-right col-span-1"
                    >
                      Seleccionar
                    </Label>
                    <select
                      id="selectPersona"
                      value={selectedPersonaId ?? ""}
                      onChange={(e) =>
                        setSelectedPersonaId(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="col-span-3 border rounded p-2"
                    >
                      <option value="">Seleccione una persona</option>
                      {filteredPersonas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.apellidos}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}
            {tipoAsociacion === "nueva" && (
              <>
                {/* mismos campos que ya tienes para nueva persona */}
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
                      setNewUserData({
                        ...newUserData,
                        generoId: parseInt(value),
                      })
                    }
                    value={newUserData.generoId?.toString() || ""}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un género" />
                    </SelectTrigger>
                    <SelectContent>
                      {gendersList.map((genero) => (
                        <SelectItem
                          key={genero.id}
                          value={genero.id.toString()}
                        >
                          {genero.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Agrega otros campos del formulario aquí */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
