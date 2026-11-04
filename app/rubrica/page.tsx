"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import { api, getErrorMessage } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Rúbrica de rutinas (United Scoring System / FEDECOLCHEER). Es GLOBAL: la ven todos los clubes y solo la plataforma
// (permiso configurar_rubrica) puede cambiarla.

interface Nivel { id: number; nombre: string; modalidad: string; activo: boolean }
interface SubCriterio { id: number; nombre: string; seccion: string; tipoCalculo: string }
interface FilaCantidad {
  id: number; nivel: { id: number }; tabla: string; unidad: string;
  rangoMinAtletas: number; rangoMaxAtletas: number; mayoria: number; granParte: number; maximo: number;
}
interface Escalon {
  id: number; nivel: { id: number }; subCriterio: { id: number; nombre: string }; orden: number; valorPuntaje: number;
  condicionHabilidadesDiferentes: number | null; condicionGrupoMinimo: string | null; descripcionRubrica: string | null;
}

const TABLAS = [
  { valor: "Construcciones", unidad: "grupos", etiqueta: "Construcciones (cuenta grupos)" },
  { valor: "Saltos_Gimnasia", unidad: "atletas", etiqueta: "Saltos y gimnasia (cuenta atletas)" },
];
const GRUPOS_MINIMOS = ["MAYORIA", "GRAN_PARTE", "MAXIMO"];

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));

