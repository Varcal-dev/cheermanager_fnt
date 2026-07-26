"use client";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { api, clearAuthToken } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Camera,
  Check,
  Key,
  LogOut,
  Mail,
  Phone,
  Save,
  User,
  MapPin,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const generos = [
  { id: 1, nombre: "Masculino" },
  { id: 2, nombre: "Femenino" },
  { id: 3, nombre: "Otro" },
];

// El backend expone el perfil vía GET /api/usuario/me devolviendo un
// UsuarioDTO. Ese DTO trae los datos de la persona asociada APLANADOS
// (nombre, apellidos, direccion, telefono, fechaNacimiento, generoId,
// personaId) y el rol como "rolNombre", no como objetos anidados
// "persona"/"rol". Este tipo refleja eso para no repetir el bug del front
// original, que asumía una forma que el backend nunca produce.
interface UsuarioPerfil {
  id: number;
  username: string;
  email: string;
  rolNombre: string | null;
  ultimoAcceso: string | null;
  activo: boolean;
  requiereCambioPassword: boolean;
  personaId: number | null;
  nombre: string | null;
  apellidos: string | null;
  direccion: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  generoId: number | null;
}

function PerfilContent() {
  const router = useRouter();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    direccion: "",
    telefono: "",
    genero_id: 1,
  });
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/usuario/me");
        const data: UsuarioPerfil = res.data;
        setUsuario(data);

        setFormData({
          email: data.email || "",
          nombre: data.personaId ? data.nombre || "" : "",
          direccion: data.personaId ? data.direccion || "" : "",
          telefono: data.personaId ? data.telefono || "" : "",
          genero_id: data.generoId || 1,
        });
        setDate(
          data.personaId && data.fechaNacimiento
            ? new Date(data.fechaNacimiento)
            : undefined
        );
      } catch (err) {
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = () => {
    // NOTA: el backend todavía no expone un endpoint de auto-servicio para
    // que un usuario edite sus propios datos de persona (el único endpoint
    // existente, PUT /api/usuario/actualizar/{id}, requiere el permiso
    // administrativo "modificar_usuario"). Hasta que exista ese endpoint,
    // dejamos claro que el formulario no persiste cambios en vez de simular
    // un guardado exitoso que en realidad no ocurre.
    setIsEditing(false);
    toast.info(
      "La edición de perfil aún no está conectada a un endpoint del backend. Contacta a un administrador para actualizar tus datos."
    );
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!passwordData.currentPassword) {
      setPasswordError("Debes ingresar tu contraseña actual");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await api.post("/api/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.success) {
        setPasswordSuccess("Contraseña actualizada correctamente");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordError(response.data.message || "No se pudo cambiar la contraseña");
      }
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.message || "Error al conectar con el servidor"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/logout", {});
    } catch (err) {
      // Si el logout en el backend falla igual limpiamos la sesión local.
    } finally {
      clearAuthToken();
      setUser(null);
      router.push("/login");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>No se pudo cargar el perfil.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_3fr]">
        {/* Tarjeta de perfil */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src="/placeholder.svg?height=96&width=96"
                  alt="Avatar"
                />
                <AvatarFallback className="text-lg bg-purple-100 text-purple-700">
                  {usuario.personaId
                    ? getInitials(usuario.nombre || "")
                    : getInitials(usuario.username)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background"
              >
                <Camera className="h-4 w-4" />
                <span className="sr-only">Cambiar foto</span>
              </Button>
            </div>

            <h2 className="text-xl font-bold mt-2">
              {usuario.personaId ? usuario.nombre : usuario.username}
            </h2>
            <p className="text-sm text-muted-foreground">{usuario.email}</p>

            <Badge variant="outline" className="mt-2">
              {usuario.rolNombre}
            </Badge>

            <div className="w-full mt-6 space-y-2">
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Usuario: {usuario.username}</span>
              </div>
              {usuario.personaId && (
                <>
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{usuario.telefono}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{usuario.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{usuario.direccion}</span>
                  </div>
                </>
              )}
            </div>

            <div className="w-full mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Último acceso
              </p>
              <p className="text-sm">
                {usuario.ultimoAcceso
                  ? new Date(usuario.ultimoAcceso).toLocaleString()
                  : "No disponible"}
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full mt-6"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>

        {/* Tabs de información */}
        <Tabs defaultValue="informacion">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="informacion">
              Información Personal
            </TabsTrigger>
            <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          </TabsList>

          {/* Tab: Información Personal */}
          <TabsContent value="informacion">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>
                      {isEditing
                        ? "Edita tu información personal"
                        : "Visualiza y gestiona tu información personal"}
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={() =>
                      isEditing ? handleSaveProfile() : setIsEditing(true)
                    }
                  >
                    {isEditing ? (
                      <>
                        <Save className="mr-2 h-4 w-4" /> Guardar
                      </>
                    ) : (
                      "Editar"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de Usuario</Label>
                    <Input id="username" value={usuario.username} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder={!usuario.personaId ? "No disponible" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder={!usuario.personaId ? "No disponible" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder={!usuario.personaId ? "No disponible" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                          disabled={!isEditing || !usuario.personaId}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date
                            ? format(date, "PPP", { locale: es })
                            : "No disponible"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={!isEditing}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genero">Género</Label>
                    <Select
                      disabled={!isEditing || !usuario.personaId}
                      value={formData.genero_id.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          genero_id: Number.parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger id="genero">
                        <SelectValue placeholder="Selecciona un género" />
                      </SelectTrigger>
                      <SelectContent>
                        {generos.map((genero) => (
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
                </div>

                {!usuario.personaId && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
                    <p className="text-amber-800 text-sm">
                      Este usuario no tiene información personal asociada.
                      Contacta con un administrador para vincular tu cuenta
                      con tus datos personales.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Seguridad */}
          <TabsContent value="seguridad">
            <Card>
              <CardHeader>
                <CardTitle>Seguridad de la Cuenta</CardTitle>
                <CardDescription>
                  Gestiona tu contraseña y configuración de seguridad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Cambiar Contraseña</h3>

                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-3 text-sm flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      {passwordSuccess}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña Actual</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      disabled={changingPassword}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      disabled={changingPassword}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirmar Nueva Contraseña
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      disabled={changingPassword}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleChangePassword}
                  className="ml-auto"
                  disabled={changingPassword}
                >
                  <Key className="mr-2 h-4 w-4" />
                  {changingPassword ? "Cambiando..." : "Cambiar Contraseña"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <ProtectedRoute requiredPermission="ver_mi_perfil">
      <PerfilContent />
    </ProtectedRoute>
  );
}
