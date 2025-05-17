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
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!deportistaSeleccionado || !planSeleccionado) {
      toast.error("Selecciona deportista y plan");
      return;
    }

    // Fecha inscripción en formato YYYY-MM-DD (hoy)
    const hoy = new Date().toISOString().slice(0, 10);

    const body = {
      deportistaId: deportistaSeleccionado,
      planPagoId: planSeleccionado,
      fechaInscripcion: hoy,
      fechaVencimiento,
      estado: "Activa",
    };
    console.log("Deportista seleccionado:", deportistaSeleccionado);
    console.log("Plan seleccionado:", planSeleccionado);

    console.log("Datos a enviar:", body); // <--- Aquí imprimes el objeto
    const res = await fetch("http://localhost:8080/api/inscripciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success("Inscripción creada");
      onInscripcionExitosa(); // <-- refresca la tabla
      setOpen(false);
    } else {
      toast.error("Error al inscribir");
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
