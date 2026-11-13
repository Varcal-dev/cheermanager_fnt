"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PUNTAJE_MAXIMO, claseNota, hoyLocal, listarMiembros,
  type Criterio, type Grupo, type Miembro, type ResultadoLote,
} from "@/app/lib/evaluaciones";
import {
  actualizarPlantilla, catalogoPlantilla, crearPlantilla, eliminarPlantilla, fechasPlantilla, listarPlantillas,
  resultadosPlantilla,
  type Catalogo, type ItemEntrada, type Modalidad, type Plantilla, type ResultadosPlantilla, type TipoItem,
} from "@/app/lib/plantillas";

const SIN = "__sin__";
const clave = (t: TipoItem, id: number) => `${t}:${id}`;
const valido = (v: string) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= PUNTAJE_MAXIMO;

// ---------- Diálogo: crear / editar plantilla ----------
function PlantillaDialog({
  abierto, plantilla, criteriosClub, onClose, onGuardada,
}: {
  abierto: boolean;
  plantilla: Plantilla | null;
  criteriosClub: Criterio[];
  onClose: () => void;
  onGuardada: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad | typeof SIN>(SIN);
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const [nivel, setNivel] = useState("todos");
  const [categoriaHab, setCategoriaHab] = useState("todas");
  const [guardando, setGuardando] = useState(false);

  // Al abrir: precarga la plantilla. Las selecciones previas se reconstruyen por nombre de criterio.
  useEffect(() => {
    if (!abierto) return;
    setNombre(plantilla?.nombre ?? "");
    setDescripcion(plantilla?.descripcion ?? "");
    setModalidad(plantilla?.modalidad ?? SIN);
    setBusca("");
    setNivel("todos");
    setCategoriaHab("todas");
    setSel(new Set());
  }, [abierto, plantilla]);

  useEffect(() => {
    if (!abierto) return;
    catalogoPlantilla(modalidad === SIN ? null : modalidad)
      .then(setCatalogo)
      .catch(() => toast.error("No se pudo cargar el catálogo de criterios"));
  }, [abierto, modalidad]);

  // Reconstruye la selección al editar, cuando ya hay catálogo.
  useEffect(() => {
    if (!abierto || !plantilla || !catalogo) return;
    const nuevo = new Set<string>();
    for (const c of plantilla.criterios) {
      const r = catalogo.rubrica.find((x) => x.nombre === c.nombre && c.categoria.startsWith("Rúbrica"));
      if (r) { nuevo.add(clave("RUBRICA", r.id)); continue; }
      const h = catalogo.habilidades.find((x) => `${x.codigo} · ${x.nombre}` === c.nombre && c.categoria === "Habilidades");
      if (h) { nuevo.add(clave("HABILIDAD", h.id)); continue; }
      nuevo.add(clave("CLUB", c.criterioId));
    }
    setSel(nuevo);
    // solo la primera vez que llega el catálogo de esta plantilla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, plantilla, catalogo?.modalidad]);

  const alternar = (k: string) =>
    setSel((p) => {
      const n = new Set(p);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });

  const secciones = useMemo(() => {
    const m = new Map<string, Catalogo["rubrica"]>();
    for (const r of catalogo?.rubrica ?? []) m.set(r.seccion, [...(m.get(r.seccion) ?? []), r]);
    return [...m.entries()];
  }, [catalogo]);

  const niveles = useMemo(() => [...new Set((catalogo?.habilidades ?? []).map((h) => h.nivel))], [catalogo]);
  const categoriasHab = useMemo(
    () => [...new Set((catalogo?.habilidades ?? []).map((h) => h.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [catalogo],
  );
  const habilidades = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (catalogo?.habilidades ?? [])
      .filter(
        (h) =>
          (nivel === "todos" || h.nivel === nivel) &&
          (categoriaHab === "todas" || h.categoria === categoriaHab) &&
          (!q || `${h.codigo} ${h.nombre}`.toLowerCase().includes(q)),
      )
      .slice(0, 150);
  }, [catalogo, busca, nivel, categoriaHab]);

  // Criterios propios del club, sin los generados desde rúbrica/habilidades.
  const propios = criteriosClub.filter((c) => !c.categoria.startsWith("Rúbrica") && c.categoria !== "Habilidades");

  const hayRubrica = [...sel].some((k) => k.startsWith("RUBRICA:"));

  async function guardar() {
    if (!nombre.trim()) return toast.error("Escribe el nombre de la plantilla");
    if (sel.size === 0) return toast.error("Elige al menos un criterio");
    if (hayRubrica && modalidad === SIN) return toast.error("Elige la modalidad (Prep o Elite) para usar criterios de rúbrica");
    const items: ItemEntrada[] = [...sel].map((k) => {
      const [tipo, ref] = k.split(":");
      return { tipo: tipo as TipoItem, ref: Number(ref) };
    });
    const body = { nombre: nombre.trim(), descripcion: descripcion.trim(), modalidad: modalidad === SIN ? null : modalidad, items };
    setGuardando(true);
    try {
      if (plantilla) await actualizarPlantilla(plantilla.id, body); else await crearPlantilla(body);
      toast.success("Plantilla guardada");
      onGuardada();
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo guardar la plantilla"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{plantilla ? "Editar plantilla" : "Nueva plantilla de tryout"}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} placeholder="Tryout Prep 2027" />
          </div>
          <div className="space-y-1.5">
            <Label>Modalidad de la rúbrica</Label>
            <Select value={modalidad} onValueChange={(v) => setModalidad(v as Modalidad | typeof SIN)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN}>Sin rúbrica (solo habilidades / propios)</SelectItem>
                <SelectItem value="Prep">Prep</SelectItem>
                <SelectItem value="Elite">Elite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descripción (opcional)</Label>
            <Input value={descripcion} maxLength={300} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Novice no aplica: no usa esta rúbrica. Seleccionados: {sel.size}</p>
        <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
          Al evaluar, cada criterio se califica con un número entero de <strong>0</strong> (no lo logra) a <strong>{PUNTAJE_MAXIMO}</strong> (ejecución perfecta).
        </p>

        <Tabs defaultValue="rubrica">
          <TabsList>
            <TabsTrigger value="rubrica">Rúbrica</TabsTrigger>
            <TabsTrigger value="habilidades">Habilidades</TabsTrigger>
            <TabsTrigger value="club">Mis criterios</TabsTrigger>
          </TabsList>
          <TabsContent value="rubrica" className="space-y-3 pt-3">
            {modalidad === SIN ? (
              <p className="text-sm text-muted-foreground">Elige Prep o Elite para ver las secciones de la rúbrica.</p>
            ) : secciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay criterios de rúbrica para {modalidad}.</p>
            ) : (
              secciones.map(([sec, rs]) => (
                <div key={sec}>
                  <p className="mb-1 text-sm font-medium">{sec}</p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {rs.map((r) => (
                      <label key={r.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={sel.has(clave("RUBRICA", r.id))} onCheckedChange={() => alternar(clave("RUBRICA", r.id))} />
                        {r.nombre}
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          <TabsContent value="habilidades" className="space-y-3 pt-3">
            <div className="flex flex-wrap gap-2">
              <Input className="max-w-xs" placeholder="Buscar habilidad…" value={busca} onChange={(e) => setBusca(e.target.value)} />
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {niveles.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={categoriaHab} onValueChange={setCategoriaHab}>
                <SelectTrigger className="w-48" aria-label="Categoría de habilidad"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las categorías</SelectItem>
                  {categoriasHab.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              {habilidades.length} habilidad(es){habilidades.length === 150 ? " (mostrando las primeras 150: afina con la búsqueda o los filtros)" : ""}. Los filtros no quitan lo ya marcado.
            </p>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
              {habilidades.map((h) => (
                <label key={h.id} className="flex items-start gap-2 text-sm">
                  <Checkbox className="mt-0.5" checked={sel.has(clave("HABILIDAD", h.id))} onCheckedChange={() => alternar(clave("HABILIDAD", h.id))} />
                  <span><span className="font-mono text-xs text-muted-foreground">{h.codigo}</span> {h.nombre}</span>
                </label>
              ))}
              {habilidades.length === 0 && <p className="text-sm text-muted-foreground">Sin resultados.</p>}
            </div>
          </TabsContent>
          <TabsContent value="club" className="pt-3">
            <div className="grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">
              {propios.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={sel.has(clave("CLUB", c.id))} onCheckedChange={() => alternar(clave("CLUB", c.id))} />
                  {c.nombre} <span className="text-xs text-muted-foreground">· {c.categoria}</span>
                </label>
              ))}
              {propios.length === 0 && <p className="text-sm text-muted-foreground">No hay criterios propios.</p>}
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar plantilla"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Evaluar con la plantilla ----------
function EvaluarPlantilla({ plantilla, grupos }: { plantilla: Plantilla; grupos: Grupo[] }) {
  const [grupoId, setGrupoId] = useState("");
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [fecha, setFecha] = useState(hoyLocal());
  const [notas, setNotas] = useState<Record<string, string>>({}); // `${deportistaId}:${criterioId}`
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setMiembros([]);
    setNotas({});
    setErrores({});
    if (!grupoId) return;
    listarMiembros(Number(grupoId)).then(setMiembros).catch(() => toast.error("No se pudo cargar el grupo"));
  }, [grupoId, plantilla.id]);

  const llenas = Object.entries(notas).filter(([, v]) => v !== "");
  const hayInvalidas = llenas.some(([, v]) => !valido(v));

  async function enviar() {
    setEnviando(true);
    setErrores({});
    const porDep = new Map<number, { criterioId: number; puntajeObtenido: number }[]>();
    for (const [k, v] of llenas) {
      const [d, c] = k.split(":").map(Number);
      porDep.set(d, [...(porDep.get(d) ?? []), { criterioId: c, puntajeObtenido: Number(v) }]);
    }
    let guardadas = 0;
    const fallos: Record<string, string> = {};
    const ok = new Set<string>();
    try {
      for (const [d, registros] of porDep) {
        const res = await api.post<ResultadoLote>("/api/evaluaciones/masivo", { deportistaId: d, fecha, registros });
        guardadas += res.data.registradas.length;
        for (const [c, msg] of Object.entries(res.data.errores ?? {})) fallos[`${d}:${c}`] = msg;
        for (const r of registros) if (!(`${r.criterioId}` in (res.data.errores ?? {}))) ok.add(`${d}:${r.criterioId}`);
      }
      if (guardadas > 0) toast.success(`${guardadas} evaluación(es) guardada(s)`);
      setErrores(fallos);
      setNotas((p) => Object.fromEntries(Object.entries(p).filter(([k]) => !ok.has(k))));
      if (Object.keys(fallos).length > 0) toast.warn("Algunas no se guardaron: revisa los mensajes en rojo");
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudieron guardar las evaluaciones"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Grupo</Label>
          <Select value={grupoId} onValueChange={setGrupoId}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Elige un grupo" /></SelectTrigger>
            <SelectContent>{grupos.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.nombre}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Fecha</Label>
          <Input type="date" value={fecha} max={hoyLocal()} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <p className="rounded-md bg-muted/50 p-2 text-sm text-muted-foreground">
        Cómo calificar: escribe un número entero de <strong>0</strong> (mínimo, no lo logra) a <strong>{PUNTAJE_MAXIMO}</strong> (máximo,
        ejecución perfecta). Deja la celda vacía si no evalúas ese criterio. El promedio solo cuenta los criterios calificados.
      </p>
      {miembros.length > 0 && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Deportista</TableHead>
                  {plantilla.criterios.map((c) => (
                    <TableHead key={c.criterioId} className="min-w-28 text-center text-xs" title={c.nombre}>
                      <span className="line-clamp-2">{c.nombre}</span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {miembros.map((m) => (
                  <TableRow key={m.deportistaId}>
                    <TableCell className="sticky left-0 bg-background font-medium">{m.nombre}</TableCell>
                    {plantilla.criterios.map((c) => {
                      const k = `${m.deportistaId}:${c.criterioId}`;
                      const v = notas[k] ?? "";
                      return (
                        <TableCell key={c.criterioId} className="text-center">
                          <Input
                            inputMode="numeric"
                            placeholder={`0-${PUNTAJE_MAXIMO}`}
                            aria-label={`${m.nombre}: ${c.nombre} (0 a ${PUNTAJE_MAXIMO})`}
                            className={`mx-auto h-8 w-16 text-center ${v !== "" && !valido(v) ? "border-destructive" : ""}`}
                            value={v}
                            onChange={(e) => setNotas((p) => ({ ...p, [k]: e.target.value.replace(/[^0-9]/g, "") }))}
                          />
                          {errores[k] && <p className="mt-0.5 text-[10px] text-destructive">{errores[k]}</p>}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {miembros.length > 0 && (
        <div className="flex items-center gap-3">
          <Button onClick={enviar} disabled={enviando || llenas.length === 0 || hayInvalidas || !fecha}>
            {enviando ? "Guardando…" : `Guardar ${llenas.length} nota(s)`}
          </Button>
          <span className="text-xs text-muted-foreground">Las celdas vacías no se guardan. Un número fuera de 0–{PUNTAJE_MAXIMO} se marca en rojo y bloquea el guardado.</span>
        </div>
      )}
    </div>
  );
}

// ---------- Resultados / ranking ----------
function ResultadosPlantillaView({ plantilla }: { plantilla: Plantilla }) {
  const [fechas, setFechas] = useState<string[]>([]);
  const [fecha, setFecha] = useState("");
  const [res, setRes] = useState<ResultadosPlantilla | null>(null);

  useEffect(() => {
    setFechas([]); setFecha(""); setRes(null);
    fechasPlantilla(plantilla.id)
      .then((f) => { setFechas(f); if (f.length) setFecha(f[0]); })
      .catch(() => toast.error("No se pudieron cargar las fechas"));
  }, [plantilla.id]);

  useEffect(() => {
    if (!fecha) return;
    resultadosPlantilla(plantilla.id, fecha).then(setRes).catch(() => toast.error("No se pudieron cargar los resultados"));
  }, [plantilla.id, fecha]);

  if (fechas.length === 0) return <p className="text-sm text-muted-foreground">Aún no hay evaluaciones con esta plantilla.</p>;
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Fecha del tryout</Label>
        <Select value={fecha} onValueChange={setFecha}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{fechas.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {res && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="sticky left-0 bg-background">Deportista</TableHead>
                  {res.criterios.map((c) => <TableHead key={c.criterioId} className="min-w-24 text-center text-xs"><span className="line-clamp-2">{c.nombre}</span></TableHead>)}
                  <TableHead className="text-center">Promedio</TableHead>
                  <TableHead className="text-center">Evaluado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {res.filas.map((f, i) => (
                  <TableRow key={f.deportistaId}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="sticky left-0 bg-background font-medium">{f.nombre}</TableCell>
                    {res.criterios.map((c) => {
                      const p = f.puntajes[String(c.criterioId)];
                      return <TableCell key={c.criterioId} className={`text-center ${p === undefined ? "text-muted-foreground" : claseNota(p)}`}>{p ?? "—"}</TableCell>;
                    })}
                    <TableCell className={`text-center font-semibold ${claseNota(f.promedio)}`}>{f.promedio.toFixed(2)}</TableCell>
                    <TableCell className="text-center text-xs">{f.evaluados}/{f.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <p className="text-xs text-muted-foreground">El promedio considera solo los criterios evaluados; compara el avance en la columna “Evaluado”.</p>
    </div>
  );
}

// ---------- Pestaña ----------
export default function TryoutTab({ grupos, criterios, onCriteriosCambian }: {
  grupos: Grupo[]; criterios: Criterio[]; onCriteriosCambian: () => void;
}) {
  const { permissions } = useUser();
  const puedeCrear = permissions.includes("crear_evaluacion");
  const puedeEditar = permissions.includes("modificar_evaluacion");
  const puedeBorrar = permissions.includes("eliminar_evaluacion");
  const [lista, setLista] = useState<Plantilla[]>([]);
  const [selId, setSelId] = useState("");
  const [dialogo, setDialogo] = useState<{ abierto: boolean; plantilla: Plantilla | null }>({ abierto: false, plantilla: null });

  const cargar = () => listarPlantillas().then(setLista).catch(() => toast.error("No se pudieron cargar las plantillas"));
  useEffect(() => { cargar(); }, []);

  const actual = lista.find((p) => String(p.id) === selId) ?? null;

  async function borrar(p: Plantilla) {
    if (!confirm(`¿Eliminar la plantilla "${p.nombre}"? Las evaluaciones ya registradas se conservan.`)) return;
    try {
      await eliminarPlantilla(p.id);
      toast.success("Plantilla eliminada");
      setSelId("");
      cargar();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo eliminar"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label>Plantilla de tryout</Label>
          <Select value={selId} onValueChange={setSelId}>
            <SelectTrigger className="w-72"><SelectValue placeholder={lista.length ? "Elige una plantilla" : "Aún no hay plantillas"} /></SelectTrigger>
            <SelectContent>{lista.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {actual && puedeEditar && <Button variant="outline" size="sm" onClick={() => setDialogo({ abierto: true, plantilla: actual })}><Pencil className="mr-1 h-4 w-4" />Editar</Button>}
          {actual && puedeBorrar && <Button variant="outline" size="sm" onClick={() => borrar(actual)}><Trash2 className="mr-1 h-4 w-4" />Eliminar</Button>}
          {puedeCrear && <Button size="sm" onClick={() => setDialogo({ abierto: true, plantilla: null })}><Plus className="mr-1 h-4 w-4" />Nueva plantilla</Button>}
        </div>
      </div>

      {actual ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {actual.nombre}
              <Badge variant="secondary">Tryout</Badge>
              {actual.modalidad && <Badge variant="outline">{actual.modalidad}</Badge>}
              <Badge variant="outline">{actual.criterios.length} criterios</Badge>
            </CardTitle>
            {actual.descripcion && <p className="text-sm text-muted-foreground">{actual.descripcion}</p>}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={puedeCrear ? "evaluar" : "resultados"}>
              <TabsList>
                {puedeCrear && <TabsTrigger value="evaluar">Evaluar</TabsTrigger>}
                <TabsTrigger value="resultados">Resultados</TabsTrigger>
              </TabsList>
              {puedeCrear && <TabsContent value="evaluar" className="pt-4"><EvaluarPlantilla plantilla={actual} grupos={grupos} /></TabsContent>}
              <TabsContent value="resultados" className="pt-4"><ResultadosPlantillaView plantilla={actual} /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Crea una plantilla eligiendo criterios de la rúbrica (Prep o Elite) y de habilidades; luego evalúa a los deportistas y compara el ranking.
        </p>
      )}

      <PlantillaDialog
        abierto={dialogo.abierto}
        plantilla={dialogo.plantilla}
        criteriosClub={criterios}
        onClose={() => setDialogo({ abierto: false, plantilla: null })}
        onGuardada={() => { cargar(); onCriteriosCambian(); }}
      />
    </div>
  );
}