function Contenido() {
  const { permissions } = useUser();
  const puedeEditar = permissions.includes("configurar_rubrica");

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [subCriterios, setSubCriterios] = useState<SubCriterio[]>([]);
  const [nivelId, setNivelId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState<FilaCantidad[]>([]);
  const [escalones, setEscalones] = useState<Escalon[]>([]);

  const [dNivel, setDNivel] = useState<Partial<Nivel> | null>(null);
  const [dCantidad, setDCantidad] = useState<Record<string, string> | null>(null);
  const [dEscalon, setDEscalon] = useState<Record<string, string> | null>(null);

  const cargarNiveles = useCallback(async () => {
    try {
      const [n, s] = await Promise.all([
        api.get<Nivel[]>("/api/rubrica-config/niveles"),
        api.get<SubCriterio[]>("/api/rubrica-config/sub-criterios"),
      ]);
      setNiveles(n.data);
      setSubCriterios(s.data);
      setNivelId((actual) => actual ?? n.data[0]?.id ?? null);
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo cargar la rúbrica"));
    }
  }, []);

  const cargarDetalle = useCallback(async () => {
    if (nivelId === null) return;
    try {
      const [c, e] = await Promise.all([
        api.get<FilaCantidad[]>(`/api/rubrica-config/tabla-cantidad/${nivelId}`),
        api.get<Escalon[]>(`/api/rubrica-config/topes-seccion/nivel/${nivelId}`),
      ]);
      setCantidad(c.data);
      setEscalones(e.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudo cargar el nivel"));
    }
  }, [nivelId]);

  useEffect(() => { cargarNiveles(); }, [cargarNiveles]);
  useEffect(() => { cargarDetalle(); }, [cargarDetalle]);

  const nivel = niveles.find((n) => n.id === nivelId) ?? null;

  const escalonesPorSubCriterio = useMemo(() => {
    const m = new Map<string, Escalon[]>();
    for (const e of escalones) {
      if (!m.has(e.subCriterio.nombre)) m.set(e.subCriterio.nombre, []);
      m.get(e.subCriterio.nombre)!.push(e);
    }
    return Array.from(m.entries());
  }, [escalones]);

  async function guardar(accion: () => Promise<unknown>, ok: string, cerrar: () => void, despues: () => Promise<void>) {
    try {
      await accion();
      toast.success(ok);
      cerrar();
      await despues();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo guardar"));
    }
  }

  async function borrar(url: string, pregunta: string, despues: () => Promise<void>) {
    if (!confirm(pregunta)) return;
    try {
      await api.delete(url);
      toast.success("Eliminado");
      await despues();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo eliminar"));
    }
  }

  // ---- niveles
  const guardarNivel = () =>
    guardar(
      () => (dNivel?.id ? api.put(`/api/rubrica-config/niveles/${dNivel.id}`, dNivel) : api.post("/api/rubrica-config/niveles", { activo: true, ...dNivel })),
      "Nivel guardado", () => setDNivel(null), cargarNiveles,
    );

  // ---- tabla de cantidad
  const abrirCantidad = (f?: FilaCantidad) =>
    setDCantidad(f
      ? { id: String(f.id), tabla: f.tabla, rangoMin: String(f.rangoMinAtletas), rangoMax: String(f.rangoMaxAtletas), mayoria: String(f.mayoria), granParte: String(f.granParte), maximo: String(f.maximo) }
      : { id: "", tabla: "Construcciones", rangoMin: "", rangoMax: "", mayoria: "", granParte: "", maximo: "" });
  const guardarCantidad = () => {
    if (!dCantidad || nivelId === null) return;
    const t = TABLAS.find((x) => x.valor === dCantidad.tabla)!;
    const cuerpo = {
      nivel: { id: nivelId }, tabla: t.valor, unidad: t.unidad,
      rangoMinAtletas: num(dCantidad.rangoMin), rangoMaxAtletas: num(dCantidad.rangoMax),
      mayoria: num(dCantidad.mayoria), granParte: num(dCantidad.granParte), maximo: num(dCantidad.maximo),
    };
    return guardar(
      () => (dCantidad.id ? api.put(`/api/rubrica-config/tabla-cantidad/${dCantidad.id}`, cuerpo) : api.post("/api/rubrica-config/tabla-cantidad", cuerpo)),
      "Fila guardada", () => setDCantidad(null), cargarDetalle,
    );
  };

  // ---- escalones
  const abrirEscalon = (e?: Escalon) =>
    setDEscalon(e
      ? { id: String(e.id), subCriterioId: String(e.subCriterio.id), orden: String(e.orden), valor: String(e.valorPuntaje), habilidades: e.condicionHabilidadesDiferentes === null ? "" : String(e.condicionHabilidadesDiferentes), grupo: e.condicionGrupoMinimo ?? "", descripcion: e.descripcionRubrica ?? "" }
      : { id: "", subCriterioId: "", orden: "", valor: "", habilidades: "", grupo: "", descripcion: "" });
  const guardarEscalon = () => {
    if (!dEscalon || nivelId === null) return;
    const cuerpo = {
      nivel: { id: nivelId }, subCriterio: { id: Number(dEscalon.subCriterioId) }, orden: num(dEscalon.orden),
      valorPuntaje: num(dEscalon.valor), condicionHabilidadesDiferentes: num(dEscalon.habilidades),
      condicionGrupoMinimo: dEscalon.grupo || null, descripcionRubrica: dEscalon.descripcion.trim() || null,
    };
    return guardar(
      () => (dEscalon.id ? api.put(`/api/rubrica-config/topes-seccion/${dEscalon.id}`, cuerpo) : api.post("/api/rubrica-config/topes-seccion", cuerpo)),
      "Escalón guardado", () => setDEscalon(null), cargarDetalle,
    );
  };

  const select = "h-9 w-full rounded-md border bg-background px-2 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rúbrica de rutinas</h1>
        <p className="text-muted-foreground">
          Niveles, tablas de cantidad y escalones de puntaje del United Scoring System (FEDECOLCHEER).{" "}
          {puedeEditar
            ? "Es la misma para todos los clubes: cualquier cambio aplica a las evaluaciones nuevas de todos."
            : "Es compartida por todos los clubes y solo la plataforma puede modificarla; aquí la ves como referencia."}
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Niveles</CardTitle>
            <CardDescription>Un nivel con configuración o evaluaciones no se elimina: se desactiva.</CardDescription>
          </div>
          {puedeEditar && <Button size="sm" onClick={() => setDNivel({ nombre: "", modalidad: "Elite", activo: true })}><Plus className="mr-1 h-4 w-4" />Nuevo nivel</Button>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {niveles.map((n) => (
              <div key={n.id} className="flex items-center gap-1">
                <Button variant={n.id === nivelId ? "default" : "outline"} size="sm" onClick={() => setNivelId(n.id)}>
                  {n.nombre} <span className="ml-1 text-xs opacity-70">{n.modalidad}</span>
                  {!n.activo && <Badge variant="secondary" className="ml-2">Inactivo</Badge>}
                </Button>
                {puedeEditar && <Button size="icon" variant="ghost" aria-label={`Editar ${n.nombre}`} onClick={() => setDNivel(n)}><Pencil className="h-4 w-4" /></Button>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {nivel && (
        <>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Tabla de cantidad · {nivel.nombre}</CardTitle>
                <CardDescription>Según el número de atletas, cuántos grupos (o atletas) cuentan como mayoría, gran parte y máximo.</CardDescription>
              </div>
              {puedeEditar && <Button size="sm" onClick={() => abrirCantidad()}><Plus className="mr-1 h-4 w-4" />Agregar fila</Button>}
            </CardHeader>
            <CardContent>
              {cantidad.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este nivel no tiene filas de cantidad.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabla</TableHead><TableHead>Unidad</TableHead><TableHead>Atletas</TableHead>
                      <TableHead className="text-right">Mayoría</TableHead><TableHead className="text-right">Gran parte</TableHead><TableHead className="text-right">Máximo</TableHead>
                      {puedeEditar && <TableHead className="w-24" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...cantidad].sort((a, b) => a.tabla.localeCompare(b.tabla) || a.rangoMinAtletas - b.rangoMinAtletas).map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>{f.tabla.replace("_", " / ")}</TableCell><TableCell>{f.unidad}</TableCell>
                        <TableCell>{f.rangoMinAtletas}–{f.rangoMaxAtletas}</TableCell>
                        <TableCell className="text-right">{f.mayoria}</TableCell><TableCell className="text-right">{f.granParte}</TableCell><TableCell className="text-right">{f.maximo}</TableCell>
                        {puedeEditar && (
                          <TableCell className="flex gap-1">
                            <Button size="icon" variant="ghost" aria-label="Editar fila" onClick={() => abrirCantidad(f)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" aria-label="Eliminar fila" onClick={() => borrar(`/api/rubrica-config/tabla-cantidad/${f.id}`, "¿Eliminar esta fila de la tabla de cantidad?", cargarDetalle)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Escalones de puntaje · {nivel.nombre}</CardTitle>
                <CardDescription>El cálculo toma el escalón más alto cuyas condiciones se cumplan. Las fórmulas viven en el código; aquí se editan los valores.</CardDescription>
              </div>
              {puedeEditar && <Button size="sm" onClick={() => abrirEscalon()}><Plus className="mr-1 h-4 w-4" />Agregar escalón</Button>}
            </CardHeader>
            <CardContent className="space-y-5">
              {escalonesPorSubCriterio.length === 0 && <p className="text-sm text-muted-foreground">Este nivel no tiene escalones configurados.</p>}
              {escalonesPorSubCriterio.map(([nombre, lista]) => (
                <div key={nombre}>
                  <h3 className="mb-1 text-sm font-semibold">{nombre}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Orden</TableHead><TableHead className="w-20 text-right">Valor</TableHead>
                        <TableHead className="w-28">Habilidades</TableHead><TableHead className="w-32">Grupo mínimo</TableHead><TableHead>Rúbrica</TableHead>
                        {puedeEditar && <TableHead className="w-24" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lista.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.orden}</TableCell><TableCell className="text-right font-medium">{Number(e.valorPuntaje).toFixed(2)}</TableCell>
                          <TableCell>{e.condicionHabilidadesDiferentes ?? "—"}</TableCell><TableCell>{e.condicionGrupoMinimo ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{e.descripcionRubrica ?? ""}</TableCell>
                          {puedeEditar && (
                            <TableCell className="flex gap-1">
                              <Button size="icon" variant="ghost" aria-label="Editar escalón" onClick={() => abrirEscalon(e)}><Pencil className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" aria-label="Eliminar escalón" onClick={() => borrar(`/api/rubrica-config/topes-seccion/${e.id}`, "¿Eliminar este escalón?", cargarDetalle)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sub-criterios</CardTitle>
          <CardDescription>Solo lectura. Un sub-criterio nuevo necesita además su calculadora en el código.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Sección</TableHead><TableHead>Tipo de cálculo</TableHead></TableRow></TableHeader>
            <TableBody>
              {subCriterios.map((s) => (
                <TableRow key={s.id}><TableCell>{s.nombre}</TableCell><TableCell>{s.seccion}</TableCell><TableCell className="font-mono text-xs">{s.tipoCalculo}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Nivel */}
      <Dialog open={dNivel !== null} onOpenChange={(o) => !o && setDNivel(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{dNivel?.id ? "Editar nivel" : "Nuevo nivel"}</DialogTitle><DialogDescription>Ej.: N5, Prep 1.1, Novice Tiny.</DialogDescription></DialogHeader>
          {dNivel && (
            <div className="space-y-3">
              <div><Label htmlFor="n-nombre">Nombre</Label><Input id="n-nombre" maxLength={50} value={dNivel.nombre ?? ""} onChange={(e) => setDNivel({ ...dNivel, nombre: e.target.value })} /></div>
              <div><Label htmlFor="n-mod">Modalidad</Label><Input id="n-mod" maxLength={50} value={dNivel.modalidad ?? ""} onChange={(e) => setDNivel({ ...dNivel, modalidad: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dNivel.activo ?? true} onChange={(e) => setDNivel({ ...dNivel, activo: e.target.checked })} />Activo (aparece al evaluar)</label>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDNivel(null)}>Cancelar</Button><Button onClick={guardarNivel} disabled={!dNivel?.nombre?.trim() || !dNivel?.modalidad?.trim()}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabla de cantidad */}
      <Dialog open={dCantidad !== null} onOpenChange={(o) => !o && setDCantidad(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{dCantidad?.id ? "Editar fila" : "Nueva fila"} · {nivel?.nombre}</DialogTitle><DialogDescription>Debe cumplirse mayoría ≤ gran parte ≤ máximo, y los rangos de una misma tabla no pueden cruzarse.</DialogDescription></DialogHeader>
          {dCantidad && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label htmlFor="c-tabla">Tabla</Label>
                <select id="c-tabla" className={select} value={dCantidad.tabla} onChange={(e) => setDCantidad({ ...dCantidad, tabla: e.target.value })}>
                  {TABLAS.map((t) => (<option key={t.valor} value={t.valor}>{t.etiqueta}</option>))}
                </select></div>
              {([["rangoMin", "Atletas desde"], ["rangoMax", "Atletas hasta"], ["mayoria", "Mayoría"], ["granParte", "Gran parte"], ["maximo", "Máximo"]] as const).map(([k, et]) => (
                <div key={k}><Label htmlFor={`c-${k}`}>{et}</Label><Input id={`c-${k}`} type="number" min={1} value={dCantidad[k]} onChange={(e) => setDCantidad({ ...dCantidad, [k]: e.target.value })} /></div>
              ))}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDCantidad(null)}>Cancelar</Button><Button onClick={guardarCantidad}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalón */}
      <Dialog open={dEscalon !== null} onOpenChange={(o) => !o && setDEscalon(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{dEscalon?.id ? "Editar escalón" : "Nuevo escalón"} · {nivel?.nombre}</DialogTitle><DialogDescription>El orden 1 es el escalón más bajo; no puede repetirse dentro del mismo sub-criterio.</DialogDescription></DialogHeader>
          {dEscalon && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label htmlFor="s-sub">Sub-criterio</Label>
                <select id="s-sub" className={select} value={dEscalon.subCriterioId} disabled={!!dEscalon.id} onChange={(e) => setDEscalon({ ...dEscalon, subCriterioId: e.target.value })}>
                  <option value="">Elige uno</option>
                  {subCriterios.map((s) => (<option key={s.id} value={s.id}>{s.nombre}</option>))}
                </select></div>
              <div><Label htmlFor="s-orden">Orden</Label><Input id="s-orden" type="number" min={1} value={dEscalon.orden} onChange={(e) => setDEscalon({ ...dEscalon, orden: e.target.value })} /></div>
              <div><Label htmlFor="s-valor">Valor (0–10)</Label><Input id="s-valor" type="number" min={0} max={10} step={0.1} value={dEscalon.valor} onChange={(e) => setDEscalon({ ...dEscalon, valor: e.target.value })} /></div>
              <div><Label htmlFor="s-hab">Habilidades diferentes</Label><Input id="s-hab" type="number" min={1} value={dEscalon.habilidades} onChange={(e) => setDEscalon({ ...dEscalon, habilidades: e.target.value })} /></div>
              <div><Label htmlFor="s-grupo">Grupo mínimo</Label>
                <select id="s-grupo" className={select} value={dEscalon.grupo} onChange={(e) => setDEscalon({ ...dEscalon, grupo: e.target.value })}>
                  <option value="">—</option>{GRUPOS_MINIMOS.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select></div>
              <div className="col-span-2"><Label htmlFor="s-desc">Texto de la rúbrica (opcional)</Label><Input id="s-desc" maxLength={500} value={dEscalon.descripcion} onChange={(e) => setDEscalon({ ...dEscalon, descripcion: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDEscalon(null)}>Cancelar</Button><Button onClick={guardarEscalon} disabled={!dEscalon?.subCriterioId || !dEscalon?.orden || dEscalon?.valor === ""}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RubricaPage() {
  return (
    <ProtectedRoute requiredPermission="ver_evaluacion">
      <Contenido />
    </ProtectedRoute>
  );
}
