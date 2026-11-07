"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useUser } from "@/context/UserContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { listarGrupos, listarMiembros, type Grupo, type Miembro } from "@/app/lib/evaluaciones";
import {
  CATEGORIAS, ESTADOS, ESTILOS, NIVELES, TIERS, calcularPuntaje, driversDe, estadoDeportista, evaluarHabilidad,
  historialHabilidad, listarCatalogo, valorInicial,
  type DriverDef, type EstadoDeportista, type Habilidad, type ItemHistorial,
} from "@/app/lib/habilidades";

const TODOS = "todos";
const colorEstado = (e: string) =>
  e === "DOMINADA" ? "bg-green-600 text-white" : e === "EN_DESARROLLO" ? "bg-amber-500 text-white" : "bg-muted text-foreground";

function Filtros({ nivel, setNivel, categoria, setCategoria }: {
  nivel: string; setNivel: (v: string) => void; categoria: string; setCategoria: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={nivel} onValueChange={setNivel}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Nivel" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos los niveles</SelectItem>
          {NIVELES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={categoria} onValueChange={setCategoria}>
        <SelectTrigger className="w-52"><SelectValue placeholder="Categoría" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todas las categorías</SelectItem>
          {Object.entries(CATEGORIAS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

const etiquetaHabilidad = (h: Habilidad) =>
  [h.nivel, CATEGORIAS[h.categoria], h.estilo ? ESTILOS[h.estilo] : null, h.tier ? TIERS[h.tier] : null].filter(Boolean).join(" · ");

function Glosario() {
  const [nivel, setNivel] = useState(TODOS);
  const [categoria, setCategoria] = useState(TODOS);
  const [texto, setTexto] = useState("");
  const [lista, setLista] = useState<Habilidad[]>([]);
  useEffect(() => {
    listarCatalogo({ nivel: nivel === TODOS ? undefined : nivel, categoria: categoria === TODOS ? undefined : categoria })
      .then(setLista).catch(() => toast.error("No se pudo cargar el glosario"));
  }, [nivel, categoria]);
  const visibles = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return t ? lista.filter((h) => h.nombre.toLowerCase().includes(t) || (h.nombreEn ?? "").toLowerCase().includes(t)) : lista;
  }, [lista, texto]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Filtros nivel={nivel} setNivel={setNivel} categoria={categoria} setCategoria={setCategoria} />
        <Input className="w-64" placeholder="Buscar habilidad…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <span className="text-sm text-muted-foreground">{visibles.length} habilidades</span>
      </div>
      <div className="rounded-md border divide-y max-h-[65vh] overflow-auto">
        {visibles.map((h) => (
          <div key={h.id} className="p-3 text-sm">
            <div className="font-medium">{h.nombre}</div>
            <div className="text-xs text-muted-foreground">{etiquetaHabilidad(h)}{h.nombreEn ? ` · ${h.nombreEn}` : ""}</div>
          </div>
        ))}
        {visibles.length === 0 && <p className="p-6 text-center text-muted-foreground">Sin resultados.</p>}
      </div>
    </div>
  );
}

function SelectorDeportista({ onChange }: { onChange: (id: number | null) => void }) {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [grupo, setGrupo] = useState("");
  const [dep, setDep] = useState("");
  useEffect(() => { listarGrupos().then(setGrupos).catch(() => toast.error("No se pudieron cargar los grupos")); }, []);
  const elegirGrupo = (v: string) => {
    setGrupo(v); setDep(""); onChange(null); setMiembros([]);
    listarMiembros(Number(v)).then(setMiembros).catch(() => toast.error("No se pudieron cargar los deportistas"));
  };
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={grupo} onValueChange={elegirGrupo}>
        <SelectTrigger className="w-56"><SelectValue placeholder="Grupo" /></SelectTrigger>
        <SelectContent>{grupos.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.nombre}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={dep} onValueChange={(v) => { setDep(v); onChange(Number(v)); }} disabled={!grupo}>
        <SelectTrigger className="w-64"><SelectValue placeholder="Deportista" /></SelectTrigger>
        <SelectContent>{miembros.map((m) => <SelectItem key={m.deportistaId} value={String(m.deportistaId)}>{m.nombre}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function Evaluar({ deportistaId, onGuardado }: { deportistaId: number; onGuardado: () => void }) {
  const [nivel, setNivel] = useState(TODOS);
  const [categoria, setCategoria] = useState(TODOS);
  const [lista, setLista] = useState<Habilidad[]>([]);
  const [habId, setHabId] = useState("");
  const [drivers, setDrivers] = useState<DriverDef[]>([]);
  const [niveles, setNiveles] = useState<Record<string, number>>({});
  const [obs, setObs] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    listarCatalogo({ nivel: nivel === TODOS ? undefined : nivel, categoria: categoria === TODOS ? undefined : categoria })
      .then(setLista).catch(() => toast.error("No se pudo cargar el glosario"));
    setHabId("");
  }, [nivel, categoria]);

  const hab = lista.find((h) => String(h.id) === habId);
  useEffect(() => {
    setNiveles({});
    if (hab) driversDe(hab.categoria).then(setDrivers).catch(() => toast.error("No se pudieron cargar los drivers"));
    else setDrivers([]);
  }, [hab?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const deducciones = drivers.map((d) => ({ driver: d.nombre, nivel: niveles[d.nombre] ?? 0 }));
  const puntaje = hab ? calcularPuntaje(hab.categoria, deducciones) : 0;

  const guardar = async () => {
    if (!hab) return;
    setGuardando(true);
    try {
      const r = await evaluarHabilidad({ deportistaId, habilidadId: hab.id, observaciones: obs || undefined, deducciones });
      toast.success(`Evaluación guardada: ${r.puntaje.toFixed(1)} (${ESTADOS[r.estado] ?? r.estado})`);
      setNiveles({}); setObs(""); onGuardado();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "No se pudo guardar la evaluación");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <Filtros nivel={nivel} setNivel={setNivel} categoria={categoria} setCategoria={setCategoria} />
      <Select value={habId} onValueChange={setHabId}>
        <SelectTrigger className="w-full"><SelectValue placeholder="Habilidad a evaluar" /></SelectTrigger>
        <SelectContent className="max-h-80">
          {lista.map((h) => <SelectItem key={h.id} value={String(h.id)}>{h.nivel} · {h.nombre}</SelectItem>)}
        </SelectContent>
      </Select>
      {hab && (
        <div className="space-y-4 rounded-md border p-4">
          <p className="text-sm text-muted-foreground">{etiquetaHabilidad(hab)} — parte de {valorInicial(hab.categoria).toFixed(1)}</p>
          {drivers.map((d) => (
            <div key={d.nombre} className="flex flex-wrap items-center gap-3">
              <Label className="w-48">{d.etiqueta}</Label>
              <div className="flex gap-1.5">
                {Array.from({ length: d.maxNivel + 1 }, (_, n) => (
                  <button key={n} type="button" onClick={() => setNiveles({ ...niveles, [d.nombre]: n })}
                    className={`h-8 min-w-12 rounded border px-2 text-sm ${(niveles[d.nombre] ?? 0) === n ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {n === 0 ? "OK" : `−0.${n}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Textarea placeholder="Observaciones (opcional)" maxLength={500} value={obs} onChange={(e) => setObs(e.target.value)} />
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{puntaje.toFixed(1)}</span>
            <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar evaluación"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Avance({ deportistaId, recarga }: { deportistaId: number; recarga: number }) {
  const [estado, setEstado] = useState<EstadoDeportista | null>(null);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [historial, setHistorial] = useState<ItemHistorial[]>([]);
  useEffect(() => {
    estadoDeportista(deportistaId).then(setEstado).catch(() => toast.error("No se pudo cargar el avance"));
    setAbierta(null);
  }, [deportistaId, recarga]);
  const ver = (id: number) => {
    if (abierta === id) return setAbierta(null);
    setAbierta(id);
    historialHabilidad(deportistaId, id).then(setHistorial).catch(() => toast.error("No se pudo cargar el historial"));
  };
  if (!estado) return <p className="text-muted-foreground">Cargando…</p>;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {estado.porNivel.map((p) => (
          <div key={p.nivel} className="rounded-md border p-3">
            <div className="font-semibold">{p.nivel}</div>
            <div className="text-sm">{p.dominadas} dominadas / {p.totalCatalogo}</div>
            <div className="text-xs text-muted-foreground">{p.evaluadas} evaluadas</div>
          </div>
        ))}
      </div>
      <div className="rounded-md border divide-y">
        {estado.habilidades.map((e) => (
          <div key={e.habilidad.id} className="p-3 text-sm">
            <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => ver(e.habilidad.id)}>
              <span>
                <span className="font-medium">{e.habilidad.nombre}</span>
                <span className="block text-xs text-muted-foreground">{etiquetaHabilidad(e.habilidad)}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span>{e.ultimoPuntaje.toFixed(1)}</span>
                <Badge className={colorEstado(e.estado)}>{ESTADOS[e.estado]}</Badge>
              </span>
            </button>
            {abierta === e.habilidad.id && (
              <ul className="mt-2 space-y-1 border-t pt-2 text-xs">
                {historial.map((h) => (
                  <li key={h.id}>
                    {h.fecha}: <b>{h.puntaje.toFixed(1)}</b>
                    {h.deducciones.filter((d) => d.nivel > 0).map((d) => ` · ${d.driver.replace("_", "/")} −0.${d.nivel}`).join("")}
                    {h.observaciones ? ` — ${h.observaciones}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {estado.habilidades.length === 0 && <p className="p-6 text-center text-muted-foreground">Aún no tiene habilidades evaluadas.</p>}
      </div>
    </div>
  );
}

export default function HabilidadesPantalla() {
  const { permissions } = useUser();
  const puedeEvaluar = permissions.includes("registrar_evaluacion");
  const [deportistaId, setDeportistaId] = useState<number | null>(null);
  const [recarga, setRecarga] = useState(0);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Habilidades</h1>
        <p className="text-muted-foreground">
          Glosario N1–N4 y evaluación de cada habilidad con los drivers de la rúbrica (valor inicial menos deducciones).
        </p>
      </div>
      <Tabs defaultValue="glosario">
        <TabsList>
          <TabsTrigger value="glosario">Glosario</TabsTrigger>
          <TabsTrigger value="deportista">Por deportista</TabsTrigger>
        </TabsList>
        <TabsContent value="glosario" className="pt-4"><Glosario /></TabsContent>
        <TabsContent value="deportista" className="pt-4 space-y-4">
          <SelectorDeportista onChange={setDeportistaId} />
          {deportistaId && (
            <Tabs defaultValue="avance">
              <TabsList>
                <TabsTrigger value="avance">Avance</TabsTrigger>
                {puedeEvaluar && <TabsTrigger value="evaluar">Evaluar habilidad</TabsTrigger>}
              </TabsList>
              <TabsContent value="avance" className="pt-4"><Avance deportistaId={deportistaId} recarga={recarga} /></TabsContent>
              {puedeEvaluar && (
                <TabsContent value="evaluar" className="pt-4">
                  <Evaluar deportistaId={deportistaId} onGuardado={() => setRecarga((r) => r + 1)} />
                </TabsContent>
              )}
            </Tabs>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
