"use client";

import { useEffect, useState } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { DeportistaDisponible } from "@/app/lib/matricula";

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function PasoDeportista({
  onSeleccionar,
}: {
  onSeleccionar: (deportista: DeportistaDisponible) => void;
}) {
  const [cargando, setCargando] = useState(true);
  const [deportistas, setDeportistas] = useState<DeportistaDisponible[]>([]);

  useEffect(() => {
    setCargando(true);
    api
      .get("/api/inscripciones/no-inscritos")
      .then((res) => {
        setDeportistas(
          res.data.map((d: any) => ({
            deportista_id: d.deportistaId,
            nombre_completo: d.nombreCompleto,
            nivel: d.nivel,
          })),
        );
      })
      .catch(() => toast.error("No se pudo cargar la lista de deportistas disponibles"))
      .finally(() => setCargando(false));
  }, []);

  return (
    <Command className="rounded-lg border">
      <CommandInput placeholder="Buscar deportista…" />
      <CommandList className="h-[320px]">
        {cargando ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Cargando…
          </div>
        ) : (
          <>
            <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
              <UserPlus className="mx-auto mb-2 size-6 opacity-40" />
              No hay deportistas registrados
              <br />
              pendientes de inscripción.
            </CommandEmpty>
            <CommandGroup>
              {deportistas.map((d) => (
                <CommandItem
                  key={d.deportista_id}
                  value={d.nombre_completo}
                  onSelect={() => onSeleccionar(d)}
                  className="flex items-center gap-2 py-2"
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
                      {iniciales(d.nombre_completo)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-none">
                      {d.nombre_completo}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{d.nivel}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );
}