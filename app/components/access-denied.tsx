"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface AccessDeniedProps {
  hasAccess: boolean
  redirectTo?: string
}

export function AccessDenied({ hasAccess, redirectTo = "/error-permisos" }: AccessDeniedProps) {
  const router = useRouter()

  useEffect(() => {
    if (!hasAccess) {
      router.push(redirectTo)
    }
  }, [hasAccess, redirectTo, router])

  if (!hasAccess) {
    return null
  }

  return null
}
