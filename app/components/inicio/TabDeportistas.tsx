"use client";

import { AlertTriangle, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ResumenPersonas } from "@/app/lib/dashboard";
import { type CargaPerezosa, KpiCard, MiniPieChart, PestanaResumen, SinDatos } from "./comunes";

/** Pestaña Deportistas — /api/dashboard/personas */
export default function TabDeportistas({ estado }: { estado: CargaPerezosa<ResumenPersonas> }) {
  return (
    <PestanaResumen estado={estado} fallo="No se pudo cargar el resumen de deportistas.">
      {(d) => (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total deportistas"
              value={String(d.totalDeportistas)}
              description={`${d.deportistasConCondicionMedicaActiva} con condición médica activa`}
              icon={<Users className="h-5 w-5" />}
              tone="primary"
              link="/deportistas"
            />
            <KpiCard
              title="Altas (30 días)"
              value={String(d.altasRecientes)}
              description="deportistas activados"
              icon={<UserPlus className="h-5 w-5" />}
              tone="success"
              link="/deportistas"
            />
            <KpiCard
              title="Bajas (30 días)"
              value={String(d.bajasRecientes)}
              description="deportistas retirados"
              icon={<AlertTriangle className="h-5 w-5" />}
              tone="destructive"
              link="/deportistas"
            />
            <KpiCard
              title="Entrenadores"
              value={String(d.totalEntrenadores)}
              description="cuerpo técnico activo"
              icon={<ShieldCheck className="h-5 w-5" />}
              tone="accent"
              link="/entrenadores"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Por estado</CardTitle>
              </CardHeader>
              <CardContent>
                <MiniPieChart data={d.deportistasPorEstado} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Por género</CardTitle>
              </CardHeader>
              <CardContent>
                <MiniPieChart data={d.deportistasPorGenero} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Por división</CardTitle>
              </CardHeader>
              <CardContent>
                <MiniPieChart data={d.deportistasPorDivision} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Entrenadores</CardTitle>
                <CardDescription>Grupos a cargo por entrenador</CardDescription>
              </CardHeader>
              <CardContent>
                {d.entrenadores.length === 0 ? (
                  <SinDatos>No hay entrenadores registrados.</SinDatos>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Especialización</TableHead>
                        <TableHead className="text-right">Grupos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.entrenadores.map((e) => (
                        <TableRow key={e.entrenadorId}>
                          <TableCell className="font-medium">{e.nombreCompleto}</TableCell>
                          <TableCell className="text-muted-foreground">{e.especializacion || "—"}</TableCell>
                          <TableCell className="text-right">{e.gruposACargo}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Movimientos recientes</CardTitle>
                <CardDescription>Altas y bajas de deportistas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.movimientosRecientes.length === 0 ? (
                  <SinDatos>Sin movimientos en el período.</SinDatos>
                ) : (
                  d.movimientosRecientes.slice(0, 8).map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{m.nombreCompleto}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.fechaCambio).toLocaleDateString()}
                          {m.motivo ? ` · ${m.motivo}` : ""}
                        </p>
                      </div>
                      <Badge variant={m.esAlta ? "success" : "destructive"}>{m.estadoNuevo}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </PestanaResumen>
  );
}
