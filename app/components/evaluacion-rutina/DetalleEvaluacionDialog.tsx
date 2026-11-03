"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EvaluacionRutinaResultado } from "@/app/lib/evaluacion-rutina";
import { ETIQUETA_SECCION, formatearFecha } from "./comunes";
import ResumenCierre from "./ResumenCierre";

interface Props {
  /** Evaluación ya guardada a mostrar; null = diálogo cerrado. */
  evaluacion: EvaluacionRutinaResultado | null;
  onClose: () => void;
}

export default function DetalleEvaluacionDialog({ evaluacion, onClose }: Props) {
  return (
    <Dialog open={evaluacion !== null} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {evaluacion?.evento} — {evaluacion && formatearFecha(evaluacion.fecha)}
          </DialogTitle>
        </DialogHeader>
        {evaluacion && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
              <span className="text-sm text-muted-foreground">
                {evaluacion.nombreGrupo} · {evaluacion.nivel}
              </span>
              <span className="text-2xl font-bold">{evaluacion.puntajeTotal.toFixed(2)}</span>
            </div>
            <ResumenCierre evaluacion={evaluacion} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sub-criterio</TableHead>
                  <TableHead>Sección</TableHead>
                  <TableHead className="text-right">Puntaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluacion.registros.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.nombreSubCriterio}</TableCell>
                    <TableCell className="text-muted-foreground">{ETIQUETA_SECCION[r.seccion]}</TableCell>
                    <TableCell className="text-right font-medium">{r.puntajeFinal.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {evaluacion.observaciones && <p className="text-sm text-muted-foreground">{evaluacion.observaciones}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
