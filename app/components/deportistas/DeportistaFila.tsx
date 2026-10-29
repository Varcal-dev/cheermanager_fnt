"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, KeyRound, Pencil, RotateCcw, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useUser } from "@/context/UserContext";
import type { PlanPago } from "@/lib/deportistas-historiales";
import type { Deportista, Nivel } from "@/app/deportistas/types";
import { calcularEdad } from "@/app/deportistas/utils";
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
  const { permissions } = useUser();
  const router = useRouter();
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
        <TableCell>{deportista.nivelNombre}</TableCell>
        <TableCell>
          {deportista.grupos?.map((grupo, index) => (
            <Badge key={index} variant="outline" className="mr-1">
              {grupo}
            </Badge>
          ))}
        </TableCell>
        <TableCell>
          <Badge variant={deportista.estadoNombre === "Activo" ? "success" : "secondary"}>
            {deportista.estadoNombre}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            {permissions.includes("modificar_deportista") && (
              <Button variant="outline" size="sm" onClick={onEditar}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
            )}
            {permissions.includes("restablecer_clave_usuario") && (
              <Button
                variant="outline"
                size="sm"
                title="Generar clave temporal de acceso"
                onClick={() => {
                  if (confirm(`¿Generar una clave temporal para ${nombreCompleto}? Reemplaza la clave actual.`)) {
                    onClave();
                  }
                }}
              >
                <KeyRound className="h-4 w-4 mr-1" /> Clave
              </Button>
            )}
            {sinInscripcion && (
              <Button
                variant="outline"
                size="sm"
                className="text-accent border-accent/30 bg-accent/10 hover:bg-accent/20"
                onClick={() =>
                  router.push(
                    `/inscripciones?matricular=${deportista.deportistaId}&nombre=${encodeURIComponent(
                      nombreCompleto,
                    )}&nivel=${encodeURIComponent(deportista.nivelNombre)}`,
                  )
                }
              >
                <UserPlus className="h-4 w-4 mr-1" /> Matricular
              </Button>
            )}
            {permissions.includes("eliminar_deportista") && !retirado && (
              <Button variant="destructive" size="sm" onClick={onRetirar}>
                <Trash2 className="h-4 w-4 mr-1" /> Retirar
              </Button>
            )}
            {permissions.includes("modificar_deportista") && retirado && (
              <Button variant="outline" size="sm" onClick={onReactivar}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reactivar
              </Button>
            )}
          </div>
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
