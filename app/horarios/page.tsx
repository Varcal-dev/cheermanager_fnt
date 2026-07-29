"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Calendar,
  Users,
  Link2,
  X,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import NuevoHorarioModal from "../components/Forms/NuevoHorarioModal";
import AsignarHorarioAGrupoModal from "../components/Forms/AsignarHorarioAGrupoModal";
import CalendarioSemanal from "../components/Horarios/CalendarioSemanal";

interface GrupoAsociado {
  horarioEntrenamientoId: number;
  grupoId: number;
  nombreGrupo: string;
}

interface HorarioResponseDTO {
  id: number;
  diaId: number;
  dia: string;
  horaInicio: string; // "HH:mm:ss"
  horaFin: string;
  grupos: GrupoAsociado[];
}

interface GrupoSimple {
  id: number;
  nombre: string;
}

interface EstadoAsistencia {
  id: number;
  estado: string;
}

interface DeportistaActivo {
  deportistaId: number;
  nombre: string;
}

interface AsistenciaResponseDTO {
  id: number;
  deportistaId: number;
  nombreDeportista: string;
  horarioId: number;
  fecha: string;
  estadoAsistenciaId: number;
  estadoAsistencia: string;
}

// Solo para ordenar la tabla por día real de la semana en vez de
// alfabéticamente (Jueves no debería ir antes que Lunes).
const ORDEN_DIAS: Record<string, number> = {
  lunes: 1,
  martes: 2,
  miércoles: 3,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  sabado: 6,
  domingo: 7,
};

const formatHora = (hora: string) => hora?.slice(0, 5) ?? "";

