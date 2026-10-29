"use client";

import React from "react";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { useUser } from "@/context/UserContext";
import type { Entrenador } from "@/app/entrenadores/types";
import EntrenadorDetalle from "./EntrenadorDetalle";

interface Props {
  entrenador: Entrenador;
  expandido: boolean;
  onToggle: () => void;
  onEditar: () => void;
  onRetirar: () => void;
}

/** Fila de la tabla de entrenadores (con sus acciones) y, si está expandida, su detalle. */
export default function EntrenadorFila({ entrenador, expandido, onToggle, onEditar, onRetirar }: Props) {
  const { permissions } = useUser();
  const retirado = entrenador.estado?.estado === "Retirado";

  return (
    <React.Fragment>
      <TableRow>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {expandido ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium">
          {entrenador.persona?.nombre} {entrenador.persona?.apellidos}
        </TableCell>
        <TableCell>{entrenador.especializacion}</TableCell>
        <TableCell>
          <Badge variant={entrenador.estado?.estado === "Activo" ? "default" : "secondary"}>
            {entrenador.estado?.estado}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            {permissions.includes("modificar_entrenador") && (
              <Button variant="outline" size="sm" onClick={onEditar}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
            )}
            {permissions.includes("eliminar_entrenador") && !retirado && (
              <Button variant="destructive" size="sm" onClick={onRetirar}>
                <Trash2 className="h-4 w-4 mr-1" /> Retirar
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {expandido && (
        <TableRow className="bg-muted/50">
          <TableCell colSpan={5} className="p-0">
            <div className="p-4">
              <EntrenadorDetalle entrenador={entrenador} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}
