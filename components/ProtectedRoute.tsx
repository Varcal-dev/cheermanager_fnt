"use client"
import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission: string
}

const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { user, permissions, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirigir al login si no está autenticado
        router.push("/login")
      } else if (!permissions.includes(requiredPermission)) {
        // Redirigir a una página de error si no tiene el permiso
        router.push("/error-permisos")
      }
    }
  }, [user, permissions, loading, requiredPermission, router])

  if (loading) {
    return <p>Cargando... .i.</p>
  }

  return <>{children}</>
}

export default ProtectedRoute