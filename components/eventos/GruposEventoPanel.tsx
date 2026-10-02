"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface GrupoEvento {
  id: number;
  grupoEntrenamientoId: number;
  nombreGrupo: string;
}

interface GrupoOpcion {
  id: number;
  nombre: string;
}

export default function GruposEventoPanel({ eventoId }: { eventoId: number }) {
  const [cargando, setCargando] = useState(true);
  const [grupos, setGrupos] = useState<GrupoEvento[]>([]);
  const [gruposDisponibles, setGruposDisponibles] = useState<GrupoOpcion[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [inscribiendo, setInscribiendo] = useState(false);

  const cargar = () => {
    setCargando(true);
    Promise.allSettled([
      api.get(`/api/grupos-evento/evento/${eventoId}`),
      api.get("/api/grupos"),
    ]).then(([resGrupos, resDisponibles]) => {
      if (resGrupos.status === "fulfilled") setGrupos(resGrupos.value.data);
      else toast.error("No se pudieron cargar los grupos inscritos");

      if (resDisponibles.status === "fulfilled") setGruposDisponibles(resDisponibles.value.data);

      setCargando(false);
    });
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  const inscribir = async () => {
    if (!grupoSeleccionado) {
      toast.error("Selecciona un grupo");
      return;
    }
    setInscribiendo(true);
    try {
      await api.post("/api/grupos-evento", {
        grupoEntrenamientoId: Number(grupoSeleccionado),
        eventoId,
      });
      toast.success("Grupo inscrito al evento");
      setGrupoSeleccionado("");
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo inscribir el grupo",
      );
    } finally {
      setInscribiendo(false);
    }
  };

  const desinscribir = async (id: number) => {
    if (!confirm("¿Quitar este grupo del evento?")) return;
    try {
      await api.delete(`/api/grupos-evento/${id}`);
      toast.success("Grupo desinscrito");
      cargar();
    } catch {
      toast.error("No se pudo desinscribir el grupo");
    }
  };

  const grupoIdsYaInscritos = new Set(grupos.map((g) => g.grupoEntrenamientoId));
  const opcionesParaInscribir = gruposDisponibles.filter(
    (g) => !grupoIdsYaInscritos.has(g.id),
  );

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select value={grupoSeleccionado} onValueChange={setGrupoSeleccionado}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Selecciona un grupo para inscribir" />
          </SelectTrigger>
          <SelectContent>
            {opcionesParaInscribir.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={inscribir} disabled={inscribiendo}>
          {inscribiendo ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <UserPlus className="h-4 w-4 mr-1" />
          )}
          Inscribir
        </Button>
      </div>

      {grupos.length === 0 ? (
        <p className="text-center py-4 text-muted-foreground">
          Ningún grupo inscrito todavía.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grupo</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grupos.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{g.nombreGrupo}</TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => desinscribir(g.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Quitar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}