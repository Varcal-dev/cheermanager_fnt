"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Shape real de lo que devuelve GET /api/entrenadores: la entidad JPA
// Entrenador (id, persona anidada, especializacion...), no un DTO plano.
// El componente anterior esperaba { rolId, nombre, apellidos } directos,
// que nunca llegan así del backend.
interface Persona {
  id: number;
  nombre: string;
  apellidos: string;
}

interface Entrenador {
  id: number;
  persona: Persona;
  especializacion?: string;
}

// GrupoEntrenador.rol es un String libre en el backend (sin catálogo fijo),
// pero el resto de la app ya usa esta convención (ver datos de ejemplo de
// entrenadores/horarios). Si luego quieres un catálogo real en BD, se
// cambia este arreglo por un fetch, sin tocar el resto del componente.
const ROLES_ENTRENADOR = ["Entrenador Principal", "Entrenador Asistente"];

export function ModalAsignarEntrenador({
  grupoId,
  grupoNombre,
  onEntrenadorAsignado,
}: {
  grupoId: number;
  grupoNombre?: string;
  onEntrenadorAsignado?: () => void;
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] = useState("");
  const [rol, setRol] = useState(ROLES_ENTRENADOR[0]);
  const [fechaInicio, setFechaInicio] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (modalAbierto) {
      api
        .get(`/api/entrenadores`)
        .then((res) => setEntrenadores(res.data))
        .catch((err) => {
          console.error("Error al cargar entrenadores", err);
          toast.error("No se pudo cargar la lista de entrenadores");
        });
    }
  }, [modalAbierto]);

  const resetForm = () => {
    setEntrenadorSeleccionado("");
    setRol(ROLES_ENTRENADOR[0]);
    setFechaInicio(new Date().toISOString().split("T")[0]);
  };

  const handleAsignar = async () => {
    if (!entrenadorSeleccionado) return;
    setGuardando(true);
    try {
      const response = await api.post(
        `/api/grupos/${grupoId}/asignar-entrenadores`,
        {
          entrenadorId: Number(entrenadorSeleccionado),
          grupoId,
          fechaInicio, // formato ISO yyyy-MM-dd, como espera AsignacionEntrenadorDTO
          rol,
        },
      );
      // El backend devuelve un string plano ("Entrenador asignado
      // correctamente al grupo"), igual que agregar-deportistas.
      toast.success(response.data || "Entrenador asignado correctamente");
      resetForm();
      setModalAbierto(false);
      onEntrenadorAsignado?.();
    } catch (error: any) {
      console.error("Error al asignar entrenador:", error);
      // Cubre tanto el body plano (badRequest().body(mensaje)) como el
      // body por defecto de Spring ({ message: ... }) por si el backend
      // aún no está actualizado con el try/catch del controller.
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Error al asignar el entrenador. Intenta de nuevo.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setModalAbierto(true)}>
        <UserPlus className="h-4 w-4 mr-1" />
        Asignar Entrenador
      </Button>

      <Dialog
        open={modalAbierto}
        onOpenChange={(open) => {
          setModalAbierto(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Entrenador a Grupo</DialogTitle>
            <DialogDescription>
              {grupoNombre
                ? `Selecciona el entrenador que deseas asignar a "${grupoNombre}".`
                : "Selecciona el entrenador que deseas asignar."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Entrenador</label>
              <Select
                onValueChange={setEntrenadorSeleccionado}
                value={entrenadorSeleccionado}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar entrenador" />
                </SelectTrigger>
                <SelectContent>
                  {entrenadores.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No hay entrenadores disponibles
                    </div>
                  ) : (
                    entrenadores.map((entrenador) => (
                      <SelectItem
                        key={entrenador.id}
                        value={entrenador.id.toString()}
                      >
                        {entrenador.persona?.nombre}{" "}
                        {entrenador.persona?.apellidos}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Rol</label>
              <Select onValueChange={setRol} value={rol}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_ENTRENADOR.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Fecha de inicio</label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={entrenadorSeleccionado === "" || guardando}
              onClick={handleAsignar}
            >
              {guardando ? "Asignando..." : "Asignar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}