"use client"

import * as React from "react"
import { CalendarClock, CheckCheck, History, ListChecks, Loader2, Save, Users } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, getErrorMessage } from "@/lib/api"

// Vista de asistencias conectada al backend (antes usaba datos de ejemplo en memoria).
// Endpoints: /api/grupos/con-deportistas, /api/horarios, /api/estados-asistencia,
// /api/asistencias/grupo/{id}/deportistas-activos, /api/asistencias/grupo/{id}?fecha=, /api/asistencias/masivo

interface GrupoSimple {
  id: number
  nombre: string
}

interface HorarioDTO {
  id: number
  dia: string
  horaInicio: string
  horaFin: string
  grupos: { horarioEntrenamientoId: number; grupoId: number; nombreGrupo: string }[]
}

interface EstadoAsistencia {
  id: number
  estado: string
}

interface DeportistaActivo {
  deportistaId: number
  nombre: string
}

interface AsistenciaDTO {
  id: number
  deportistaId: number
  nombreDeportista: string
  horarioId: number
  fecha: string
  estadoAsistenciaId: number
  estadoAsistencia: string
}

const fechaLocalISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const hoyISO = () => fechaLocalISO(new Date())
const haceDias = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return fechaLocalISO(d)
}
const inicioDeMes = () => {
  const d = new Date()
  return fechaLocalISO(new Date(d.getFullYear(), d.getMonth(), 1))
}
const fechaCorta = (iso: string) => {
  const [y, m, d] = iso.split("-")
  return y && m && d ? `${d}/${m}/${y}` : iso
}
const MAX_DIAS_PERIODO = 366
const hora = (h: string) => h?.slice(0, 5) ?? ""

function badgeVariant(estado: string): "default" | "secondary" | "destructive" | "outline" {
  const e = estado.toLowerCase()
  if (e === "presente") return "default"
  if (e === "ausente") return "destructive"
  if (e === "tarde") return "secondary"
  return "outline"
}

function useCatalogos() {
  const [grupos, setGrupos] = React.useState<GrupoSimple[]>([])
  const [horarios, setHorarios] = React.useState<HorarioDTO[]>([])
  const [estados, setEstados] = React.useState<EstadoAsistencia[]>([])
  const [cargando, setCargando] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      api.get("/api/grupos/con-deportistas"),
      api.get("/api/horarios"),
      api.get("/api/estados-asistencia"),
    ])
      .then(([g, h, e]) => {
        setGrupos((g.data as any[]).map((x) => ({ id: x.id, nombre: x.nombre })))
        setHorarios(h.data)
        setEstados(e.data)
      })
      .catch((err) => toast.error(getErrorMessage(err, "No se pudieron cargar grupos, horarios o estados")))
      .finally(() => setCargando(false))
  }, [])

  return { grupos, horarios, estados, cargando }
}

