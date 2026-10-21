"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { api } from "@/lib/api"

export default function RecuperarPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!email) {
        throw new Error("Por favor ingrese su correo electrónico")
      }

      const response = await api.post("/api/forgot-password", { email })

      if (response.data.success) {
        setSuccess(true)
      } else {
        setError(response.data.message || "No se pudo procesar la solicitud")
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError(err instanceof Error ? err.message : "Ocurrió un error al procesar la solicitud")
      }
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
          <CardTitle className="text-2xl font-bold text-primary">Recuperar Contraseña</CardTitle>
          <CardDescription>Ingrese su correo electrónico para recibir instrucciones</CardDescription>
        </CardHeader>
        {success ? (
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription>
                Si el correo <strong>{email}</strong> está registrado, te enviamos instrucciones para restablecer tu
                contraseña.
              </AlertDescription>
            </Alert>
            <p className="text-center text-sm text-muted-foreground">
              Revisa tu bandeja de entrada (y la carpeta de spam). El enlace para crear una nueva contraseña
              llega por correo y tiene vigencia limitada. Si tu cuenta fue creada con un correo ficticio
              (terminado en <strong>@cheermanager.com</strong>), pide a un administrador de tu club que te genere
              una clave temporal.
            </p>
            <Button className="w-full mt-4" onClick={() => router.push("/login")}>
              <ArrowLeft size={16} className="mr-2" />
              Volver al inicio de sesión
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
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ingrese su correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send size={16} />
                    Enviar instrucciones
                  </span>
                )}
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