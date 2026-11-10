"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PlanYDatosPantalla from "@/app/components/suscripcion/PlanYDatosPantalla";

export default function PlanYDatosPage() {
  return (
    <ProtectedRoute requiredPermission="ver_dash_administracion">
      <PlanYDatosPantalla />
    </ProtectedRoute>
  );
}