export function AsistenciasView() {
  const cat = useCatalogos()

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Asistencias</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Registra la asistencia de un entrenamiento en bloque y consulta lo ya registrado por grupo y fecha.
        </p>
      </div>

      {cat.cargando ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Cargando…
        </div>
      ) : (
        <Tabs defaultValue="registro" className="gap-6">
          <TabsList>
            <TabsTrigger value="registro">
              <ListChecks data-icon="inline-start" />
              Registro masivo
            </TabsTrigger>
            <TabsTrigger value="historial">
              <History data-icon="inline-start" />
              Consulta
            </TabsTrigger>
          </TabsList>
          <TabsContent value="registro">
            <RegistroMasivo {...cat} />
          </TabsContent>
          <TabsContent value="historial">
            <Consulta {...cat} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

type CatProps = { grupos: GrupoSimple[]; horarios: HorarioDTO[]; estados: EstadoAsistencia[] }

/* ---------------------------- Tab 1: Registro ---------------------------- */

function RegistroMasivo({ grupos, horarios, estados }: CatProps) {
  const [grupoId, setGrupoId] = React.useState("")
  const [horarioId, setHorarioId] = React.useState("")
  const [fecha, setFecha] = React.useState(hoyISO())
  const [roster, setRoster] = React.useState<{ deportistaId: number; nombre: string; estadoId: string }[]>([])
  const [cargada, setCargada] = React.useState(false)
  const [cargando, setCargando] = React.useState(false)
  const [guardando, setGuardando] = React.useState(false)

  const horariosDelGrupo = React.useMemo(
    () => (grupoId ? horarios.filter((h) => h.grupos.some((g) => g.grupoId === Number(grupoId))) : []),
    [horarios, grupoId],
  )

  React.useEffect(() => {
    setHorarioId("")
    setCargada(false)
    setRoster([])
  }, [grupoId])

  const estadoPorDefecto = () => (estados.find((e) => e.estado.toLowerCase() === "presente") ?? estados[0])?.id.toString() ?? ""

  async function cargarLista() {
    if (!grupoId || !horarioId || !fecha) {
      toast.error("Selecciona grupo, horario y fecha")
      return
    }
    setCargando(true)
    try {
      const [activos, yaRegistradas] = await Promise.all([
        api.get<DeportistaActivo[]>(`/api/asistencias/grupo/${grupoId}/deportistas-activos`),
        api.get<AsistenciaDTO[]>(`/api/asistencias/grupo/${grupoId}`, { params: { fecha } }),
      ])
      const previos = new Map(
        yaRegistradas.data.filter((a) => a.horarioId === Number(horarioId)).map((a) => [a.deportistaId, a]),
      )
      const defecto = estadoPorDefecto()
      setRoster(
        activos.data.map((d) => ({
          deportistaId: d.deportistaId,
          nombre: d.nombre,
          estadoId: previos.get(d.deportistaId)?.estadoAsistenciaId.toString() ?? defecto,
        })),
      )
      setCargada(true)
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo cargar la lista del grupo"))
    } finally {
      setCargando(false)
    }
  }

  async function guardar() {
    if (!horarioId || roster.length === 0) return
    setGuardando(true)
    try {
      const { data } = await api.post("/api/asistencias/masivo", {
        horarioId: Number(horarioId),
        fecha,
        registros: roster.map((r) => ({ deportistaId: r.deportistaId, estadoAsistenciaId: Number(r.estadoId) })),
      })
      const errores: Record<string, string> = data?.errores ?? {}
      const n = Object.keys(errores).length
      if (n === 0) toast.success(`Asistencia guardada: ${data?.registrados?.length ?? roster.length} deportistas`)
      else toast.warn(`Se guardaron ${data?.registrados?.length ?? 0} registros y ${n} fallaron: ${Object.values(errores)[0]}`)
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo guardar la asistencia"))
    } finally {
      setGuardando(false)
    }
  }

  const marcarTodos = (estadoId: string) => setRoster((p) => p.map((r) => ({ ...r, estadoId })))

  const resumen = React.useMemo(() => {
    const out: Record<string, number> = {}
    for (const r of roster) {
      const nombre = estados.find((e) => e.id === Number(r.estadoId))?.estado ?? "—"
      out[nombre] = (out[nombre] ?? 0) + 1
    }
    return out
  }, [roster, estados])

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            Grupo, horario y fecha
          </CardTitle>
          <CardDescription>Elige el entrenamiento para cargar los deportistas activos del grupo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label>Grupo</Label>
              <Select value={grupoId} onValueChange={setGrupoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Horario</Label>
              <Select value={horarioId} onValueChange={setHorarioId} disabled={!grupoId}>
                <SelectTrigger>
                  <SelectValue placeholder={grupoId ? "Selecciona un horario" : "Primero el grupo"} />
                </SelectTrigger>
                <SelectContent>
                  {horariosDelGrupo.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {h.dia} {hora(h.horaInicio)}–{hora(h.horaFin)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Fecha</Label>
              <Input type="date" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>
          <Button className="mt-4" onClick={cargarLista} disabled={cargando || !grupoId || !horarioId}>
            {cargando ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Users className="mr-2 size-4" />}
            Cargar lista
          </Button>
        </CardContent>
      </Card>

      {cargada && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Lista de asistencia</CardTitle>
              <CardDescription>
                {roster.length} deportistas activos ·{" "}
                {Object.entries(resumen)
                  .map(([k, v]) => `${v} ${k.toLowerCase()}`)
                  .join(" · ")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {estados.slice(0, 2).map((e) => (
                <Button key={e.id} variant="outline" size="sm" onClick={() => marcarTodos(String(e.id))}>
                  <CheckCheck className="mr-1 size-4" /> Todos {e.estado.toLowerCase()}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {roster.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este grupo no tiene deportistas activos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deportista</TableHead>
                    <TableHead className="w-56">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((r, i) => (
                    <TableRow key={r.deportistaId}>
                      <TableCell className="font-medium">{r.nombre}</TableCell>
                      <TableCell>
                        <Select
                          value={r.estadoId}
                          onValueChange={(v) => setRoster((p) => p.map((x, j) => (j === i ? { ...x, estadoId: v } : x)))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {estados.map((e) => (
                              <SelectItem key={e.id} value={String(e.id)}>
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
            <Button className="mt-4" onClick={guardar} disabled={guardando || roster.length === 0}>
              {guardando ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              Guardar asistencia
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/* ---------------------------- Tab 2: Consulta ---------------------------- */

function Consulta({ grupos, horarios }: CatProps) {
  const [grupoId, setGrupoId] = React.useState("")
  const [desde, setDesde] = React.useState(inicioDeMes())
  const [hasta, setHasta] = React.useState(hoyISO())
  const [filas, setFilas] = React.useState<AsistenciaDTO[] | null>(null)
  const [consultado, setConsultado] = React.useState<{ desde: string; hasta: string } | null>(null)
  const [cargando, setCargando] = React.useState(false)

  const rango = (d: string, h: string) => {
    setDesde(d)
    setHasta(h)
  }

  async function consultar() {
    if (!grupoId) {
      toast.error("Selecciona un grupo")
      return
    }
    if (!desde || !hasta) {
      toast.error("Indica la fecha de inicio y la fecha de fin")
      return
    }
    if (desde > hasta) {
      toast.error("La fecha de inicio no puede ser posterior a la fecha de fin")
      return
    }
    const dias = Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000) + 1
    if (dias > MAX_DIAS_PERIODO) {
      toast.error(`El periodo no puede superar ${MAX_DIAS_PERIODO} días`)
      return
    }
    setCargando(true)
    try {
      const res = await api.get<AsistenciaDTO[]>(`/api/asistencias/grupo/${grupoId}/rango`, {
        params: { desde, hasta },
      })
      // Lo más reciente primero y, dentro de un mismo día, por nombre.
      setFilas(
        [...res.data].sort(
          (a, b) => b.fecha.localeCompare(a.fecha) || a.nombreDeportista.localeCompare(b.nombreDeportista),
        ),
      )
      setConsultado({ desde, hasta })
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo consultar la asistencia"))
    } finally {
      setCargando(false)
    }
  }

  const etiquetaHorario = (id: number) => {
    const h = horarios.find((x) => x.id === id)
    return h ? `${h.dia} ${hora(h.horaInicio)}–${hora(h.horaFin)}` : `#${id}`
  }

  const resumen = React.useMemo(() => {
    const porEstado: Record<string, number> = {}
    for (const f of filas ?? []) porEstado[f.estadoAsistencia] = (porEstado[f.estadoAsistencia] ?? 0) + 1
    const total = filas?.length ?? 0
    const presentes = Object.entries(porEstado).find(([k]) => k.toLowerCase() === "presente")?.[1] ?? 0
    return { porEstado, total, porcentaje: total ? Math.round((presentes * 100) / total) : 0 }
  }, [filas])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asistencia registrada</CardTitle>
        <CardDescription>Consulta lo guardado para un grupo en un periodo (fecha de inicio y de fin).</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>Grupo</Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un grupo" />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Desde</Label>
            <Input type="date" value={desde} max={hasta || hoyISO()} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Hasta</Label>
            <Input type="date" value={hasta} min={desde || undefined} max={hoyISO()} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={consultar} disabled={cargando}>
              {cargando && <Loader2 className="mr-2 size-4 animate-spin" />}
              Consultar
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => rango(hoyISO(), hoyISO())}>
            Hoy
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => rango(haceDias(6), hoyISO())}>
            Últimos 7 días
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => rango(inicioDeMes(), hoyISO())}>
            Este mes
          </Button>
        </div>

        {filas && consultado && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {consultado.desde === consultado.hasta
                  ? fechaCorta(consultado.desde)
                  : `${fechaCorta(consultado.desde)} al ${fechaCorta(consultado.hasta)}`}
                {" · "}
                {resumen.total} registros
              </span>
              {Object.entries(resumen.porEstado).map(([estado, n]) => (
                <Badge key={estado} variant={badgeVariant(estado)}>
                  {estado}: {n}
                </Badge>
              ))}
              {resumen.total > 0 && <span className="text-muted-foreground">· {resumen.porcentaje}% presente</span>}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Deportista</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Sin registros en ese periodo.
                    </TableCell>
                  </TableRow>
                ) : (
                  filas.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{fechaCorta(f.fecha)}</TableCell>
                      <TableCell className="font-medium">{f.nombreDeportista}</TableCell>
                      <TableCell>{etiquetaHorario(f.horarioId)}</TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(f.estadoAsistencia)}>{f.estadoAsistencia}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  )
}