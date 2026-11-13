"use client";

import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { PlanPago } from "@/lib/deportistas-historiales";
import type { Deportista, Nivel } from "@/app/deportistas/types";
import { calcularEdad } from "@/app/deportistas/utils";
import DeportistaAcciones from "./DeportistaAcciones";
import DeportistaDetalle from "./DeportistaDetalle";

interface Props {
  deportista: Deportista;
  expandido: boolean;
  /** true si aún no tiene inscripción (se ofrece "Matricular"). */
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

/** Fila de la tabla de deportistas (con sus acciones) y, si está expandida, su detalle. */
export default function DeportistaFila({
  deportista,
  expandido,
  sinInscripcion,
  niveles,
  planesPago,
  onToggle,
  onEditar,
  onClave,
  onRetirar,
  onReactivar,
  onNivelCambiado,
}: Props) {
  const nombreCompleto = `${deportista.nombre} ${deportista.apellidos}`;
  const retirado = deportista.estadoNombre === "Retirado";

  return (
    <React.Fragment>
      <TableRow>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {expandido ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-xs font-semibold text-accent">
              {`${deportista.nombre?.[0] ?? ""}${deportista.apellidos?.[0] ?? ""}`.toUpperCase()}
            </span>
            <span>{nombreCompleto}</span>
          </div>
        </TableCell>
        <TableCell>{calcularEdad(deportista.fechaNacimiento)} años</TableCell>
        <TableCell>{deportista.genero}</TableCell>
        <TableCell>{deportista.nivelNombre ?? "Sin nivel"}</TableCell>
        <TableCell>
          {deportista.grupos?.map((grupo, index) => (
            <Badge key={index} variant="outline" className="mr-1">
              {grupo}
            </Badge>
          ))}
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant={deportista.estadoNombre === "Activo" ? "success" : "secondary"}>
              {deportista.estadoNombre}
            </Badge>
            {sinInscripcion && !retirado && (
              <Badge variant="warning" title="Aún no tiene inscripción: no se le factura ni entra a un grupo">
                Sin matricular
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <DeportistaAcciones
            deportista={deportista}
            sinInscripcion={sinInscripcion}
            onEditar={onEditar}
            onClave={onClave}
            onRetirar={onRetirar}
            onReactivar={onReactivar}
          />
        </TableCell>
      </TableRow>

      {expandido && (
        <TableRow className="bg-muted/50">
          <TableCell colSpan={8} className="p-0">
            <div className="p-4">
              <DeportistaDetalle
                deportista={deportista}
                niveles={niveles}
                planesPago={planesPago}
                onNivelCambiado={onNivelCambiado}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}