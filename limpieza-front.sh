#!/usr/bin/env bash
# Limpieza del front de CheerManager (C14). Ejecutar desde la raíz del front.
# Todo lo que se borra fue verificado: no lo importa ninguna página (ni directa ni indirectamente).
set -euo pipefail
[ -f package.json ] && [ -d app ] || { echo "Ejecuta esto en la raíz del front"; exit 1; }

# Copias duplicadas idénticas (la app usa app/components/*)
rm -rf components/eventos components/matricula
# ProtectedRoute: queda components/ProtectedRoute.tsx (ya con la redirección a /mi)
rm -f app/components/ProtectedRoute.tsx
# UI duplicada y sin uso (la app usa @/components/ui/*)
rm -rf app/components/ui
# Componentes y utilidades sin ningún import
rm -f app/components/access-denied.tsx app/components/with-permission.tsx
rm -f app/components/Forms/DeportistaElegibleItem.tsx
rm -f app/lib/navetagation.ts app/lib/utils.ts
rm -rf app/lib/data
rm -f components/theme-provider.tsx
# Pila de toasts de shadcn/radix y sonner: la app usa react-toastify
rm -f components/ui/toast.tsx components/ui/toaster.tsx components/ui/use-toast.ts components/ui/sonner.tsx hooks/use-toast.ts
echo "Listo. Ahora: npm install && npm run build"
