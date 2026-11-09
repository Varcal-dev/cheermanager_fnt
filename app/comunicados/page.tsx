"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ComunicadosPantalla from "@/app/components/comunicados/ComunicadosPantalla";

export default function ComunicadosPage() {
  return (
    <ProtectedRoute requiredPermission="ver_comunicados">
      <ComunicadosPantalla />
    </ProtectedRoute>
  );
}
