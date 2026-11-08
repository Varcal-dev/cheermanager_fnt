"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SolicitudesTitularPantalla from "@/app/components/solicitudes/SolicitudesTitularPantalla";

export default function SolicitudesTitularPage() {
  return (
    <ProtectedRoute requiredPermission="ver_consentimientos">
      <SolicitudesTitularPantalla />
    </ProtectedRoute>
  );
}
