"use client";

import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import type { EvaluacionRutinaResultado } from "@/app/lib/evaluacion-rutina";
import CapturaEvaluacion from "./CapturaEvaluacion";
import DetalleEvaluacionDialog from "./DetalleEvaluacionDialog";
import HistorialEvaluaciones from "./HistorialEvaluaciones";
import RevisionEvaluacionDialog from "./RevisionEvaluacionDialog";
import { useCapturaEvaluacion } from "./useCapturaEvaluacion";
import { useHistorialEvaluaciones } from "./useHistorialEvaluaciones";

/** Pantalla de evaluación de rutina (histórico + captura). La usan /evaluaciones y /evaluacion-rutina. */
export default function EvaluacionRutinaPantalla({ permisoVer }: { permisoVer: string }) {
  return (
    <ProtectedRoute requiredPermission={permisoVer}>
      <Contenido />
    </ProtectedRoute>
  );
}

function Contenido() {
  const { permissions } = useUser();
  const puedeCrear = permissions.includes("crear_evaluacion_rutina");
  const puedeEliminar = permissions.includes("eliminar_evaluacion");

  const [modo, setModo] = useState<"lista" | "captura">("lista");
  const [detalle, setDetalle] = useState<EvaluacionRutinaResultado | null>(null);

  const historial = useHistorialEvaluaciones();
  const captura = useCapturaEvaluacion((grupoId) => {
    setModo("lista");
    historial.mostrarGrupo(String(grupoId));
  });

  const abrirCaptura = () => {
    setModo("captura");
    captura.iniciar();
  };
  const cancelarCaptura = () => {
    setModo("lista");
    captura.reiniciar();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluación de rutina</h1>
          <p className="text-muted-foreground">Rúbrica United Scoring System (FEDECOLCHEER 2026) por grupo</p>
        </div>
        {modo === "lista" ? (
          puedeCrear && (
            <Button onClick={abrirCaptura}>
              <Plus className="h-4 w-4 mr-2" /> Nueva evaluación
            </Button>
          )
        ) : (
          <Button variant="outline" onClick={cancelarCaptura}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver al listado
          </Button>
        )}
      </div>

      {modo === "lista" ? (
        <HistorialEvaluaciones historial={historial} puedeEliminar={puedeEliminar} onVerDetalle={setDetalle} />
      ) : (
        <CapturaEvaluacion captura={captura} grupos={historial.grupos} />
      )}

      <RevisionEvaluacionDialog
        resultado={captura.preview}
        guardando={captura.guardando}
        onCorregir={captura.cerrarPreview}
        onGuardar={captura.confirmarGuardado}
      />
      <DetalleEvaluacionDialog evaluacion={detalle} onClose={() => setDetalle(null)} />
    </div>
  );
}
