"use client";

import { useRouter } from "next/navigation";
import { KeyRound, Pencil, RotateCcw, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import type { Deportista } from "@/app/deportistas/types";

interface Props {
  deportista: Deportista;
  /** true si aún no tiene inscripción (se ofrece "Matricular"). */
  sinInscripcion: boolean;
  onEditar: () => void;
  onClave: () => void;
  onRetirar: () => void;
  onReactivar: () => void;
}

/** Botones de acción de un deportista. Los comparten la fila de la tabla y la tarjeta del teléfono. */
export default function DeportistaAcciones({ deportista, sinInscripcion, onEditar, onClave, onRetirar, onReactivar }: Props) {
  const { permissions } = useUser();
  const router = useRouter();
  const nombreCompleto = `${deportista.nombre} ${deportista.apellidos}`;
  const retirado = deportista.estadoNombre === "Retirado";

  return (
    <div className="flex flex-wrap gap-2">
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
              )}&nivel=${encodeURIComponent(deportista.nivelNombre ?? "")}`,
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
  );
}
