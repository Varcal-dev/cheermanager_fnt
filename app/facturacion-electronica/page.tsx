"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ConfigFacturacionPantalla from "@/app/components/facturacion-electronica/ConfigFacturacionPantalla";

export default function FacturacionElectronicaPage() {
  return (
    <ProtectedRoute requiredPermission="gestionar_facturacion_electronica">
      <ConfigFacturacionPantalla />
    </ProtectedRoute>
  );
}
