"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import {
  FacturaManualPayload,
  crearFacturaManual,
  mensajeError,
} from "@/app/lib/facturas-pagos";

interface PersonaResumen {
  id: number;
  nombre: string;
  apellidos: string;
}

interface EventoResumen {
  id: number;
  nombre: string;
  fecha: string;
}

const CONCEPTOS: { value: FacturaManualPayload["concepto"]; label: string }[] = [
  { value: "UNIFORME", label: "Uniforme" },
  { value: "COMPETENCIA", label: "Competencia" },
  { value: "EVENTO", label: "Evento" },
  { value: "OTRO", label: "Otro" },
];

const hoy = () => new Date().toISOString().slice(0, 10);

// Cobro manual fuera de la mensualidad: uniforme, competencia, evento u otro.
// Las facturas de inscripción y mensualidad las genera el sistema.
export default function NuevaFacturaModal({
  open,
  onOpenChange,
  onCreada,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreada: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<PersonaResumen[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [persona, setPersona] = useState<PersonaResumen | null>(null);

  const [concepto, setConcepto] = useState<FacturaManualPayload["concepto"]>("UNIFORME");
  const [eventos, setEventos] = useState<EventoResumen[]>([]);
  const [eventoId, setEventoId] = useState<string>("");
  const [descripcion, setDescripcion] = useState("");
  const [total, setTotal] = useState("");
  const [fechaEmision, setFechaEmision] = useState(hoy());
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBusqueda("");
    setResultados([]);
    setPersona(null);
    setConcepto("UNIFORME");
    setEventoId("");
    setDescripcion("");
    setTotal("");
    setFechaEmision(hoy());
    setFechaVencimiento("");
    api
      .get<EventoResumen[]>("/api/eventos")
      .then((r) => setEventos(r.data))
      .catch(() => setEventos([])); // sin permiso de eventos: el campo evento simplemente no ofrece opciones
  }, [open]);

  const buscar = async () => {
    if (busqueda.trim().length < 2) {
      toast.info("Escribe al menos 2 letras del nombre");
      return;
    }
    setBuscando(true);
    try {
      const { data } = await api.get<PersonaResumen[]>("/api/personas/buscar", {
        params: { nombre: busqueda.trim() },
      });
      setResultados(data);
      if (data.length === 0) toast.info("No se encontraron personas con ese nombre");
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo buscar"));
    } finally {
      setBuscando(false);
    }
  };

  const totalNumero = Number(total);
  const valido =
    persona !== null &&
    descripcion.trim().length > 0 &&
    totalNumero > 0 &&
    (!fechaVencimiento || fechaVencimiento >= fechaEmision);

  const guardar = async () => {
    if (!persona || !valido) return;
    setGuardando(true);
    try {
      const factura = await crearFacturaManual({
        personaId: persona.id,
        concepto,
        descripcion: descripcion.trim(),
        total: totalNumero,
        fechaEmision,
        fechaVencimiento: fechaVencimiento || undefined,
        eventoId: eventoId ? Number(eventoId) : null,
      });
      toast.success(`Factura ${factura.numeroFactura} creada`);
      onCreada();
      onOpenChange(false);
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo crear la factura"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo cobro manual</DialogTitle>
          <DialogDescription>
            Para uniformes, competencias, eventos u otros cobros. Vence a los 10 días si no indicas otra fecha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cobrar a</Label>
            {persona ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>
                  {persona.nombre} {persona.apellidos}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setPersona(null)}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por nombre…"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && buscar()}
                  />
                  <Button variant="outline" onClick={buscar} disabled={buscando}>
                    {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {resultados.length > 0 && (
                  <div className="max-h-36 overflow-y-auto rounded-md border">
                    {resultados.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => setPersona(p)}
                      >
                        {p.nombre} {p.apellidos}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Concepto</Label>
              <Select value={concepto} onValueChange={(v) => setConcepto(v as FacturaManualPayload["concepto"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONCEPTOS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Evento (opcional)</Label>
              <Select value={eventoId || "ninguno"} onValueChange={(v) => setEventoId(v === "ninguno" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Sin evento</SelectItem>
                  {eventos.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input
              value={descripcion}
              maxLength={255}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej.: Uniforme competencia 2026 talla M"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Total (COP)</Label>
              <Input type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Emisión</Label>
              <Input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vence (opcional)</Label>
              <Input
                type="date"
                value={fechaVencimiento}
                min={fechaEmision}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={!valido || guardando}>
            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear factura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
