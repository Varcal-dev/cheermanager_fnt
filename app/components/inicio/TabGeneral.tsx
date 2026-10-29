"use client";

import Link from "next/link";
import { Award, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumenInicio } from "@/app/lib/dashboard";
import { formatCOP } from "@/app/lib/facturas-pagos";
import { AlertItem, Cargando, SinDatos } from "./comunes";

interface Props {
  resumen: ResumenInicio | null;
  cargando: boolean;
  inscripcionesSinGrupo: number;
}

type Alerta = {
  title: string;
  description: string;
  type: "warning" | "info";
};

/** Alertas a mostrar según el resumen (cartera, inscripciones sin grupo, condiciones médicas, evento). */
function construirAlertas(resumen: ResumenInicio | null, inscripcionesSinGrupo: number): Alerta[] {
  if (!resumen) return [];
  const alertas: Alerta[] = [];
  if (resumen.facturasConSaldoPendiente > 0) {
    alertas.push({
      title: "Cartera pendiente",
      description: `${resumen.facturasConSaldoPendiente} facturas con saldo por ${formatCOP(
        resumen.carteraPendienteTotal,
      )}`,
      type: "warning",
    });
  }
  if (inscripcionesSinGrupo > 0) {
    alertas.push({
      title: "Inscripciones sin grupo",
      description: `${inscripcionesSinGrupo} deportistas esperando asignación de grupo`,
      type: "warning",
    });
  }
  if (resumen.alertasCondicionMedicaActiva > 0) {
    alertas.push({
      title: "Condiciones médicas activas",
      description: `${resumen.alertasCondicionMedicaActiva} deportistas con una condición médica activa registrada`,
      type: "info",
    });
  }
  if (resumen.proximoEvento) {
    alertas.push({
      title: "Evento próximo",
      description: `${resumen.proximoEvento.nombre} en ${resumen.proximoEvento.diasRestantes} días`,
      type: "info",
    });
  }
  return alertas;
}

/** Pestaña General — alertas y próximo evento (datos del resumen de inicio). */
export default function TabGeneral({ resumen, cargando, inscripcionesSinGrupo }: Props) {
  const alertas = construirAlertas(resumen, inscripcionesSinGrupo);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Alertas Importantes</CardTitle>
          <AlertTriangle className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {cargando ? (
            <Cargando />
          ) : alertas.length === 0 ? (
            <SinDatos>Todo al día — no hay alertas pendientes.</SinDatos>
          ) : (
            <div className="space-y-4">
              {alertas.map((alerta, i) => (
                <AlertItem key={i} title={alerta.title} description={alerta.description} type={alerta.type} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximo Evento</CardTitle>
          <CardDescription>Según el calendario de competencias</CardDescription>
        </CardHeader>
        <CardContent>
          {cargando ? (
            <Cargando />
          ) : resumen?.proximoEvento ? (
            <div className="flex items-start space-x-4">
              <div className="rounded-full p-2 bg-primary/10 text-primary">
                <Award className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{resumen.proximoEvento.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(resumen.proximoEvento.fecha).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">{resumen.proximoEvento.diasRestantes} días restantes</p>
              </div>
            </div>
          ) : (
            <SinDatos>No hay eventos agendados todavía.</SinDatos>
          )}
          <Link href="/eventos" className="text-sm text-primary hover:underline block text-center mt-4">
            Ver todos los eventos
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
