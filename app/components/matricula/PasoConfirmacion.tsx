"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { EstadoMatricula } from "@/app/lib/matricula";

export default function PasoConfirmacion({
  estado,
  onCerrar,
}: {
  estado: EstadoMatricula;
  onCerrar: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircle2 className="h-10 w-10 text-green-600" />
      <p className="font-medium">
        {estado.deportista?.nombre_completo} quedó matriculado correctamente
      </p>
      {estado.grupoNombre && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Grupo: {estado.grupoNombre}
        </Badge>
      )}
      <p className="text-sm text-muted-foreground">
        Ya puedes ver su factura y pagos desde la lista de inscripciones.
      </p>
      <Button onClick={onCerrar} className="mt-2">
        Listo
      </Button>
    </div>
  );
}