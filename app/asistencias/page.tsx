"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { AsistenciasView } from "@/app/components/asistencias/asistencias-view";

// Registro manual de asistencia, consulta por periodo y métricas. Permiso: registrar_asistencia.
// El pase de lista con carnet vive en /asistencias/escaneo.
export default function AsistenciasPage() {
  return (
    <ProtectedRoute requiredPermission="registrar_asistencia">
      <AsistenciasView />
    </ProtectedRoute>
  );
}
