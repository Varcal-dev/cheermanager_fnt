"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import ReportesPantalla from "@/app/components/reportes/ReportesPantalla";

// Reportes: resumen financiero por rango de fechas y exportes CSV. Permiso: generar_reporte_financiero.
export default function ReportesPage() {
  return (
    <ProtectedRoute requiredPermission="generar_reporte_financiero">
      <ReportesPantalla />
    </ProtectedRoute>
  );
}
