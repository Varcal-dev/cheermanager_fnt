"use client";

import { Eye, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EvaluacionRutinaResultado } from "@/app/lib/evaluacion-rutina";
import { formatearFecha } from "./comunes";
import type { HistorialEvaluaciones as Historial } from "./useHistorialEvaluaciones";

interface Props {
  historial: Historial;
  puedeEliminar: boolean;
  onVerDetalle: (ev: EvaluacionRutinaResultado) => void;
}

export default function HistorialEvaluaciones({ historial, puedeEliminar, onVerDetalle }: Props) {
  const { grupos, grupoId, setGrupoId, evaluaciones, cargando, borrar } = historial;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico por grupo</CardTitle>
        <CardDescription>Selecciona un grupo para ver sus evaluaciones registradas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={grupoId} onValueChange={setGrupoId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Selecciona un grupo" />
          </SelectTrigger>
          <SelectContent>
            {grupos.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {cargando ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
          </div>
        ) : !grupoId ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Elige un grupo para ver su histórico.</p>
        ) : evaluaciones.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Este grupo todavía no tiene evaluaciones de rutina registradas.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead className="text-right">Puntaje</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluaciones.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell>{formatearFecha(ev.fecha)}</TableCell>
                  <TableCell className="font-medium">{ev.evento}</TableCell>
                  <TableCell className="text-muted-foreground">{ev.nivel}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold">{ev.puntajeTotal.toFixed(2)}</span>
                    {ev.puntajeFinal != null && ev.puntajeMaximo != null && (
                      <span className="block text-xs text-muted-foreground">
                        {ev.banda ? `${ev.banda} · ` : "Final "}
                        {ev.puntajeFinal.toFixed(2)}
                        {ev.banda ? "" : " / 100"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => onVerDetalle(ev)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {puedeEliminar && (
                      <Button variant="ghost" size="icon" onClick={() => ev.id && borrar(ev.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
