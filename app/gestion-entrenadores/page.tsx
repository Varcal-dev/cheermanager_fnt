"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import GestionEntrenadoresPantalla from "@/app/components/gestion-entrenadores/GestionEntrenadoresPantalla";

export default function GestionEntrenadoresPage() {
  return (
    <ProtectedRoute requiredPermission="ver_entrenador">
      <GestionEntrenadoresPantalla />
    </ProtectedRoute>
  );
}
