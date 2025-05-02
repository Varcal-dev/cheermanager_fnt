import type React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  UserPlus,
  Calendar,
  Award,
  ShoppingBag,
  DollarSign,
  ClipboardList,
  AlertTriangle,
  Star,
  Activity,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Componente para gráficas (simulado con divs coloreados)
function ChartPlaceholder({ height = "h-64", className = "" }: { height?: string; className?: string }) {
  return (
    <div
      className={`${height} w-full rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center ${className}`}
    >
      <span className="text-purple-400 text-sm font-medium">Gráfica (Simulada)</span>
    </div>
  )
}

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido al sistema de gestión de Cheer Gym</p>
      </div>

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Deportistas Activos"
          value="156"
          change="+12%"
          trend="up"
          description="vs. mes anterior"
          icon={<UserPlus className="h-5 w-5 text-purple-600" />}
          link="/deportistas"
        />
        <KpiCard
          title="Ingresos Mensuales"
          value="$8,450"
          change="+5.2%"
          trend="up"
          description="vs. mes anterior"
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          link="/facturas"
        />
        <KpiCard
          title="Asistencia"
          value="92%"
          change="-2.1%"
          trend="down"
          description="vs. mes anterior"
          icon={<CheckCircle className="h-5 w-5 text-blue-600" />}
          link="/asistencia"
        />
        <KpiCard
          title="Nuevas Inscripciones"
          value="24"
          change="+8"
          trend="up"
          description="este mes"
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

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Gráfica principal */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Resumen de Actividad</CardTitle>
                <CardDescription>Deportistas activos y asistencia en los últimos 30 días</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartPlaceholder />
              </CardContent>
            </Card>

            {/* Alertas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Alertas Importantes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <AlertItem title="Pagos vencidos" description="8 deportistas tienen pagos vencidos" type="warning" />
                  <AlertItem
                    title="Inventario bajo"
                    description="3 productos están por debajo del stock mínimo"
                    type="warning"
                  />
                  <AlertItem title="Evento próximo" description="Competencia Nacional en 5 días" type="info" />
                  <AlertItem
                    title="Evaluaciones pendientes"
                    description="12 deportistas requieren evaluación"
                    type="info"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Calendario de eventos */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Eventos</CardTitle>
                <CardDescription>Calendario de actividades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <CalendarItem
                    title="Competencia Regional"
                    date="15/05/2024"
                    type="competition"
                    description="Centro Deportivo Municipal"
                  />
                  <CalendarItem
                    title="Evaluación Técnica"
                    date="18/05/2024"
                    type="evaluation"
                    description="Grupos Junior y Senior"
                  />
                  <CalendarItem
                    title="Exhibición de Rutinas"
                    date="25/05/2024"
                    type="exhibition"
                    description="Plaza Central"
                  />
                  <CalendarItem
                    title="Campamento de Verano"
                    date="01/06/2024"
                    type="camp"
                    description="Inicio de inscripciones"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actividad reciente */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimas acciones en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ActivityItem
                    icon={<UserPlus className="h-4 w-4" />}
                    title="Nuevo deportista registrado"
                    description="María González fue registrada en el grupo Junior Elite"
                    timestamp="Hace 2 horas"
                  />
                  <ActivityItem
                    icon={<Calendar className="h-4 w-4" />}
                    title="Horario modificado"
                    description="El horario del grupo Mini Estrellas fue actualizado"
                    timestamp="Hace 5 horas"
                  />
                  <ActivityItem
                    icon={<Award className="h-4 w-4" />}
                    title="Nuevo evento creado"
                    description="Competencia Regional 2024 fue agregada al calendario"
                    timestamp="Ayer"
                  />
                  <ActivityItem
                    icon={<ShoppingBag className="h-4 w-4" />}
                    title="Venta realizada"
                    description="Venta de uniformes por $350"
                    timestamp="Hace 2 días"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Datos interesantes */}
            <Card>
              <CardHeader>
                <CardTitle>Datos Destacados</CardTitle>
                <CardDescription>Información relevante</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <DataItem
                    icon={<Star className="h-4 w-4 text-yellow-500" />}
                    title="Mejor Grupo"
                    value="Senior Elite"
                    description="Mayor progreso este mes"
                  />
                  <DataItem
                    icon={<Activity className="h-4 w-4 text-green-500" />}
                    title="Mayor Asistencia"
                    value="Grupo Junior"
                    description="98% de asistencia"
                  />
                  <DataItem
                    icon={<Award className="h-4 w-4 text-purple-500" />}
                    title="Próxima Competencia"
                    value="15 días"
                    description="Campeonato Nacional"
                  />
                  <DataItem
                    icon={<ShoppingBag className="h-4 w-4 text-blue-500" />}
                    title="Producto Más Vendido"
                    value="Uniforme Competición"
                    description="24 unidades este mes"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Financiero */}
        <TabsContent value="financiero" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Gráfica de ingresos */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Ingresos vs Gastos</CardTitle>
                <CardDescription>Análisis financiero de los últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartPlaceholder />
              </CardContent>
            </Card>

            {/* KPIs financieros */}
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

          <div className="grid gap-4 md:grid-cols-2">
            {/* Distribución de ingresos */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ingresos</CardTitle>
                <CardDescription>Por categoría</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                  <span className="text-purple-400 text-sm font-medium">Gráfica Circular</span>
                </div>
              </CardContent>
            </Card>

            {/* Pagos pendientes */}
            <Card>
              <CardHeader>
                <CardTitle>Pagos Pendientes</CardTitle>
                <CardDescription>Facturas por cobrar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PaymentItem name="Carlos Rodríguez" amount="$350" dueDate="15/05/2024" status="vencido" />
                  <PaymentItem name="Ana Martínez" amount="$280" dueDate="18/05/2024" status="pendiente" />
                  <PaymentItem name="Luis Gómez" amount="$420" dueDate="22/05/2024" status="pendiente" />
                  <PaymentItem name="Sofía Torres" amount="$350" dueDate="10/05/2024" status="vencido" />
                  <Link href="/pagos" className="text-sm text-purple-600 hover:underline block text-center mt-2">
                    Ver todos los pagos pendientes
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Deportistas */}
        <TabsContent value="deportistas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Distribución por nivel */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Distribución por Nivel</CardTitle>
                <CardDescription>Deportistas por categoría y nivel</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartPlaceholder />
              </CardContent>
            </Card>

            {/* Estadísticas de deportistas */}
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
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tasa de retención</span>
                  <span className="text-sm font-bold text-blue-600">92%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Promedio de edad</span>
                  <span className="text-sm font-bold">14.5 años</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Asistencia semanal */}
            <Card>
              <CardHeader>
                <CardTitle>Asistencia Semanal</CardTitle>
                <CardDescription>Últimos 7 días</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartPlaceholder height="h-48" />
              </CardContent>
            </Card>

            {/* Top deportistas */}
            <Card>
              <CardHeader>
                <CardTitle>Deportistas Destacados</CardTitle>
                <CardDescription>Mejor rendimiento este mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <AthleteItem
                    name="Laura Sánchez"
                    level="Senior Elite"
                    achievement="Mejor técnica en stunts"
                    rating={5}
                  />
                  <AthleteItem
                    name="Daniel Pérez"
                    level="Junior Advanced"
                    achievement="Mayor progreso en tumbling"
                    rating={5}
                  />
                  <AthleteItem name="Valeria Gómez" level="Senior Elite" achievement="Mejor asistencia" rating={4} />
                  <AthleteItem name="Martín Torres" level="Youth Advanced" achievement="Mejor actitud" rating={4} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Eventos */}
        <TabsContent value="eventos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Calendario de eventos */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Calendario de Eventos</CardTitle>
                <CardDescription>Próximos 3 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="grid grid-cols-7 gap-1">
                    {["D", "L", "M", "X", "J", "V", "S"].map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: 35 }).map((_, i) => {
                      const hasEvent = [3, 8, 15, 22, 27].includes(i)
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-md flex items-center justify-center text-xs ${
                            hasEvent ? "bg-purple-100 text-purple-700" : "hover:bg-gray-100"
                          }`}
                        >
                          {i + 1 <= 31 ? i + 1 : ""}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Próximos eventos */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Eventos</CardTitle>
                <CardDescription>Eventos importantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <EventItem
                    title="Competencia Regional"
                    date="15/05/2024"
                    location="Centro Deportivo Municipal"
                    type="competition"
                  />
                  <EventItem
                    title="Exhibición de Rutinas"
                    date="25/05/2024"
                    location="Plaza Central"
                    type="exhibition"
                  />
                  <EventItem
                    title="Campamento de Verano"
                    date="01/06/2024"
                    location="Instalaciones Cheer Gym"
                    type="camp"
                  />
                  <EventItem
                    title="Campeonato Nacional"
                    date="15/06/2024"
                    location="Estadio Olímpico"
                    type="competition"
                  />
                  <Link href="/eventos" className="text-sm text-purple-600 hover:underline block text-center mt-2">
                    Ver todos los eventos
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Resultados de competencias */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados de Competencias</CardTitle>
                <CardDescription>Últimas competencias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <CompetitionResult
                    name="Campeonato Regional"
                    date="10/04/2024"
                    category="Senior Elite"
                    result="1er Lugar"
                  />
                  <CompetitionResult
                    name="Campeonato Regional"
                    date="10/04/2024"
                    category="Junior Advanced"
                    result="2do Lugar"
                  />
                  <CompetitionResult
                    name="Copa Invitacional"
                    date="25/03/2024"
                    category="Senior Elite"
                    result="1er Lugar"
                  />
                  <CompetitionResult
                    name="Copa Invitacional"
                    date="25/03/2024"
                    category="Youth Advanced"
                    result="3er Lugar"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preparación para eventos */}
            <Card>
              <CardHeader>
                <CardTitle>Preparación para Eventos</CardTitle>
                <CardDescription>Estado de preparación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <PreparationItem event="Competencia Regional" date="15/05/2024" progress={85} status="En progreso" />
                  <PreparationItem event="Exhibición de Rutinas" date="25/05/2024" progress={70} status="En progreso" />
                  <PreparationItem event="Campeonato Nacional" date="15/06/2024" progress={45} status="En progreso" />
                  <PreparationItem event="Campamento de Verano" date="01/06/2024" progress={60} status="En progreso" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function KpiCard({
  title,
  value,
  change,
  trend,
  description,
  icon,
  link,
}: {
  title: string
  value: string
  change: string
  trend: "up" | "down" | "neutral"
  description: string
  icon: React.ReactNode
  link: string
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
            <span
              className={`text-xs font-medium flex items-center ${
                trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-600"
              }`}
            >
              {trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : trend === "down" ? (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              ) : null}
              {change}
            </span>
            <span className="text-xs text-muted-foreground ml-2">{description}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ActivityItem({
  icon,
  title,
  description,
  timestamp,
}: {
  icon: React.ReactNode
  title: string
  description: string
  timestamp: string
}) {
  return (
    <div className="flex items-start space-x-4">
      <div className="rounded-full bg-muted p-2">{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{timestamp}</p>
      </div>
    </div>
  )
}

function AlertItem({
  title,
  description,
  type,
}: {
  title: string
  description: string
  type: "warning" | "info" | "error"
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
  )
}

function CalendarItem({
  title,
  date,
  type,
  description,
}: {
  title: string
  date: string
  type: "competition" | "evaluation" | "exhibition" | "camp"
  description: string
}) {
  const getIcon = () => {
    switch (type) {
      case "competition":
        return <Award className="h-4 w-4" />
      case "evaluation":
        return <ClipboardList className="h-4 w-4" />
      case "exhibition":
        return <Users className="h-4 w-4" />
      case "camp":
        return <Calendar className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getColor = () => {
    switch (type) {
      case "competition":
        return "bg-purple-100 text-purple-600"
      case "evaluation":
        return "bg-blue-100 text-blue-600"
      case "exhibition":
        return "bg-green-100 text-green-600"
      case "camp":
        return "bg-orange-100 text-orange-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <div className="flex items-start space-x-4">
      <div className={`rounded-full p-2 ${getColor()}`}>{getIcon()}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
  )
}

function DataItem({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode
  title: string
  value: string
  description: string
}) {
  return (
    <div className="flex items-start space-x-4">
      <div className="rounded-full bg-muted p-2">{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function PaymentItem({
  name,
  amount,
  dueDate,
  status,
}: {
  name: string
  amount: string
  dueDate: string
  status: "pendiente" | "vencido" | "pagado"
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium leading-none">{name}</p>
        <p className="text-xs text-muted-foreground">Vence: {dueDate}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">{amount}</p>
        <p
          className={`text-xs ${
            status === "vencido" ? "text-red-600" : status === "pendiente" ? "text-amber-600" : "text-green-600"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </p>
      </div>
    </div>
  )
}

function AthleteItem({
  name,
  level,
  achievement,
  rating,
}: {
  name: string
  level: string
  achievement: string
  rating: number
}) {
  return (
    <div className="flex items-start space-x-4">
      <div className="rounded-full bg-purple-100 p-2 text-purple-600">
        <Users className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{name}</p>
        <p className="text-xs text-muted-foreground">{level}</p>
        <p className="text-xs text-muted-foreground">{achievement}</p>
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

function EventItem({
  title,
  date,
  location,
  type,
}: {
  title: string
  date: string
  location: string
  type: "competition" | "exhibition" | "camp" | "other"
}) {
  const getIcon = () => {
    switch (type) {
      case "competition":
        return <Award className="h-4 w-4" />
      case "exhibition":
        return <Users className="h-4 w-4" />
      case "camp":
        return <Calendar className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getColor = () => {
    switch (type) {
      case "competition":
        return "bg-purple-100 text-purple-600"
      case "exhibition":
        return "bg-green-100 text-green-600"
      case "camp":
        return "bg-orange-100 text-orange-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <div className="flex items-start space-x-4">
      <div className={`rounded-full p-2 ${getColor()}`}>{getIcon()}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{location}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
  )
}

function CompetitionResult({
  name,
  date,
  category,
  result,
}: {
  name: string
  date: string
  category: string
  result: string
}) {
  return (
    <div className="flex items-start space-x-4">
      <div className="rounded-full bg-purple-100 p-2 text-purple-600">
        <Award className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{name}</p>
        <p className="text-xs text-muted-foreground">{category}</p>
        <div className="flex justify-between">
          <p className="text-xs text-muted-foreground">{date}</p>
          <p className="text-xs font-bold text-purple-600">{result}</p>
        </div>
      </div>
    </div>
  )
}

function PreparationItem({
  event,
  date,
  progress,
  status,
}: {
  event: string
  date: string
  progress: number
  status: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <p className="text-sm font-medium">{event}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="flex justify-between">
        <p className="text-xs text-muted-foreground">{status}</p>
        <p className="text-xs font-medium">{progress}%</p>
      </div>
    </div>
  )
}
