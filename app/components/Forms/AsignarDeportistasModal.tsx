"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface Candidato {
  deportistaId: number;
  nombreCompleto: string;
  genero: string;
  nivel: string;
  edad: number | null;
  elegible: boolean;
  motivo: string | null;
}

interface CandidatosResponse {
  grupoNombre: string;
  cupoActual: number;
  cupoMaximo: number | null;
  elegibles: Candidato[];
  noElegibles: Candidato[];
}

export default function AsignarDeportistasModal({
  grupoId,
  grupoNombre,
  open,
  onOpenChange,
  onDeportistaAgregado,
}: {
  grupoId: number;
  grupoNombre: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeportistaAgregado: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CandidatosResponse | null>(null);
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<number | null>(null);
  const [mostrarNoElegibles, setMostrarNoElegibles] = useState(false);

  const fetchCandidatos = () => {
    setLoading(true);
    api
      .get(`/api/grupos/${grupoId}/candidatos`)
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error("Error cargando candidatos:", err);
        toast.error("No se pudo cargar la lista de candidatos");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (open) {
      setSearch("");
      setMostrarNoElegibles(false);
      fetchCandidatos();
    }
  }, [open, grupoId]);

  const handleAdd = async (candidato: Candidato) => {
    setAddingId(candidato.deportistaId);
    try {
      const response = await api.post(`/api/grupos/${grupoId}/agregar-deportistas`, {
        deportistaId: candidato.deportistaId,
        observaciones: "",
      });
      // El backend devuelve un string plano, no un objeto { mensaje }.
      toast.success(response.data || "Deportista añadido correctamente");

      // Se quita de la lista local (en vez de cerrar el modal) para poder
      // seguir añadiendo al siguiente deportista sin reabrir nada.
      setData((prev) =>
        prev
          ? {
              ...prev,
              cupoActual: prev.cupoActual + 1,
              elegibles: prev.elegibles.filter(
                (d) => d.deportistaId !== candidato.deportistaId,
              ),
            }
          : prev,
      );
      onDeportistaAgregado();

      // Si con esta asignación el grupo llegó al cupo máximo, refrescamos
      // para que el resto de elegibles pase a "no elegible: cupo lleno".
      if (data?.cupoMaximo != null && data.cupoActual + 1 >= data.cupoMaximo) {
        fetchCandidatos();
      }
    } catch (error: any) {
      console.error("Error al agregar deportista:", error);
      toast.error(
        error.response?.data ?? "Error al agregar deportista. Intenta de nuevo.",
      );
    } finally {
      setAddingId(null);
    }
  };

  const filtro = (lista: Candidato[]) =>
    lista.filter((d) =>
      d.nombreCompleto.toLowerCase().includes(search.toLowerCase()),
    );

  const elegiblesFiltrados = useMemo(
    () => (data ? filtro(data.elegibles) : []),
    [data, search],
  );
  const noElegiblesFiltrados = useMemo(
    () => (data ? filtro(data.noElegibles) : []),
    [data, search],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Añadir deportistas a: {grupoNombre}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando candidatos...
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar deportista..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9"
                />
              </div>
              {data.cupoMaximo != null && (
                <Badge
                  variant="outline"
                  className={
                    data.cupoActual >= data.cupoMaximo
                      ? "ml-3 bg-red-50 text-red-700 border-red-200"
                      : "ml-3"
                  }
                >
                  Cupo: {data.cupoActual}/{data.cupoMaximo}
                </Badge>
              )}
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {elegiblesFiltrados.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No hay deportistas elegibles disponibles para este grupo.
                </p>
              ) : (
                elegiblesFiltrados.map((d) => (
                  <div
                    key={d.deportistaId}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      <div>
                        <p className="font-medium">{d.nombreCompleto}</p>
                        <p className="text-sm text-gray-600">
                          {d.genero} · {d.nivel}
                          {d.edad != null ? ` · ${d.edad} años` : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={addingId === d.deportistaId}
                      onClick={() => handleAdd(d)}
                    >
                      {addingId === d.deportistaId ? "Añadiendo..." : "Añadir"}
                    </Button>
                  </div>
                ))
              )}
            </div>

            {noElegiblesFiltrados.length > 0 && (
              <div className="pt-2 border-t">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:underline"
                  onClick={() => setMostrarNoElegibles((v) => !v)}
                >
                  {mostrarNoElegibles ? "Ocultar" : "Mostrar"} no elegibles (
                  {noElegiblesFiltrados.length})
                </button>

                {mostrarNoElegibles && (
                  <div className="space-y-2 mt-2 max-h-[200px] overflow-y-auto">
                    {noElegiblesFiltrados.map((d) => (
                      <div
                        key={d.deportistaId}
                        className="flex items-center justify-between border p-2 rounded bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          <div>
                            <p className="font-medium">{d.nombreCompleto}</p>
                            <p className="text-sm text-red-600">{d.motivo}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}