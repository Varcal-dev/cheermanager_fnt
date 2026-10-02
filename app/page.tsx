"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Award,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Users,
  Layers,
  CalendarClock,
  ClipboardList,
  ShoppingBag,
  ShieldCheck,
  TrendingUp,
  LineChart as LineChartIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  obtenerResumenInicio,
  ResumenInicio,
  obtenerResumenEventos,
  ResumenEventos,
  obtenerResumenFinanzas,
  ResumenFinanzas,
  obtenerResumenPersonas,
  ResumenPersonas,
  obtenerResumenOrganizacion,
  ResumenOrganizacion,
  obtenerResumenHorarios,
  ResumenHorarios,
  obtenerResumenEvaluacion,
  ResumenEvaluacion,
  obtenerProgresionGrupo,
  ProgresionGrupo,
  obtenerResumenAdministracion,
  ResumenAdministracion,
  obtenerResumenTienda,
  ResumenTienda,
} from "@/app/lib/dashboard";
import { formatCOP } from "@/app/lib/facturas-pagos";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// ---------- Hook genérico para pestañas que se cargan al abrirse ----------

function useLazyResumen<T>(fetcher: () => Promise<T>, errorMsg: string) {
  const [data, setData] = useState<T | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargado, setCargado] = useState(false);

  const cargar = () => {
    if (cargado) return;
    setCargado(true);
    setCargando(true);
    fetcher()
      .then(setData)
      .catch(() => toast.error(errorMsg))
      .finally(() => setCargando(false));
  };

  return { data, cargando, cargar };
}

function Cargando() {
  return (
    <div className="flex items-center justify-center py-10 text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
    </div>
  );
}

function SinDatos({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground py-6 text-center">{children}</p>
  );
}

