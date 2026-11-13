"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { DeportistaDisponible, FECHA_VALIDA, FECHA_MAXIMA } from "@/app/lib/matricula";
import { formatCOP } from "@/app/lib/facturas-pagos";

interface PlanPago {
  id: number;
  nombre: string;
  valorMensual?: number | null;
  descuentoPorcentaje?: number | null;
  sesionesSemanales?: number | null;
}

// Valor del plan con su descuento propio aplicado (si lo tiene).
const valorNeto = (p?: PlanPago) => {
  if (!p || p.valorMensual == null) return null;
  const d = p.descuentoPorcentaje ?? 0;
  return Math.round(p.valorMensual * (1 - d / 100));
};
const textoCosto = (p: PlanPago) => (p.valorMensual == null ? "" : ` — ${formatCOP(valorNeto(p) ?? 0)}`);
interface Convenio {
  id: number;
  nombreEmpresa: string;
  descuento?: { nombre: string };
}

export default function PasoPlanPago({
  deportista,
  guardando,
  permitirVolver = true,
  onVolver,
  onConfirmar,
}: {
  deportista: DeportistaDisponible;
  guardando: boolean;
  // false cuando ya existe una inscripción creada para este deportista (p.
  // ej. volvimos aquí desde el paso Grupo): volver más atrás, a la búsqueda
  // de deportista, dejaría la inscripción "huérfana" de su selección.
  permitirVolver?: boolean;
  onVolver: () => void;
  onConfirmar: (payload: {
    planPagoId: number;
    planMensualidadId?: number;
    convenioId?: number;
    fechaVencimiento: string;
  }) => Promise<void>;
}) {
  const [cargando, setCargando] = useState(true);
  const [planesInscripcion, setPlanesInscripcion] = useState<PlanPago[]>([]);
  const [planesMensualidad, setPlanesMensualidad] = useState<PlanPago[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);

  const [planSeleccionado, setPlanSeleccionado] = useState("");
  const [planMensualidadSeleccionado, setPlanMensualidadSeleccionado] = useState("");
  const [convenioSeleccionado, setConvenioSeleccionado] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const año = new Date().getFullYear();
    return new Date(año, 11, 31).toISOString().slice(0, 10);
  });

  useEffect(() => {
    setCargando(true);
    Promise.allSettled([
      api.get("/api/planes-pago", { params: { categoria: "inscripcion" } }),
      api.get("/api/planes-pago", { params: { categoria: "mensualidad" } }),
      api.get("/api/convenios"),
    ]).then(([resPlanes, resPlanesMensualidad, resConvenios]) => {
      if (resPlanes.status === "fulfilled") setPlanesInscripcion(resPlanes.value.data);
      else toast.error("No se pudieron cargar los planes de inscripción");

      if (resPlanesMensualidad.status === "fulfilled")
        setPlanesMensualidad(resPlanesMensualidad.value.data);
      else toast.error("No se pudieron cargar los planes de mensualidad");

      if (resConvenios.status === "fulfilled") setConvenios(resConvenios.value.data);

      setCargando(false);
    });
  }, []);

  const planActual = useMemo(
    () => planesInscripcion.find((p) => String(p.id) === planSeleccionado),
    [planesInscripcion, planSeleccionado],
  );

  const mensualidadActual = useMemo(
    () => planesMensualidad.find((p) => String(p.id) === planMensualidadSeleccionado),
    [planesMensualidad, planMensualidadSeleccionado],
  );
  const costoInscripcion = valorNeto(planActual);
  const costoMensualidad = valorNeto(mensualidadActual);

  const handleSubmit = async () => {
    if (!planSeleccionado) {
      toast.error("Selecciona un plan de inscripción");
      return;
    }
    if (!FECHA_VALIDA.test(fechaVencimiento)) {
      toast.error(
        "La fecha de vencimiento no es válida — revisa que el año tenga 4 dígitos.",
      );
      return;
    }
    await onConfirmar({
      planPagoId: Number(planSeleccionado),
      planMensualidadId: planMensualidadSeleccionado ? Number(planMensualidadSeleccionado) : undefined,
      convenioId: convenioSeleccionado ? Number(convenioSeleccionado) : undefined,
      fechaVencimiento,
    });
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando planes...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Matriculando a</span>
        <Badge variant="outline">{deportista.nombre_completo}</Badge>
      </div>

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
                {textoCosto(plan)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label>
          Plan de mensualidad{" "}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Select value={planMensualidadSeleccionado} onValueChange={setPlanMensualidadSeleccionado}>
          <SelectTrigger>
            <SelectValue placeholder="Sin mensualidad" />
          </SelectTrigger>
          <SelectContent>
            {planesMensualidad.map((plan) => (
              <SelectItem key={plan.id} value={String(plan.id)}>
                {plan.nombre}
                {textoCosto(plan)}
                {plan.sesionesSemanales ? ` · ${plan.sesionesSemanales} ses./sem.` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label>
          Convenio <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Select value={convenioSeleccionado} onValueChange={setConvenioSeleccionado}>
          <SelectTrigger>
            <SelectValue placeholder="Sin convenio" />
          </SelectTrigger>
          <SelectContent>
            {convenios.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombreEmpresa}
                {c.descuento?.nombre ? ` — ${c.descuento.nombre}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label>Fecha de vencimiento</Label>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            className="pl-8"
            value={fechaVencimiento}
            min={new Date().toISOString().slice(0, 10)}
            max={FECHA_MAXIMA}
            onChange={(e) => setFechaVencimiento(e.target.value)}
          />
        </div>
      </div>

      {planActual && (
        <div className="space-y-1.5 rounded-md border bg-muted/40 p-3 text-sm" aria-live="polite">
          <p className="font-medium">Costo</p>
          <div className="flex justify-between">
            <span>Inscripción · {planActual.nombre}</span>
            <span className="font-medium">{costoInscripcion === null ? "Sin valor definido" : formatCOP(costoInscripcion)}</span>
          </div>
          {mensualidadActual && (
            <div className="flex justify-between">
              <span>
                Mensualidad · {mensualidadActual.nombre}
                {mensualidadActual.sesionesSemanales ? ` (${mensualidadActual.sesionesSemanales} sesiones por semana)` : ""}
              </span>
              <span className="font-medium">
                {costoMensualidad === null ? "Sin valor definido" : `${formatCOP(costoMensualidad)} / mes`}
              </span>
            </div>
          )}
          {[planActual.descuentoPorcentaje, mensualidadActual?.descuentoPorcentaje].some((d) => d) && (
            <p className="text-xs text-muted-foreground">Los valores ya incluyen el descuento propio de cada plan.</p>
          )}
          {convenioSeleccionado && (
            <p className="text-xs text-muted-foreground">El convenio elegido puede aplicar un descuento adicional al facturar.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Vigente hasta el {fechaVencimiento}.
            {mensualidadActual?.sesionesSemanales
              ? ` En el siguiente paso solo podrás asignarlo a un grupo que entrene ${mensualidadActual.sesionesSemanales} ${mensualidadActual.sesionesSemanales === 1 ? "día" : "días"} por semana.`
              : ""}
          </p>
        </div>
      )}

      <div className="flex justify-between pt-2">
        {permitirVolver ? (
          <Button variant="outline" onClick={onVolver} disabled={guardando}>
            Volver
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={handleSubmit} disabled={!planSeleccionado || guardando}>
          {guardando ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Guardando…
            </>
          ) : (
            "Guardar y continuar"
          )}
        </Button>
      </div>
    </div>
  );
}