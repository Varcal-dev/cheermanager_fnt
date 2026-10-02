"use client";

import { useEffect, useState } from "react";
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
  Search,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Stethoscope,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import {
  obtenerHistorialMedicoGlobal,
  actualizarHistorialMedico,
  eliminarHistorialMedico,
  crearHistorialMedico,
  type RegistroHistorialMedicoGlobal,
} from "@/lib/deportistas-historiales";

const TIPOS_SUGERIDOS = ["Lesión", "Condición Crónica", "Alergia", "Enfermedad", "Otro"];
const GRAVEDADES_SUGERIDAS = ["Leve", "Moderada", "Grave"];
const PAGE_SIZE = 20;

function badgeGravedad(gravedad: string | null): "success" | "default" | "destructive" | "outline" {
  if (!gravedad) return "outline";
  const g = gravedad.toLowerCase();
  if (g.includes("grave") || g.includes("alta")) return "destructive";
  if (g.includes("moder") || g.includes("media")) return "default";
  if (g.includes("leve") || g.includes("baja")) return "success";
  return "outline";
}

interface DeportistaOpcion {
  id: number;
  nombre: string;
  apellidos: string;
}

interface FormHistorial {
  deportistaId: string;
  descripcion: string;
  fechaRegistro: string;
  tipoRegistro: string;
  gravedad: string;
  medicoTratante: string;
}

const FORM_VACIO: FormHistorial = {
  deportistaId: "",
  descripcion: "",
  fechaRegistro: new Date().toISOString().slice(0, 10),
  tipoRegistro: "",
  gravedad: "",
  medicoTratante: "",
};

