import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Entrenador {
  rolId: number;
  nombre: string;
  apellidos: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  generoId: number;
  fechaContratacion: string;
  especializacion: string;
  estadoId: number;
}

export function ModalAsignarEntrenador() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] = useState("");

  useEffect(() => {
    if (modalAbierto) {
      axios
        .get("http://localhost:8080/api/entrenadores", {
          withCredentials: true,
        })
        .then((res) => setEntrenadores(res.data))
        .catch((err) => console.error("Error al cargar entrenadores", err));
    }
  }, [modalAbierto]);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setModalAbierto(true)}>
        <UserPlus className="h-4 w-4 mr-1" />
        Asignar Entrenador
      </Button>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Entrenador a Grupo</DialogTitle>
            <DialogDescription>
              Selecciona el entrenador que deseas asignar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Entrenador</label>
              <Select
                onValueChange={(value) => setEntrenadorSeleccionado(value)}
                value={entrenadorSeleccionado}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar entrenador" />
                </SelectTrigger>
                <SelectContent>
                  {entrenadores.map((entrenador, index) =>
                    entrenador.rolId !== undefined &&
                    entrenador.rolId !== null ? (
                      <SelectItem
                        key={entrenador.rolId}
                        value={entrenador.rolId.toString()}
                      >
                        {entrenador.nombre} {entrenador.apellidos}
                      </SelectItem>
                    ) : (
                      <SelectItem key={`item-${index}`} value="unknown">
                        {entrenador.nombre} {entrenador.apellidos}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={entrenadorSeleccionado === ""}
              onClick={() => {
                const entrenador =
                  entrenadores[parseInt(entrenadorSeleccionado)];
                console.log("Entrenador seleccionado:", entrenador);
                // aquí podrías hacer el POST
                setModalAbierto(false);
              }}
            >
              Asignar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
