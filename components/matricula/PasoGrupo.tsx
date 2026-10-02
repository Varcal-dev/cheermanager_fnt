"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { obtenerGruposElegibles, GrupoElegible } from "@/app/lib/matricula";
import { toast } from "react-toastify";

export default function PasoGrupo({
  deportistaId,
  guardando,
  onVolver,
  onConfirmar,
}: {
  deportistaId: number;
  guardando: boolean;
  onVolver: () => void;
  onConfirmar: (grupoId: number, grupoNombre: string) => Promise<void>;
}) {
  const [cargando, setCargando] = useState(true);
  const [elegibles, setElegibles] = useState<GrupoElegible[]>([]);
  const [noElegibles, setNoElegibles] = useState<GrupoElegible[]>([]);
  const [mostrarNoElegibles, setMostrarNoElegibles] = useState(false);

  useEffect(() => {
    setCargando(true);
    obtenerGruposElegibles(deportistaId)
      .then((data) => {
        setElegibles(data.elegibles);
        setNoElegibles(data.noElegibles);
      })
      .catch((err) => {
        toast.error(
          err.response?.data ?? "No se pudieron cargar los grupos elegibles",
        );
      })
      .finally(() => setCargando(false));
  }, [deportistaId]);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Buscando grupos elegibles...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {elegibles.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No hay grupos elegibles para el nivel de este deportista todavía.
        </p>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {elegibles.map((g) => (
            <div
              key={g.grupoId}
              className="flex items-center justify-between border p-2 rounded"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <div>
                  <p className="font-medium">{g.nombreGrupo}</p>
                  <p className="text-sm text-gray-600">
                    {g.categoriaNivel}
                    {g.cupoMaximo != null ? ` · cupo ${g.cupoActual}/${g.cupoMaximo}` : ""}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                disabled={guardando}
                onClick={() => onConfirmar(g.grupoId, g.nombreGrupo)}
              >
                {guardando ? "Asignando..." : "Asignar"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {noElegibles.length > 0 && (
        <div className="pt-2 border-t">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => setMostrarNoElegibles((v) => !v)}
          >
            {mostrarNoElegibles ? "Ocultar" : "Mostrar"} no elegibles ({noElegibles.length})
          </button>
          {mostrarNoElegibles && (
            <div className="space-y-2 mt-2 max-h-[180px] overflow-y-auto">
              {noElegibles.map((g) => (
                <div
                  key={g.grupoId}
                  className="flex items-center gap-2 border p-2 rounded bg-muted/40"
                >
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <div>
                    <p className="font-medium">{g.nombreGrupo}</p>
                    <p className="text-sm text-red-600">{g.motivo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-start pt-2 border-t mt-2">
        <Button variant="outline" onClick={onVolver} disabled={guardando}>
          Volver
        </Button>
      </div>
    </div>
  );
}