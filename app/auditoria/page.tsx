"use client";

import { SetStateAction, useEffect, useState } from "react";
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
import { Search, ChevronLeft, ChevronRight, Loader2, Eye, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  obtenerAuditoria,
  obtenerTablasAuditadas,
  parsearSnapshot,
  type AccionAuditoria,
  type RegistroAuditoria,
} from "@/lib/auditoria";
import { cn } from "@/lib/utils";

const ACCION_BADGE: Record<AccionAuditoria, "success" | "outline" | "destructive"> = {
  INSERT: "success",
  UPDATE: "outline",
  DELETE: "destructive",
};

const PAGE_SIZE = 20;

export default function AuditoriaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tablaFiltro, setTablaFiltro] = useState<string | null>(null);
  const [accionFiltro, setAccionFiltro] = useState<AccionAuditoria | null>(null);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [page, setPage] = useState(0);

  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [cargando, setCargando] = useState(true);

  const [tablasDisponibles, setTablasDisponibles] = useState<string[]>([]);
  const [selectedRegistro, setSelectedRegistro] = useState<number | null>(null);

  // Resumen (pestaña "Estadísticas"): conteos reales vía totalElements de
  // consultas con size=1, no un cálculo aproximado sobre la página cargada.
  const [resumen, setResumen] = useState<{
    total: number;
    insert: number;
    update: number;
    delete: number;
  } | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(false);

  useEffect(() => {
    obtenerTablasAuditadas()
      .then(setTablasDisponibles)
      .catch(() => {
        // silencioso: el filtro de tabla simplemente queda vacío
      });
  }, []);

  useEffect(() => {
    setCargando(true);
    const desde = fechaDesde ? `${fechaDesde}T00:00:00` : undefined;
    const hasta = fechaHasta ? `${fechaHasta}T23:59:59` : undefined;

    obtenerAuditoria({
      tabla: tablaFiltro ?? undefined,
      accion: accionFiltro ?? undefined,
      q: searchTerm || undefined,
      desde,
      hasta,
      page,
      size: PAGE_SIZE,
    })
      .then((data: { content: SetStateAction<RegistroAuditoria[]>; totalElements: SetStateAction<number>; totalPages: SetStateAction<number>; }) => {
        setRegistros(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(data.totalPages);
      })
      .catch(() => toast.error("No se pudieron cargar los registros de auditoría"))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablaFiltro, accionFiltro, searchTerm, fechaDesde, fechaHasta, page]);

  const cargarResumen = () => {
    setCargandoResumen(true);
    const base = { tabla: tablaFiltro ?? undefined, size: 1 } as const;
    Promise.allSettled([
      obtenerAuditoria({ ...base }),
      obtenerAuditoria({ ...base, accion: "INSERT" }),
      obtenerAuditoria({ ...base, accion: "UPDATE" }),
      obtenerAuditoria({ ...base, accion: "DELETE" }),
    ])
      .then(([total, insert, update, del]) => {
        setResumen({
          total: total.status === "fulfilled" ? total.value.totalElements : 0,
          insert: insert.status === "fulfilled" ? insert.value.totalElements : 0,
          update: update.status === "fulfilled" ? update.value.totalElements : 0,
          delete: del.status === "fulfilled" ? del.value.totalElements : 0,
        });
      })
      .finally(() => setCargandoResumen(false));
  };

  const registroSeleccionado = registros.find((r) => r.id === selectedRegistro) ?? null;

  return (
    <ProtectedRoute requiredPermission="ver_dash_administracion">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">
              Auditoría
            </h1>
            <p className="text-muted-foreground">
              Registro de actividad y cambios en el sistema
            </p>
          </div>
        </div>

        <Tabs
          defaultValue="registros"
          className="w-full"
          onValueChange={(v) => {
            if (v === "estadisticas" && !resumen) cargarResumen();
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registros">Registros de Auditoría</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="registros" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative flex items-center w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuario, tabla o IP…"
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
                  value={tablaFiltro ?? "all"}
                  onValueChange={(value) => {
                    setPage(0);
                    setTablaFiltro(value === "all" ? null : value);
                  }}
                >
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Tabla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las tablas</SelectItem>
                    {tablasDisponibles.map((tabla) => (
                      <SelectItem key={tabla} value={tabla}>
                        {tabla}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={accionFiltro ?? "all"}
                  onValueChange={(value) => {
                    setPage(0);
                    setAccionFiltro(value === "all" ? null : (value as AccionAuditoria));
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="INSERT">Creación</SelectItem>
                    <SelectItem value="UPDATE">Actualización</SelectItem>
                    <SelectItem value="DELETE">Eliminación</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => {
                    setPage(0);
                    setFechaDesde(e.target.value);
                  }}
                  className="h-9 w-[150px]"
                  title="Desde"
                />
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => {
                    setPage(0);
                    setFechaHasta(e.target.value);
                  }}
                  className="h-9 w-[150px]"
                  title="Hasta"
                />
                {(tablaFiltro || accionFiltro || fechaDesde || fechaHasta || searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTablaFiltro(null);
                      setAccionFiltro(null);
                      setFechaDesde("");
                      setFechaHasta("");
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
                        Usuario
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Tabla
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Acción
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Registro
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Fecha
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        IP
                      </TableHead>
                      <TableHead className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                        Detalle
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargando ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <div className="flex items-center justify-center py-10 text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando
                            registros…
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : registros.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                              <Search className="h-6 w-6 text-accent" />
                            </div>
                            <p className="text-lg font-display font-semibold text-foreground">
                              Sin actividad registrada
                            </p>
                            <p className="text-sm text-muted-foreground max-w-sm">
                              {tablaFiltro || accionFiltro || fechaDesde || fechaHasta || searchTerm
                                ? "No hay registros que coincidan con estos filtros."
                                : "Cuando alguien cree, edite o elimine algo en el sistema, aparecerá aquí."}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      registros.map((registro) => (
                        <TableRow
                          key={registro.id}
                          className={selectedRegistro === registro.id ? "bg-muted/50" : ""}
                        >
                          <TableCell className="font-medium">
                            {registro.usuarioUsername ?? "—"}
                          </TableCell>
                          <TableCell className="font-figures text-sm">
                            {registro.tablaAfectada}
                          </TableCell>
                          <TableCell>
                            <Badge variant={ACCION_BADGE[registro.accion]}>
                              {registro.accion}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-figures text-sm text-muted-foreground">
                            {registro.registroId ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(registro.fecha).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-figures text-sm text-muted-foreground">
                            {registro.ipUsuario ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedRegistro(
                                  selectedRegistro === registro.id ? null : registro.id,
                                )
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" /> Ver
                            </Button>
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

            {registroSeleccionado && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">
                    Detalle del registro #{registroSeleccionado.id}
                  </CardTitle>
                  <CardDescription>
                    {registroSeleccionado.tablaAfectada} · {registroSeleccionado.accion}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-display font-semibold mb-2">
                        Información del registro
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2">
                          <span className="text-muted-foreground">Usuario:</span>
                          <span>{registroSeleccionado.usuarioUsername ?? "—"}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-muted-foreground">Tabla:</span>
                          <span className="font-figures">
                            {registroSeleccionado.tablaAfectada}
                          </span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-muted-foreground">Acción:</span>
                          <Badge variant={ACCION_BADGE[registroSeleccionado.accion]}>
                            {registroSeleccionado.accion}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-muted-foreground">Fecha:</span>
                          <span>
                            {new Date(registroSeleccionado.fecha).toLocaleString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2">
                          <span className="text-muted-foreground">IP:</span>
                          <span className="font-figures">
                            {registroSeleccionado.ipUsuario ?? "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display font-semibold mb-2">
                        Cambios realizados
                      </h3>
                      <div className="space-y-4">
                        {parsearSnapshot(registroSeleccionado.valoresAnteriores) && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">
                              Valores anteriores:
                            </h4>
                            <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-auto font-figures">
                              {JSON.stringify(
                                parsearSnapshot(registroSeleccionado.valoresAnteriores),
                                null,
                                2,
                              )}
                            </pre>
                          </div>
                        )}
                        {parsearSnapshot(registroSeleccionado.nuevosValores) && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground">
                              Nuevos valores:
                            </h4>
                            <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-auto font-figures">
                              {JSON.stringify(
                                parsearSnapshot(registroSeleccionado.nuevosValores),
                                null,
                                2,
                              )}
                            </pre>
                          </div>
                        )}
                        {!registroSeleccionado.valoresAnteriores &&
                          !registroSeleccionado.nuevosValores && (
                            <p className="text-sm text-muted-foreground">
                              Sin detalle de campos para este registro.
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="estadisticas" className="space-y-4">
            {cargandoResumen || !resumen ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando…
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {tablaFiltro
                    ? `Filtrado a la tabla "${tablaFiltro}". `
                    : ""}
                  Conteos reales sobre toda la tabla de auditoría, no solo la
                  página visible.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ResumenCard
                    titulo="Total de registros"
                    valor={resumen.total}
                    tone="accent"
                  />
                  <ResumenCard
                    titulo="Creaciones"
                    valor={resumen.insert}
                    tone="success"
                  />
                  <ResumenCard
                    titulo="Actualizaciones"
                    valor={resumen.update}
                    tone="primary"
                  />
                  <ResumenCard
                    titulo="Eliminaciones"
                    valor={resumen.delete}
                    tone="destructive"
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

const RESUMEN_TONES = {
  primary: "text-primary",
  success: "text-success",
  accent: "text-accent",
  destructive: "text-destructive",
} as const;

function ResumenCard({
  titulo,
  valor,
  tone,
}: {
  titulo: string;
  valor: number;
  tone: keyof typeof RESUMEN_TONES;
}) {
  return (
    <Card className={cn("lane-accent", RESUMEN_TONES[tone])}>
      <CardHeader className="pb-2 pl-5">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-5">
        <div className="text-3xl font-display font-bold font-figures text-foreground">
          {valor.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}