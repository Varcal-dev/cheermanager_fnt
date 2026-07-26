"use client"

import * as React from "react"
import { Search, Download, Layers, Filter } from "lucide-react"
import { toast } from "react-toastify"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

type Catalogo = { id: number; nombre: string }

type CategoriaNivel = {
  id: number
  nombre: string
  nivel: Catalogo
  division: Catalogo
  estadoCategoriaNivel: Catalogo
  añoNacimientoMin: number | null
  añoNacimientoMax: number | null
  cantidadMin: number | null
  cantidadMax: number | null
}

function rangoLegible(min: number | null, max: number | null) {
  if (min === null && max === null) return "Sin restricción"
  if (min === null) return `Hasta ${max}`
  if (max === null) return `Desde ${min}`
  return min === max ? String(min) : `${min}–${max}`
}

const PAGE_SIZE = 6

export function CategoriasView() {
  const [categorias, setCategorias] = React.useState<CategoriaNivel[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [nivelFiltro, setNivelFiltro] = React.useState("all")
  const [divisionFiltro, setDivisionFiltro] = React.useState("all")
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    api.get("/api/categorias-nivel")
      .then((res) => setCategorias(res.data))
      .catch(() => toast.error("No se pudo cargar el catálogo de categorías"))
      .finally(() => setLoading(false))
  }, [])

  // Opciones de filtro derivadas de los datos ya cargados (es un catálogo, no hace falta pedirlas aparte)
  const niveles = React.useMemo(() => {
    const map = new Map(categorias.map((c) => [c.nivel.id, c.nivel.nombre]))
    return Array.from(map, ([id, nombre]) => ({ id, nombre }))
  }, [categorias])

  const divisiones = React.useMemo(() => {
    const map = new Map(categorias.map((c) => [c.division.id, c.division.nombre]))
    return Array.from(map, ([id, nombre]) => ({ id, nombre }))
  }, [categorias])

  const filtradas = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return categorias.filter((c) => {
      if (nivelFiltro !== "all" && String(c.nivel.id) !== nivelFiltro) return false
      if (divisionFiltro !== "all" && String(c.division.id) !== divisionFiltro) return false
      if (q) {
        const hay = `${c.nombre} ${c.nivel.nombre} ${c.division.nombre}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [categorias, search, nivelFiltro, divisionFiltro])

  React.useEffect(() => { setPage(1) }, [search, nivelFiltro, divisionFiltro])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const paginaActual = Math.min(page, totalPaginas)
  const visibles = filtradas.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  const kpis = React.useMemo(() => ({
    total: categorias.length,
    niveles: niveles.length,
    divisiones: divisiones.length,
  }), [categorias, niveles, divisiones])

  function exportar() {
    const headers = ["Nombre", "Nivel", "División", "Estado", "Rango de edad", "Atletas"]
    const rows = filtradas.map((c) => [
      c.nombre, c.nivel.nombre, c.division.nombre, c.estadoCategoriaNivel.nombre,
      rangoLegible(c.añoNacimientoMin, c.añoNacimientoMax),
      rangoLegible(c.cantidadMin, c.cantidadMax),
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "categorias-por-nivel.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Categorías por Nivel</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo oficial FEDECOLCHEER — cruce de nivel y división. Solo lectura.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="gap-1">
            <CardDescription>Total categorías</CardDescription>
            <CardTitle className="text-3xl">{kpis.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="gap-1">
            <CardDescription>Niveles</CardDescription>
            <CardTitle className="text-3xl">{kpis.niveles}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="gap-1">
            <CardDescription>Divisiones</CardDescription>
            <CardTitle className="text-3xl">{kpis.divisiones}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                Catálogo de categorías
              </CardTitle>
              <CardDescription>
                {filtradas.length} categoría{filtradas.length === 1 ? "" : "s"} encontrada{filtradas.length === 1 ? "" : "s"}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, nivel o división…"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={nivelFiltro} onValueChange={setNivelFiltro}>
                  <SelectTrigger className="w-[170px]">
                    <Filter className="size-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    {niveles.map((n) => (
                      <SelectItem key={n.id} value={String(n.id)}>{n.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={divisionFiltro} onValueChange={setDivisionFiltro}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="size-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las divisiones</SelectItem>
                    {divisiones.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportar}>
                  <Download data-icon="inline-start" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>División</TableHead>
                  <TableHead>Rango de edad</TableHead>
                  <TableHead>Atletas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Cargando…</TableCell></TableRow>
                ) : visibles.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron categorías con los filtros aplicados.</TableCell></TableRow>
                ) : (
                  visibles.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell>{c.nivel.nombre}</TableCell>
                      <TableCell>{c.division.nombre}</TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {rangoLegible(c.añoNacimientoMin, c.añoNacimientoMax)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {rangoLegible(c.cantidadMin, c.cantidadMax)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.estadoCategoriaNivel.nombre}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">Mostrando {visibles.length} de {filtradas.length}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={paginaActual <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
              <span className="text-sm text-muted-foreground tabular-nums">Página {paginaActual} de {totalPaginas}</span>
              <Button variant="outline" size="sm" disabled={paginaActual >= totalPaginas} onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}>Siguiente</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}