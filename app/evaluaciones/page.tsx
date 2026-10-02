"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, ArrowLeft, Eye, Trophy, Info } from "lucide-react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import {
  GrupoOpcion,
  NivelCompetencia,
  SubCriterioRubrica,
  DriverSubCriterio,
  EscalonDriverNivel,
  TopeSeccionNivel,
  TopeDriverNivel,
  Seccion,
  GrupoMinimo,
  ETIQUETA_GRUPO_MINIMO,
  SECCIONES,
  RegistroSubCriterioInput,
  DriverConstruccionInput,
  EvaluacionRutinaInput,
  EvaluacionRutinaResultado,
  listarGrupos,
  listarNiveles,
  listarSubCriterios,
  listarDrivers,
  listarEscalonesDriver,
  listarTopesSeccion,
  obtenerTopeDriver,
  previsualizarEvaluacion,
  guardarEvaluacion,
  listarEvaluacionesPorGrupo,
  eliminarEvaluacion,
} from "@/app/lib/evaluacion-rutina";
import {
  driversSugeridos,
  guiaGeneral,
  NIVELES_DEDUCCION,
} from "@/app/lib/rubrica-guia";

const ETIQUETA_SECCION: Record<Seccion, string> = {
  Construcciones: "Construcciones",
  Gimnasia: "Gimnasia",
  Ejecucion: "Ejecución",
  General: "General",
};

// Heurística para pre-cargar el valor inicial de Ejecución (4.0 o 2.0) según
// el nombre del sub-criterio, ya que el backend no lo expone como config —
// queda editable por si el juez necesita corregirlo.
function valorInicialSugerido(nombre: string): number {
  const n = nombre.toLowerCase();
  return n.includes("lanzamiento") || n.includes("salto") ? 2.0 : 4.0;
}

function registroVacio(sc: SubCriterioRubrica): RegistroSubCriterioInput {
  switch (sc.tipoCalculo) {
    case "VALOR_INICIAL_MENOS_DRIVERS":
      return {
        subCriterioId: sc.id,
        puntajeFinalManual: valorInicialSugerido(sc.nombre),
        deducciones: [],
      };
    case "RANGO_DIRECTO_JUEZ":
      return { subCriterioId: sc.id, puntajeFinalManual: undefined };
    case "ESCALON_CANTIDAD_SIMPLE":
      return { subCriterioId: sc.id, habilidadesDiferentes: undefined, grupoMinimoAlcanzado: undefined };
    case "ESCALON_GIMNASIA":
      return { subCriterioId: sc.id, grupoMinimoAlcanzado: undefined, driversConstruccion: [] };
    case "ESCALON_HABILIDADES_GRUPOS":
    default:
      return {
        subCriterioId: sc.id,
        habilidadesDiferentes: undefined,
        grupoMinimoAlcanzado: undefined,
        driversConstruccion: [],
      };
  }
}

