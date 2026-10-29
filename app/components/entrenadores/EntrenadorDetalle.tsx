"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import {
  fechaLegible,
  type AsignacionEntrenador,
  type Entrenador,
  type HorarioEntrenador,
} from "@/app/entrenadores/types";
import AsignarGrupoAEntrenadorModal from "../Forms/AsignarGrupoAEntrenadorModal";
import EditarAsignacionEntrenadorModal from "../Forms/EditarAsignacionEntrenadorModal";
import FinalizarAsignacionEntrenadorModal from "../Forms/FinalizarAsignacionEntrenadorModal";

// Lo mínimo que necesitan los modales de Editar/Finalizar de una asignación. Se llega a la misma
// asignación (GrupoEntrenador) desde dos vistas: "Grupos Asignados" y "Horarios".
interface AsignacionEnAccion {
  id: number;
  grupoNombre: string;
  rol: string;
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span>{valor}</span>
    </div>
  );
}

/**
 * Detalle desplegable de un entrenador: datos, grupos asignados y horarios. Se monta al expandir la
 * fila, así que las asignaciones y el horario se piden solo cuando se necesitan.
 */
export default function EntrenadorDetalle({ entrenador }: { entrenador: Entrenador }) {
  const [asignaciones, setAsignaciones] = useState<AsignacionEntrenador[]>([]);
  const [horarios, setHorarios] = useState<HorarioEntrenador[]>([]);
  const [cargando, setCargando] = useState(true);

  const [enEdicion, setEnEdicion] = useState<AsignacionEnAccion | null>(null);
  const [aFinalizar, setAFinalizar] = useState<AsignacionEnAccion | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    Promise.allSettled([
      api.get(`/api/grupos/entrenadores/${entrenador.id}/asignaciones`),
      api.get(`/api/grupos/entrenadores/${entrenador.id}/horario`),
    ])
      .then(([asignacionesRes, horarioRes]) => {
        setAsignaciones(asignacionesRes.status === "fulfilled" ? asignacionesRes.value.data : []);
        setHorarios(horarioRes.status === "fulfilled" ? horarioRes.value.data : []);
        if (asignacionesRes.status === "rejected" || horarioRes.status === "rejected") {
          toast.error("No se pudo cargar la información de grupos/horario de este entrenador");
        }
      })
      .finally(() => setCargando(false));
  }, [entrenador.id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const persona = entrenador.persona;

  return (
    <>
      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Información Personal</TabsTrigger>
          <TabsTrigger value="grupos">Grupos Asignados</TabsTrigger>
          <TabsTrigger value="horarios">Horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Datos Personales</h4>
              <div className="space-y-2">
                <Dato etiqueta="Teléfono:" valor={persona?.telefono || "—"} />
                <Dato etiqueta="Dirección:" valor={persona?.direccion || "—"} />
                <Dato etiqueta="Fecha de Nacimiento:" valor={fechaLegible(persona?.fechaNacimiento)} />
                <Dato etiqueta="Fecha de Contratación:" valor={fechaLegible(entrenador.fechaContratacion)} />
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Información Profesional</h4>
              <div className="space-y-2">
                <Dato etiqueta="Especialización:" valor={entrenador.especializacion || "—"} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="grupos" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Grupos Asignados</h4>
            <AsignarGrupoAEntrenadorModal entrenadorId={entrenador.id} onAsignado={cargar} />
          </div>
          {cargando ? (
            <div className="text-center py-4 text-muted-foreground">Cargando…</div>
          ) : asignaciones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaciones.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.grupoNombre}</TableCell>
                    <TableCell>{a.rol}</TableCell>
                    <TableCell>{fechaLegible(a.fechaInicio)}</TableCell>
                    <TableCell>{a.fechaFin ? fechaLegible(a.fechaFin) : "Activo"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEnEdicion(a)}>
                          <Pencil className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        {!a.fechaFin && (
                          <Button variant="destructive" size="sm" onClick={() => setAFinalizar(a)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Finalizar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No hay grupos asignados a este entrenador</div>
          )}
        </TabsContent>

        <TabsContent value="horarios" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Horarios</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Estos bloques vienen del horario real de cada grupo asignado. Para agregar o cambiar días/horas, hazlo
            desde el módulo Horarios — afecta a todo el grupo, no solo a este entrenador.
          </p>
          {cargando ? (
            <div className="text-center py-4 text-muted-foreground">Cargando…</div>
          ) : horarios.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Día</TableHead>
                  <TableHead>Hora Inicio</TableHead>
                  <TableHead>Hora Fin</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {horarios.map((h, idx) => {
                  const asignacion: AsignacionEnAccion = { id: h.asignacionId, grupoNombre: h.grupoNombre, rol: h.rol };
                  return (
                    <TableRow key={`${h.asignacionId}-${idx}`}>
                      <TableCell>{h.grupoNombre}</TableCell>
                      <TableCell>{h.dia}</TableCell>
                      <TableCell>{h.horaInicio}</TableCell>
                      <TableCell>{h.horaFin}</TableCell>
                      <TableCell>
                        <Badge variant={h.rol === "Entrenador Principal" ? "default" : "outline"}>{h.rol}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setEnEdicion(asignacion)}>
                            <Pencil className="h-4 w-4 mr-1" /> Editar rol
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setAFinalizar(asignacion)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Finalizar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No hay horarios asignados a este entrenador</div>
          )}
        </TabsContent>
      </Tabs>

      {enEdicion && (
        <EditarAsignacionEntrenadorModal
          asignacionId={enEdicion.id}
          grupoNombre={enEdicion.grupoNombre}
          rolActual={enEdicion.rol}
          open={enEdicion !== null}
          onOpenChange={(abierto) => {
            if (!abierto) setEnEdicion(null);
          }}
          onActualizado={() => {
            setEnEdicion(null);
            cargar();
          }}
        />
      )}

      {aFinalizar && (
        <FinalizarAsignacionEntrenadorModal
          asignacionId={aFinalizar.id}
          grupoNombre={aFinalizar.grupoNombre}
          open={aFinalizar !== null}
          onOpenChange={(abierto) => {
            if (!abierto) setAFinalizar(null);
          }}
          onFinalizado={() => {
            setAFinalizar(null);
            cargar();
          }}
        />
      )}
    </>
  );
}
