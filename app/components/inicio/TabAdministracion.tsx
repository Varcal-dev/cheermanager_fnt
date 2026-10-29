"use client";

import Link from "next/link";
import { CalendarClock, ClipboardList, DollarSign, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ResumenAdministracion } from "@/app/lib/dashboard";
import { formatCOP } from "@/app/lib/facturas-pagos";
import { type CargaPerezosa, KpiCard, PestanaResumen, SinDatos } from "./comunes";

/** Pestaña Administración — /api/dashboard/administracion */
export default function TabAdministracion({ estado }: { estado: CargaPerezosa<ResumenAdministracion> }) {
  return (
    <PestanaResumen estado={estado} fallo="No se pudo cargar el resumen administrativo.">
      {(d) => (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Recaudo del mes"
              value={formatCOP(d.recaudoMesActual)}
              description={formatCOP(d.carteraPendienteTotal) + " en cartera"}
              icon={<DollarSign className="h-5 w-5" />}
              tone="success"
              link="/facturas"
            />
            <KpiCard
              title="Asistencia (30 días)"
              value={
                d.porcentajeAsistenciaGeneral30Dias != null
                  ? `${d.porcentajeAsistenciaGeneral30Dias.toFixed(0)}%`
                  : "Sin datos"
              }
              description="salud operativa general"
              icon={<CalendarClock className="h-5 w-5" />}
              tone="accent"
              link="/asistencias"
            />
            <KpiCard
              title="Puntaje promedio club"
              value={d.puntajePromedioClub != null ? d.puntajePromedioClub.toFixed(2) : "Sin datos"}
              description={`${d.gruposConEvaluacionReciente} grupos evaluados`}
              icon={<ClipboardList className="h-5 w-5" />}
              tone="primary"
              link="/evaluaciones"
            />
            <KpiCard
              title="Usuarios activos (7 días)"
              value={String(d.usuariosActivos7Dias)}
              description={`${d.loginsExitosos7Dias} logins exitosos · ${d.loginsFallidos7Dias} fallidos`}
              icon={<ShieldCheck className="h-5 w-5" />}
              tone="destructive"
              link="/usuarios"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Auditoría reciente</CardTitle>
              <CardDescription>Últimos cambios registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {d.auditoriaReciente.length === 0 ? (
                <SinDatos>Sin actividad reciente registrada.</SinDatos>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Tabla</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.auditoriaReciente.map((a, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{a.usuario}</TableCell>
                        <TableCell className="text-muted-foreground">{a.tablaAfectada}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              a.accion === "DELETE" ? "destructive" : a.accion === "CREATE" ? "success" : "secondary"
                            }
                          >
                            {a.accion}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(a.fecha).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Link href="/auditoria" className="text-sm text-primary hover:underline block text-center mt-4">
                Ver auditoría completa
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </PestanaResumen>
  );
}
