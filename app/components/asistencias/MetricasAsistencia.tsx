"use client"

import * as React from "react"
import { AlertTriangle, CalendarCheck, Loader2, TrendingUp, Trophy, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts"
import { toast } from "react-toastify"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api, getErrorMessage } from "@/lib/api"
import { KpiCard } from "@/app/components/inicio/comunes"

// Métricas detalladas de asistencia: GET /api/asistencias/metricas?desde=&hasta=&grupoId=
// (más completas que el resumen de Horarios en el inicio: por estado, grupo, día, semana y deportista).

interface PorEstado { estado: string; total: number; porcentaje: number | null }
interface PorGrupo { grupoId: number; nombre: string; total: number; presentes: number; porcentaje: number | null; sesiones: number }
interface PorDia { dia: number; nombre: string; total: number; presentes: number; porcentaje: number | null }
interface Semana { inicio: string; total: number; presentes: number; porcentaje: number | null }
interface PorDeportista { deportistaId: number; nombre: string; total: number; presentes: number; porcentaje: number; ausenciasSeguidas: number }
interface Metricas {
  desde: string
  hasta: string
  totalRegistros: number
  presentes: number
  porcentaje: number | null
  sesiones: number
  deportistas: number
  porEstado: PorEstado[]
  porGrupo: PorGrupo[]
  porDiaSemana: PorDia[]
  tendenciaSemanal: Semana[]
  enRiesgo: PorDeportista[]
  masConstantes: PorDeportista[]
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const haceDias = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return iso(d)
}
const fechaCorta = (s: string) => {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
}
const pct = (v: number | null) => (v == null ? "—" : `${v.toFixed(0)}%`)

export default function MetricasAsistencia({ grupos }: { grupos: { id: number; nombre: string }[] }) {
  const [desde, setDesde] = React.useState(haceDias(29))
  const [hasta, setHasta] = React.useState(iso(new Date()))
  const [grupoId, setGrupoId] = React.useState("todos")
  const [data, setData] = React.useState<Metricas | null>(null)
  const [cargando, setCargando] = React.useState(true)

  React.useEffect(() => {
    if (!desde || !hasta || desde > hasta) return
    let vigente = true
    setCargando(true)
    api
      .get<Metricas>("/api/asistencias/metricas", {
        params: { desde, hasta, ...(grupoId !== "todos" ? { grupoId } : {}) },
      })
      .then((res) => vigente && setData(res.data))
      .catch((err) => vigente && toast.error(getErrorMessage(err, "No se pudieron cargar las métricas")))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [desde, hasta, grupoId])

  const rangoInvalido = !!desde && !!hasta && desde > hasta
  const atajo = (dias: number) => {
    setDesde(haceDias(dias - 1))
    setHasta(iso(new Date()))
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>Desde</Label>
            <Input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Hasta</Label>
            <Input type="date" value={hasta} min={desde || undefined} max={iso(new Date())} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Grupo</Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los grupos</SelectItem>
                {grupos.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Rango rápido</Label>
            <Select onValueChange={(v) => atajo(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Elegir…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
                <SelectItem value="180">Últimos 6 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {rangoInvalido && <p className="text-sm text-destructive">La fecha de inicio no puede ser posterior a la de fin.</p>}

      {cargando && !data ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Calculando…
        </div>
      ) : data && data.totalRegistros === 0 ? (
        <p className="rounded-lg border bg-card py-10 text-center text-sm text-muted-foreground">
          No hay asistencias registradas en este rango{grupoId !== "todos" ? " para este grupo" : ""}.
        </p>
      ) : data ? (
        <div className={cargando ? "flex flex-col gap-4 opacity-60 transition-opacity" : "flex flex-col gap-4"}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Asistencia" value={pct(data.porcentaje)} description={`${data.presentes} de ${data.totalRegistros} registros`} icon={<CalendarCheck className="h-5 w-5" />} tone="accent" />
            <KpiCard title="Entrenamientos" value={String(data.sesiones)} description="sesiones con lista tomada" icon={<TrendingUp className="h-5 w-5" />} />
            <KpiCard title="Deportistas" value={String(data.deportistas)} description="con al menos un registro" icon={<Users className="h-5 w-5" />} tone="success" />
            <KpiCard title="En riesgo" value={String(data.enRiesgo.length)} description="bajo 70% (mín. 3 registros)" icon={<AlertTriangle className="h-5 w-5" />} tone="destructive" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por estado</CardTitle>
              <CardDescription>Cómo se reparten los registros del rango.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {data.porEstado.map((e) => (
                <Badge key={e.estado} variant={e.estado === "Presente" ? "success" : "outline"} className="text-sm">
                  {e.estado}: {e.total} ({pct(e.porcentaje)})
                </Badge>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tendencia semanal</CardTitle>
                <CardDescription>% de asistencia por semana (desde el lunes).</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.tendenciaSemanal.map((s) => ({ semana: fechaCorta(s.inicio), porcentaje: s.porcentaje ?? 0, registros: s.total }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} width={44} />
                    <RTooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="porcentaje" name="Asistencia" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por día de la semana</CardTitle>
                <CardDescription>Qué días se asiste más.</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.porDiaSemana.map((d) => ({ dia: d.nombre.slice(0, 3), porcentaje: d.porcentaje ?? 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} width={44} />
                    <RTooltip formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="porcentaje" name="Asistencia" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {data.porGrupo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por grupo</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grupo</TableHead>
                      <TableHead className="text-right">Entrenamientos</TableHead>
                      <TableHead className="text-right">Registros</TableHead>
                      <TableHead className="text-right">Presentes</TableHead>
                      <TableHead className="text-right">Asistencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.porGrupo.map((g) => (
                      <TableRow key={g.grupoId}>
                        <TableCell className="font-medium">{g.nombre}</TableCell>
                        <TableCell className="text-right">{g.sesiones}</TableCell>
                        <TableCell className="text-right">{g.total}</TableCell>
                        <TableCell className="text-right">{g.presentes}</TableCell>
                        <TableCell className="text-right font-medium">{pct(g.porcentaje)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <ListaDeportistas titulo="Deportistas en riesgo" descripcion="Menos de 70% de asistencia en el rango." icono={<AlertTriangle className="size-4 text-destructive" />} filas={data.enRiesgo} vacio="Nadie bajo 70%. 👏" mostrarRacha />
            <ListaDeportistas titulo="Más constantes" descripcion="Mayor asistencia en el rango." icono={<Trophy className="size-4 text-primary" />} filas={data.masConstantes} vacio="Aún no hay suficientes registros." />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ListaDeportistas({ titulo, descripcion, icono, filas, vacio, mostrarRacha }: { titulo: string; descripcion: string; icono: React.ReactNode; filas: PorDeportista[]; vacio: string; mostrarRacha?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icono}
          {titulo}
        </CardTitle>
        <CardDescription>{descripcion}</CardDescription>
      </CardHeader>
      <CardContent>
        {filas.length === 0 ? (
          <p className="text-sm text-muted-foreground">{vacio}</p>
        ) : (
          <ul className="divide-y">
            {filas.map((f) => (
              <li key={f.deportistaId} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{f.nombre}</span>
                  <span className="block text-xs text-muted-foreground">
                    {f.presentes} de {f.total} entrenamientos
                    {mostrarRacha && f.ausenciasSeguidas >= 2 ? ` · ${f.ausenciasSeguidas} sin asistir seguidos` : ""}
                  </span>
                </span>
                <Badge variant={f.porcentaje < 70 ? "destructive" : "success"}>{f.porcentaje.toFixed(0)}%</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
