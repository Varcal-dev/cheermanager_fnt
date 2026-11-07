"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useUser } from "@/context/UserContext";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PUNTAJE_MAXIMO, claseNota, hoyLocal, type Criterio, type EvaluacionFila, type Grupo, type Pagina } from "@/app/lib/evaluaciones";

const TAMANO = 25;

// Columnas por las que se puede ordenar (el orden lo aplica el servidor, así vale para todas las páginas).
type Orden = "fecha" | "deportista" | "categoria" | "criterio" | "puntaje";
type Direccion = "asc" | "desc";

export default function HistorialTab({ grupos, criterios }: { grupos: Grupo[]; criterios: Criterio[] }) {
  const { permissions } = useUser();
  const puedeEditar = permissions.includes("modificar_evaluacion");
  const puedeEliminar = permissions.includes("eliminar_evaluacion");

  const [grupoId, setGrupoId] = useState("");
  const [criterioId, setCriterioId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [texto, setTexto] = useState("");
  const [textoAplicado, setTextoAplicado] = useState("");
  const [pagina, setPagina] = useState(0);
  const [orden, setOrden] = useState<Orden>("fecha");
  const [direccion, setDireccion] = useState<Direccion>("desc");
  const [datos, setDatos] = useState<Pagina | null>(null);
  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState<EvaluacionFila | null>(null);
  const [puntaje, setPuntaje] = useState("");
  const [fecha, setFecha] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params: Record<string, string | number> = { pagina, tamano: TAMANO, orden, direccion };
      if (grupoId) params.grupoId = grupoId;
      if (criterioId) params.criterioId = criterioId;
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      if (textoAplicado) params.texto = textoAplicado;
      const { data } = await api.get<Pagina>("/api/evaluaciones/buscar", { params });
      setDatos(data);
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudieron cargar las evaluaciones"));
    } finally {
      setCargando(false);
    }
  }, [grupoId, criterioId, desde, hasta, textoAplicado, pagina, orden, direccion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function filtrar<T>(set: (v: T) => void, v: T) {
    set(v);
    setPagina(0);
  }

  // Mismo criterio: invierte la dirección. Otro criterio: fecha empieza por lo más reciente; el resto de A a Z / menor a mayor.
  function ordenarPor(clave: Orden) {
    if (clave === orden) {
      setDireccion(direccion === "asc" ? "desc" : "asc");
    } else {
      setOrden(clave);
      setDireccion(clave === "fecha" ? "desc" : "asc");
    }
    setPagina(0);
  }

  // Función (no componente) para que no se vuelva a montar en cada render y el botón conserve el foco.
  function encabezado(clave: Orden, titulo: string, derecha?: boolean) {
    const activo = orden === clave;
    const Icono = !activo ? ArrowUpDown : direccion === "asc" ? ArrowUp : ArrowDown;
    return (
      <TableHead
        key={clave}
        className={derecha ? "text-right" : undefined}
        aria-sort={activo ? (direccion === "asc" ? "ascending" : "descending") : "none"}
      >
        <button
          type="button"
          onClick={() => ordenarPor(clave)}
          className={`inline-flex items-center gap-1 hover:text-foreground ${derecha ? "justify-end" : ""} ${activo ? "text-foreground" : ""}`}
          title={`Ordenar por ${titulo.toLowerCase()}`}
        >
          {titulo}
          <Icono className={`h-3.5 w-3.5 ${activo ? "" : "opacity-40"}`} />
        </button>
      </TableHead>
    );
  }

  function abrirEdicion(e: EvaluacionFila) {
    setEditando(e);
    setPuntaje(String(e.puntajeObtenido));
    setFecha(e.fecha);
  }

  async function guardar() {
    if (!editando) return;
    try {
      await api.put(`/api/evaluaciones/${editando.id}`, { puntajeObtenido: Number(puntaje), fecha });
      toast.success("Evaluación corregida");
      setEditando(null);
      await cargar();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo corregir la evaluación"));
    }
  }

  async function eliminar(e: EvaluacionFila) {
    if (!confirm(`¿Eliminar la evaluación de ${e.nombreDeportista} en "${e.nombreCriterio}"? No se puede deshacer.`)) return;
    try {
      await api.delete(`/api/evaluaciones/${e.id}`);
      toast.success("Evaluación eliminada");
      await cargar();
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo eliminar"));
    }
  }

  const puntajeValido = puntaje !== "" && Number.isInteger(Number(puntaje)) && Number(puntaje) >= 0 && Number(puntaje) <= PUNTAJE_MAXIMO;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div>
            <Label htmlFor="h-grupo">Grupo</Label>
            <select id="h-grupo" className="h-9 rounded-md border bg-background px-2 text-sm" value={grupoId}
              onChange={(e) => filtrar(setGrupoId, e.target.value)}>
              <option value="">Todos</option>
              {grupos.map((g) => (<option key={g.id} value={g.id}>{g.nombre}</option>))}
            </select>
          </div>
          <div>
            <Label htmlFor="h-criterio">Criterio</Label>
            <select id="h-criterio" className="h-9 rounded-md border bg-background px-2 text-sm" value={criterioId}
              onChange={(e) => filtrar(setCriterioId, e.target.value)}>
              <option value="">Todos</option>
              {criterios.map((c) => (<option key={c.id} value={c.id}>{c.categoria} · {c.nombre}</option>))}
            </select>
          </div>
          <div>
            <Label htmlFor="h-desde">Desde</Label>
            <Input id="h-desde" type="date" value={desde} onChange={(e) => filtrar(setDesde, e.target.value)} />
          </div>
          <div>
            <Label htmlFor="h-hasta">Hasta</Label>
            <Input id="h-hasta" type="date" value={hasta} onChange={(e) => filtrar(setHasta, e.target.value)} />
          </div>
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); setTextoAplicado(texto); setPagina(0); }}>
            <div>
              <Label htmlFor="h-texto">Deportista</Label>
              <Input id="h-texto" placeholder="Nombre o apellido" value={texto} onChange={(e) => setTexto(e.target.value)} />
            </div>
            <Button type="submit" variant="outline">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      {datos && datos.contenido.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay evaluaciones con estos filtros.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {encabezado("fecha", "Fecha")}
              {encabezado("deportista", "Deportista")}
              {encabezado("categoria", "Categoría")}
              {encabezado("criterio", "Criterio")}
              {encabezado("puntaje", "Puntaje", true)}
              {(puedeEditar || puedeEliminar) && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {datos?.contenido.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.fecha}</TableCell>
                <TableCell>{e.nombreDeportista}</TableCell>
                <TableCell>{e.categoria}</TableCell>
                <TableCell>{e.nombreCriterio}</TableCell>
                <TableCell className={`text-right font-medium ${claseNota(e.puntajeObtenido)}`}>{e.puntajeObtenido}/{PUNTAJE_MAXIMO}</TableCell>
                {(puedeEditar || puedeEliminar) && (
                  <TableCell className="flex gap-1">
                    {puedeEditar && (
                      <Button size="icon" variant="ghost" aria-label="Corregir" onClick={() => abrirEdicion(e)}><Pencil className="h-4 w-4" /></Button>
                    )}
                    {puedeEliminar && (
                      <Button size="icon" variant="ghost" aria-label="Eliminar" onClick={() => eliminar(e)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {datos && datos.totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{datos.total} evaluaciones · página {datos.pagina + 1} de {datos.totalPaginas}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagina === 0 || cargando} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={pagina + 1 >= datos.totalPaginas || cargando} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      <Dialog open={editando !== null} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Corregir evaluación</DialogTitle>
          </DialogHeader>
          {editando && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{editando.nombreDeportista} · {editando.nombreCriterio}</p>
              <div>
                <Label htmlFor="e-puntaje">Puntaje (0–{PUNTAJE_MAXIMO})</Label>
                <Input id="e-puntaje" type="number" min={0} max={PUNTAJE_MAXIMO} step={1} value={puntaje} onChange={(e) => setPuntaje(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="e-fecha">Fecha</Label>
                <Input id="e-fecha" type="date" max={hoyLocal()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={guardar} disabled={!puntajeValido || !fecha}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}