export default function Home() {
  const { permissions } = useUser();
  const tienePermiso = (p: string) => permissions.includes(p);

  const [resumen, setResumen] = useState<ResumenInicio | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [inscripcionesSinGrupo, setInscripcionesSinGrupo] = useState(0);

  const eventosTab = useLazyResumen(
    obtenerResumenEventos,
    "No se pudo cargar el resumen de eventos",
  );
  const financieroTab = useLazyResumen(
    obtenerResumenFinanzas,
    "No se pudo cargar el resumen financiero",
  );
  const personasTab = useLazyResumen(
    () => obtenerResumenPersonas(30),
    "No se pudo cargar el resumen de deportistas y entrenadores",
  );
  const organizacionTab = useLazyResumen(
    obtenerResumenOrganizacion,
    "No se pudo cargar el resumen de grupos",
  );
  const evaluacionTab = useLazyResumen(
    obtenerResumenEvaluacion,
    "No se pudo cargar el resumen de evaluaciones",
  );
  const administracionTab = useLazyResumen(
    obtenerResumenAdministracion,
    "No se pudo cargar el resumen administrativo",
  );
  const tiendaTab = useLazyResumen(
    obtenerResumenTienda,
    "No se pudo cargar el resumen de tienda",
  );

  // Horarios necesita re-consultar cuando cambia el rango de días, así que
  // no usa el hook genérico (que solo carga una vez).
  const [horariosData, setHorariosData] = useState<ResumenHorarios | null>(null);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [diasHorarios, setDiasHorarios] = useState("30");
  const cargarHorarios = (dias: string) => {
    setCargandoHorarios(true);
    obtenerResumenHorarios(Number(dias))
      .then(setHorariosData)
      .catch(() => toast.error("No se pudo cargar el resumen de asistencia"))
      .finally(() => setCargandoHorarios(false));
  };

  // Progresión de un grupo (detalle dentro del tab de Evaluación)
  const [grupoProgresion, setGrupoProgresion] = useState<ProgresionGrupo | null>(
    null,
  );
  const [cargandoProgresion, setCargandoProgresion] = useState(false);
  const verProgresion = (grupoId: number) => {
    setCargandoProgresion(true);
    setGrupoProgresion(null);
    obtenerProgresionGrupo(grupoId)
      .then(setGrupoProgresion)
      .catch(() => toast.error("No se pudo cargar la progresión del grupo"))
      .finally(() => setCargandoProgresion(false));
  };

  useEffect(() => {
    setCargandoResumen(true);
    Promise.allSettled([obtenerResumenInicio(), api.get("/api/inscripciones/detalle")])
      .then(([resResumen, resInscripciones]) => {
        if (resResumen.status === "fulfilled") {
          setResumen(resResumen.value);
        } else {
          toast.error("No se pudo cargar el resumen del panel de inicio");
        }

        if (resInscripciones.status === "fulfilled") {
          const sinGrupo = (resInscripciones.value.data ?? []).filter(
            (item: any) => !item.grupoAsignado,
          ).length;
          setInscripcionesSinGrupo(sinGrupo);
        }
      })
      .finally(() => setCargandoResumen(false));
  }, []);

  type Alerta = {
    title: string;
    description: string;
    type: "warning" | "info";
  };

  const alertas: Alerta[] = resumen
    ? [
        ...(resumen.facturasConSaldoPendiente > 0
          ? [
              {
                title: "Cartera pendiente",
                description: `${resumen.facturasConSaldoPendiente} facturas con saldo por ${formatCOP(
                  resumen.carteraPendienteTotal,
                )}`,
                type: "warning" as const,
              },
            ]
          : []),
        ...(inscripcionesSinGrupo > 0
          ? [
              {
                title: "Inscripciones sin grupo",
                description: `${inscripcionesSinGrupo} deportistas esperando asignación de grupo`,
                type: "warning" as const,
              },
            ]
          : []),
        ...(resumen.alertasCondicionMedicaActiva > 0
          ? [
              {
                title: "Condiciones médicas activas",
                description: `${resumen.alertasCondicionMedicaActiva} deportistas con una condición médica activa registrada`,
                type: "info" as const,
              },
            ]
          : []),
        ...(resumen.proximoEvento
          ? [
              {
                title: "Evento próximo",
                description: `${resumen.proximoEvento.nombre} en ${resumen.proximoEvento.diasRestantes} días`,
                type: "info" as const,
              },
            ]
          : []),
      ]
    : [];

  // Definición de pestañas adicionales — cada una solo se muestra si el
  // usuario tiene el permiso del dashboard correspondiente (mismo criterio
  // que usa el backend con @RequiresPermission en DashboardController).
  const tabsExtra = [
    { value: "financiero", label: "Financiero", permiso: "ver_dash_finanzas" },
    { value: "deportistas", label: "Deportistas", permiso: "ver_dash_personas" },
    { value: "organizacion", label: "Organización", permiso: "ver_dash_organizacion" },
    { value: "horarios", label: "Horarios", permiso: "ver_dash_horarios" },
    { value: "evaluacion", label: "Evaluación", permiso: "ver_dash_evaluacion" },
    { value: "eventos", label: "Eventos", permiso: "ver_evento" },
    { value: "tienda", label: "Tienda", permiso: "ver_dash_tienda" },
    { value: "administracion", label: "Administración", permiso: "ver_dash_administracion" },
  ].filter((t) => tienePermiso(t.permiso));

  return (
    <ProtectedRoute requiredPermission="ver_dash_inicio">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido al sistema de gestión de Ratels All Stars
          </p>
        </div>

        {/* KPIs principales — conectados a /api/dashboard/inicio */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Deportistas Activos"
            value={cargandoResumen ? "…" : String(resumen?.deportistasActivos ?? 0)}
            description={`${resumen?.totalGrupos ?? 0} grupos activos`}
            icon={<UserPlus className="h-5 w-5" />}
            tone="primary"
            link="/deportistas"
          />
          <KpiCard
            title="Cartera Pendiente"
            value={cargandoResumen ? "…" : formatCOP(resumen?.carteraPendienteTotal ?? 0)}
            description={`${resumen?.facturasConSaldoPendiente ?? 0} facturas con saldo`}
            icon={<DollarSign className="h-5 w-5" />}
            tone="success"
            link="/facturas"
          />
          <KpiCard
            title="Asistencia (7 días)"
            value={
              cargandoResumen
                ? "…"
                : resumen?.porcentajeAsistenciaUltimos7Dias != null
                  ? `${resumen.porcentajeAsistenciaUltimos7Dias.toFixed(0)}%`
                  : "Sin datos"
            }
            description="promedio de todos los grupos"
            icon={<CheckCircle className="h-5 w-5" />}
            tone="accent"
            link="/asistencias"
          />
          <KpiCard
            title="Sin grupo asignado"
            value={cargandoResumen ? "…" : String(inscripcionesSinGrupo)}
            description="inscripciones esperando grupo"
            icon={<UserPlus className="h-5 w-5" />}
            tone="destructive"
            link="/inscripciones"
          />
        </div>

        {/* Tabs para diferentes vistas */}
        <Tabs
          defaultValue="general"
          className="space-y-4"
          onValueChange={(v) => {
            if (v === "eventos") eventosTab.cargar();
            if (v === "financiero") financieroTab.cargar();
            if (v === "deportistas") personasTab.cargar();
            if (v === "organizacion") organizacionTab.cargar();
            if (v === "evaluacion") evaluacionTab.cargar();
            if (v === "administracion") administracionTab.cargar();
            if (v === "tienda") tiendaTab.cargar();
            if (v === "horarios" && !horariosData && !cargandoHorarios) {
              cargarHorarios(diasHorarios);
            }
          }}
        >
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            {tabsExtra.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab: General — conectada a datos reales */}
          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Alertas reales */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Alertas Importantes
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  {cargandoResumen ? (
                    <Cargando />
                  ) : alertas.length === 0 ? (
                    <SinDatos>Todo al día — no hay alertas pendientes.</SinDatos>
                  ) : (
                    <div className="space-y-4">
                      {alertas.map((alerta, i) => (
                        <AlertItem
                          key={i}
                          title={alerta.title}
                          description={alerta.description}
                          type={alerta.type}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Próximo evento real */}
              <Card>
                <CardHeader>
                  <CardTitle>Próximo Evento</CardTitle>
                  <CardDescription>Según el calendario de competencias</CardDescription>
                </CardHeader>
                <CardContent>
                  {cargandoResumen ? (
                    <Cargando />
                  ) : resumen?.proximoEvento ? (
                    <div className="flex items-start space-x-4">
                      <div className="rounded-full p-2 bg-primary/10 text-primary">
                        <Award className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {resumen.proximoEvento.nombre}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(resumen.proximoEvento.fecha).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {resumen.proximoEvento.diasRestantes} días restantes
                        </p>
                      </div>
                    </div>
                  ) : (
                    <SinDatos>No hay eventos agendados todavía.</SinDatos>
                  )}
                  <Link
                    href="/eventos"
                    className="text-sm text-primary hover:underline block text-center mt-4"
                  >
                    Ver todos los eventos
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Financiero — /api/dashboard/finanzas */}
          <TabsContent value="financiero" className="space-y-4">
            {financieroTab.cargando ? (
              <Cargando />
            ) : financieroTab.data ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <KpiCard
                    title="Recaudo del mes"
                    value={formatCOP(financieroTab.data.recaudoMesActual)}
                    description={`facturado: ${formatCOP(financieroTab.data.facturadoMesActual)}`}
                    icon={<DollarSign className="h-5 w-5" />}
                    tone="success"
                    link="/facturas"
                  />
                  <KpiCard
                    title="Cartera pendiente"
                    value={formatCOP(financieroTab.data.carteraPendienteTotal)}
                    description={`${financieroTab.data.facturasConSaldoPendiente} facturas con saldo`}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    tone="destructive"
                    link="/facturas"
                  />
                  <KpiCard
                    title="Ingreso tienda"
                    value={formatCOP(financieroTab.data.ingresoTiendaMesActual)}
                    description="ventas del mes en curso"
                    icon={<ShoppingBag className="h-5 w-5" />}
                    tone="accent"
                    link="/ventas"
                  />
                  <KpiCard
                    title="Facturado con descuento"
                    value={formatCOP(financieroTab.data.ingresoConDescuentoMesActual)}
                    description="referencia, no ahorro exacto"
                    icon={<TrendingUp className="h-5 w-5" />}
                    tone="primary"
                    link="/descuentos"
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Recaudo mensual</CardTitle>
                      <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {financieroTab.data.tendenciaUltimos6Meses.length === 0 ? (
                        <SinDatos>Todavía no hay historial suficiente.</SinDatos>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={financieroTab.data.tendenciaUltimos6Meses}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="mes" fontSize={12} />
                            <YAxis
                              fontSize={12}
                              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                            />
                            <RTooltip
                              formatter={(v: number) => formatCOP(v)}
                              contentStyle={{ fontSize: 12 }}
                            />
                            <Bar
                              dataKey="recaudado"
                              fill="hsl(var(--chart-1))"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Morosidad por plan</CardTitle>
                      <CardDescription>% de facturas con saldo pendiente</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {financieroTab.data.morosidadPorPlan.length === 0 ? (
                        <SinDatos>Sin planes con facturas todavía.</SinDatos>
                      ) : (
                        financieroTab.data.morosidadPorPlan.map((p, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{p.nombrePlan}</span>
                              <span className="text-muted-foreground">
                                {p.porcentajeMorosidad != null
                                  ? `${p.porcentajeMorosidad.toFixed(0)}%`
                                  : "—"}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-destructive"
                                style={{
                                  width: `${Math.min(p.porcentajeMorosidad ?? 0, 100)}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {p.facturasConSaldoPendiente} de {p.totalFacturas} facturas
                            </p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <SinDatos>No se pudo cargar el resumen financiero.</SinDatos>
            )}
          </TabsContent>

          {/* Tab: Deportistas — /api/dashboard/personas */}
          <TabsContent value="deportistas" className="space-y-4">
            {personasTab.cargando ? (
              <Cargando />
            ) : personasTab.data ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <KpiCard
                    title="Total deportistas"
                    value={String(personasTab.data.totalDeportistas)}
                    description={`${personasTab.data.deportistasConCondicionMedicaActiva} con condición médica activa`}
                    icon={<Users className="h-5 w-5" />}
                    tone="primary"
                    link="/deportistas"
                  />
                  <KpiCard
                    title="Altas (30 días)"
                    value={String(personasTab.data.altasRecientes)}
                    description="deportistas activados"
                    icon={<UserPlus className="h-5 w-5" />}
                    tone="success"
                    link="/deportistas"
                  />
                  <KpiCard
                    title="Bajas (30 días)"
                    value={String(personasTab.data.bajasRecientes)}
                    description="deportistas retirados"
                    icon={<AlertTriangle className="h-5 w-5" />}
                    tone="destructive"
                    link="/deportistas"
                  />
                  <KpiCard
                    title="Entrenadores"
                    value={String(personasTab.data.totalEntrenadores)}
                    description="cuerpo técnico activo"
                    icon={<ShieldCheck className="h-5 w-5" />}
                    tone="accent"
                    link="/entrenadores"
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Por estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MiniPieChart data={personasTab.data.deportistasPorEstado} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Por género</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MiniPieChart data={personasTab.data.deportistasPorGenero} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Por división</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MiniPieChart data={personasTab.data.deportistasPorDivision} />
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Entrenadores</CardTitle>
                      <CardDescription>Grupos a cargo por entrenador</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {personasTab.data.entrenadores.length === 0 ? (
                        <SinDatos>No hay entrenadores registrados.</SinDatos>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Especialización</TableHead>
                              <TableHead className="text-right">Grupos</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {personasTab.data.entrenadores.map((e) => (
                              <TableRow key={e.entrenadorId}>
                                <TableCell className="font-medium">
                                  {e.nombreCompleto}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {e.especializacion || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {e.gruposACargo}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Movimientos recientes</CardTitle>
                      <CardDescription>Altas y bajas de deportistas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {personasTab.data.movimientosRecientes.length === 0 ? (
                        <SinDatos>Sin movimientos en el período.</SinDatos>
                      ) : (
                        personasTab.data.movimientosRecientes.slice(0, 8).map((m, i) => (
                          <div key={i} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                            <div>
                              <p className="font-medium">{m.nombreCompleto}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(m.fechaCambio).toLocaleDateString()}
                                {m.motivo ? ` · ${m.motivo}` : ""}
                              </p>
                            </div>
                            <Badge variant={m.esAlta ? "success" : "destructive"}>
                              {m.estadoNuevo}
                            </Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <SinDatos>No se pudo cargar el resumen de deportistas.</SinDatos>
            )}
          </TabsContent>

          {/* Tab: Organización — /api/dashboard/organizacion */}
          <TabsContent value="organizacion" className="space-y-4">
            {organizacionTab.cargando ? (
              <Cargando />
            ) : organizacionTab.data ? (
              <>
                {organizacionTab.data.gruposPorDebajoDelMinimo.length > 0 && (
                  <Card className="border-destructive/40">
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <CardTitle className="text-sm">
                        {organizacionTab.data.gruposPorDebajoDelMinimo.length} grupo(s)
                        por debajo del mínimo requerido
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {organizacionTab.data.gruposPorDebajoDelMinimo.map((g) => (
                        <Badge key={g.grupoId} variant="destructive">
                          {g.nombreGrupo} ({g.deportistasActivos}/{g.cantidadMinRequerida})
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Grupos</CardTitle>
                      <CardDescription>Ocupación actual por grupo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {organizacionTab.data.gruposConOcupacion.length === 0 ? (
                        <SinDatos>No hay grupos registrados.</SinDatos>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Grupo</TableHead>
                              <TableHead>Nivel</TableHead>
                              <TableHead className="text-right">Activos</TableHead>
                              <TableHead className="text-right">H / M</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {organizacionTab.data.gruposConOcupacion.map((g) => {
                              const bajoMinimo =
                                g.cantidadMinRequerida != null &&
                                g.deportistasActivos < g.cantidadMinRequerida;
                              return (
                                <TableRow key={g.grupoId}>
                                  <TableCell className="font-medium">
                                    {g.nombreGrupo}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {g.nivel} · {g.division}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {g.deportistasActivos}
                                    {g.cantidadMinRequerida != null && (
                                      <span className="text-muted-foreground">
                                        {" "}
                                        / {g.cantidadMinRequerida}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {g.hombres} / {g.mujeres}
                                  </TableCell>
                                  <TableCell>
                                    {bajoMinimo ? (
                                      <Badge variant="destructive">Bajo mínimo</Badge>
                                    ) : (
                                      <Badge variant="success">OK</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Grupos por nivel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MiniPieChart data={organizacionTab.data.gruposPorNivel} />
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <SinDatos>No se pudo cargar el resumen de grupos.</SinDatos>
            )}
          </TabsContent>

          {/* Tab: Horarios — /api/dashboard/horarios */}
          <TabsContent value="horarios" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Asistencia calculada sobre los últimos {horariosData?.diasAnalizados ?? diasHorarios} días
              </p>
              <Select
                value={diasHorarios}
                onValueChange={(v) => {
                  setDiasHorarios(v);
                  cargarHorarios(v);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="90">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cargandoHorarios ? (
              <Cargando />
            ) : horariosData ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <KpiCard
                    title="Asistencia general"
                    value={
                      horariosData.porcentajeAsistenciaGeneral != null
                        ? `${horariosData.porcentajeAsistenciaGeneral.toFixed(0)}%`
                        : "Sin datos"
                    }
                    description="promedio simple entre grupos"
                    icon={<CalendarClock className="h-5 w-5" />}
                    tone="accent"
                    link="/asistencias"
                  />
                  <KpiCard
                    title="En riesgo"
                    value={String(horariosData.deportistasEnRiesgo.length)}
                    description="deportistas bajo 70% de asistencia"
                    icon={<AlertTriangle className="h-5 w-5" />}
                    tone="destructive"
                    link="/asistencias"
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Asistencia por grupo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {horariosData.asistenciaPorGrupo.length === 0 ? (
                        <SinDatos>Sin registros de asistencia en el rango.</SinDatos>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Grupo</TableHead>
                              <TableHead className="text-right">Presentes</TableHead>
                              <TableHead className="text-right">%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {horariosData.asistenciaPorGrupo.map((g) => (
                              <TableRow key={g.grupoId}>
                                <TableCell className="font-medium">{g.nombreGrupo}</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {g.presentes} / {g.totalRegistros}
                                </TableCell>
                                <TableCell className="text-right">
                                  {g.porcentaje != null ? `${g.porcentaje.toFixed(0)}%` : "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Deportistas en riesgo</CardTitle>
                      <CardDescription>Menos de 70% de asistencia</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {horariosData.deportistasEnRiesgo.length === 0 ? (
                        <SinDatos>Ningún deportista por debajo del 70%.</SinDatos>
                      ) : (
                        <div className="space-y-2">
                          {horariosData.deportistasEnRiesgo.map((d) => (
                            <div
                              key={d.deportistaId}
                              className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                            >
                              <span className="font-medium">{d.nombreCompleto}</span>
                              <Badge variant="destructive">{d.porcentaje.toFixed(0)}%</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <SinDatos>No se pudo cargar el resumen de asistencia.</SinDatos>
            )}
          </TabsContent>

          {/* Tab: Evaluación — /api/dashboard/evaluacion */}
          <TabsContent value="evaluacion" className="space-y-4">
            {evaluacionTab.cargando ? (
              <Cargando />
            ) : evaluacionTab.data ? (
              <Card>
                <CardHeader>
                  <CardTitle>Último puntaje por grupo</CardTitle>
                  <CardDescription>
                    Clic en un grupo para ver su progresión
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {evaluacionTab.data.ultimosPuntajesPorGrupo.length === 0 ? (
                    <SinDatos>Todavía no hay evaluaciones de rutina registradas.</SinDatos>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Grupo</TableHead>
                          <TableHead>Nivel</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead className="text-right">Puntaje</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {evaluacionTab.data.ultimosPuntajesPorGrupo.map((g) => (
                          <TableRow
                            key={g.grupoId}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => verProgresion(g.grupoId)}
                          >
                            <TableCell className="font-medium">{g.nombreGrupo}</TableCell>
                            <TableCell className="text-muted-foreground">{g.nivel}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(g.fecha).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{g.evento}</TableCell>
                            <TableCell className="text-right font-bold">
                              {g.puntajeTotal.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <LineChartIcon className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : (
              <SinDatos>No se pudo cargar el resumen de evaluaciones.</SinDatos>
            )}

            <Dialog
              open={cargandoProgresion || grupoProgresion !== null}
              onOpenChange={(open) => {
                if (!open) setGrupoProgresion(null);
              }}
            >
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {grupoProgresion?.nombreGrupo ?? "Progresión del grupo"}
                  </DialogTitle>
                </DialogHeader>
                {cargandoProgresion ? (
                  <Cargando />
                ) : grupoProgresion && grupoProgresion.puntos.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={grupoProgresion.puntos}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="fecha"
                        fontSize={11}
                        tickFormatter={(v) => new Date(v).toLocaleDateString()}
                      />
                      <YAxis fontSize={11} />
                      <RTooltip
                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="puntajeTotal"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <SinDatos>Este grupo todavía no tiene histórico de evaluaciones.</SinDatos>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Tab: Eventos — conectada a /api/dashboard/eventos */}
          <TabsContent value="eventos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Próximos Eventos</CardTitle>
                  <CardDescription>Con grupos ya inscritos</CardDescription>
                </CardHeader>
                <CardContent>
                  {eventosTab.cargando ? (
                    <Cargando />
                  ) : eventosTab.data && eventosTab.data.proximosEventos.length > 0 ? (
                    <div className="space-y-3">
                      {eventosTab.data.proximosEventos.map((e) => (
                        <div key={e.eventoId} className="flex items-start space-x-3">
                          <div className="rounded-full p-2 bg-primary/10 text-primary">
                            <Award className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-none">{e.nombre}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(e.fecha).toLocaleDateString()} · {e.gruposInscritos} grupos inscritos
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <SinDatos>No hay eventos próximos agendados.</SinDatos>
                  )}
                  <Link
                    href="/eventos"
                    className="text-sm text-primary hover:underline block text-center mt-4"
                  >
                    Ver todos los eventos
                  </Link>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Podios de la Temporada</CardTitle>
                  <CardDescription>Premios ganados</CardDescription>
                </CardHeader>
                <CardContent>
                  {eventosTab.cargando ? (
                    <Cargando />
                  ) : eventosTab.data ? (
                    <>
                      <div className="text-2xl font-display font-bold mb-3">
                        {eventosTab.data.podiosTemporada} podios esta temporada
                      </div>
                      {eventosTab.data.premiosGanados.length > 0 ? (
                        <div className="space-y-2">
                          {eventosTab.data.premiosGanados.slice(0, 5).map((p, i) => (
                            <div key={i} className="text-sm border-b pb-2 last:border-0">
                              <span className="font-medium">#{p.posicion}</span> — {p.nombreGrupo} en{" "}
                              {p.nombreEvento}
                              {p.descripcionPremio ? ` (${p.descripcionPremio})` : ""}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <SinDatos>Todavía no hay premios registrados esta temporada.</SinDatos>
                      )}
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Tienda — /api/dashboard/tienda */}
          <TabsContent value="tienda" className="space-y-4">
            {tiendaTab.cargando ? (
              <Cargando />
            ) : tiendaTab.data ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <KpiCard
                    title="Ingreso del mes"
                    value={formatCOP(tiendaTab.data.ingresoMesActual)}
                    description={`${tiendaTab.data.ventasMesActual} ventas`}
                    icon={<ShoppingBag className="h-5 w-5" />}
                    tone="success"
                    link="/ventas"
                  />
                  <KpiCard
                    title="Unidades vendidas"
                    value={String(tiendaTab.data.unidadesVendidasMesActual)}
                    description="mes en curso"
                    icon={<Layers className="h-5 w-5" />}
                    tone="primary"
                    link="/inventario"
                  />
                  <KpiCard
                    title="Variantes con stock bajo"
                    value={String(tiendaTab.data.variantesConStockBajo.length)}
                    description="requieren reabastecimiento"
                    icon={<AlertTriangle className="h-5 w-5" />}
                    tone="destructive"
                    link="/inventario"
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ingreso por categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MiniPieChart
                        data={tiendaTab.data.ingresoPorCategoria}
                        formatter={(v) => formatCOP(v)}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top productos del mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tiendaTab.data.topProductosVendidos.length === 0 ? (
                        <SinDatos>Sin ventas registradas este mes.</SinDatos>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead className="text-right">Unidades</TableHead>
                              <TableHead className="text-right">Ingreso</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tiendaTab.data.topProductosVendidos.map((p, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{p.nombreProducto}</TableCell>
                                <TableCell className="text-right">{p.unidadesVendidas}</TableCell>
                                <TableCell className="text-right">
                                  {formatCOP(p.ingresoGenerado)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {tiendaTab.data.variantesConStockBajo.length > 0 && (
                  <Card className="border-destructive/40">
                    <CardHeader>
                      <CardTitle className="text-sm">Variantes con stock bajo</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {tiendaTab.data.variantesConStockBajo.map((v) => (
                        <Badge key={v.productoVarianteId} variant="destructive">
                          {v.nombreProducto} {v.talla ? `· ${v.talla}` : ""}{" "}
                          {v.color ? `· ${v.color}` : ""} ({v.stockActual})
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <SinDatos>No se pudo cargar el resumen de tienda.</SinDatos>
            )}
          </TabsContent>

          {/* Tab: Administración — /api/dashboard/administracion */}
          <TabsContent value="administracion" className="space-y-4">
            {administracionTab.cargando ? (
              <Cargando />
            ) : administracionTab.data ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <KpiCard
                    title="Recaudo del mes"
                    value={formatCOP(administracionTab.data.recaudoMesActual)}
                    description={formatCOP(administracionTab.data.carteraPendienteTotal) + " en cartera"}
                    icon={<DollarSign className="h-5 w-5" />}
                    tone="success"
                    link="/facturas"
                  />
                  <KpiCard
                    title="Asistencia (30 días)"
                    value={
                      administracionTab.data.porcentajeAsistenciaGeneral30Dias != null
                        ? `${administracionTab.data.porcentajeAsistenciaGeneral30Dias.toFixed(0)}%`
                        : "Sin datos"
                    }
                    description="salud operativa general"
                    icon={<CalendarClock className="h-5 w-5" />}
                    tone="accent"
                    link="/asistencias"
                  />
                  <KpiCard
                    title="Puntaje promedio club"
                    value={
                      administracionTab.data.puntajePromedioClub != null
                        ? administracionTab.data.puntajePromedioClub.toFixed(2)
                        : "Sin datos"
                    }
                    description={`${administracionTab.data.gruposConEvaluacionReciente} grupos evaluados`}
                    icon={<ClipboardList className="h-5 w-5" />}
                    tone="primary"
                    link="/evaluaciones"
                  />
                  <KpiCard
                    title="Usuarios activos (7 días)"
                    value={String(administracionTab.data.usuariosActivos7Dias)}
                    description={`${administracionTab.data.loginsExitosos7Dias} logins exitosos · ${administracionTab.data.loginsFallidos7Dias} fallidos`}
                    icon={<ShieldCheck className="h-5 w-5" />}
                    tone="destructive"
                    link="/usuarios"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Auditoría reciente</CardTitle>
                    <CardDescription>Últimos cambios registrados en el sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {administracionTab.data.auditoriaReciente.length === 0 ? (
                      <SinDatos>Sin actividad reciente registrada.</SinDatos>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Tabla</TableHead>
                            <TableHead>Acción</TableHead>
                            <TableHead>Fecha</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {administracionTab.data.auditoriaReciente.map((a, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{a.usuario}</TableCell>
                              <TableCell className="text-muted-foreground">{a.tablaAfectada}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    a.accion === "DELETE"
                                      ? "destructive"
                                      : a.accion === "CREATE"
                                        ? "success"
                                        : "secondary"
                                  }
                                >
                                  {a.accion}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(a.fecha).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    <Link
                      href="/auditoria"
                      className="text-sm text-primary hover:underline block text-center mt-4"
                    >
                      Ver auditoría completa
                    </Link>
                  </CardContent>
                </Card>
              </>
            ) : (
              <SinDatos>No se pudo cargar el resumen administrativo.</SinDatos>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

const KPI_TONES = {
  primary: "text-primary",
  success: "text-success",
  accent: "text-accent",
  destructive: "text-destructive",
} as const;

const KPI_BG = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  accent: "bg-accent/10 text-accent",
  destructive: "bg-destructive/10 text-destructive",
} as const;

function KpiCard({
  title,
  value,
  description,
  icon,
  link,
  tone = "primary",
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  tone?: keyof typeof KPI_TONES;
}) {
  return (
    <Link href={link} className="block">
      <Card className={cn("lane-accent hover:shadow-md transition-shadow", KPI_TONES[tone])}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 pl-5">
          <CardTitle className="text-sm font-sans font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <span className={cn("rounded-md p-1.5", KPI_BG[tone])}>
            {icon}
          </span>
        </CardHeader>
        <CardContent className="pl-5">
          <div className="text-3xl font-display font-bold text-foreground font-figures">
            {value}
          </div>
          <div className="flex items-center mt-1">
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const ALERT_TONES = {
  warning: "bg-primary/10 text-primary",
  error: "bg-destructive/10 text-destructive",
  info: "bg-accent/10 text-accent",
} as const;

function AlertItem({
  title,
  description,
  type,
}: {
  title: string;
  description: string;
  type: "warning" | "info" | "error";
}) {
  return (
    <div className="flex items-start space-x-4">
      <div className={cn("rounded-full p-2", ALERT_TONES[type])}>
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Pie chart pequeño y genérico para los mapas Record<string, number> que
// devuelven varios de los DTOs de dashboard (por estado, por género, por
// nivel, por categoría...).
function MiniPieChart({
  data,
  formatter,
}: {
  data: Record<string, number>;
  formatter?: (v: number) => string;
}) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);

  if (entries.length === 0) {
    return <SinDatos>Sin datos suficientes.</SinDatos>;
  }

  const chartData = entries.map(([name, value]) => ({ name, value }));

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="55%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={35}
            outerRadius={70}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <RTooltip formatter={(v: number) => (formatter ? formatter(v) : v)} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 flex-1">
        {chartData.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs gap-2">
            <span className="flex items-center gap-1.5 truncate">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="font-medium shrink-0">
              {formatter ? formatter(d.value) : d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}