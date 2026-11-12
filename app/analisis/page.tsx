"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AnalisisPantalla from "@/app/components/reportes/AnalisisPantalla";

// Análisis histórico del club (altas, asistencia, retención, evaluaciones, cobrado). Permiso: ver_dash_organizacion.
export default function AnalisisPage() {
  return (
    <ProtectedRoute requiredPermission="ver_dash_organizacion">
      <AnalisisPantalla />
    </ProtectedRoute>
  );
}
