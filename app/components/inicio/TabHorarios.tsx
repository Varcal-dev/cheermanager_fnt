"use client";

import { AlertTriangle, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ResumenHorarios } from "@/app/lib/dashboard";
import { Cargando, KpiCard, SinDatos } from "./comunes";

interface Props {
  data: ResumenHorarios | null;
  cargando: boolean;
  dias: string;
  onCambiarDias: (dias: string) => void;
}

/** Pestaña Horarios — /api/dashboard/horarios (se vuelve a consultar al cambiar el rango de días). */
export default function TabHorarios({ data, cargando, dias, onCambiarDias }: Props) {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Asistencia calculada sobre los últimos {data?.diasAnalizados ?? dias} días
        </p>
        <Select value={dias} onValueChange={onCambiarDias}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {cargando ? (
        <Cargando />
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <KpiCard
              title="Asistencia general"
              value={
                data.porcentajeAsistenciaGeneral != null
                  ? `${data.porcentajeAsistenciaGeneral.toFixed(0)}%`
                  : "Sin datos"
              }
              description="promedio simple entre grupos"
              icon={<CalendarClock className="h-5 w-5" />}
              tone="accent"
              link="/asistencias"
            />
            <KpiCard
              title="En riesgo"
              value={String(data.deportistasEnRiesgo.length)}
              description="deportistas bajo 70% de asistencia"
              icon={<AlertTriangle className="h-5 w-5" />}
              tone="destructive"
              link="/asistencias"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asistencia por grupo</CardTitle>
              </CardHeader>
              <CardContent>
                {data.asistenciaPorGrupo.length === 0 ? (
                  <SinDatos>Sin registros de asistencia en el rango.</SinDatos>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grupo</TableHead>
                        <TableHead className="text-right">Presentes</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.asistenciaPorGrupo.map((g) => (
                        <TableRow key={g.grupoId}>
                          <TableCell className="font-medium">{g.nombreGrupo}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {g.presentes} / {g.totalRegistros}
                          </TableCell>
                          <TableCell className="text-right">
                            {g.porcentaje != null ? `${g.porcentaje.toFixed(0)}%` : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deportistas en riesgo</CardTitle>
                <CardDescription>Menos de 70% de asistencia</CardDescription>
              </CardHeader>
              <CardContent>
                {data.deportistasEnRiesgo.length === 0 ? (
                  <SinDatos>Ningún deportista por debajo del 70%.</SinDatos>
                ) : (
                  <div className="space-y-2">
                    {data.deportistasEnRiesgo.map((d) => (
                      <div
                        key={d.deportistaId}
                        className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                      >
                        <span className="font-medium">{d.nombreCompleto}</span>
                        <Badge variant="destructive">{d.porcentaje.toFixed(0)}%</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <SinDatos>No se pudo cargar el resumen de asistencia.</SinDatos>
      )}
    </>
  );
}
