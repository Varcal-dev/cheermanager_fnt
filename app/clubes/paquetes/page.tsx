"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PaquetesClubPantalla from "@/app/components/clubes/PaquetesClubPantalla";

export default function PaquetesClubPage() {
  return (
    <ProtectedRoute requiredPermission="gestionar_clubes">
      <PaquetesClubPantalla />
    </ProtectedRoute>
  );
}
