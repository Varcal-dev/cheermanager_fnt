"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import RankingPantalla from "@/app/components/ranking/RankingPantalla";

export default function RankingPage() {
  return (
    <ProtectedRoute requiredPermission="ver_evento">
      <RankingPantalla />
    </ProtectedRoute>
  );
}
