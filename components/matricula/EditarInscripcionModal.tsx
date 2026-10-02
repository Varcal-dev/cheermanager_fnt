"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface PlanPago {
  id: number;
  nombre: string;
}

export default function EditarInscripcionModal({
  open,
  onOpenChange,
  inscripcionId,
  nombreDeportista,
  fechaInscripcion,
  onActualizado,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inscripcionId: number | null;
  // La lista de Inscripciones ya conoce estos dos datos (vienen de
  // InscripcionDetalleDto, ya probado) — se los pasamos en vez de
  // volver a derivarlos del GET /{id}, que devuelve el entity crudo
  // con una forma anidada distinta.
  nombreDeportista: string;
  fechaInscripcion: string;
  onActualizado: () => void;
}) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [planesInscripcion, setPlanesInscripcion] = useState<PlanPago[]>([]);
  const [planesMensualidad, setPlanesMensualidad] = useState<PlanPago[]>([]);

  const [planSeleccionado, setPlanSeleccionado] = useState("");
  const [planMensualidadSeleccionado, setPlanMensualidadSeleccionado] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [estado, setEstado] = useState("Activa");

  useEffect(() => {
    if (!open || !inscripcionId) return;

    setCargando(true);
    Promise.allSettled([
      api.get(`/api/inscripciones/${inscripcionId}`),
      api.get("/api/planes-pago", { params: { categoria: "inscripcion" } }),
      api.get("/api/planes-pago", { params: { categoria: "mensualidad" } }),
    ]).then(([resInscripcion, resPlanes, resPlanesMensualidad]) => {
      if (resInscripcion.status === "fulfilled") {
        const data = resInscripcion.value.data;
        setPlanSeleccionado(data.planPago?.id ? String(data.planPago.id) : "");
        setPlanMensualidadSeleccionado(
          data.planMensualidad?.id ? String(data.planMensualidad.id) : "",
        );
        setFechaVencimiento(data.fechaVencimiento ?? "");
        setEstado(data.estado ?? "Activa");
      } else {
        toast.error("No se pudo cargar la inscripción");
      }

      if (resPlanes.status === "fulfilled") setPlanesInscripcion(resPlanes.value.data);
      if (resPlanesMensualidad.status === "fulfilled")
        setPlanesMensualidad(resPlanesMensualidad.value.data);

      setCargando(false);
    });
  }, [open, inscripcionId]);

  const handleSubmit = async () => {
    if (!inscripcionId || !planSeleccionado) return;

    // Salvavidas: si por algún motivo no tenemos la fecha de inscripción
    // original, no mandamos el PUT — el backend la rechazaría igual (la
    // columna es NOT NULL) pero preferimos avisar claro aquí en vez de
    // dejar que llegue como error de base de datos.
    if (!fechaInscripcion) {
      toast.error(
        "No se pudo determinar la fecha de inscripción original. Cierra y vuelve a intentar.",
      );
      return;
    }

    setGuardando(true);
    try {
      await api.put(`/api/inscripciones/${inscripcionId}`, {
        planPago: { id: Number(planSeleccionado) },
        planMensualidad: planMensualidadSeleccionado
          ? { id: Number(planMensualidadSeleccionado) }
          : null,
        fechaInscripcion,
        fechaVencimiento,
        estado,
      });
      toast.success("Inscripción actualizada correctamente");
      onOpenChange(false);
      onActualizado();
    } catch (error: any) {
      // El backend rechaza el cambio de plan con un mensaje claro si la
      // factura ya tiene pagos registrados — se lo mostramos tal cual.
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo actualizar la inscripción",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar inscripción</DialogTitle>
        </DialogHeader>

        {cargando ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Editando la inscripción de <strong>{nombreDeportista}</strong>
            </p>

            <div className="grid gap-1.5">
              <Label>Plan de inscripción</Label>
              <Select value={planSeleccionado} onValueChange={setPlanSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {planesInscripcion.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si esta inscripción ya tiene pagos registrados, cambiar el
                plan será rechazado por el sistema.
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label>
                Plan de mensualidad{" "}
                <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Select
                value={planMensualidadSeleccionado}
                onValueChange={setPlanMensualidadSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin mensualidad" />
                </SelectTrigger>
                <SelectContent>
                  {planesMensualidad.map((plan) => (
                    <SelectItem key={plan.id} value={String(plan.id)}>
                      {plan.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Fecha de vencimiento</Label>
              <Input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activa">Activa</SelectItem>
                  <SelectItem value="Inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={cargando || guardando || !planSeleccionado}>
            {guardando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}