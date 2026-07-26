"use client";

import { useEffect, useMemo, useState } from "react";
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
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { UserPlus, Loader2, CalendarDays } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface DeportistaDisponible {
  deportista_id: number;
  nombre_completo: string;
  nivel: string;
}

interface PlanPago {
  id: number;
  nombre: string;
}

interface Convenio {
  id: number;
  nombreEmpresa: string;
  descuento?: { nombre: string };
}

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function InscribirDeportistaModal({
  onInscripcionExitosa,
}: {
  onInscripcionExitosa: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [deportistas, setDeportistas] = useState<DeportistaDisponible[]>([]);
  const [planesInscripcion, setPlanesInscripcion] = useState<PlanPago[]>([]);
  const [planesMensualidad, setPlanesMensualidad] = useState<PlanPago[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);

  const [deportistaSeleccionado, setDeportistaSeleccionado] =
    useState<DeportistaDisponible | null>(null);
  const [planSeleccionado, setPlanSeleccionado] = useState<string>("");
  const [planMensualidadSeleccionado, setPlanMensualidadSeleccionado] =
    useState<string>("");
  const [convenioSeleccionado, setConvenioSeleccionado] = useState<string>("");

  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const año = new Date().getFullYear();
    return new Date(año, 11, 31).toISOString().slice(0, 10);
  });

  useEffect(() => {
    if (!open) return;

    setCargando(true);
    setDeportistaSeleccionado(null);
    setPlanSeleccionado("");
    setPlanMensualidadSeleccionado("");
    setConvenioSeleccionado("");

    Promise.allSettled([
      api.get("/api/inscripciones/no-inscritos"),
      api.get("/api/planes-pago", { params: { categoria: "inscripcion" } }),
      api.get("/api/planes-pago", { params: { categoria: "mensualidad" } }),
      api.get("/api/convenios"),
    ]).then(([resDeportistas, resPlanes, resPlanesMensualidad, resConvenios]) => {
      if (resDeportistas.status === "fulfilled") {
        setDeportistas(
          resDeportistas.value.data.map((d: any) => ({
            deportista_id: d.deportistaId,
            nombre_completo: d.nombreCompleto,
            nivel: d.nivel,
          })),
        );
      } else {
        toast.error("No se pudo cargar la lista de deportistas disponibles");
      }

      if (resPlanes.status === "fulfilled") {
        setPlanesInscripcion(resPlanes.value.data);
      } else {
        toast.error("No se pudieron cargar los planes de inscripción");
      }

      if (resPlanesMensualidad.status === "fulfilled") {
        setPlanesMensualidad(resPlanesMensualidad.value.data);
      } else {
        toast.error("No se pudieron cargar los planes de mensualidad");
      }

      if (resConvenios.status === "fulfilled") {
        setConvenios(resConvenios.value.data);
      }

      setCargando(false);
    });
  }, [open]);

  const planActual = useMemo(
    () => planesInscripcion.find((p) => String(p.id) === planSeleccionado),
    [planesInscripcion, planSeleccionado],
  );

  const planMensualidadActual = useMemo(
    () =>
      planesMensualidad.find(
        (p) => String(p.id) === planMensualidadSeleccionado,
      ),
    [planesMensualidad, planMensualidadSeleccionado],
  );

  const handleSubmit = async () => {
    if (!deportistaSeleccionado || !planSeleccionado) {
      toast.error("Selecciona un deportista y un plan de inscripción");
      return;
    }

    setGuardando(true);
    const hoy = new Date().toISOString().slice(0, 10);

    try {
      await api.post("/api/inscripciones", {
        deportistaId: deportistaSeleccionado.deportista_id,
        planPagoId: Number(planSeleccionado),
        // Opcional: si se elige, se factura de una vez el primer mes de
        // mensualidad junto con la inscripción (antes esto quedaba sin
        // cobrar — el deportista quedaba inscrito pero sin ningún cargo de
        // mensualidad asociado).
        planMensualidadId: planMensualidadSeleccionado
          ? Number(planMensualidadSeleccionado)
          : null,
        fechaInscripcion: hoy,
        fechaVencimiento,
        estado: "Activa",
      });

      if (convenioSeleccionado) {
        try {
          await api.put(
            `/api/deportistas/${deportistaSeleccionado.deportista_id}/convenio`,
            { convenioId: Number(convenioSeleccionado) },
          );
        } catch {
          toast.error(
            "La inscripción fue creada, pero ocurrió un error al asignar el convenio",
          );
          onInscripcionExitosa();
          setOpen(false);
          return;
        }
      }

      toast.success(
        `${deportistaSeleccionado.nombre_completo} fue inscrito correctamente`,
      );
      onInscripcionExitosa();
      setOpen(false);
    } catch {
      toast.error("No se pudo crear la inscripción");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 size-4" />
          Nueva inscripción
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Inscribir deportista al club</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[260px_1fr] divide-x">
          {/* Panel izquierdo: buscador de deportistas */}
          <div className="flex flex-col">
            <Command className="rounded-none bg-transparent">
              <CommandInput placeholder="Buscar deportista…" />
              <CommandList className="h-[360px]">
                {cargando ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Cargando…
                  </div>
                ) : (
                  <>
                    <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
                      No hay deportistas registrados
                      <br />
                      pendientes de inscripción.
                    </CommandEmpty>
                    <CommandGroup>
                      {deportistas.map((d) => (
                        <CommandItem
                          key={d.deportista_id}
                          value={d.nombre_completo}
                          onSelect={() => setDeportistaSeleccionado(d)}
                          className="flex items-center gap-2 py-2"
                          data-selected={
                            deportistaSeleccionado?.deportista_id ===
                            d.deportista_id
                          }
                        >
                          <Avatar className="size-7">
                            <AvatarFallback className="bg-primary/10 text-[11px] font-medium text-primary">
                              {iniciales(d.nombre_completo)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-none">
                              {d.nombre_completo}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {d.nivel}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </div>

          {/* Panel derecho: deportista elegido + formulario */}
          <div className="flex flex-col gap-5 p-6">
            {!deportistaSeleccionado ? (
              <div className="flex h-[360px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <UserPlus className="size-8 opacity-40" />
                <p className="text-sm">
                  Elige un deportista de la lista para
                  <br />
                  completar su inscripción.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
                      {iniciales(deportistaSeleccionado.nombre_completo)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-none">
                      {deportistaSeleccionado.nombre_completo}
                    </p>
                    <Badge variant="outline" className="mt-1.5">
                      {deportistaSeleccionado.nivel}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-1.5">
                    <Label>Plan de inscripción</Label>
                    <Select
                      value={planSeleccionado}
                      onValueChange={setPlanSeleccionado}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {planesInscripcion.length === 0 ? (
                          <p className="px-2 py-1.5 text-sm text-muted-foreground">
                            No hay planes de inscripción configurados
                          </p>
                        ) : (
                          planesInscripcion.map((plan) => (
                            <SelectItem key={plan.id} value={String(plan.id)}>
                              {plan.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-1.5">
                    <Label>
                      Plan de mensualidad{" "}
                      <span className="font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    </Label>
                    <Select
                      value={planMensualidadSeleccionado}
                      onValueChange={setPlanMensualidadSeleccionado}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin mensualidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {planesMensualidad.length === 0 ? (
                          <p className="px-2 py-1.5 text-sm text-muted-foreground">
                            No hay planes de mensualidad configurados
                          </p>
                        ) : (
                          planesMensualidad.map((plan) => (
                            <SelectItem key={plan.id} value={String(plan.id)}>
                              {plan.nombre}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {planMensualidadActual && (
                      <p className="text-xs text-muted-foreground">
                        Se generará también la factura del primer mes de
                        mensualidad, junto con la de inscripción.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-1.5">
                    <Label>
                      Convenio{" "}
                      <span className="font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    </Label>
                    <Select
                      value={convenioSeleccionado}
                      onValueChange={setConvenioSeleccionado}
                    >
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
                        onChange={(e) => setFechaVencimiento(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {planActual && (
                  <p className="text-xs text-muted-foreground">
                    Se inscribirá con el plan <strong>{planActual.nombre}</strong>,
                    vigente hasta el {fechaVencimiento}.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!deportistaSeleccionado || !planSeleccionado || guardando}
          >
            {guardando ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar inscripción"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}