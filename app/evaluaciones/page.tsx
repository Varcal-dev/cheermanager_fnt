"use client";

import EvaluacionRutinaPantalla from "@/app/components/evaluacion-rutina/EvaluacionRutinaPantalla";

// Hoy esta ruta muestra la misma pantalla que /evaluacion-rutina (el código original era una copia).
// Cuando exista una pantalla propia de evaluaciones, se reemplaza aquí.
export default function EvaluacionesPage() {
  return <EvaluacionRutinaPantalla permisoVer="ver_evaluacion" />;
}
