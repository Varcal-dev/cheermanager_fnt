"use client";

import { Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SECCIONES, type EvaluacionRutinaResultado } from "@/app/lib/evaluacion-rutina";
import { ETIQUETA_SECCION } from "./comunes";
import ResumenCierre from "./ResumenCierre";

interface Props {
  /** Resultado calculado sin guardar; null = diálogo cerrado. */
  resultado: EvaluacionRutinaResultado | null;
  guardando: boolean;
  onCorregir: () => void;
  onGuardar: () => void;
}

export default function RevisionEvaluacionDialog({ resultado, guardando, onCorregir, onGuardar }: Props) {
  return (
    <Dialog open={resultado !== null} onOpenChange={(abierto) => !abierto && onCorregir()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar antes de guardar</DialogTitle>
        </DialogHeader>
        {resultado && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
              <div>
                <p className="text-sm text-muted-foreground">
                  {resultado.nombreGrupo} · {resultado.nivel} · {resultado.evento}
                </p>
                <p className="text-xs text-muted-foreground">Compara este total contra la hoja de papel antes de confirmar.</p>
              </div>
              <div className="text-3xl font-bold flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                {resultado.puntajeTotal.toFixed(2)}
              </div>
            </div>

            <ResumenCierre evaluacion={resultado} />

            {SECCIONES.map((seccion) => {
              const filas = resultado.registros.filter((r) => r.seccion === seccion);
              if (filas.length === 0) return null;
              const subtotal = filas.reduce((acc, r) => acc + r.puntajeFinal, 0);
              return (
                <div key={seccion}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">{ETIQUETA_SECCION[seccion]}</h4>
                    <span className="text-sm text-muted-foreground">{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {filas.map((r, i) => (
                      <div key={i} className="text-sm border-b pb-1.5 last:border-0">
                        <div className="flex items-center justify-between">
                          <span>{r.nombreSubCriterio}</span>
                          <span className="font-medium">{r.puntajeFinal.toFixed(2)}</span>
                        </div>
                        {r.detalleCalculo && <p className="text-xs text-muted-foreground">{r.detalleCalculo}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCorregir}>
            Corregir
          </Button>
          <Button onClick={onGuardar} disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar evaluación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
