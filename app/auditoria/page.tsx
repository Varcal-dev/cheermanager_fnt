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
  calcularCambios,
  etiquetaCampo,
  formatearValor,
  parsearSnapshot,
  resumenCambio,
  ETIQUETA_ACCION,
  type AccionAuditoria,
  type RegistroAuditoria,
} from "@/lib/auditoria";
import { cn } from "@/lib/utils";

const ACCION_BADGE: Record<AccionAuditoria, "success" | "outline" | "destructive" | "secondary" | "default"> = {
  INSERT: "success",
  UPDATE: "outline",
  DELETE: "destructive",
  EXPORTE: "secondary",
  PERMISOS: "default",
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
                    <SelectItem value="PERMISOS">Cambio de permisos</SelectItem>
                    <SelectItem value="EXPORTE">Exportes de datos</SelectItem>
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
                        Qué cambió
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
                        <TableCell colSpan={8}>
                          <div className="flex items-center justify-center py-10 text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando
                            registros…
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : registros.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8}>
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
                              {ETIQUETA_ACCION[registro.accion] ?? registro.accion}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-figures text-sm text-muted-foreground">
                            {registro.registroId ?? "—"}
                          </TableCell>
                          <TableCell className="max-w-[16rem] truncate text-sm text-muted-foreground" title={resumenCambio(registro)}>
                            {resumenCambio(registro)}
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

            {registroSeleccionado && <DetalleRegistro registro={registroSeleccionado} />}
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

function DetalleRegistro({ registro }: { registro: RegistroAuditoria }) {
  const [verIguales, setVerIguales] = useState(false);
  const cambios = calcularCambios(registro);
  const modificados = cambios.filter((c) => c.tipo === "modificado");
  const esUpdate = registro.accion === "UPDATE";
  const visibles = esUpdate && !verIguales ? modificados : cambios;
  const antes = parsearSnapshot(registro.valoresAnteriores);
  const despues = parsearSnapshot(registro.nuevosValores);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Detalle del registro #{registro.id}</CardTitle>
        <CardDescription>
          {ETIQUETA_ACCION[registro.accion] ?? registro.accion} en <span className="font-figures">{registro.tablaAfectada}</span>
          {registro.registroId !== null && <> · registro {registro.registroId}</>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">Usuario</div>
            <div>{registro.usuarioUsername ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Fecha</div>
            <div>{new Date(registro.fecha).toLocaleString("es-CO")}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">IP</div>
            <div className="font-figures">{registro.ipUsuario ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Acción</div>
            <Badge variant={ACCION_BADGE[registro.accion]}>{ETIQUETA_ACCION[registro.accion] ?? registro.accion}</Badge>
          </div>
        </div>

        {registro.accion === "PERMISOS" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <ListaPermisos titulo="Permisos agregados" tono="text-success" items={despues?.permisosAgregados} />
            <ListaPermisos titulo="Permisos quitados" tono="text-destructive" items={antes?.permisosQuitados} />
            {typeof despues?.totalPermisos === "number" && (
              <p className="text-sm text-muted-foreground sm:col-span-2">
                El rol {String(despues.rol ?? antes?.rol ?? "")} queda con {despues.totalPermisos} permisos.
              </p>
            )}
          </div>
        ) : registro.accion === "EXPORTE" ? (
          <p className="text-sm">{resumenCambio(registro)}</p>
        ) : cambios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin detalle de campos para este registro.</p>
        ) : (
          <div className="space-y-2">
            {esUpdate && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {registro.valoresAnteriores === null
                    ? "No se pudo recuperar cómo estaba antes: se muestran los valores actuales."
                    : modificados.length === 0
                      ? "No cambió ningún campo propio del registro (puede haber cambiado una relación, p. ej. un grupo asignado)."
                      : `${modificados.length} campo(s) modificado(s)`}
                </p>
                {registro.valoresAnteriores !== null && cambios.length > modificados.length && (
                  <Button variant="ghost" size="sm" onClick={() => setVerIguales((v) => !v)}>
                    {verIguales ? "Ver solo lo modificado" : `Ver también los ${cambios.length - modificados.length} sin cambios`}
                  </Button>
                )}
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Campo</TableHead>
                  {registro.accion !== "INSERT" && <TableHead>Antes</TableHead>}
                  {registro.accion !== "DELETE" && <TableHead>{esUpdate ? "Después" : "Valor"}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((c) => (
                  <TableRow key={c.campo} className={c.tipo === "modificado" ? "bg-accent/10" : ""}>
                    <TableCell className="font-medium">{etiquetaCampo(c.campo)}</TableCell>
                    {registro.accion !== "INSERT" && (
                      <TableCell className={cn("font-figures text-sm", c.tipo === "modificado" && "text-destructive line-through decoration-1")}>
                        {registro.accion === "UPDATE" && registro.valoresAnteriores === null ? "—" : formatearValor(c.campo, c.antes)}
                      </TableCell>
                    )}
                    {registro.accion !== "DELETE" && (
                      <TableCell className={cn("font-figures text-sm", c.tipo === "modificado" && "font-semibold text-success")}>
                        {formatearValor(c.campo, c.despues)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ListaPermisos({ titulo, tono, items }: { titulo: string; tono: string; items: unknown }) {
  const lista = Array.isArray(items) ? (items as string[]) : [];
  return (
    <div>
      <h4 className={cn("text-sm font-medium", tono)}>
        {titulo} ({lista.length})
      </h4>
      {lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguno</p>
      ) : (
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {lista.map((p) => (
            <li key={p}>
              <Badge variant="outline" className="font-figures text-xs">
                {p}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
