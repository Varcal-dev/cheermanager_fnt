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
  UserPlus,
  Award,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { obtenerResumenInicio, ResumenInicio } from "@/app/lib/dashboard";
import { formatCOP } from "@/app/lib/facturas-pagos";

// Componente para gráficas (simulado con divs coloreados) — se mantiene
// solo para las pestañas que todavía no están conectadas a datos reales
// (ver nota al inicio de cada una).
function ChartPlaceholder({
  height = "h-64",
  className = "",
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`${height} w-full rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center ${className}`}
    >
      <span className="text-purple-400 text-sm font-medium">
        Gráfica (Simulada)
      </span>
    </div>
  );
}

// Aviso reutilizable para las pestañas que aún no se conectaron. El
// backend ya expone /api/dashboard/finanzas, /personas y /eventos (ver
// ajustes_claudia/KPIs_y_Dashboards_CheerManager_propuesta.md) — son el
// siguiente paso natural.
function AvisoDatosEjemplo({ permiso }: { permiso: string }) {
  return (
    <p className="text-xs text-muted-foreground bg-muted/50 border rounded-md px-3 py-2">
      Esta pestaña todavía muestra datos de ejemplo. El backend ya expone{" "}
      <code className="font-mono">{permiso}</code>; falta conectarla en una
      próxima sesión.
    </p>
  );
}

export default function Home() {
  const [resumen, setResumen] = useState<ResumenInicio | null>(null);
  const [cargandoResumen, setCargandoResumen] = useState(true);
  const [inscripcionesSinGrupo, setInscripcionesSinGrupo] = useState(0);

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

  type AlertaDashboard = {
    title: string;
    description: string;
    type: "warning" | "info" | "error";
  };

  const alertas: AlertaDashboard[] = resumen
    ? [
        resumen.facturasConSaldoPendiente > 0 && {
          title: "Cartera pendiente",
          description: `${resumen.facturasConSaldoPendiente} facturas con saldo por ${formatCOP(
            resumen.carteraPendienteTotal,
          )}`,
          type: "warning",
        },
        inscripcionesSinGrupo > 0 && {
          title: "Inscripciones sin grupo",
          description: `${inscripcionesSinGrupo} deportistas esperando asignación de grupo`,
          type: "warning",
        },
        resumen.alertasCondicionMedicaActiva > 0 && {
          title: "Condiciones médicas activas",
          description: `${resumen.alertasCondicionMedicaActiva} deportistas con una condición médica activa registrada`,
          type: "info",
        },
        resumen.proximoEvento && {
          title: "Evento próximo",
          description: `${resumen.proximoEvento.nombre} en ${resumen.proximoEvento.diasRestantes} días`,
          type: "info",
        },
      ].filter((x): x is AlertaDashboard => Boolean(x))
    : [];

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
            icon={<UserPlus className="h-5 w-5 text-purple-600" />}
            link="/deportistas"
          />
          <KpiCard
            title="Cartera Pendiente"
            value={cargandoResumen ? "…" : formatCOP(resumen?.carteraPendienteTotal ?? 0)}
            description={`${resumen?.facturasConSaldoPendiente ?? 0} facturas con saldo`}
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
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
            icon={<CheckCircle className="h-5 w-5 text-blue-600" />}
            link="/asistencias"
          />
          <KpiCard
            title="Sin grupo asignado"
            value={cargandoResumen ? "…" : String(inscripcionesSinGrupo)}
            description="inscripciones esperando grupo"
            icon={<UserPlus className="h-5 w-5 text-orange-600" />}
            link="/inscripciones"
          />
        </div>

        {/* Tabs para diferentes vistas */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="financiero">Financiero</TabsTrigger>
            <TabsTrigger value="deportistas">Deportistas</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
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
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  {cargandoResumen ? (
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
                    </div>
                  ) : alertas.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Todo al día — no hay alertas pendientes.
                    </p>
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
                    <div className="flex items-center justify-center py-6 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
                    </div>
                  ) : resumen?.proximoEvento ? (
                    <div className="flex items-start space-x-4">
                      <div className="rounded-full p-2 bg-purple-100 text-purple-600">
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
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No hay eventos agendados todavía.
                    </p>
                  )}
                  <Link
                    href="/eventos"
                    className="text-sm text-purple-600 hover:underline block text-center mt-4"
                  >
                    Ver todos los eventos
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Financiero */}
          <TabsContent value="financiero" className="space-y-4">
            <AvisoDatosEjemplo permiso="ver_dash_finanzas" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Ingresos vs Gastos</CardTitle>
                  <CardDescription>
                    Análisis financiero de los últimos 6 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartPlaceholder />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Indicadores Financieros</CardTitle>
                  <CardDescription>Resumen del mes actual</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ingresos Totales</span>
                    <span className="text-sm font-bold text-green-600">$12,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gastos Totales</span>
                    <span className="text-sm font-bold text-red-600">$8,320</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Beneficio Neto</span>
                    <span className="text-sm font-bold text-blue-600">$4,130</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pagos Pendientes</span>
                    <span className="text-sm font-bold text-amber-600">$2,850</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Margen de Beneficio</span>
                    <span className="text-sm font-bold text-purple-600">33.2%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Deportistas */}
          <TabsContent value="deportistas" className="space-y-4">
            <AvisoDatosEjemplo permiso="ver_dash_personas" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Distribución por Nivel</CardTitle>
                  <CardDescription>Deportistas por categoría y nivel</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartPlaceholder />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas</CardTitle>
                  <CardDescription>Datos generales</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Deportistas</span>
                    <span className="text-sm font-bold">156</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Nuevos este mes</span>
                    <span className="text-sm font-bold text-green-600">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bajas este mes</span>
                    <span className="text-sm font-bold text-red-600">5</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Eventos */}
          <TabsContent value="eventos" className="space-y-4">
            <AvisoDatosEjemplo permiso="ver_evento" />
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Resultados de Competencias</CardTitle>
                  <CardDescription>Últimas competencias</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartPlaceholder height="h-48" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Preparación para Eventos</CardTitle>
                  <CardDescription>Estado de preparación</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartPlaceholder height="h-48" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

function KpiCard({
  title,
  value,
  description,
  icon,
  link,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}) {
  return (
    <Link href={link} className="block">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <div className="flex items-center mt-1">
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

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
      <div
        className={`rounded-full p-2 ${
          type === "warning"
            ? "bg-yellow-100 text-yellow-600"
            : type === "error"
              ? "bg-red-100 text-red-600"
              : "bg-blue-100 text-blue-600"
        }`}
      >
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}