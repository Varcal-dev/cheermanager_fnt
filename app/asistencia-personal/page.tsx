"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AsistenciaPersonalPantalla from "@/app/components/asistencia-personal/AsistenciaPersonalPantalla";

// Asistencia del personal: marcar con el carnet, registro por rango y carnets. Permiso base: registrar_asistencia.
export default function AsistenciaPersonalPage() {
  return (
    <ProtectedRoute requiredPermission="registrar_asistencia">
      <AsistenciaPersonalPantalla />
    </ProtectedRoute>
  );
}
