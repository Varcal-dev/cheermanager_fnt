"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listarDrivers,
  listarEscalonesDriver,
  type DriverConstruccionInput,
  type DriverSubCriterio,
  type EscalonDriverNivel,
  type RegistroSubCriterioInput,
} from "@/app/lib/evaluacion-rutina";
import { TopeDriverGuia } from "./GuiasRubrica";

interface Props {
  subCriterioId: number;
  nivelId: number;
  valor: RegistroSubCriterioInput;
  onChange: (patch: Partial<RegistroSubCriterioInput>) => void;
}

// Construcciones / Gimnasia: driver "Grado de Dificultad" (lista repetible de habilidades)
// y "Participacion Maxima" (un escalón seleccionado).
export default function DriversConstruccionForm({ subCriterioId, nivelId, valor, onChange }: Props) {
  const [drivers, setDrivers] = useState<DriverSubCriterio[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarDrivers(subCriterioId)
      .then(setDrivers)
      .catch(() => toast.error("No se pudieron cargar los drivers de este sub-criterio"))
      .finally(() => setCargando(false));
  }, [subCriterioId]);

  if (cargando) return <p className="text-xs text-muted-foreground">Cargando drivers…</p>;
  if (drivers.length === 0) return null;

  const registros = valor.driversConstruccion ?? [];
  const driverGrado = drivers.find((d) => d.nombre.toLowerCase() === "grado de dificultad");
  const driverParticipacion = drivers.find((d) => d.nombre.toLowerCase() === "participacion maxima");
  const filasGrado = driverGrado ? registros.filter((r) => r.driverId === driverGrado.id) : [];

  // Siempre se renumeran 1..n: al quitar una habilidad del medio no quedan huecos ni números repetidos.
  const actualizarFilasGrado = (nuevas: DriverConstruccionInput[]) => {
    const otras = registros.filter((r) => r.driverId !== driverGrado?.id);
    const renumeradas = nuevas.map((f, i) => ({ ...f, numeroHabilidad: i + 1 }));
    onChange({ driversConstruccion: [...otras, ...renumeradas] });
  };

  const agregarHabilidad = () => {
    if (!driverGrado) return;
    actualizarFilasGrado([...filasGrado, { driverId: driverGrado.id, numeroHabilidad: filasGrado.length + 1, esNivelAlto: false }]);
  };
  const quitarHabilidad = (i: number) => actualizarFilasGrado(filasGrado.filter((_, idx) => idx !== i));

  const filaParticipacion = driverParticipacion ? registros.find((r) => r.driverId === driverParticipacion.id) : undefined;
  const setParticipacion = (escalonId: number) => {
    if (!driverParticipacion) return;
    const otras = registros.filter((r) => r.driverId !== driverParticipacion.id);
    onChange({ driversConstruccion: [...otras, { driverId: driverParticipacion.id, escalonSeleccionadoId: escalonId }] });
  };

  return (
    <div className="space-y-3 border-t pt-3">
      {driverGrado && (
        <div className="space-y-2">
          <Label className="text-xs">Grado de dificultad — una fila por habilidad marcada</Label>
          <TopeDriverGuia driverId={driverGrado.id} nivelId={nivelId} />
          {filasGrado.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Hab. {f.numeroHabilidad}</span>
              <Select
                value={f.esNivelAlto ? "alto" : "basico"}
                onValueChange={(v) => {
                  const copia = [...filasGrado];
                  copia[i] = { ...copia[i], esNivelAlto: v === "alto" };
                  actualizarFilasGrado(copia);
                }}
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Apropiada (básico)</SelectItem>
                  <SelectItem value="alto">Avanzada / Élite (alto)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => quitarHabilidad(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={agregarHabilidad}>
            <Plus className="h-4 w-4 mr-1" /> Agregar habilidad
          </Button>
        </div>
      )}

      {driverParticipacion && (
        <ParticipacionMaximaSelect
          driverId={driverParticipacion.id}
          nivelId={nivelId}
          valorSeleccionado={filaParticipacion?.escalonSeleccionadoId ?? null}
          onSeleccionar={setParticipacion}
        />
      )}
    </div>
  );
}

function ParticipacionMaximaSelect({
  driverId,
  nivelId,
  valorSeleccionado,
  onSeleccionar,
}: {
  driverId: number;
  nivelId: number;
  valorSeleccionado: number | null;
  onSeleccionar: (escalonId: number) => void;
}) {
  const [escalones, setEscalones] = useState<EscalonDriverNivel[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarEscalonesDriver(driverId, nivelId)
      .then(setEscalones)
      .catch(() => toast.error("No se pudieron cargar los escalones de participación máxima"))
      .finally(() => setCargando(false));
  }, [driverId, nivelId]);

  if (cargando) return <p className="text-xs text-muted-foreground">Cargando escalones…</p>;
  if (escalones.length === 0) return null;

  return (
    <div className="space-y-1.5 max-w-md">
      <Label className="text-xs">Participación máxima</Label>
      <Select value={valorSeleccionado ? String(valorSeleccionado) : ""} onValueChange={(v) => onSeleccionar(Number(v))}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona el escalón alcanzado…" />
        </SelectTrigger>
        <SelectContent>
          {escalones.map((e) => (
            <SelectItem key={e.id} value={String(e.id)}>
              {e.descripcion} ({e.valor})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