export default function HistorialMedicoPage() {
  const { permissions } = useUser();

  const [registros, setRegistros] = useState<RegistroHistorialMedicoGlobal[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [cargando, setCargando] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string | null>(null);
  const [gravedadFiltro, setGravedadFiltro] = useState<string | null>(null);

  const [deportistas, setDeportistas] = useState<DeportistaOpcion[]>([]);
  const [registroSeleccionado, setRegistroSeleccionado] =
    useState<RegistroHistorialMedicoGlobal | null>(null);

  const [modalAbierto, setModalAbierto] = useState<"nuevo" | "editar" | null>(null);
  const [registroEnEdicion, setRegistroEnEdicion] = useState<RegistroHistorialMedicoGlobal | null>(
    null,
  );
  const [form, setForm] = useState<FormHistorial>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const [registroAEliminar, setRegistroAEliminar] =
    useState<RegistroHistorialMedicoGlobal | null>(null);

  // Estadísticas: se traen aparte con un tamaño de página grande, ya que no
  // hay (todavía) un endpoint de agregación — para el volumen de un club
  // esto es suficiente y evita inventar números.
  const [stats, setStats] = useState<{
    porTipo: Record<string, number>;
    porGravedad: Record<string, number>;
    total: number;
  } | null>(null);

  useEffect(() => {
    api
      .get("/api/deportistas")
      .then((res) => setDeportistas(res.data))
      .catch(() => {
        // silencioso: el selector de deportista en el formulario simplemente queda vacío
      });
  }, []);

  const cargar = () => {
    setCargando(true);
    obtenerHistorialMedicoGlobal({
      tipoRegistro: tipoFiltro ?? undefined,
      gravedad: gravedadFiltro ?? undefined,
      q: searchTerm || undefined,
      page,
      size: PAGE_SIZE,
    })
      .then((data) => {
        setRegistros(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(data.totalPages);
      })
      .catch(() => toast.error("No se pudo cargar el historial médico"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoFiltro, gravedadFiltro, searchTerm, page]);

  const cargarStats = () => {
    obtenerHistorialMedicoGlobal({ size: 1000 })
      .then((data) => {
        const porTipo: Record<string, number> = {};
        const porGravedad: Record<string, number> = {};
        for (const r of data.content) {
          const tipo = r.tipoRegistro || "Sin especificar";
          const gravedad = r.gravedad || "Sin especificar";
          porTipo[tipo] = (porTipo[tipo] || 0) + 1;
          porGravedad[gravedad] = (porGravedad[gravedad] || 0) + 1;
        }
        setStats({ porTipo, porGravedad, total: data.totalElements });
      })
      .catch(() => toast.error("No se pudieron calcular las estadísticas"));
  };

  const abrirNuevo = () => {
    setForm(FORM_VACIO);
    setModalAbierto("nuevo");
  };

  const abrirEdicion = (registro: RegistroHistorialMedicoGlobal) => {
    setRegistroEnEdicion(registro);
    setForm({
      deportistaId: "",
      descripcion: registro.descripcion,
      fechaRegistro: registro.fechaRegistro,
      tipoRegistro: registro.tipoRegistro || "",
      gravedad: registro.gravedad || "",
      medicoTratante: registro.medicoTratante || "",
    });
    setModalAbierto("editar");
  };

  const guardar = async () => {
    if (!form.descripcion.trim() || !form.fechaRegistro) {
      toast.error("Descripción y fecha son obligatorias");
      return;
    }
    setGuardando(true);
    try {
      if (modalAbierto === "nuevo") {
        if (!form.deportistaId) {
          toast.error("Selecciona un deportista");
          setGuardando(false);
          return;
        }
        await crearHistorialMedico(parseInt(form.deportistaId), {
          descripcion: form.descripcion,
          fechaRegistro: form.fechaRegistro,
          tipoRegistro: form.tipoRegistro || undefined,
          gravedad: form.gravedad || undefined,
          medicoTratante: form.medicoTratante || undefined,
        });
        toast.success("Registro médico creado");
      } else if (registroEnEdicion) {
        await actualizarHistorialMedico(registroEnEdicion.id, {
          descripcion: form.descripcion,
          fechaRegistro: form.fechaRegistro,
          tipoRegistro: form.tipoRegistro || undefined,
          gravedad: form.gravedad || undefined,
          medicoTratante: form.medicoTratante || undefined,
        });
        toast.success("Registro médico actualizado");
      }
      setModalAbierto(null);
      setRegistroEnEdicion(null);
      cargar();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el registro médico");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!registroAEliminar) return;
    try {
      await eliminarHistorialMedico(registroAEliminar.id);
      toast.success("Registro eliminado");
      setRegistroAEliminar(null);
      if (registroSeleccionado?.id === registroAEliminar.id) setRegistroSeleccionado(null);
      cargar();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el registro");
    }
  };

  return (
    <ProtectedRoute requiredPermission="ver_historial_medico">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">
              Historial Médico
            </h1>
            <p className="text-muted-foreground">
              Lesiones y condiciones de salud registradas para los deportistas
            </p>
          </div>
          {permissions.includes("crear_historial_medico") && (
            <Button onClick={abrirNuevo}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Registro
            </Button>
          )}
        </div>

        <Tabs
          defaultValue="registros"
          className="w-full"
          onValueChange={(v) => {
            if (v === "estadisticas" && !stats) cargarStats();
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registros">Registros Médicos</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="registros" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative flex items-center w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por deportista o descripción…"
                  value={searchTerm}
                  onChange={(e) => {
                    setPage(0);
                    setSearchTerm(e.target.value);
                  }}
                  className="h-9 pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={tipoFiltro ?? "all"}
                  onValueChange={(v) => {
                    setPage(0);
                    setTipoFiltro(v === "all" ? null : v);
                  }}
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {TIPOS_SUGERIDOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={gravedadFiltro ?? "all"}
                  onValueChange={(v) => {
                    setPage(0);
                    setGravedadFiltro(v === "all" ? null : v);
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Gravedad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {GRAVEDADES_SUGERIDAS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(tipoFiltro || gravedadFiltro || searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTipoFiltro(null);
                      setGravedadFiltro(null);
                      setSearchTerm("");
                      setPage(0);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> Limpiar
                  </Button>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Deportista
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Tipo
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Fecha
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Descripción
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Gravedad
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargando ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="flex items-center justify-center py-10 text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando…
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : registros.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                              <Stethoscope className="h-6 w-6 text-accent" />
                            </div>
                            <p className="text-lg font-display font-semibold text-foreground">
                              Sin registros médicos
                            </p>
                            <p className="text-sm text-muted-foreground max-w-sm">
                              {tipoFiltro || gravedadFiltro || searchTerm
                                ? "No hay registros que coincidan con estos filtros."
                                : 'Usa "Nuevo Registro" para documentar una lesión o condición médica.'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      registros.map((registro) => (
                        <TableRow key={registro.id}>
                          <TableCell className="font-medium">
                            {registro.personaNombre} {registro.personaApellidos}
                          </TableCell>
                          <TableCell>{registro.tipoRegistro || "—"}</TableCell>
                          <TableCell>
                            {new Date(registro.fechaRegistro).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="max-w-[280px] truncate">
                            {registro.descripcion}
                          </TableCell>
                          <TableCell>
                            {registro.gravedad ? (
                              <Badge variant={badgeGravedad(registro.gravedad)}>
                                {registro.gravedad}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRegistroSeleccionado(registro)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> Ver
                              </Button>
                              {permissions.includes("modificar_historial_medico") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => abrirEdicion(registro)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" /> Editar
                                </Button>
                              )}
                              {permissions.includes("eliminar_historial_medico") && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setRegistroAEliminar(registro)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {totalElements} registros · página {page + 1} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="estadisticas" className="space-y-4">
            {!stats ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando…
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="lane-accent text-accent">
                  <CardHeader className="pb-2 pl-5">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de registros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pl-5">
                    <div className="text-3xl font-display font-bold font-figures text-foreground">
                      {stats.total.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-display">Por gravedad</CardTitle>
                    <CardDescription>Sobre los registros cargados</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(stats.porGravedad).map(([g, count]) => (
                      <div key={g} className="flex items-center justify-between text-sm">
                        <span>{g}</span>
                        <span className="font-figures font-semibold">{count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="font-display">Por tipo de registro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(stats.porTipo).map(([t, count]) => (
                      <div key={t} className="flex items-center justify-between text-sm">
                        <span>{t}</span>
                        <span className="font-figures font-semibold">{count}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Ver detalle */}
        <Dialog
          open={!!registroSeleccionado}
          onOpenChange={(open) => !open && setRegistroSeleccionado(null)}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalle del Registro Médico</DialogTitle>
            </DialogHeader>
            {registroSeleccionado && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-sm">Deportista</h3>
                    <p>
                      {registroSeleccionado.personaNombre} {registroSeleccionado.personaApellidos}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm">Tipo</h3>
                    <p>{registroSeleccionado.tipoRegistro || "—"}</p>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm">Fecha</h3>
                    <p>{new Date(registroSeleccionado.fechaRegistro).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm">Gravedad</h3>
                    <p>{registroSeleccionado.gravedad || "—"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm">Descripción</h3>
                  <p>{registroSeleccionado.descripcion}</p>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm">Médico tratante</h3>
                  <p>{registroSeleccionado.medicoTratante || "No especificado"}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRegistroSeleccionado(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Nuevo / Editar */}
        <Dialog open={!!modalAbierto} onOpenChange={(open) => !open && setModalAbierto(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {modalAbierto === "nuevo" ? "Nuevo Registro Médico" : "Editar Registro Médico"}
              </DialogTitle>
              <DialogDescription>
                {modalAbierto === "nuevo"
                  ? "Ingresa la información médica del deportista."
                  : `Editando el registro de ${registroEnEdicion?.personaNombre ?? ""}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              {modalAbierto === "nuevo" && (
                <div className="space-y-2">
                  <Label>Deportista</Label>
                  <Select
                    value={form.deportistaId}
                    onValueChange={(v) => setForm({ ...form, deportistaId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un deportista" />
                    </SelectTrigger>
                    <SelectContent>
                      {deportistas.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.nombre} {d.apellidos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.tipoRegistro}
                    onValueChange={(v) => setForm({ ...form, tipoRegistro: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_SUGERIDOS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={form.fechaRegistro}
                    onChange={(e) => setForm({ ...form, fechaRegistro: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción *</Label>
                <Textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej. Esguince de tobillo durante entrenamiento"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gravedad</Label>
                  <Select
                    value={form.gravedad}
                    onValueChange={(v) => setForm({ ...form, gravedad: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona gravedad" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRAVEDADES_SUGERIDAS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Médico tratante</Label>
                  <Input
                    value={form.medicoTratante}
                    onChange={(e) => setForm({ ...form, medicoTratante: e.target.value })}
                    placeholder="Dr./Dra. …"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalAbierto(null)}>
                Cancelar
              </Button>
              <Button onClick={guardar} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Eliminar */}
        <Dialog
          open={!!registroAEliminar}
          onOpenChange={(open) => !open && setRegistroAEliminar(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Eliminar este registro médico de {registroAEliminar?.personaNombre}? Esta acción
                no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button variant="destructive" onClick={eliminar}>
                Eliminar
              </Button>
              <Button variant="secondary" onClick={() => setRegistroAEliminar(null)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}