"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ViajesPantalla from "@/app/components/viajes/ViajesPantalla";

export default function ViajesPage() {
  return (
    <ProtectedRoute requiredPermission="ver_viajes">
      <ViajesPantalla />
    </ProtectedRoute>
  );
}
