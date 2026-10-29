"use client";

import { LineChart as LineChartIcon } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProgresionGrupo, ResumenEvaluacion } from "@/app/lib/dashboard";
import { type CargaPerezosa, Cargando, PestanaResumen, SinDatos } from "./comunes";

interface Props {
  estado: CargaPerezosa<ResumenEvaluacion>;
  grupoProgresion: ProgresionGrupo | null;
  cargandoProgresion: boolean;
  onVerProgresion: (grupoId: number) => void;
  onCerrarProgresion: () => void;
}

/** Pestaña Evaluación — /api/dashboard/evaluacion, con la progresión de un grupo en un diálogo. */
export default function TabEvaluacion({
  estado,
  grupoProgresion,
  cargandoProgresion,
  onVerProgresion,
  onCerrarProgresion,
}: Props) {
  return (
    <>
      <PestanaResumen estado={estado} fallo="No se pudo cargar el resumen de evaluaciones.">
        {(d) => (
          <Card>
            <CardHeader>
              <CardTitle>Último puntaje por grupo</CardTitle>
              <CardDescription>Clic en un grupo para ver su progresión</CardDescription>
            </CardHeader>
            <CardContent>
              {d.ultimosPuntajesPorGrupo.length === 0 ? (
                <SinDatos>Todavía no hay evaluaciones de rutina registradas.</SinDatos>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead className="text-right">Puntaje</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.ultimosPuntajesPorGrupo.map((g) => (
                      <TableRow
                        key={g.grupoId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onVerProgresion(g.grupoId)}
                      >
                        <TableCell className="font-medium">{g.nombreGrupo}</TableCell>
                        <TableCell className="text-muted-foreground">{g.nivel}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(g.fecha).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{g.evento}</TableCell>
                        <TableCell className="text-right font-bold">{g.puntajeTotal.toFixed(2)}</TableCell>
                        <TableCell>
                          <LineChartIcon className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </PestanaResumen>

      <Dialog
        open={cargandoProgresion || grupoProgresion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) onCerrarProgresion();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{grupoProgresion?.nombreGrupo ?? "Progresión del grupo"}</DialogTitle>
          </DialogHeader>
          {cargandoProgresion ? (
            <Cargando />
          ) : grupoProgresion && grupoProgresion.puntos.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={grupoProgresion.puntos}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" fontSize={11} tickFormatter={(v) => new Date(v).toLocaleDateString()} />
                <YAxis fontSize={11} />
                <RTooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />
                <Line
                  type="monotone"
                  dataKey="puntajeTotal"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <SinDatos>Este grupo todavía no tiene histórico de evaluaciones.</SinDatos>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
