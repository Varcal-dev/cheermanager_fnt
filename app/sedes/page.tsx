"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SedesPantalla from "@/app/components/sedes/SedesPantalla";

export default function SedesPage() {
  return (
    <ProtectedRoute requiredPermission="ver_sedes">
      <SedesPantalla />
    </ProtectedRoute>
  );
}
