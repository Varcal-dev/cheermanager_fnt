"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Estado } from "@/app/deportistas/types";

interface Props {
  estados: Estado[];
  seleccionados: number[];
  onToggle: (estadoId: number) => void;
  onLimpiar: () => void;
}

/** Filtro de estados con casillas (varios a la vez). */
export default function FiltroEstadosDropdown({ estados, seleccionados, onToggle, onLimpiar }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Estados {seleccionados.length > 0 && `(${seleccionados.length})`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm">Filtrar por Estado</span>
            {seleccionados.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onLimpiar}>
                Limpiar
              </Button>
            )}
          </div>
          {estados.map((estado) => (
            <div key={estado.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`estado-${estado.id}`}
                checked={seleccionados.includes(estado.id)}
                onChange={() => onToggle(estado.id)}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor={`estado-${estado.id}`} className="text-sm cursor-pointer flex-1">
                {estado.estado}
              </label>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
