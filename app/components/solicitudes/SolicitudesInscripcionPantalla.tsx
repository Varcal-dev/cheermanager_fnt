"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  aprobarSolicitud,
  listarSolicitudes,
  rechazarSolicitud,
  type EstadoSolicitud,
  type Solicitud,
} from "@/app/lib/portal";

// Solicitudes de inscripción a temporada hechas desde el portal (deportista / acudiente).
// El club las revisa una por una: al aprobar se crea la inscripción y sus facturas.

interface PlanPago {
  id: number;
  nombre: string;
}

const TODAS = "TODAS";
const SIN_MENSUALIDAD = "ninguno";

const ETIQUETA: Record<EstadoSolicitud, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
};

const VARIANTE: Record<EstadoSolicitud, "default" | "secondary" | "destructive" | "outline"> = {
  PENDIENTE: "default",
  APROBADA: "secondary",
  RECHAZADA: "destructive",
  CANCELADA: "outline",
};

const fmt = (d?: string | null) =>
  d ? new Date(d.slice(0, 10) + "T00:00:00").toLocaleDateString("es-CO") : "—";

export default function SolicitudesInscripcionPantalla({ embebido = false, alCambiar }: { embebido?: boolean; alCambiar?: () => void }) {
  const [filtro, setFiltro] = useState<string>("PENDIENTE");
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);

  const [aprobando, setAprobando] = useState<Solicitud | null>(null);
  const [rechazando, setRechazando] = useState<Solicitud | null>(null);
  const [planesInscripcion, setPlanesInscripcion] = useState<PlanPago[]>([]);
  const [planesMensualidad, setPlanesMensualidad] = useState<PlanPago[]>([]);
  const [planInscripcion, setPlanInscripcion] = useState("");
  const [planMensualidad, setPlanMensualidad] = useState(SIN_MENSUALIDAD);
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setSolicitudes(await listarSolicitudes(filtro === TODAS ? undefined : filtro));
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron cargar las solicitudes"));
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirAprobacion = async (s: Solicitud) => {
    setPlanInscripcion("");
    setPlanMensualidad(SIN_MENSUALIDAD);
    setAprobando(s);
    // Los planes se cargan al abrir el diálogo la primera vez.
    if (planesInscripcion.length === 0 && planesMensualidad.length === 0) {
      const [ins, men] = await Promise.allSettled([
        api.get("/api/planes-pago", { params: { categoria: "inscripcion" } }),
        api.get("/api/planes-pago", { params: { categoria: "mensualidad" } }),
      ]);
      if (ins.status === "fulfilled") setPlanesInscripcion(ins.value.data ?? []);
      else toast.error("No se pudieron cargar los planes de inscripción");
      if (men.status === "fulfilled") setPlanesMensualidad(men.value.data ?? []);
      else toast.error("No se pudieron cargar los planes de mensualidad");
    }
  };

  const confirmarAprobacion = async () => {
    if (!aprobando) return;
    if (!planInscripcion) {
      toast.error("Selecciona el plan de inscripción");
      return;
    }
    setGuardando(true);
    try {
      await aprobarSolicitud(
        aprobando.id,
        Number(planInscripcion),
        planMensualidad === SIN_MENSUALIDAD ? null : Number(planMensualidad),
      );
      toast.success(`Solicitud de ${aprobando.deportista} aprobada: inscripción y facturas creadas`);
      setAprobando(null);
      cargar();
      alCambiar?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo aprobar la solicitud"));
    } finally {
      setGuardando(false);
    }
  };

  const abrirRechazo = (s: Solicitud) => {
    setMotivo("");
    setRechazando(s);
  };

  const confirmarRechazo = async () => {
    if (!rechazando) return;
    if (motivo.trim().length < 5) {
      toast.error("Indica el motivo del rechazo (mínimo 5 caracteres)");
      return;
    }
    setGuardando(true);
    try {
      await rechazarSolicitud(rechazando.id, motivo.trim());
      toast.success("Solicitud rechazada");
      setRechazando(null);
      cargar();
      alCambiar?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo rechazar la solicitud"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission="gestionar_inscripciones">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            {!embebido && <h1 className="text-3xl font-bold tracking-tight">Solicitudes de inscripción</h1>}
            <p className="text-muted-foreground">
              Renovaciones pedidas desde el portal por deportistas y acudientes. Al aprobar se crea la inscripción y
              sus facturas.
            </p>
          </div>
          <div className="w-[180px]">
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                <SelectItem value="APROBADA">Aprobadas</SelectItem>
                <SelectItem value="RECHAZADA">Rechazadas</SelectItem>
                <SelectItem value="CANCELADA">Canceladas</SelectItem>
                <SelectItem value={TODAS}>Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deportista</TableHead>
                  <TableHead>Temporada</TableHead>
                  <TableHead>Solicitada</TableHead>
                  <TableHead>Observaciones</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : solicitudes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No hay solicitudes en este estado.
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitudes.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.deportista}</TableCell>
                      <TableCell>
                        {s.temporada}
                        <span className="block text-xs text-muted-foreground">
                          {fmt(s.temporadaInicio)} – {fmt(s.temporadaFin)}
                        </span>
                      </TableCell>
                      <TableCell>{fmt(s.fechaSolicitud)}</TableCell>
                      <TableCell className="max-w-[240px] truncate" title={s.observaciones ?? ""}>
                        {s.observaciones ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={VARIANTE[s.estado]}>{ETIQUETA[s.estado]}</Badge>
                        {s.estado === "RECHAZADA" && s.motivoResolucion && (
                          <span className="block text-xs text-muted-foreground">{s.motivoResolucion}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.estado === "PENDIENTE" ? (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => abrirAprobacion(s)}>
                              <Check className="mr-1 h-4 w-4" /> Aprobar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => abrirRechazo(s)}>
                              <X className="mr-1 h-4 w-4" /> Rechazar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{fmt(s.fechaResolucion)}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Aprobar: se eligen los planes con los que se factura */}
        <Dialog open={aprobando !== null} onOpenChange={(o) => !o && setAprobando(null)}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Aprobar solicitud</DialogTitle>
              <DialogDescription>
                {aprobando?.deportista} · temporada {aprobando?.temporada}. Se creará la inscripción, la factura de
                inscripción y, si eliges plan, la primera mensualidad.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Plan de inscripción</Label>
                <Select value={planInscripcion} onValueChange={setPlanInscripcion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planesInscripcion.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Plan de mensualidad (opcional)</Label>
                <Select value={planMensualidad} onValueChange={setPlanMensualidad}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_MENSUALIDAD}>Sin mensualidad</SelectItem>
                    {planesMensualidad.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAprobando(null)}>
                Cancelar
              </Button>
              <Button onClick={confirmarAprobacion} disabled={guardando}>
                {guardando ? "Aprobando..." : "Aprobar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rechazar: el motivo es obligatorio y lo ve quien solicitó */}
        <Dialog open={rechazando !== null} onOpenChange={(o) => !o && setRechazando(null)}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle>Rechazar solicitud</DialogTitle>
              <DialogDescription>
                {rechazando?.deportista} · temporada {rechazando?.temporada}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label>Motivo</Label>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Tiene facturas pendientes de la temporada anterior"
                maxLength={300}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRechazando(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmarRechazo} disabled={guardando}>
                {guardando ? "Rechazando..." : "Rechazar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
