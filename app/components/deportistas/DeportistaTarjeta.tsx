"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlanPago } from "@/lib/deportistas-historiales";
import type { Deportista, Nivel } from "@/app/deportistas/types";
import { calcularEdad } from "@/app/deportistas/utils";
import DeportistaAcciones from "./DeportistaAcciones";
import DeportistaDetalle from "./DeportistaDetalle";

interface Props {
  deportista: Deportista;
  expandido: boolean;
  sinInscripcion: boolean;
  niveles: Nivel[];
  planesPago: PlanPago[];
  onToggle: () => void;
  onEditar: () => void;
  onClave: () => void;
  onRetirar: () => void;
  onReactivar: () => void;
  onNivelCambiado: () => void;
}

/** Deportista como tarjeta (teléfono). Misma información y acciones que la fila de la tabla. */
export default function DeportistaTarjeta({
  deportista,
  expandido,
  sinInscripcion,
  niveles,
  planesPago,
  onToggle,
  onNivelCambiado,
  ...acciones
}: Props) {
  const nombreCompleto = `${deportista.nombre} ${deportista.apellidos}`;
  const retirado = deportista.estadoNombre === "Retirado";

  return (
    <li className="rounded-lg border bg-card">
      <div className="space-y-3 p-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-sm font-semibold text-accent">
            {`${deportista.nombre?.[0] ?? ""}${deportista.apellidos?.[0] ?? ""}`.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{nombreCompleto}</p>
            <p className="text-xs text-muted-foreground">
              {calcularEdad(deportista.fechaNacimiento)} años · {deportista.genero} · {deportista.nivelNombre ?? "Sin nivel"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={onToggle}
            aria-expanded={expandido}
            aria-label={expandido ? `Ocultar detalle de ${nombreCompleto}` : `Ver detalle de ${nombreCompleto}`}
          >
            {expandido ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Badge variant={deportista.estadoNombre === "Activo" ? "success" : "secondary"}>{deportista.estadoNombre}</Badge>
          {sinInscripcion && !retirado && <Badge variant="warning">Sin matricular</Badge>}
          {deportista.grupos?.map((grupo, i) => (
            <Badge key={i} variant="outline">
              {grupo}
            </Badge>
          ))}
        </div>

        <div className="border-t pt-3 [&_button]:min-h-11">
          <DeportistaAcciones deportista={deportista} sinInscripcion={sinInscripcion} {...acciones} />
        </div>
      </div>

      {expandido && (
        <div className="border-t bg-muted/50 p-3">
          <DeportistaDetalle
            deportista={deportista}
            niveles={niveles}
            planesPago={planesPago}
            onNivelCambiado={onNivelCambiado}
          />
        </div>
      )}
    </li>
  );
}
