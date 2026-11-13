"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import EscaneoAsistencia from "@/app/components/asistencias/EscaneoAsistencia";

// Pasar lista escaneando el carnet de cada deportista. Permiso: registrar_asistencia.
export default function EscaneoPage() {
  return (
    <ProtectedRoute requiredPermission="registrar_asistencia">
      <EscaneoAsistencia />
    </ProtectedRoute>
  );
}
