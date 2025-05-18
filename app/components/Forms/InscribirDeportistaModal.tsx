import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";

interface DeportistaDisponible {
  deportista_id: number;
  nombre_completo: string;
  nivel: string;
}

interface PlanPago {
  id: number;
  nombre: string;
}

export default function InscribirDeportistaModal({
  onInscripcionExitosa,
}: {
  onInscripcionExitosa: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deportistas, setDeportistas] = useState<DeportistaDisponible[]>([]);
  const [planesPago, setPlanesPago] = useState<PlanPago[]>([]);
  const [deportistaSeleccionado, setDeportistaSeleccionado] = useState<
    number | null
  >(null);
  const [planSeleccionado, setPlanSeleccionado] = useState<number | null>(null);

  // Fecha por defecto: último día del año actual
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const año = new Date().getFullYear();
    return new Date(año, 11, 31).toISOString().slice(0, 10); // 31 diciembre año actual
  });

  const [convenios, setConvenios] = useState<any[]>([]);
  const [convenioSeleccionado, setConvenioSeleccionado] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (open) {
      fetch("http://localhost:8080/api/inscripciones/no-inscritos")
        .then((res) => res.json())
        .then((data: any[][]) => {
          const deportistasTransformados = data.map((d) => ({
            deportista_id: d[0],
            nombre_completo: d[1],
            nivel: d[2],
          }));
          setDeportistas(deportistasTransformados);
        });

      fetch("http://localhost:8080/api/planes-pago")
        .then((res) => res.json())
        .then((data: any[]) => {
          const planesTransformados = data.map((p) => ({
            id: p.id,
            nombre: p.tipoPlan, // mapear tipoPlan a nombre
          }));
          setPlanesPago(planesTransformados);
        });

      fetch("http://localhost:8080/api/convenios")
        .then((res) => res.json())
        .then((data) => setConvenios(data));
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!deportistaSeleccionado || !planSeleccionado) {
      toast.error("Selecciona deportista y plan");
      return;
    }
    if (!convenioSeleccionado) {
      toast.error("Selecciona un convenio");
      return;
    }

    const hoy = new Date().toISOString().slice(0, 10);

    const body = {
      deportistaId: deportistaSeleccionado,
      planPagoId: planSeleccionado,
      fechaInscripcion: hoy,
      fechaVencimiento,
      estado: "Activa",
    };

    try {
      console.log("Datos a enviar:", body);
      const res = await fetch("http://localhost:8080/api/inscripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        toast.error("Error al crear inscripcion")
        throw new Error("Error al crear la inscripción");
      }

      try {
        console.log("Datos: ", convenioSeleccionado);
        const resConvenio = await fetch(
          `http://localhost:8080/api/deportistas/${deportistaSeleccionado}/convenio`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(convenioSeleccionado),
          }
        );

        if (!resConvenio.ok) {
          toast.error("Error al actualizar el convenio del deportista")
          throw new Error("Error al actualizar el convenio del deportista");
        }

        toast.success("Inscripción creada exitosamente");
        onInscripcionExitosa();
        setOpen(false);
      } catch (err) {
        console.error(err);
        toast.error(
          "La inscripción fue creada, pero ocurrió un error al asignar el convenio"
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("No se pudo crear la inscripción");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">+ Nueva inscripción</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inscribir deportista</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Deportista</Label>
            <Command>
              <CommandInput placeholder="Buscar deportista..." />
              <CommandList className="max-h-40 overflow-y-auto">
                {deportistas.map((dep, index) => (
                  <CommandItem
                    key={dep.deportista_id + "-" + index}
                    value={dep.nombre_completo}
                    onSelect={() =>
                      setDeportistaSeleccionado(dep.deportista_id)
                    }
                    className={
                      deportistaSeleccionado === dep.deportista_id
                        ? "bg-accent"
                        : ""
                    }
                  >
                    {dep.nombre_completo} — {dep.nivel}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </div>

          <div>
            <Label>Plan de pago</Label>
            <select
              className="w-full border rounded-md p-2"
              value={planSeleccionado ?? ""}
              onChange={(e) => setPlanSeleccionado(parseInt(e.target.value))}
            >
              <option value="">Selecciona un plan</option>
              {planesPago.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Convenio</Label>
            <select
              className="w-full border rounded-md p-2"
              value={convenioSeleccionado ?? ""}
              onChange={(e) =>
                setConvenioSeleccionado(parseInt(e.target.value))
              }
            >
              <option value="">Selecciona un convenio</option>
              {convenios.map((convenio) => (
                <option key={convenio.id} value={convenio.id}>
                  {convenio.nombreEmpresa} —{" "}
                  {convenio.descuento?.nombre ?? "Sin Descuento"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Fecha de vencimiento</Label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              min={new Date().toISOString().slice(0, 10)} // no dejar fechas pasadas
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>Guardar inscripción</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
