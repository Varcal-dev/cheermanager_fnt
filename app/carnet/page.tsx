"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CarnetPantalla from "@/app/components/carnet/CarnetPantalla";

export default function CarnetPage() {
  return (
    <ProtectedRoute requiredPermission="ver_deportista">
      <CarnetPantalla />
    </ProtectedRoute>
  );
}