export default function HorariosPage() {
  const [activeTab, setActiveTab] = useState("horarios");

  // ---- Horarios ----
  const [horarios, setHorarios] = useState<HorarioResponseDTO[]>([]);
  const [grupos, setGrupos] = useState<GrupoSimple[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [modalHorarioOpen, setModalHorarioOpen] = useState(false);
  const [horarioEditar, setHorarioEditar] = useState<HorarioResponseDTO | null>(
    null,
  );

  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [horarioParaAsignar, setHorarioParaAsignar] =
    useState<HorarioResponseDTO | null>(null);

  const [confirmEliminarHorarioId, setConfirmEliminarHorarioId] = useState<
    number | null
  >(null);
  const [confirmDesasignar, setConfirmDesasignar] = useState<{
    horarioEntrenamientoId: number;
    nombreGrupo: string;
  } | null>(null);

  const fetchHorarios = async () => {
    setLoadingHorarios(true);
    try {
      const res = await api.get(`/api/horarios`);
      setHorarios(res.data);
    } catch (error) {
      console.error("Error al obtener horarios:", error);
      toast.error("Error al cargar los horarios.");
    } finally {
      setLoadingHorarios(false);
    }
  };

  const fetchGrupos = async () => {
    try {
      // /api/grupos (crudo) serializa la entidad JPA con la relación
      // bidireccional grupo <-> deportistas y entra en loop infinito al
      // convertir a JSON (Document nesting depth exceeded). /con-deportistas
      // ya arma un DTO plano sin ese ciclo — mismo endpoint que usa
      // grupos/page.tsx.
      const res = await api.get(`/api/grupos/con-deportistas`);
      setGrupos(res.data.map((g: any) => ({ id: g.id, nombre: g.nombre })));
    } catch (error) {
      console.error("Error al obtener grupos:", error);
      toast.error("Error al cargar los grupos.");
    }
  };

  useEffect(() => {
    fetchHorarios();
    fetchGrupos();
  }, []);

  const handleEliminarHorario = async () => {
    if (!confirmEliminarHorarioId) return;
    try {
      await api.delete(`/api/horarios/${confirmEliminarHorarioId}`);
      toast.success("Horario eliminado correctamente");
      setConfirmEliminarHorarioId(null);
      fetchHorarios();
    } catch (error: any) {
      console.error("Error al eliminar horario:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Error al eliminar el horario.",
      );
    }
  };

  const handleDesasignar = async () => {
    if (!confirmDesasignar) return;
    try {
      await api.delete(
        `/api/horarios/asignacion/${confirmDesasignar.horarioEntrenamientoId}`,
      );
      toast.success("Horario desvinculado del grupo");
      setConfirmDesasignar(null);
      fetchHorarios();
    } catch (error: any) {
      console.error("Error al desasignar horario:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Error al desvincular el horario.",
      );
    }
  };

  const filteredHorarios = useMemo(
    () =>
      horarios
        .filter(
          (h) =>
            h.dia.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.grupos.some((g) =>
              g.nombreGrupo.toLowerCase().includes(searchTerm.toLowerCase()),
            ),
        )
        .sort((a, b) => {
          const diaA = ORDEN_DIAS[a.dia.toLowerCase()] ?? 99;
          const diaB = ORDEN_DIAS[b.dia.toLowerCase()] ?? 99;
          if (diaA !== diaB) return diaA - diaB;
          return a.horaInicio.localeCompare(b.horaInicio);
        }),
    [horarios, searchTerm],
  );

  // ---- Asistencias ----
  const [estadosCatalogo, setEstadosCatalogo] = useState<EstadoAsistencia[]>(
    [],
  );
  const [grupoAsistenciaId, setGrupoAsistenciaId] = useState("");
  const [horarioAsistenciaId, setHorarioAsistenciaId] = useState("");
  const [fechaAsistencia, setFechaAsistencia] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [roster, setRoster] = useState<
    { deportistaId: number; nombre: string; estadoAsistenciaId: string }[]
  >([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);
  const [listaCargada, setListaCargada] = useState(false);

  useEffect(() => {
    api
      .get(`/api/estados-asistencia`)
      .then((res) => setEstadosCatalogo(res.data))
      .catch((err) => {
        console.error("Error al cargar estados de asistencia", err);
        toast.error("No se pudo cargar el catálogo de estados de asistencia");
      });
  }, []);

  // Horarios que pertenecen al grupo seleccionado, para no dejar elegir
  // combinaciones que no existen.
  const horariosDelGrupo = useMemo(
    () =>
      grupoAsistenciaId
        ? horarios.filter((h) =>
            h.grupos.some((g) => g.grupoId === Number(grupoAsistenciaId)),
          )
        : [],
    [horarios, grupoAsistenciaId],
  );

  useEffect(() => {
    setHorarioAsistenciaId("");
    setListaCargada(false);
    setRoster([]);
  }, [grupoAsistenciaId]);

  const estadoPorDefecto = () => {
    const presente = estadosCatalogo.find(
      (e) => e.estado.toLowerCase() === "presente",
    );
    return (presente ?? estadosCatalogo[0])?.id.toString() ?? "";
  };

  const handleCargarLista = async () => {
    if (!grupoAsistenciaId || !horarioAsistenciaId || !fechaAsistencia) {
      toast.error("Selecciona grupo, horario y fecha");
      return;
    }
    setLoadingRoster(true);
    try {
      const [activosRes, yaRegistradasRes] = await Promise.all([
        api.get<DeportistaActivo[]>(
          `/api/asistencias/grupo/${grupoAsistenciaId}/deportistas-activos`,
        ),
        api.get<AsistenciaResponseDTO[]>(
          `/api/asistencias/grupo/${grupoAsistenciaId}`,
          { params: { fecha: fechaAsistencia } },
        ),
      ]);

      const defecto = estadoPorDefecto();
      const yaRegistradas = new Map(
        yaRegistradasRes.data.map((a) => [a.deportistaId, a]),
      );

      setRoster(
        activosRes.data.map((d) => ({
          deportistaId: d.deportistaId,
          nombre: d.nombre,
          estadoAsistenciaId:
            yaRegistradas
              .get(d.deportistaId)
              ?.estadoAsistenciaId.toString() ?? defecto,
        })),
      );
      setListaCargada(true);
    } catch (error) {
      console.error("Error al cargar la lista:", error);
      toast.error("No se pudo cargar la lista de deportistas del grupo.");
    } finally {
      setLoadingRoster(false);
    }
  };

  const marcarTodos = (estadoId: string) => {
    setRoster((prev) =>
      prev.map((r) => ({ ...r, estadoAsistenciaId: estadoId })),
    );
  };

  const handleGuardarAsistencia = async () => {
    if (!horarioAsistenciaId || roster.length === 0) return;
    setGuardandoAsistencia(true);
    try {
      const { data, status } = await api.post(`/api/asistencias/masivo`, {
        horarioId: Number(horarioAsistenciaId),
        fecha: fechaAsistencia,
        registros: roster.map((r) => ({
          deportistaId: r.deportistaId,
          estadoAsistenciaId: Number(r.estadoAsistenciaId),
        })),
      });

      const errores: Record<string, string> = data?.errores ?? {};
      const numErrores = Object.keys(errores).length;

      if (numErrores === 0) {
        toast.success(
          `Asistencia guardada: ${data?.registrados?.length ?? roster.length} deportistas`,
        );
      } else {
        toast.warn(
          `Se guardaron ${data?.registrados?.length ?? 0} registros, pero ${numErrores} fallaron. Revisa la consola para el detalle.`,
        );
        console.error("Errores al registrar asistencia masiva:", errores);
      }
    } catch (error: any) {
      console.error("Error al guardar asistencia:", error);
      toast.error(
        error.response?.data?.message ||
          error.response?.data ||
          "Error al guardar la asistencia. Intenta de nuevo.",
      );
    } finally {
      setGuardandoAsistencia(false);
    }
  };

  const presentesCount = useMemo(() => {
    const presenteId = estadosCatalogo.find(
      (e) => e.estado.toLowerCase() === "presente",
    )?.id;
    if (presenteId == null) return null;
    return roster.filter((r) => Number(r.estadoAsistenciaId) === presenteId)
      .length;
  }, [roster, estadosCatalogo]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Horarios y Asistencias
          </h1>
            <p className="text-muted-foreground">
              Gestiona los horarios de entrenamiento y registra asistencias
            </p>
          </div>
          {(activeTab === "horarios" || activeTab === "calendario") && (
            <Button
              onClick={() => {
                setHorarioEditar(null);
                setModalHorarioOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Horario
            </Button>
          )}
        </div>

        <Tabs
          defaultValue="horarios"
          className="w-full"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="horarios">Horarios</TabsTrigger>
            <TabsTrigger value="calendario">Calendario</TabsTrigger>
            <TabsTrigger value="asistencias">Asistencias</TabsTrigger>
          </TabsList>

          {/* ================= HORARIOS ================= */}
          <TabsContent value="horarios">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between mb-4">
                  <div className="flex items-center space-x-2 w-full max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por día o grupo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {loadingHorarios ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando
                    horarios...
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Día</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Grupos asignados</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHorarios.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No hay horarios registrados todavía.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredHorarios.map((horario) => (
                          <TableRow key={horario.id}>
                            <TableCell className="font-medium">
                              {horario.dia}
                            </TableCell>
                            <TableCell>
                              {formatHora(horario.horaInicio)} -{" "}
                              {formatHora(horario.horaFin)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {horario.grupos.length === 0 ? (
                                  <span className="text-sm text-muted-foreground">
                                    Sin grupo asignado
                                  </span>
                                ) : (
                                  horario.grupos.map((g) => (
                                    <Badge
                                      key={g.horarioEntrenamientoId}
                                      variant="outline"
                                      className="flex items-center gap-1"
                                    >
                                      {g.nombreGrupo}
                                      <button
                                        type="button"
                                        title="Desvincular de este grupo"
                                        onClick={() =>
                                          setConfirmDesasignar({
                                            horarioEntrenamientoId:
                                              g.horarioEntrenamientoId,
                                            nombreGrupo: g.nombreGrupo,
                                          })
                                        }
                                      >
                                        <X className="h-3 w-3 hover:text-red-600" />
                                      </button>
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Asignar a otro grupo"
                                  onClick={() => {
                                    setHorarioParaAsignar(horario);
                                    setModalAsignarOpen(true);
                                  }}
                                >
                                  <Link2 className="h-4 w-4 mr-1" /> Asignar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setHorarioEditar(horario);
                                    setModalHorarioOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-1" /> Editar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    setConfirmEliminarHorarioId(horario.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================= CALENDARIO ================= */}
          <TabsContent value="calendario">
            {loadingHorarios ? (
              <Card>
                <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando
                  calendario...
                </CardContent>
              </Card>
            ) : (
              <CalendarioSemanal horarios={horarios} />
            )}
          </TabsContent>

          {/* ================= ASISTENCIAS ================= */}
          <TabsContent value="asistencias">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Asistencias</CardTitle>
                <CardDescription>
                  Selecciona grupo, horario y fecha para pasar lista o revisar
                  una asistencia ya registrada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="text-sm font-medium">Grupo</label>
                    <Select
                      onValueChange={setGrupoAsistenciaId}
                      value={grupoAsistenciaId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        {grupos.map((g) => (
                          <SelectItem key={g.id} value={g.id.toString()}>
                            {g.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Horario</label>
                    <Select
                      onValueChange={setHorarioAsistenciaId}
                      value={horarioAsistenciaId}
                      disabled={!grupoAsistenciaId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            grupoAsistenciaId
                              ? "Seleccionar horario"
                              : "Elige un grupo primero"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {horariosDelGrupo.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Este grupo no tiene horarios asignados
                          </div>
                        ) : (
                          horariosDelGrupo.map((h) => (
                            <SelectItem key={h.id} value={h.id.toString()}>
                              {h.dia} {formatHora(h.horaInicio)}-
                              {formatHora(h.horaFin)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Fecha</label>
                    <Input
                      type="date"
                      value={fechaAsistencia}
                      onChange={(e) => setFechaAsistencia(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleCargarLista}
                    disabled={
                      !grupoAsistenciaId ||
                      !horarioAsistenciaId ||
                      loadingRoster
                    }
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {loadingRoster ? "Cargando..." : "Cargar lista"}
                  </Button>
                </div>

                {listaCargada && (
                  <div className="border rounded-md">
                    <div className="flex items-center justify-between p-3 border-b bg-muted/40">
                      <div className="text-sm text-muted-foreground">
                        {roster.length} deportista(s) activo(s) en este grupo
                        {presentesCount != null &&
                          ` · ${presentesCount} marcados como presentes`}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={estadosCatalogo.length === 0}
                        onClick={() => marcarTodos(estadoPorDefecto())}
                      >
                        <CheckCheck className="h-4 w-4 mr-1" /> Marcar todos
                        presentes
                      </Button>
                    </div>

                    {roster.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay deportistas activos en este grupo.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Deportista</TableHead>
                            <TableHead className="w-[220px]">Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roster.map((r, idx) => (
                            <TableRow key={r.deportistaId}>
                              <TableCell>{r.nombre}</TableCell>
                              <TableCell>
                                <Select
                                  value={r.estadoAsistenciaId}
                                  onValueChange={(value) =>
                                    setRoster((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? { ...item, estadoAsistenciaId: value }
                                          : item,
                                      ),
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Estado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {estadosCatalogo.map((e) => (
                                      <SelectItem
                                        key={e.id}
                                        value={e.id.toString()}
                                      >
                                        {e.estado}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    {roster.length > 0 && (
                      <div className="flex justify-end p-3 border-t">
                        <Button
                          onClick={handleGuardarAsistencia}
                          disabled={guardandoAsistencia}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {guardandoAsistencia
                            ? "Guardando..."
                            : "Guardar asistencia"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modales */}
        <NuevoHorarioModal
          open={modalHorarioOpen}
          onOpenChange={setModalHorarioOpen}
          horarioEditar={horarioEditar}
          grupos={grupos}
          onGuardado={fetchHorarios}
        />

        <AsignarHorarioAGrupoModal
          open={modalAsignarOpen}
          onOpenChange={setModalAsignarOpen}
          horarioId={horarioParaAsignar?.id ?? null}
          horarioLabel={
            horarioParaAsignar
              ? `${horarioParaAsignar.dia} ${formatHora(horarioParaAsignar.horaInicio)}-${formatHora(horarioParaAsignar.horaFin)}`
              : undefined
          }
          grupos={grupos}
          gruposYaAsignados={
            horarioParaAsignar?.grupos.map((g) => g.grupoId) ?? []
          }
          onAsignado={fetchHorarios}
        />

        {/* Confirmar eliminar horario */}
        <Dialog
          open={confirmEliminarHorarioId !== null}
          onOpenChange={(open) => !open && setConfirmEliminarHorarioId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar este horario?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Se eliminará el bloque de horario y sus asignaciones a grupos.
              Los registros de asistencia ya guardados no se ven afectados.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setConfirmEliminarHorarioId(null)}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleEliminarHorario}>
                Eliminar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmar desasignar de un grupo */}
        <Dialog
          open={confirmDesasignar !== null}
          onOpenChange={(open) => !open && setConfirmDesasignar(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Desvincular este horario del grupo?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {confirmDesasignar?.nombreGrupo} dejará de entrenar en este
              bloque de horario. El horario en sí no se elimina.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDesasignar(null)}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDesasignar}>
                Desvincular
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}