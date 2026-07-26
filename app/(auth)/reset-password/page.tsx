"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError("El enlace de recuperación no es válido. Solicita uno nuevo.")
      return
    }
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post("/api/reset-password", { token, newPassword })

      if (response.data.success) {
        setSuccess(true)
      } else {
        setError(response.data.message || "No se pudo restablecer la contraseña")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al conectar con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 items-center text-center">
          <div className="w-16 h-16 mb-2 relative">
            <Image
              src="/placeholder.svg?height=64&width=64"
              alt="Cheer Gym Logo"
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Restablecer Contraseña</CardTitle>
          <CardDescription>Ingrese su nueva contraseña</CardDescription>
        </CardHeader>
        {success ? (
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription>Tu contraseña fue actualizada correctamente.</AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={() => router.push("/login")}>
              <ArrowLeft size={16} className="mr-2" />
              Ir a iniciar sesión
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="text-sm py-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {!token && !error && (
                <Alert variant="destructive" className="text-sm py-2">
                  <AlertDescription>
                    No se encontró un token de recuperación en el enlace. Solicita uno nuevo desde "¿Olvidó su
                    contraseña?".
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || !token}>
                <KeyRound size={16} className="mr-2" />
                {isLoading ? "Guardando..." : "Restablecer contraseña"}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/login")} type="button">
                <ArrowLeft size={16} className="mr-2" />
                Volver al inicio de sesión
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
