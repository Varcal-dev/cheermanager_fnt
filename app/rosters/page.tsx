"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import RostersPantalla from "@/app/components/rosters/RostersPantalla";

export default function RostersPage() {
  return (
    <ProtectedRoute requiredPermission="ver_evento">
      <RostersPantalla />
    </ProtectedRoute>
  );
}
