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
    console.log("Verificando permisos...")
    if (!loading) {
      console.log("Usuario:", user)
      console.log("Permisos:", permissions)
      if (!user) {
        console.log("Usuario no autenticado, redirigiendo a login...")
        // Redirigir al login si no está autenticado
        router.push("/login")
      } else if (!permissions.includes(requiredPermission)) {
        console.log("Permiso requerido no encontrado, redirigiendo a error de permisos...")
        // Redirigir a una página de error si no tiene el permiso
        router.push("/error-permisos")
      }
    }
  }, [user, permissions, loading, requiredPermission, router])

  if (loading || !user || !permissions.includes(requiredPermission)) {
    return <p>Cargando... .i.</p> // Mostrar un mensaje de carga mientras se verifica
  }
  

  return <>{children}</>
}

export default ProtectedRoute