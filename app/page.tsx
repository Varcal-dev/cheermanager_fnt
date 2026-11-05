"use client";

import { useEffect, useState } from "react";
import { UserPlus, DollarSign, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from "@/components/ProtectedRoute";
import OnboardingCard from "@/app/components/OnboardingCard";
import HomePlataforma from "@/app/components/inicio/HomePlataforma";
import { api } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { formatCOP } from "@/app/lib/facturas-pagos";
import {
  obtenerResumenInicio,
  ResumenInicio,
  obtenerResumenEventos,
  obtenerResumenFinanzas,
  obtenerResumenPersonas,
  obtenerResumenOrganizacion,
  obtenerResumenHorarios,
  ResumenHorarios,
  obtenerResumenEvaluacion,
  obtenerProgresionGrupo,
  ProgresionGrupo,
  obtenerResumenAdministracion,
  obtenerResumenTienda,
} from "@/app/lib/dashboard";
import { KpiCard } from "@/app/components/inicio/comunes";
import { useResumenPerezoso } from "@/app/components/inicio/useResumenPerezoso";
import TabGeneral from "@/app/components/inicio/TabGeneral";
import TabFinanciero from "@/app/components/inicio/TabFinanciero";
import TabDeportistas from "@/app/components/inicio/TabDeportistas";
import TabOrganizacion from "@/app/components/inicio/TabOrganizacion";
import TabHorarios from "@/app/components/inicio/TabHorarios";
import TabEvaluacion from "@/app/components/inicio/TabEvaluacion";
import TabEventos from "@/app/components/inicio/TabEventos";
import TabTienda from "@/app/components/inicio/TabTienda";
import TabAdministracion from "@/app/components/inicio/TabAdministracion";

// Pestañas adicionales: cada una solo se muestra si el usuario tiene el permiso del dashboard
// correspondiente (mismo criterio que usa el backend con @RequiresPermission en DashboardController).
const TABS_EXTRA = [
  { value: "financiero", label: "Financiero", permiso: "ver_dash_finanzas" },
  { value: "deportistas", label: "Deportistas", permiso: "ver_dash_personas" },
  { value: "organizacion", label: "Organización", permiso: "ver_dash_organizacion" },
  { value: "horarios", label: "Horarios", permiso: "ver_dash_horarios" },
  { value: "evaluacion", label: "Evaluación", permiso: "ver_dash_evaluacion" },
  { value: "eventos", label: "Eventos", permiso: "ver_evento" },
  { value: "tienda", label: "Tienda", permiso: "ver_dash_tienda" },
  { value: "administracion", label: "Administración", permiso: "ver_dash_administracion" },
];

/** El superadmin no tiene club: su inicio es un resumen de los clubes, no los KPIs deportivos. */
export default function Home() {
  const { esPlataforma } = useUser();
  return esPlataforma ? <HomePlataforma /> : <HomeClub />;
}

function HomeClub() {
  const { permissions } = useUser();

  // Resumen principal (KPIs + pestaña General)
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
            (item: { grupoAsignado?: unknown }) => !item.grupoAsignado,
          ).length;
          setInscripcionesSinGrupo(sinGrupo);
        }
      })
      .finally(() => setCargandoResumen(false));
  }, []);

  // Pestañas que se cargan al abrirse (una sola vez)
  const eventosTab = useResumenPerezoso(obtenerResumenEventos, "No se pudo cargar el resumen de eventos");
  const financieroTab = useResumenPerezoso(obtenerResumenFinanzas, "No se pudo cargar el resumen financiero");
  const personasTab = useResumenPerezoso(
    () => obtenerResumenPersonas(30),
    "No se pudo cargar el resumen de deportistas y entrenadores",
  );
  const organizacionTab = useResumenPerezoso(obtenerResumenOrganizacion, "No se pudo cargar el resumen de grupos");
  const evaluacionTab = useResumenPerezoso(obtenerResumenEvaluacion, "No se pudo cargar el resumen de evaluaciones");
  const administracionTab = useResumenPerezoso(
    obtenerResumenAdministracion,
    "No se pudo cargar el resumen administrativo",
  );
  const tiendaTab = useResumenPerezoso(obtenerResumenTienda, "No se pudo cargar el resumen de tienda");

  // Horarios se vuelve a consultar cuando cambia el rango de días, así que no usa el hook de una sola carga.
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

  // Progresión de un grupo (detalle dentro de la pestaña Evaluación)
  const [grupoProgresion, setGrupoProgresion] = useState<ProgresionGrupo | null>(null);
  const [cargandoProgresion, setCargandoProgresion] = useState(false);
  const verProgresion = (grupoId: number) => {
    setCargandoProgresion(true);
    setGrupoProgresion(null);
    obtenerProgresionGrupo(grupoId)
      .then(setGrupoProgresion)
      .catch(() => toast.error("No se pudo cargar la progresión del grupo"))
      .finally(() => setCargandoProgresion(false));
  };

  const alAbrirPestana = (v: string) => {
    if (v === "eventos") eventosTab.cargar();
    if (v === "financiero") financieroTab.cargar();
    if (v === "deportistas") personasTab.cargar();
    if (v === "organizacion") organizacionTab.cargar();
    if (v === "evaluacion") evaluacionTab.cargar();
    if (v === "administracion") administracionTab.cargar();
    if (v === "tienda") tiendaTab.cargar();
    if (v === "horarios" && !horariosData && !cargandoHorarios) cargarHorarios(diasHorarios);
  };

  const tabsVisibles = TABS_EXTRA.filter((t) => permissions.includes(t.permiso));

  return (
    <ProtectedRoute requiredPermission="ver_dash_inicio">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido al sistema de gestión de tu club</p>
        </div>

        {/* Lista de puesta en marcha: solo aparece mientras falte algo (GET /api/onboarding) */}
        <OnboardingCard />

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

        <Tabs defaultValue="general" className="space-y-4" onValueChange={alAbrirPestana}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            {tabsVisibles.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <TabGeneral resumen={resumen} cargando={cargandoResumen} inscripcionesSinGrupo={inscripcionesSinGrupo} />
          </TabsContent>
          <TabsContent value="financiero" className="space-y-4">
            <TabFinanciero estado={financieroTab.estado} />
          </TabsContent>
          <TabsContent value="deportistas" className="space-y-4">
            <TabDeportistas estado={personasTab.estado} />
          </TabsContent>
          <TabsContent value="organizacion" className="space-y-4">
            <TabOrganizacion estado={organizacionTab.estado} />
          </TabsContent>
          <TabsContent value="horarios" className="space-y-4">
            <TabHorarios
              data={horariosData}
              cargando={cargandoHorarios}
              dias={diasHorarios}
              onCambiarDias={(v) => {
                setDiasHorarios(v);
                cargarHorarios(v);
              }}
            />
          </TabsContent>
          <TabsContent value="evaluacion" className="space-y-4">
            <TabEvaluacion
              estado={evaluacionTab.estado}
              grupoProgresion={grupoProgresion}
              cargandoProgresion={cargandoProgresion}
              onVerProgresion={verProgresion}
              onCerrarProgresion={() => setGrupoProgresion(null)}
            />
          </TabsContent>
          <TabsContent value="eventos" className="space-y-4">
            <TabEventos estado={eventosTab.estado} />
          </TabsContent>
          <TabsContent value="tienda" className="space-y-4">
            <TabTienda estado={tiendaTab.estado} />
          </TabsContent>
          <TabsContent value="administracion" className="space-y-4">
            <TabAdministracion estado={administracionTab.estado} />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}