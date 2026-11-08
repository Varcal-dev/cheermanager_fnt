"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import UniformesPantalla from "@/app/components/uniformes/UniformesPantalla";

export default function UniformesPage() {
  return (
    <ProtectedRoute requiredPermission="ver_deportista">
      <UniformesPantalla />
    </ProtectedRoute>
  );
}
