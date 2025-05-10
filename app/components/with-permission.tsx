"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"

interface WithPermissionProps {
  hasPermission: boolean
  children: ReactNode
  fallback?: ReactNode
}

export function WithPermission({ hasPermission, children, fallback }: WithPermissionProps) {
  const router = useRouter()

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>
    }

    router.push("/error-permisos")
    return null
  }

  return <>{children}</>
}
