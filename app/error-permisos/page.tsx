"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Home, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ErrorPermisos() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <Shield className="h-12 w-12 text-red-600 dark:text-red-300" />
            </div>
          </div>
          <CardTitle className="text-2xl">Acceso Denegado</CardTitle>
          <CardDescription className="text-base">
            No tienes los permisos necesarios para acceder a esta sección.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p>Si crees que deberías tener acceso a esta sección, por favor contacta al administrador del sistema.</p>
          </div>
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground">Posibles razones:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Tu rol no tiene los permisos necesarios</li>
              <li>Tu cuenta requiere activación adicional</li>
              <li>La funcionalidad está restringida temporalmente</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button variant="outline" onClick={() => router.back()} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Link href="/" className="w-full">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Inicio
              </Button>
            </Link>
          </div>
          <Button variant="ghost" className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Contactar al Administrador
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
