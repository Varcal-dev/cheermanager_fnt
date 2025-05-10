"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Camera, Check, Key, LogOut, Mail, Phone, Save, User, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Datos de ejemplo para simular un usuario logueado
const usuarioLogueado = {
  id: 1,
  username: "admin",
  email: "admin@cheergym.com",
  rol: "Administrador",
  ultimo_acceso: "2024-04-25T10:30:00",
  activo: true,
  persona_id: 1, // Algunos usuarios no tendrán persona_id
}

// Datos de ejemplo para simular la información personal (si existe)
const informacionPersonal = {
  id: 1,
  nombre: "Administrador del Sistema",
  direccion: "Calle Principal #123, Ciudad",
  telefono: "+1234567890",
  fecha_nacimiento: "1990-05-15",
  genero_id: 1, // 1: Masculino, 2: Femenino, 3: Otro
}

// Mapeo de géneros
const generos = [
  { id: 1, nombre: "Masculino" },
  { id: 2, nombre: "Femenino" },
  { id: 3, nombre: "Otro" },
]

export default function PerfilPage() {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(
    usuarioLogueado.persona_id ? new Date(informacionPersonal.fecha_nacimiento) : undefined,
  )
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    email: usuarioLogueado.email,
    nombre: usuarioLogueado.persona_id ? informacionPersonal.nombre : "",
    direccion: usuarioLogueado.persona_id ? informacionPersonal.direccion : "",
    telefono: usuarioLogueado.persona_id ? informacionPersonal.telefono : "",
    genero_id: usuarioLogueado.persona_id ? informacionPersonal.genero_id : 1,
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = () => {
    // Aquí iría la lógica para guardar los cambios del perfil
    console.log("Guardando perfil:", formData)
    setIsEditing(false)
    // Simular éxito
    alert("Perfil actualizado correctamente")
  }

  const handleChangePassword = () => {
    setPasswordError("")
    setPasswordSuccess("")

    // Validaciones básicas
    if (!passwordData.currentPassword) {
      setPasswordError("Debes ingresar tu contraseña actual")
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    // Aquí iría la lógica para cambiar la contraseña
    console.log("Cambiando contraseña:", passwordData)

    // Simular éxito
    setPasswordSuccess("Contraseña actualizada correctamente")
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y configuración de cuenta</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_3fr]">
        {/* Tarjeta de perfil */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Avatar" />
                <AvatarFallback className="text-lg bg-purple-100 text-purple-700">
                  {usuarioLogueado.persona_id
                    ? getInitials(informacionPersonal.nombre)
                    : getInitials(usuarioLogueado.username)}
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
              {usuarioLogueado.persona_id ? informacionPersonal.nombre : usuarioLogueado.username}
            </h2>
            <p className="text-sm text-muted-foreground">{usuarioLogueado.email}</p>

            <Badge variant="outline" className="mt-2">
              {usuarioLogueado.rol}
            </Badge>

            <div className="w-full mt-6 space-y-2">
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Usuario: {usuarioLogueado.username}</span>
              </div>
              {usuarioLogueado.persona_id && (
                <>
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{informacionPersonal.telefono}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{usuarioLogueado.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{informacionPersonal.direccion}</span>
                  </div>
                </>
              )}
            </div>

            <div className="w-full mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground mb-2">Último acceso</p>
              <p className="text-sm">{new Date(usuarioLogueado.ultimo_acceso).toLocaleString()}</p>
            </div>

            <Button variant="outline" className="w-full mt-6" onClick={() => router.push("/")}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>

        {/* Tabs de información */}
        <Tabs defaultValue="informacion">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="informacion">Información Personal</TabsTrigger>
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
                      {isEditing ? "Edita tu información personal" : "Visualiza y gestiona tu información personal"}
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
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
                    <Input id="username" value={usuarioLogueado.username} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder={!usuarioLogueado.persona_id ? "No disponible" : ""}
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
                      placeholder={!usuarioLogueado.persona_id ? "No disponible" : ""}
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
                      placeholder={!usuarioLogueado.persona_id ? "No disponible" : ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                          disabled={!isEditing || !usuarioLogueado.persona_id}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: es }) : "No disponible"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus disabled={!isEditing} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genero">Género</Label>
                    <Select
                      disabled={!isEditing || !usuarioLogueado.persona_id}
                      value={formData.genero_id.toString()}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, genero_id: Number.parseInt(value) }))}
                    >
                      <SelectTrigger id="genero">
                        <SelectValue placeholder="Selecciona un género" />
                      </SelectTrigger>
                      <SelectContent>
                        {generos.map((genero) => (
                          <SelectItem key={genero.id} value={genero.id.toString()}>
                            {genero.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!usuarioLogueado.persona_id && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4">
                    <p className="text-amber-800 text-sm">
                      Este usuario no tiene información personal asociada. Contacta con un administrador para vincular
                      tu cuenta con tus datos personales.
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
                <CardDescription>Gestiona tu contraseña y configuración de seguridad</CardDescription>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleChangePassword} className="ml-auto">
                  <Key className="mr-2 h-4 w-4" />
                  Cambiar Contraseña
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