export default function EvaluacionRutinaPage() {
  const { permissions } = useUser();
  const puedeEliminar = permissions.includes("eliminar_evaluacion");

  const [modo, setModo] = useState<"lista" | "captura">("lista");

  // ---------- Modo lista ----------
  const [grupos, setGrupos] = useState<GrupoOpcion[]>([]);
  const [grupoListaId, setGrupoListaId] = useState<string>("");
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionRutinaResultado[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [detalle, setDetalle] = useState<EvaluacionRutinaResultado | null>(null);

  useEffect(() => {
    listarGrupos()
      .then(setGrupos)
      .catch(() => toast.error("No se pudieron cargar los grupos"));
  }, []);

  useEffect(() => {
    if (!grupoListaId) {
      setEvaluaciones([]);
      return;
    }
    setCargandoLista(true);
    listarEvaluacionesPorGrupo(Number(grupoListaId))
      .then(setEvaluaciones)
      .catch(() => toast.error("No se pudieron cargar las evaluaciones de este grupo"))
      .finally(() => setCargandoLista(false));
  }, [grupoListaId]);

  const recargarLista = () => {
    if (grupoListaId) {
      listarEvaluacionesPorGrupo(Number(grupoListaId)).then(setEvaluaciones);
    }
  };

  const borrar = (id: number) => {
    if (!confirm("¿Eliminar esta evaluación? Esta acción no se puede deshacer.")) return;
    eliminarEvaluacion(id)
      .then(() => {
        toast.success("Evaluación eliminada");
        recargarLista();
      })
      .catch(() => toast.error("No se pudo eliminar la evaluación"));
  };

  // ---------- Modo captura ----------
  const [niveles, setNiveles] = useState<NivelCompetencia[]>([]);
  const [subCriterios, setSubCriterios] = useState<SubCriterioRubrica[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);

  const [grupoId, setGrupoId] = useState("");
  const [nivelId, setNivelId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [evento, setEvento] = useState("");
  const [cantidadAtletas, setCantidadAtletas] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [registros, setRegistros] = useState<Record<number, RegistroSubCriterioInput>>({});

  const [previsualizando, setPrevisualizando] = useState(false);
  const [resultadoPreview, setResultadoPreview] = useState<EvaluacionRutinaResultado | null>(null);
  const [guardando, setGuardando] = useState(false);

  const iniciarCaptura = () => {
    setModo("captura");
    if (subCriterios.length === 0) {
      setCargandoCatalogos(true);
      Promise.all([listarNiveles(), listarSubCriterios()])
        .then(([n, sc]) => {
          setNiveles(n);
          setSubCriterios(sc);
          const iniciales: Record<number, RegistroSubCriterioInput> = {};
          sc.forEach((s) => (iniciales[s.id] = registroVacio(s)));
          setRegistros(iniciales);
        })
        .catch(() => toast.error("No se pudo cargar la configuración de la rúbrica"))
        .finally(() => setCargandoCatalogos(false));
    }
  };

  const cancelarCaptura = () => {
    setModo("lista");
    setResultadoPreview(null);
    setGrupoId("");
    setNivelId("");
    setEvento("");
    setCantidadAtletas("");
    setObservaciones("");
  };

  const actualizarRegistro = (subCriterioId: number, patch: Partial<RegistroSubCriterioInput>) => {
    setRegistros((prev) => ({
      ...prev,
      [subCriterioId]: { ...prev[subCriterioId], ...patch },
    }));
  };

  const subCriteriosPorSeccion = useMemo(() => {
    const mapa: Record<string, SubCriterioRubrica[]> = {};
    SECCIONES.forEach((s) => (mapa[s] = []));
    subCriterios.forEach((sc) => {
      if (!mapa[sc.seccion]) mapa[sc.seccion] = [];
      mapa[sc.seccion].push(sc);
    });
    return mapa;
  }, [subCriterios]);

  const contextoCompleto = grupoId && nivelId && cantidadAtletas && evento && fecha;

  const construirDTO = (): EvaluacionRutinaInput => ({
    grupoId: Number(grupoId),
    nivelId: Number(nivelId),
    fecha,
    evento,
    cantidadAtletas: Number(cantidadAtletas),
    observaciones: observaciones || undefined,
    registros: Object.values(registros),
  });

  const revisar = () => {
    setPrevisualizando(true);
    previsualizarEvaluacion(construirDTO())
      .then(setResultadoPreview)
      .catch((err) => {
        const msg = err?.response?.data ?? "No se pudo calcular la evaluación. Revisa los datos ingresados.";
        toast.error(typeof msg === "string" ? msg : "No se pudo calcular la evaluación.");
      })
      .finally(() => setPrevisualizando(false));
  };

  const confirmarGuardado = () => {
    setGuardando(true);
    guardarEvaluacion(construirDTO())
      .then(() => {
        toast.success("Evaluación guardada");
        setResultadoPreview(null);
        cancelarCaptura();
        setGrupoListaId(String(construirDTO().grupoId));
      })
      .catch((err) => {
        const msg = err?.response?.data ?? "No se pudo guardar la evaluación.";
        toast.error(typeof msg === "string" ? msg : "No se pudo guardar la evaluación.");
      })
      .finally(() => setGuardando(false));
  };

  return (
    <ProtectedRoute requiredPermission="ver_evaluaciones">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Evaluación de rutina</h1>
            <p className="text-muted-foreground">
              Rúbrica United Scoring System (FEDECOLCHEER 2026) por grupo
            </p>
          </div>
          {modo === "lista" ? (
            <Button onClick={iniciarCaptura}>
              <Plus className="h-4 w-4 mr-2" /> Nueva evaluación
            </Button>
          ) : (
            <Button variant="outline" onClick={cancelarCaptura}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver al listado
            </Button>
          )}
        </div>

        {modo === "lista" && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico por grupo</CardTitle>
              <CardDescription>Selecciona un grupo para ver sus evaluaciones registradas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={grupoListaId} onValueChange={setGrupoListaId}>
                <SelectTrigger className="w-72">
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

              {cargandoLista ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
                </div>
              ) : !grupoListaId ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Elige un grupo para ver su histórico.
                </p>
              ) : evaluaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Este grupo todavía no tiene evaluaciones de rutina registradas.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead className="text-right">Puntaje</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluaciones.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell>{new Date(ev.fecha).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{ev.evento}</TableCell>
                        <TableCell className="text-muted-foreground">{ev.nivel}</TableCell>
                        <TableCell className="text-right font-bold">
                          {ev.puntajeTotal.toFixed(2)}
                        </TableCell>
                        <TableCell className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => setDetalle(ev)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {puedeEliminar && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => ev.id && borrar(ev.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {modo === "captura" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>1. Contexto de la evaluación</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <Label>Nivel de competencia</Label>
                  <Select value={nivelId} onValueChange={setNivelId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {niveles.map((n) => (
                        <SelectItem key={n.id} value={String(n.id)}>
                          {n.nombre} ({n.modalidad})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Cantidad de atletas</Label>
                  <Input
                    type="number"
                    min={1}
                    value={cantidadAtletas}
                    onChange={(e) => setCantidadAtletas(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha</Label>
                  <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Evento</Label>
                  <Input
                    placeholder="Ej. Práctica interna, Nacional FEDECOLCHEER 2026…"
                    value={evento}
                    onChange={(e) => setEvento(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label>Observaciones (opcional)</Label>
                  <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {cargandoCatalogos ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando la rúbrica…
              </div>
            ) : !contextoCompleto ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Completa el contexto de arriba para habilitar la captura por sección.
              </p>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>2. Captura por sección</CardTitle>
                  <CardDescription>Ingresa lo que tengas anotado en la hoja del juez</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" defaultValue={SECCIONES}>
                    {SECCIONES.map((seccion) => (
                      <AccordionItem key={seccion} value={seccion}>
                        <AccordionTrigger>{ETIQUETA_SECCION[seccion]}</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {(subCriteriosPorSeccion[seccion] || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No hay sub-criterios configurados en esta sección.
                            </p>
                          ) : (
                            subCriteriosPorSeccion[seccion].map((sc) => (
                              <SubCriterioFormRow
                                key={sc.id}
                                subCriterio={sc}
                                nivelId={Number(nivelId)}
                                valor={registros[sc.id]}
                                onChange={(patch) => actualizarRegistro(sc.id, patch)}
                              />
                            ))
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <div className="flex justify-end mt-6">
                    <Button onClick={revisar} disabled={previsualizando}>
                      {previsualizando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Revisar cálculo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Diálogo de revisión antes de guardar */}
        <Dialog open={resultadoPreview !== null} onOpenChange={(open) => !open && setResultadoPreview(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Revisar antes de guardar</DialogTitle>
            </DialogHeader>
            {resultadoPreview && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {resultadoPreview.nombreGrupo} · {resultadoPreview.nivel} · {resultadoPreview.evento}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Compara este total contra la hoja de papel antes de confirmar.
                    </p>
                  </div>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-primary" />
                    {resultadoPreview.puntajeTotal.toFixed(2)}
                  </div>
                </div>

                {SECCIONES.map((seccion) => {
                  const filas = resultadoPreview.registros.filter((r) => r.seccion === seccion);
                  if (filas.length === 0) return null;
                  const subtotal = filas.reduce((acc, r) => acc + r.puntajeFinal, 0);
                  return (
                    <div key={seccion}>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium">{ETIQUETA_SECCION[seccion]}</h4>
                        <span className="text-sm text-muted-foreground">{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="space-y-1.5">
                        {filas.map((r, i) => (
                          <div key={i} className="text-sm border-b pb-1.5 last:border-0">
                            <div className="flex items-center justify-between">
                              <span>{r.nombreSubCriterio}</span>
                              <span className="font-medium">{r.puntajeFinal.toFixed(2)}</span>
                            </div>
                            {r.detalleCalculo && (
                              <p className="text-xs text-muted-foreground">{r.detalleCalculo}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setResultadoPreview(null)}>
                Corregir
              </Button>
              <Button onClick={confirmarGuardado} disabled={guardando}>
                {guardando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar evaluación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detalle de una evaluación ya guardada (desde el listado) */}
        <Dialog open={detalle !== null} onOpenChange={(open) => !open && setDetalle(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {detalle?.evento} — {detalle && new Date(detalle.fecha).toLocaleDateString()}
              </DialogTitle>
            </DialogHeader>
            {detalle && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                  <span className="text-sm text-muted-foreground">
                    {detalle.nombreGrupo} · {detalle.nivel}
                  </span>
                  <span className="text-2xl font-bold">{detalle.puntajeTotal.toFixed(2)}</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sub-criterio</TableHead>
                      <TableHead>Sección</TableHead>
                      <TableHead className="text-right">Puntaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalle.registros.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.nombreSubCriterio}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {ETIQUETA_SECCION[r.seccion]}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {r.puntajeFinal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {detalle.observaciones && (
                  <p className="text-sm text-muted-foreground">{detalle.observaciones}</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Una fila de captura por sub-criterio — el input que se muestra cambia
// según subCriterio.tipoCalculo, siguiendo exactamente lo que cada
// CalculadoraSubCriterio del backend realmente lee.
// ─────────────────────────────────────────────────────────────────────────

// Muestra los escalones de puntaje configurados (TopeSeccionNivel) como
// referencia rápida mientras se digita — misma tabla que ya usa el backend
// para calcular, así que nunca se desincroniza de lo que realmente aplica.
function GuiaEscalones({ nivelId, subCriterioId }: { nivelId: number; subCriterioId: number }) {
  const [escalones, setEscalones] = useState<TopeSeccionNivel[] | null>(null);

  useEffect(() => {
    listarTopesSeccion(nivelId, subCriterioId)
      .then((data) => setEscalones([...data].sort((a, b) => a.orden - b.orden)))
      .catch(() => setEscalones([]));
  }, [nivelId, subCriterioId]);

  if (!escalones || escalones.length === 0) return null;

  return (
    <details className="text-xs text-muted-foreground rounded-md border border-dashed p-2">
      <summary className="cursor-pointer flex items-center gap-1 font-medium select-none">
        <Info className="h-3 w-3" /> Ver escalones de puntaje de la rúbrica
      </summary>
      <ul className="mt-2 space-y-1">
        {escalones.map((e) => (
          <li key={e.id}>
            <span className="font-semibold text-foreground">{e.valorPuntaje}</span>{" "}
            {e.descripcionRubrica ?? "(sin descripción)"}
          </li>
        ))}
      </ul>
    </details>
  );
}

function GuiaDeduccion() {
  return (
    <details className="text-xs text-muted-foreground rounded-md border border-dashed p-2">
      <summary className="cursor-pointer flex items-center gap-1 font-medium select-none">
        <Info className="h-3 w-3" /> ¿Qué significa cada nivel de deducción?
      </summary>
      <ul className="mt-2 space-y-1">
        {NIVELES_DEDUCCION.map((n) => (
          <li key={n.valor}>
            <span className="font-semibold text-foreground">{n.valor}</span> — {n.etiqueta}:{" "}
            {n.descripcion}
          </li>
        ))}
      </ul>
    </details>
  );
}

function SubCriterioFormRow({
  subCriterio,
  nivelId,
  valor,
  onChange,
}: {
  subCriterio: SubCriterioRubrica;
  nivelId: number;
  valor: RegistroSubCriterioInput | undefined;
  onChange: (patch: Partial<RegistroSubCriterioInput>) => void;
}) {
  if (!valor) return null;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="font-medium text-sm">{subCriterio.nombre}</p>

      {subCriterio.tipoCalculo === "RANGO_DIRECTO_JUEZ" && (
        <div className="space-y-2">
          {(() => {
            const guia = guiaGeneral(subCriterio.nombre);
            return guia ? (
              <p className="text-xs text-muted-foreground rounded-md border border-dashed p-2">
                <span className="font-semibold text-foreground">Rango válido: {guia.rango}.</span>{" "}
                {guia.texto}
              </p>
            ) : (
              <GuiaEscalones nivelId={nivelId} subCriterioId={subCriterio.id} />
            );
          })()}
          <div className="max-w-xs space-y-1.5">
            <Label className="text-xs">Puntaje asignado por el juez</Label>
            <Input
              type="number"
              step="0.1"
              value={valor.puntajeFinalManual ?? ""}
              onChange={(e) =>
                onChange({ puntajeFinalManual: e.target.value === "" ? undefined : Number(e.target.value) })
              }
            />
          </div>
        </div>
      )}

      {subCriterio.tipoCalculo === "VALOR_INICIAL_MENOS_DRIVERS" && (
        <ValorInicialMenosDriversForm nombreSubCriterio={subCriterio.nombre} valor={valor} onChange={onChange} />
      )}

      {subCriterio.tipoCalculo === "ESCALON_CANTIDAD_SIMPLE" && (
        <div className="space-y-3">
          <GuiaEscalones nivelId={nivelId} subCriterioId={subCriterio.id} />
          <div className="grid gap-3 sm:grid-cols-2 max-w-md">
            <div className="space-y-1.5">
              <Label className="text-xs">Habilidades diferentes</Label>
              <Input
                type="number"
                min={0}
                value={valor.habilidadesDiferentes ?? ""}
                onChange={(e) =>
                  onChange({
                    habilidadesDiferentes: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </div>
            <GrupoMinimoSelect valor={valor} onChange={onChange} />
          </div>
        </div>
      )}

      {subCriterio.tipoCalculo === "ESCALON_GIMNASIA" && (
        <div className="space-y-3">
          <GuiaEscalones nivelId={nivelId} subCriterioId={subCriterio.id} />
          <div className="max-w-xs">
            <GrupoMinimoSelect valor={valor} onChange={onChange} />
          </div>
          <DriversConstruccionForm
            subCriterioId={subCriterio.id}
            nivelId={nivelId}
            valor={valor}
            onChange={onChange}
          />
        </div>
      )}

      {subCriterio.tipoCalculo === "ESCALON_HABILIDADES_GRUPOS" && (
        <div className="space-y-3">
          <GuiaEscalones nivelId={nivelId} subCriterioId={subCriterio.id} />
          <div className="grid gap-3 sm:grid-cols-2 max-w-md">
            <div className="space-y-1.5">
              <Label className="text-xs">Habilidades diferentes</Label>
              <Input
                type="number"
                min={0}
                value={valor.habilidadesDiferentes ?? ""}
                onChange={(e) =>
                  onChange({
                    habilidadesDiferentes: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
              />
            </div>
            <GrupoMinimoSelect valor={valor} onChange={onChange} />
          </div>
          <DriversConstruccionForm
            subCriterioId={subCriterio.id}
            nivelId={nivelId}
            valor={valor}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
}

function GrupoMinimoSelect({
  valor,
  onChange,
}: {
  valor: RegistroSubCriterioInput;
  onChange: (patch: Partial<RegistroSubCriterioInput>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Nivel de sincronía alcanzado</Label>
      <Select
        value={valor.grupoMinimoAlcanzado ?? ""}
        onValueChange={(v) => onChange({ grupoMinimoAlcanzado: v as GrupoMinimo })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona…" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ETIQUETA_GRUPO_MINIMO) as GrupoMinimo[]).map((g) => (
            <SelectItem key={g} value={g}>
              {ETIQUETA_GRUPO_MINIMO[g]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Ejecución: valor inicial (4.0 o 2.0, editable) - deducciones por driver.
function ValorInicialMenosDriversForm({
  nombreSubCriterio,
  valor,
  onChange,
}: {
  nombreSubCriterio: string;
  valor: RegistroSubCriterioInput;
  onChange: (patch: Partial<RegistroSubCriterioInput>) => void;
}) {
  const deducciones = valor.deducciones ?? [];
  const sugeridos = driversSugeridos(nombreSubCriterio);

  const actualizarDeduccion = (i: number, patch: Partial<(typeof deducciones)[number]>) => {
    const copia = [...deducciones];
    copia[i] = { ...copia[i], ...patch };
    onChange({ deducciones: copia });
  };

  const agregar = (nombreDriver = "") =>
    onChange({ deducciones: [...deducciones, { nombreDriver, nivelDeduccion: 1 }] });

  const quitar = (i: number) =>
    onChange({ deducciones: deducciones.filter((_, idx) => idx !== i) });

  const nombresYaAgregados = new Set(deducciones.map((d) => d.nombreDriver));

  return (
    <div className="space-y-3">
      <div className="max-w-xs space-y-1.5">
        <Label className="text-xs">Valor inicial</Label>
        <Input
          type="number"
          step="0.1"
          value={valor.puntajeFinalManual ?? ""}
          onChange={(e) =>
            onChange({ puntajeFinalManual: e.target.value === "" ? undefined : Number(e.target.value) })
          }
        />
      </div>

      <GuiaDeduccion />

      <div className="space-y-2">
        <Label className="text-xs">Deducciones por driver</Label>

        {sugeridos.filter((s) => !nombresYaAgregados.has(s.nombre)).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sugeridos
              .filter((s) => !nombresYaAgregados.has(s.nombre))
              .map((s) => (
                <button
                  key={s.nombre}
                  type="button"
                  title={s.descripcion}
                  onClick={() => agregar(s.nombre)}
                  className="text-xs rounded-full border px-2.5 py-1 hover:bg-muted transition-colors"
                >
                  + {s.nombre}
                </button>
              ))}
          </div>
        )}

        {deducciones.map((d, i) => {
          const guiaDriver = sugeridos.find((s) => s.nombre === d.nombreDriver);
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nombre del driver…"
                  value={d.nombreDriver}
                  onChange={(e) => actualizarDeduccion(i, { nombreDriver: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value={String(d.nivelDeduccion)}
                  onValueChange={(v) => actualizarDeduccion(i, { nivelDeduccion: Number(v) as 0 | 1 | 2 | 3 })}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NIVELES_DEDUCCION.map((n) => (
                      <SelectItem key={n.valor} value={String(n.valor)}>
                        {n.valor} — {n.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => quitar(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {guiaDriver && <p className="text-xs text-muted-foreground pl-1">{guiaDriver.descripcion}</p>}
            </div>
          );
        })}
        <Button variant="outline" size="sm" onClick={() => agregar()}>
          <Plus className="h-4 w-4 mr-1" /> Agregar otro driver
        </Button>
      </div>
    </div>
  );
}

// Construcciones / Gimnasia: drivers "Grado de Dificultad" (lista repetible
// de habilidades) y "Participacion Maxima" (un escalón seleccionado).
function DriversConstruccionForm({
  subCriterioId,
  nivelId,
  valor,
  onChange,
}: {
  subCriterioId: number;
  nivelId: number;
  valor: RegistroSubCriterioInput;
  onChange: (patch: Partial<RegistroSubCriterioInput>) => void;
}) {
  const [drivers, setDrivers] = useState<DriverSubCriterio[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarDrivers(subCriterioId)
      .then(setDrivers)
      .catch(() => toast.error("No se pudieron cargar los drivers de este sub-criterio"))
      .finally(() => setCargando(false));
  }, [subCriterioId]);

  if (cargando) {
    return <p className="text-xs text-muted-foreground">Cargando drivers…</p>;
  }
  if (drivers.length === 0) {
    return null;
  }

  const registros = valor.driversConstruccion ?? [];

  const driverGrado = drivers.find((d) => d.nombre.toLowerCase() === "grado de dificultad");
  const driverParticipacion = drivers.find((d) => d.nombre.toLowerCase() === "participacion maxima");

  const filasGrado = driverGrado
    ? registros.filter((r) => r.driverId === driverGrado.id)
    : [];

  const actualizarFilasGrado = (nuevas: DriverConstruccionInput[]) => {
    const otras = registros.filter((r) => r.driverId !== driverGrado?.id);
    onChange({ driversConstruccion: [...otras, ...nuevas] });
  };

  const agregarHabilidad = () => {
    if (!driverGrado) return;
    actualizarFilasGrado([
      ...filasGrado,
      { driverId: driverGrado.id, numeroHabilidad: filasGrado.length + 1, esNivelAlto: false },
    ]);
  };

  const quitarHabilidad = (i: number) => {
    actualizarFilasGrado(filasGrado.filter((_, idx) => idx !== i));
  };

  const filaParticipacion = driverParticipacion
    ? registros.find((r) => r.driverId === driverParticipacion.id)
    : undefined;

  const setParticipacion = (escalonId: number) => {
    if (!driverParticipacion) return;
    const otras = registros.filter((r) => r.driverId !== driverParticipacion.id);
    onChange({
      driversConstruccion: [...otras, { driverId: driverParticipacion.id, escalonSeleccionadoId: escalonId }],
    });
  };

  return (
    <div className="space-y-3 border-t pt-3">
      {driverGrado && (
        <div className="space-y-2">
          <Label className="text-xs">Grado de dificultad — una fila por habilidad marcada</Label>
          <TopeDriverGuia driverId={driverGrado.id} nivelId={nivelId} />
          {filasGrado.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16">Hab. {f.numeroHabilidad}</span>
              <Select
                value={f.esNivelAlto ? "alto" : "basico"}
                onValueChange={(v) => {
                  const copia = [...filasGrado];
                  copia[i] = { ...copia[i], esNivelAlto: v === "alto" };
                  actualizarFilasGrado(copia);
                }}
              >
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Apropiada (básico)</SelectItem>
                  <SelectItem value="alto">Avanzada / Élite (alto)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => quitarHabilidad(i)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={agregarHabilidad}>
            <Plus className="h-4 w-4 mr-1" /> Agregar habilidad
          </Button>
        </div>
      )}

      {driverParticipacion && (
        <ParticipacionMaximaSelect
          driverId={driverParticipacion.id}
          nivelId={nivelId}
          valorSeleccionado={filaParticipacion?.escalonSeleccionadoId ?? null}
          onSeleccionar={setParticipacion}
        />
      )}
    </div>
  );
}

function TopeDriverGuia({ driverId, nivelId }: { driverId: number; nivelId: number }) {
  const [tope, setTope] = useState<TopeDriverNivel | null | undefined>(undefined);

  useEffect(() => {
    obtenerTopeDriver(driverId, nivelId)
      .then(setTope)
      .catch(() => setTope(null));
  }, [driverId, nivelId]);

  if (!tope) return null;

  return (
    <p className="text-xs text-muted-foreground rounded-md border border-dashed p-2">
      Básico: <span className="font-semibold text-foreground">{tope.valorNivelBasico ?? "—"}</span> ·
      Alto: <span className="font-semibold text-foreground">{tope.valorNivelAlto ?? "—"}</span> · Tope
      máximo: <span className="font-semibold text-foreground">{tope.topeMaximo}</span>
    </p>
  );
}

function ParticipacionMaximaSelect({
  driverId,
  nivelId,
  valorSeleccionado,
  onSeleccionar,
}: {
  driverId: number;
  nivelId: number;
  valorSeleccionado: number | null;
  onSeleccionar: (escalonId: number) => void;
}) {
  const [escalones, setEscalones] = useState<EscalonDriverNivel[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarEscalonesDriver(driverId, nivelId)
      .then(setEscalones)
      .catch(() => toast.error("No se pudieron cargar los escalones de participación máxima"))
      .finally(() => setCargando(false));
  }, [driverId, nivelId]);

  if (cargando) {
    return <p className="text-xs text-muted-foreground">Cargando escalones…</p>;
  }
  if (escalones.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5 max-w-md">
      <Label className="text-xs">Participación máxima</Label>
      <Select
        value={valorSeleccionado ? String(valorSeleccionado) : ""}
        onValueChange={(v) => onSeleccionar(Number(v))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona el escalón alcanzado…" />
        </SelectTrigger>
        <SelectContent>
          {escalones.map((e) => (
            <SelectItem key={e.id} value={String(e.id)}>
              {e.descripcion} ({e.valor})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}