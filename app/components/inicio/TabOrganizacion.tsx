"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ResumenOrganizacion } from "@/app/lib/dashboard";
import { type CargaPerezosa, MiniPieChart, PestanaResumen, SinDatos } from "./comunes";

/** Pestaña Organización — /api/dashboard/organizacion */
export default function TabOrganizacion({ estado }: { estado: CargaPerezosa<ResumenOrganizacion> }) {
  return (
    <PestanaResumen estado={estado} fallo="No se pudo cargar el resumen de grupos.">
      {(d) => (
        <>
          {d.gruposPorDebajoDelMinimo.length > 0 && (
            <Card className="border-destructive/40">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm">
                  {d.gruposPorDebajoDelMinimo.length} grupo(s) por debajo del mínimo requerido
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {d.gruposPorDebajoDelMinimo.map((g) => (
                  <Badge key={g.grupoId} variant="destructive">
                    {g.nombreGrupo} ({g.deportistasActivos}/{g.cantidadMinRequerida})
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Grupos</CardTitle>
                <CardDescription>Ocupación actual por grupo</CardDescription>
              </CardHeader>
              <CardContent>
                {d.gruposConOcupacion.length === 0 ? (
                  <SinDatos>No hay grupos registrados.</SinDatos>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Nivel</TableHead>
                        <TableHead className="text-right">Activos</TableHead>
                        <TableHead className="text-right">H / M</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.gruposConOcupacion.map((g) => {
                        const bajoMinimo =
                          g.cantidadMinRequerida != null && g.deportistasActivos < g.cantidadMinRequerida;
                        return (
                          <TableRow key={g.grupoId}>
                            <TableCell className="font-medium">{g.nombreGrupo}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {g.nivel} · {g.division}
                            </TableCell>
                            <TableCell className="text-right">
                              {g.deportistasActivos}
                              {g.cantidadMinRequerida != null && (
                                <span className="text-muted-foreground"> / {g.cantidadMinRequerida}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {g.hombres} / {g.mujeres}
                            </TableCell>
                            <TableCell>
                              {bajoMinimo ? (
                                <Badge variant="destructive">Bajo mínimo</Badge>
                              ) : (
                                <Badge variant="success">OK</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grupos por nivel</CardTitle>
              </CardHeader>
              <CardContent>
                <MiniPieChart data={d.gruposPorNivel} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PestanaResumen>
  );
}
