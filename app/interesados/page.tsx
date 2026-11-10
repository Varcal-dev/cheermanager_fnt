"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import InteresadosPantalla from "@/app/components/interesados/InteresadosPantalla";

export default function InteresadosPage() {
  return (
    <ProtectedRoute requiredPermission="ver_interesados">
      <InteresadosPantalla />
    </ProtectedRoute>
  );
}
