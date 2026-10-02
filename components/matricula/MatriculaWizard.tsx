"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Check } from "lucide-react";
import { useMatriculaState } from "./useMatriculaState";
import { EstadoMatricula, PasoMatricula } from "@/app/lib/matricula";
import PasoDeportista from "./PasoDeportista";
import PasoPlanPago from "./PasoPlanPago";
import PasoGrupo from "./PasoGrupo";
import PasoConfirmacion from "./PasoConfirmacion";

const PASOS: { id: PasoMatricula; label: string }[] = [
  { id: "deportista", label: "Deportista" },
  { id: "plan", label: "Plan de pago" },
  { id: "grupo", label: "Grupo" },
  { id: "confirmacion", label: "Confirmar" },
];

export default function MatriculaWizard({
  open,
  onOpenChange,
  estadoInicial,
  onCompletado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estadoInicial?: EstadoMatricula;
  onCompletado: () => void;
}) {
  const wizard = useMatriculaState(estadoInicial);
  const pasoActualIndex = PASOS.findIndex((p) => p.id === wizard.estado.paso);

  const cerrar = (nuevoOpen: boolean) => {
    // No hay "cancelar" destructivo: cualquier avance ya está guardado en
    // el backend. Cerrar simplemente pausa; la fila de inscripciones
    // refleja el estado real y permite continuar después.
    onOpenChange(nuevoOpen);
    if (!nuevoOpen) onCompletado();
  };

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Matricular deportista
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          {PASOS.map((paso, i) => (
            <div key={paso.id} className="flex items-center gap-2 flex-1">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                  i < pasoActualIndex
                    ? "bg-green-600 text-white"
                    : i === pasoActualIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < pasoActualIndex ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {paso.label}
              </span>
              {i < PASOS.length - 1 && (
                <div className="h-px bg-border flex-1" />
              )}
            </div>
          ))}
        </div>

        {wizard.estado.paso === "deportista" && (
          <PasoDeportista onSeleccionar={wizard.elegirDeportista} />
        )}
        {wizard.estado.paso === "plan" && wizard.estado.deportista && (
          <PasoPlanPago
            deportista={wizard.estado.deportista}
            guardando={wizard.guardando}
            permitirVolver={!wizard.estado.inscripcionId}
            onVolver={() => wizard.irA("deportista")}
            onConfirmar={wizard.confirmarPlan}
          />
        )}
        {wizard.estado.paso === "grupo" && wizard.estado.deportista && (
          <PasoGrupo
            deportistaId={wizard.estado.deportista.deportista_id}
            guardando={wizard.guardando}
            onVolver={() => wizard.irA("plan")}
            onConfirmar={wizard.confirmarGrupo}
          />
        )}
        {wizard.estado.paso === "confirmacion" && (
          <PasoConfirmacion
            estado={wizard.estado}
            onCerrar={() => cerrar(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}