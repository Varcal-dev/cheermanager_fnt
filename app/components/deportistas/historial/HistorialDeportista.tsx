"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/UserContext";
import {
  obtenerHistorialMedico,
  obtenerHistorialNiveles,
  obtenerHistorialPlanes,
  type HistorialMedico,
  type HistorialNivel,
  type HistorialPlan,
  type PlanPago,
} from "@/lib/deportistas-historiales";
import type { Nivel } from "@/app/deportistas/types";
import CambioNivelDialog from "./CambioNivelDialog";
import CambioPlanDialog from "./CambioPlanDialog";
import RegistroMedicoDialog from "./RegistroMedicoDialog";

interface Props {
  deportistaId: number;
  niveles: Nivel[];
  planesPago: PlanPago[];
  /** El nivel actual del deportista pudo cambiar: la lista principal debe recargarse. */
  onNivelCambiado: () => void;
}

const fecha = (iso: string) => new Date(iso).toLocaleDateString();

/** Encabezado + estados de carga/vacío comunes a las secciones del historial. */
function SeccionHistorial({
  titulo,
  accion,
  cargando,
  vacio,
  textoVacio,
  children,
}: {
  titulo: string;
  accion?: React.ReactNode;
  cargando: boolean;
  vacio: boolean;
  textoVacio: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">{titulo}</h4>
        {accion}
      </div>
      {cargando ? (
        <div className="text-center py-4 text-muted-foreground">Cargando...</div>
      ) : vacio ? (
        <div className="text-center py-4 text-muted-foreground">{textoVacio}</div>
      ) : (
        children
      )}
    </>
  );
}

/**
 * Historiales de un deportista (niveles, planes, médico, grupos). Se monta al abrir la pestaña
 * "Historial", así que los datos se piden solo cuando se necesitan.
 */
export default function HistorialDeportista({ deportistaId, niveles, planesPago, onNivelCambiado }: Props) {
  const { permissions } = useUser();

  const [historialNiveles, setHistorialNiveles] = useState<HistorialNivel[]>([]);
  const [historialPlanes, setHistorialPlanes] = useState<HistorialPlan[]>([]);
  const [historialMedico, setHistorialMedico] = useState<HistorialMedico[]>([]);
  const [cargando, setCargando] = useState(true);

  const [nivelAbierto, setNivelAbierto] = useState(false);
  const [planAbierto, setPlanAbierto] = useState(false);
  const [medicoAbierto, setMedicoAbierto] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [n, p, m] = await Promise.all([
        obtenerHistorialNiveles(deportistaId),
        obtenerHistorialPlanes(deportistaId),
        obtenerHistorialMedico(deportistaId),
      ]);
      setHistorialNiveles(n);
      setHistorialPlanes(p);
      setHistorialMedico(m.content);
    } catch (error) {
      console.error("Error al cargar historiales", error);
      toast.error("No se pudieron cargar los historiales del deportista");
    } finally {
      setCargando(false);
    }
  }, [deportistaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const botonNuevo = (texto: string, onClick: () => void) => (
    <Button size="sm" variant="outline" onClick={onClick}>
      <Plus className="h-4 w-4 mr-1" /> {texto}
    </Button>
  );

  return (
    <>
      <Tabs defaultValue="niveles">
        <TabsList>
          <TabsTrigger value="niveles">Historial de Niveles</TabsTrigger>
          <TabsTrigger value="planes">Historial de Planes</TabsTrigger>
          <TabsTrigger value="medico">Historial Médico</TabsTrigger>
          <TabsTrigger value="grupos">Historial de Grupos</TabsTrigger>
        </TabsList>

        <TabsContent value="niveles" className="mt-4">
          <SeccionHistorial
            titulo="Historial de Niveles"
            accion={
              permissions.includes("modificar_deportista") &&
              botonNuevo("Registrar Cambio de Nivel", () => setNivelAbierto(true))
            }
            cargando={cargando}
            vacio={historialNiveles.length === 0}
            textoVacio="No hay historial de niveles registrado"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Fecha de Cambio</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialNiveles.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{niveles.find((n) => n.id === h.nivelId)?.nombre ?? h.nivelId}</TableCell>
                    <TableCell>{fecha(h.fechaCambio)}</TableCell>
                    <TableCell>{h.motivo ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SeccionHistorial>
        </TabsContent>

        <TabsContent value="planes" className="mt-4">
          <SeccionHistorial
            titulo="Historial de Planes"
            accion={
              permissions.includes("modificar_inscripcion") &&
              botonNuevo("Registrar Cambio de Plan", () => setPlanAbierto(true))
            }
            cargando={cargando}
            vacio={historialPlanes.length === 0}
            textoVacio="No hay historial de planes registrado"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Motivo de Cambio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialPlanes.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{h.nombrePlan}</TableCell>
                    <TableCell>{fecha(h.fechaInicio)}</TableCell>
                    <TableCell>{h.fechaFin ? fecha(h.fechaFin) : "Activo"}</TableCell>
                    <TableCell>{h.motivoCambio ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SeccionHistorial>
        </TabsContent>

        <TabsContent value="medico" className="mt-4">
          <SeccionHistorial
            titulo="Historial Médico"
            accion={
              permissions.includes("crear_historial_medico") &&
              botonNuevo("Nuevo Registro", () => setMedicoAbierto(true))
            }
            cargando={cargando}
            vacio={historialMedico.length === 0}
            textoVacio="No hay historial médico registrado"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Gravedad</TableHead>
                  <TableHead>Médico Tratante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historialMedico.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{fecha(h.fechaRegistro)}</TableCell>
                    <TableCell>{h.tipoRegistro ?? "—"}</TableCell>
                    <TableCell>{h.descripcion}</TableCell>
                    <TableCell>{h.gravedad ? <Badge variant="secondary">{h.gravedad}</Badge> : "—"}</TableCell>
                    <TableCell>{h.medicoTratante ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SeccionHistorial>
        </TabsContent>

        {/* Historial de Grupos — pendiente: aún no existe endpoint en el back */}
        <TabsContent value="grupos" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Historial de Grupos</h4>
          </div>
          <div className="text-center py-4 text-muted-foreground">
            Disponible cuando se conecte el módulo de inscripción a grupos
          </div>
        </TabsContent>
      </Tabs>

      <CambioNivelDialog
        open={nivelAbierto}
        onOpenChange={setNivelAbierto}
        deportistaId={deportistaId}
        niveles={niveles}
        onGuardado={() => {
          cargar();
          onNivelCambiado();
        }}
      />
      <CambioPlanDialog
        open={planAbierto}
        onOpenChange={setPlanAbierto}
        deportistaId={deportistaId}
        planesPago={planesPago}
        onGuardado={cargar}
      />
      <RegistroMedicoDialog
        open={medicoAbierto}
        onOpenChange={setMedicoAbierto}
        deportistaId={deportistaId}
        onGuardado={cargar}
      />
    </>
  );
}
