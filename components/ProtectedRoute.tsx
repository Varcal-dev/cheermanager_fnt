"use client"
import { useUser } from "@/context/UserContext"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission: string
}

const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { user, permissions, loading } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  const debeCambiarPassword = !!user?.requiereCambioPassword && pathname !== "/cambiar-password"

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirigir al login si no está autenticado
        router.push("/login")
      } else if (debeCambiarPassword) {
        // Usuario con contraseña por defecto (ej. "0000"): no lo dejamos
        // entrar a nada del sistema hasta que la cambie.
        router.push("/cambiar-password")
      } else if (!permissions.includes(requiredPermission)) {
        // Redirigir a una página de error si no tiene el permiso
        router.push("/error-permisos")
      }
    }
  }, [user, permissions, loading, requiredPermission, debeCambiarPassword, router])

  if (loading || !user || debeCambiarPassword || !permissions.includes(requiredPermission)) {
    return <p>Cargando...</p> // Mostrar un mensaje de carga mientras se verifica
  }

  return <>{children}</>
}

export default ProtectedRoute
