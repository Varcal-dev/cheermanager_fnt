"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Users } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface Grupo {
  id: number;
  nombre: string;
}

interface AsignarGrupoAEntrenadorModalProps {
  entrenadorId: number;
  onAsignado: () => void;
}

const ROLES = ["Entrenador Principal", "Entrenador Asistente"];

export default function AsignarGrupoAEntrenadorModal({
  entrenadorId,
  onAsignado,
}: AsignarGrupoAEntrenadorModalProps) {
  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoId, setGrupoId] = useState("");
  const [rol, setRol] = useState(ROLES[0]);
  const [fechaInicio, setFechaInicio] = useState(
    new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    if (!open) return;
    api
      .get("/api/grupos")
      .then((res) => setGrupos(res.data))
      .catch(() => toast.error("No se pudieron cargar los grupos"));
  }, [open]);

  const handleSubmit = async () => {
    if (!grupoId || !fechaInicio) {
      toast.error("Selecciona un grupo y una fecha de inicio");
      return;
    }

    setGuardando(true);
    try {
      await api.post(`/api/grupos/${grupoId}/asignar-entrenadores`, {
        entrenadorId,
        fechaInicio,
        rol,
      });
      toast.success("Entrenador asignado al grupo");
      setOpen(false);
      setGrupoId("");
      setRol(ROLES[0]);
      onAsignado();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo asignar el grupo",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Users className="h-4 w-4 mr-1" /> Asignar a Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Asignar entrenador a un grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Grupo</Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un grupo" />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={rol} onValueChange={setRol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fecha de inicio</Label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={guardando}>
            {guardando ? "Asignando..." : "Asignar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}