"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import HabilidadesPantalla from "@/app/components/habilidades/HabilidadesPantalla";

export default function HabilidadesPage() {
  return (
    <ProtectedRoute requiredPermission="ver_evaluaciones">
      <HabilidadesPantalla />
    </ProtectedRoute>
  );
}
