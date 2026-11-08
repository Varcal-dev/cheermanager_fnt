"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import VencimientosPantalla from "@/app/components/vencimientos/VencimientosPantalla";

export default function VencimientosPage() {
  return (
    <ProtectedRoute requiredPermission="ver_deportista">
      <VencimientosPantalla />
    </ProtectedRoute>
  );
}
