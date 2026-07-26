"use client"

import * as React from "react"
import {
  CalendarClock,
  CalendarDays,
  Clock,
  Save,
  Users,
  CheckCheck,
  History,
  ListChecks,
} from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  DEPORTISTAS,
  ESTADOS_ASISTENCIA,
  GRUPOS,
  HISTORIAL_EJEMPLO,
  HORARIOS,
  deportistasDeHorario,
  estadoInfo,
  fechaLegible,
  nombreDeportista,
  nombreGrupo,
  nombreHorario,
  type EstadoAsistencia,
  type RegistroAsistencia,
} from "@/app/lib/data/asistencias"

const HOY = new Date().toISOString().slice(0, 10)

const HORARIO_ITEMS = Object.fromEntries(
  HORARIOS.map((h: { id: string; nombre: string }) => [h.id, h.nombre]),
)
const ESTADO_ITEMS = Object.fromEntries(
  ESTADOS_ASISTENCIA.map((e: { value: EstadoAsistencia; label: string }) => [e.value, e.label]),
)

function EstadoBadge({ estado }: { estado: EstadoAsistencia }) {
  const info = estadoInfo(estado)
  return <Badge variant={info.variant}>{info.label}</Badge>
}

export function AsistenciasView() {
  const [historial, setHistorial] = React.useState<RegistroAsistencia[]>(HISTORIAL_EJEMPLO)

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Asistencias</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Registra la asistencia de un entrenamiento en bloque y consulta el historial registrado.
        </p>
      </div>

      <Tabs defaultValue="registro" className="gap-6">
        <TabsList>
          <TabsTrigger value="registro">
            <ListChecks data-icon="inline-start" />
            Registro masivo
          </TabsTrigger>
          <TabsTrigger value="historial">
            <History data-icon="inline-start" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registro">
          <RegistroMasivo historial={historial} setHistorial={setHistorial} />
        </TabsContent>

        <TabsContent value="historial">
          <HistorialAsistencias historial={historial} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ---------------------------- Tab 1: Registro ---------------------------- */

function RegistroMasivo({
  historial,
  setHistorial,
}: {
  historial: RegistroAsistencia[]
  setHistorial: React.Dispatch<React.SetStateAction<RegistroAsistencia[]>>
}) {
  const [horarioId, setHorarioId] = React.useState<string>("")
  const [fecha, setFecha] = React.useState<string>(HOY)
  // Mapa deportistaId -> estado
  const [marcas, setMarcas] = React.useState<Record<string, EstadoAsistencia>>({})

  const deportistas = React.useMemo(
    () => (horarioId ? deportistasDeHorario(horarioId) : []),
    [horarioId],
  )

  const listo = horarioId !== "" && fecha !== ""

  // Cargar estados existentes (o "presente" por defecto) cuando cambian horario/fecha
  React.useEffect(() => {
    if (!listo) {
      setMarcas({})
      return
    }
    const previos = historial.filter((r) => r.horarioId === horarioId && r.fecha === fecha)
    const base: Record<string, EstadoAsistencia> = {}
    for (const d of deportistasDeHorario(horarioId)) {
      const prev = previos.find((r) => r.deportistaId === d.id)
      base[d.id] = prev ? prev.estado : "presente"
    }
    setMarcas(base)
  }, [horarioId, fecha, listo, historial])

  const yaRegistrado = React.useMemo(
    () => listo && historial.some((r) => r.horarioId === horarioId && r.fecha === fecha),
    [historial, horarioId, fecha, listo],
  )

  const resumen = React.useMemo(() => {
    const counts: Record<EstadoAsistencia, number> = {
      presente: 0,
      ausente: 0,
      tarde: 0,
      justificado: 0,
    }
    for (const id of Object.keys(marcas)) counts[marcas[id]]++
    return counts
  }, [marcas])

  function marcarTodos(estado: EstadoAsistencia) {
    setMarcas((prev) => {
      const next = { ...prev }
      for (const d of deportistas) next[d.id] = estado
      return next
    })
  }

  function guardar() {
    const nuevos: RegistroAsistencia[] = deportistas.map((d: { id: string | number }) => ({
      id: `${horarioId}-${d.id}-${fecha}`,
      deportistaId: d.id,
      horarioId,
      fecha,
      estado: marcas[d.id] ?? "presente",
    }))
    setHistorial((prev) => {
      const restantes = prev.filter((r) => !(r.horarioId === horarioId && r.fecha === fecha))
      return [...nuevos, ...restantes]
    })
    toast.success(`Asistencia guardada · ${deportistas.length} deportistas`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Selectores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            Selecciona horario y fecha
          </CardTitle>
          <CardDescription>
            Elige el entrenamiento y la fecha para cargar los deportistas del grupo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Horario / Entrenamiento</Label>
              <Select
                items={HORARIO_ITEMS}
                value={horarioId}
                onValueChange={(v) => setHorarioId((v as string) ?? "")}
              >
                <SelectTrigger>
                  <Clock className="size-4 text-muted-foreground" />
                  <SelectValue placeholder="Seleccionar horario" />
                </SelectTrigger>
                <SelectContent>
                  {HORARIOS.map((h: (typeof HORARIOS)[number]) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.nombre} · {h.dias} · {h.hora}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fecha-asistencia">Fecha</Label>
              <Input
                id="fecha-asistencia"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de deportistas */}
      {!listo ? (
        <Empty className="rounded-lg border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>Sin datos cargados</EmptyTitle>
            <EmptyDescription>
              Selecciona un horario y una fecha para ver la lista de deportistas del grupo.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : deportistas.length === 0 ? (
        <Empty className="rounded-lg border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>Grupo sin deportistas</EmptyTitle>
            <EmptyDescription>Este horario no tiene deportistas asignados.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    {nombreHorario(horarioId)}
                  </CardTitle>
                  <CardDescription>
                    {deportistas.length} deportista{deportistas.length === 1 ? "" : "s"} ·{" "}
                    {fechaLegible(fecha)}
                    {yaRegistrado && " · editando registro existente"}
                  </CardDescription>
                </div>
                <Button onClick={guardar}>
                  <Save data-icon="inline-start" />
                  Guardar asistencia
                </Button>
              </div>

              {/* Resumen + marcar todos */}
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => marcarTodos("presente")}>
                  <CheckCheck data-icon="inline-start" />
                  Marcar todos presentes
                </Button>
                <span className="text-muted-foreground text-sm">Resumen:</span>
                {ESTADOS_ASISTENCIA.map(
                  (e: {
                    value: EstadoAsistencia
                    label: string
                    variant: React.ComponentProps<typeof Badge>["variant"]
                  }) => (
                  <Badge key={e.value} variant={e.variant}>
                    {e.label}: {resumen[e.value]}
                  </Badge>
                  ),
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Deportista</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead className="w-[220px]">Estado de asistencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deportistas.map((d: (typeof DEPORTISTAS)[number], i: number) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
                      <TableCell className="font-medium">{d.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">{nombreGrupo(d.grupoId)}</TableCell>
                      <TableCell>
                        <Select
                          items={ESTADO_ITEMS}
                          value={marcas[d.id] ?? "presente"}
                          onValueChange={(v) =>
                            setMarcas((prev) => ({ ...prev, [d.id]: v as EstadoAsistencia }))
                          }
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_ASISTENCIA.map((e: { value: EstadoAsistencia; label: string }) => (
                              <SelectItem key={e.value} value={e.value}>
                                {e.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* --------------------------- Tab 2: Historial ---------------------------- */

const DEPORTISTA_ITEMS = {
  all: "Todos los deportistas",
  ...Object.fromEntries(
    DEPORTISTAS.map((d: { id: string; nombre: string }) => [d.id, d.nombre]),
  ),
}
const GRUPO_ITEMS = {
  all: "Todos los grupos",
  ...Object.fromEntries(GRUPOS.map((g: { id: string; nombre: string }) => [g.id, g.nombre])),
}

function HistorialAsistencias({ historial }: { historial: RegistroAsistencia[] }) {
  const [deportistaFiltro, setDeportistaFiltro] = React.useState("all")
  const [grupoFiltro, setGrupoFiltro] = React.useState("all")
  const [desde, setDesde] = React.useState("")
  const [hasta, setHasta] = React.useState("")

  const grupoDeDeportista = React.useMemo(
    () => Object.fromEntries(DEPORTISTAS.map((d: { id: string; grupoId: string }) => [d.id, d.grupoId])),
    [],
  )

  const filtrado = React.useMemo(() => {
    return historial
      .filter((r) => {
        if (deportistaFiltro !== "all" && r.deportistaId !== deportistaFiltro) return false
        if (grupoFiltro !== "all" && grupoDeDeportista[r.deportistaId] !== grupoFiltro) return false
        if (desde && r.fecha < desde) return false
        if (hasta && r.fecha > hasta) return false
        return true
      })
      .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
  }, [historial, deportistaFiltro, grupoFiltro, desde, hasta, grupoDeDeportista])

  function limpiar() {
    setDeportistaFiltro("all")
    setGrupoFiltro("all")
    setDesde("")
    setHasta("")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="size-4 text-primary" />
              Historial de asistencias
            </CardTitle>
            <CardDescription>
              {filtrado.length} registro{filtrado.length === 1 ? "" : "s"} encontrado
              {filtrado.length === 1 ? "" : "s"}
            </CardDescription>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto_auto] lg:items-end">
            <div className="flex flex-col gap-2">
              <Label>Deportista</Label>
              <Select
                items={DEPORTISTA_ITEMS}
                value={deportistaFiltro}
                onValueChange={(v) => setDeportistaFiltro((v as string) ?? "all")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los deportistas</SelectItem>
                  {DEPORTISTAS.map((d: { id: string; nombre: string }) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Grupo</Label>
              <Select
                items={GRUPO_ITEMS}
                value={grupoFiltro}
                onValueChange={(v) => setGrupoFiltro((v as string) ?? "all")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grupos</SelectItem>
                  {GRUPOS.map((g: { id: string; nombre: string }) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="desde">Desde</Label>
              <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hasta">Hasta</Label>
              <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <Button variant="ghost" onClick={limpiar}>
              Limpiar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deportista</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrado.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No hay registros con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filtrado.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{nombreDeportista(r.deportistaId)}</TableCell>
                    <TableCell className="text-muted-foreground">{nombreHorario(r.horarioId)}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{fechaLegible(r.fecha)}</TableCell>
                    <TableCell>
                      <EstadoBadge estado={r.estado} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
