"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import LesionesPantalla from "@/app/components/lesiones/LesionesPantalla";

export default function LesionesPage() {
  return (
    <ProtectedRoute requiredPermission="ver_lesiones">
      <LesionesPantalla />
    </ProtectedRoute>
  );
}
