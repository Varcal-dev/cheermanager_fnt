"use client";

import { Fragment, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import {
  MESES, MESES_LARGOS, historialDeportista, listarDeportistasOpcion, medalla, rankingHabilidades, rankingTemporada,
  temporadasRanking,
  type DeportistaOpcion, type HistorialDeportista, type RankingHabilidades, type RankingTemporada, type ResultadoFila,
  type TemporadaBasica,
} from "@/app/lib/ranking";

function TablaResultados({ filas }: { filas: ResultadoFila[] }) {
  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left"><tr><th className="p-2">Fecha</th><th className="p-2">Evento</th><th className="p-2">Grupo</th><th className="p-2">Posición</th><th className="p-2">Puntaje</th><th className="p-2">Premio</th></tr></thead>
        <tbody>
          {filas.map((r, i) => (
            <tr key={`${r.eventoId}-${r.grupoId}-${i}`} className="border-t">
              <td className="p-2">{r.fecha ?? "—"}</td><td className="p-2">{r.evento}</td><td className="p-2">{r.grupo}</td>
              <td className="p-2">{medalla(r.posicion)}</td><td className="p-2">{r.puntaje ?? "—"}</td><td className="p-2">{r.premio ?? "—"}</td>
            </tr>
          ))}
          {filas.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={6}>Sin resultados.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Temporada() {
  const [temporadas, setTemporadas] = useState<TemporadaBasica[]>([]);
  const [sel, setSel] = useState<string>("");
  const [datos, setDatos] = useState<RankingTemporada | null>(null);

  useEffect(() => { temporadasRanking().then(setTemporadas).catch(() => {}); }, []);
  useEffect(() => {
    rankingTemporada(sel ? Number(sel) : undefined)
      .then((d) => { setDatos(d); if (!sel) setSel(String(d.temporada.id)); })
      .catch((e) => toast.error(getErrorMessage(e, "No se pudo cargar el ranking")));
  }, [sel]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Temporada</Label>
          <Select value={sel} onValueChange={setSel}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Temporada" /></SelectTrigger>
            <SelectContent>{temporadas.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {datos && <p className="text-sm text-muted-foreground">{datos.temporada.desde} a {datos.temporada.hasta}</p>}
      </div>
      {datos && (
        <>
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-2">#</th><th className="p-2">Grupo</th><th className="p-2">🥇</th><th className="p-2">Podios</th><th className="p-2">Eventos</th><th className="p-2">Mejor puesto</th><th className="p-2">Mejor puntaje</th><th className="p-2">Promedio</th></tr></thead>
              <tbody>
                {datos.grupos.map((g, i) => (
                  <tr key={g.grupoId} className="border-t">
                    <td className="p-2 font-bold">{i + 1}</td><td className="p-2">{g.grupo}</td><td className="p-2">{g.oros}</td><td className="p-2">{g.podios}</td>
                    <td className="p-2">{g.eventos}</td><td className="p-2">{medalla(g.mejorPosicion)}</td><td className="p-2">{g.mejorPuntaje ?? "—"}</td><td className="p-2">{g.promedioPuntaje ?? "—"}</td>
                  </tr>
                ))}
                {datos.grupos.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={8}>Esta temporada aún no tiene resultados.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Orden: más oros, luego más podios, luego mejor promedio de puntaje.</p>
          <h3 className="font-semibold">Resultados de la temporada</h3>
          <TablaResultados filas={datos.resultados} />
        </>
      )}
    </div>
  );
}

function Habilidades() {
  const hoy = new Date();
  const [anio, setAnio] = useState(String(hoy.getFullYear()));
  const [mes, setMes] = useState<string>("TODO");
  const [datos, setDatos] = useState<RankingHabilidades | null>(null);
  const [abierto, setAbierto] = useState<number | null>(null);

  useEffect(() => {
    const a = Number(anio);
    if (!a || a < 2000 || a > 2100) return;
    rankingHabilidades(a, mes === "TODO" ? undefined : Number(mes))
      .then(setDatos)
      .catch((e) => toast.error(getErrorMessage(e, "No se pudo cargar el ranking de habilidades")));
  }, [anio, mes]);

  const max = Math.max(1, ...(datos?.porMes ?? [0]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cuenta una habilidad como aprendida la primera vez que el deportista la domina en una evaluación (≥ 85 % del puntaje inicial), en el mes de esa evaluación.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div><Label>Año</Label><Input className="w-28" type="number" min={2000} max={2100} value={anio} onChange={(e) => setAnio(e.target.value)} /></div>
        <div>
          <Label>Mes</Label>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">Todo el año</SelectItem>
              {MESES_LARGOS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {datos && (
        <>
          <div className="rounded-md border p-3">
            <div className="mb-2 text-sm font-semibold">Habilidades aprendidas por mes en el club ({datos.anio})</div>
            <div className="flex h-32 items-end gap-2">
              {datos.porMes.map((n, i) => (
                <button key={i} type="button" className="flex flex-1 flex-col items-center justify-end gap-1" onClick={() => setMes(String(i + 1))} title={`${MESES_LARGOS[i]}: ${n}`}>
                  <span className="text-xs">{n}</span>
                  <span className={`w-full rounded-t ${mes === String(i + 1) ? "bg-primary" : "bg-primary/50"}`} style={{ height: `${(n / max) * 80}%`, minHeight: n ? 4 : 1 }} />
                  <span className="text-xs text-muted-foreground">{MESES[i]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm">
            {datos.mes ? `${MESES_LARGOS[datos.mes - 1]} ${datos.anio}` : `Año ${datos.anio}`}: <b>{datos.totalClub}</b> habilidad(es) aprendida(s) en total.
          </div>
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-2">#</th><th className="p-2">Deportista</th><th className="p-2">Habilidades</th><th className="p-2" /></tr></thead>
              <tbody>
                {datos.filas.map((f, i) => (
                  <Fragment key={f.deportistaId}>
                    <tr className="border-t">
                      <td className="p-2 font-bold">{i + 1}</td><td className="p-2">{f.nombre}</td><td className="p-2">{f.cantidad}</td>
                      <td className="p-2 text-right"><Button size="sm" variant="ghost" onClick={() => setAbierto(abierto === f.deportistaId ? null : f.deportistaId)}>{abierto === f.deportistaId ? "Ocultar" : "Ver cuáles"}</Button></td>
                    </tr>
                    {abierto === f.deportistaId && (
                      <tr className="bg-muted/30">
                        <td />
                        <td colSpan={3} className="p-2">
                          <ul className="list-disc pl-5">
                            {f.habilidades.map((h) => <li key={h.habilidadId}>{h.fecha} · {h.nivel} · {h.categoria} · {h.nombre}</li>)}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {datos.filas.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={4}>Nadie dominó habilidades nuevas en este periodo.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PorDeportista() {
  const [lista, setLista] = useState<DeportistaOpcion[]>([]);
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<string>("");
  const [datos, setDatos] = useState<HistorialDeportista | null>(null);

  useEffect(() => { listarDeportistasOpcion().then(setLista).catch(() => toast.error("No se pudo cargar la lista de deportistas")); }, []);
  useEffect(() => {
    if (!sel) return;
    historialDeportista(Number(sel)).then(setDatos).catch((e) => toast.error(getErrorMessage(e, "No se pudo cargar el historial")));
  }, [sel]);

  const filtrados = lista.filter((d) => `${d.nombre} ${d.apellidos}`.toLowerCase().includes(busca.toLowerCase())).slice(0, 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div><Label>Buscar</Label><Input className="w-56" placeholder="Nombre" value={busca} onChange={(e) => setBusca(e.target.value)} /></div>
        <div>
          <Label>Deportista</Label>
          <Select value={sel} onValueChange={setSel}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Elige" /></SelectTrigger>
            <SelectContent>{filtrados.map((d) => <SelectItem key={d.deportistaId} value={String(d.deportistaId)}>{d.nombre} {d.apellidos}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      {datos && (
        <>
          <div className="rounded-md border p-3 text-sm"><b>{datos.nombre}</b>: {datos.eventos} competencia(s), {datos.podios} podio(s).</div>
          <TablaResultados filas={datos.resultados} />
          <p className="text-xs text-muted-foreground">
            Los resultados se registran por grupo. Se muestran los de los grupos a los que pertenece el deportista (y los de grupos que dejó, hasta la fecha en que salió).
          </p>
        </>
      )}
    </div>
  );
}

export default function RankingPantalla() {
  const { permissions } = useUser();
  const verHabilidades = permissions.includes("ver_evaluaciones");
  const verDeportistas = permissions.includes("ver_deportista");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ranking e historial</h1>
        <p className="text-muted-foreground">Resultados de competencia por temporada y por deportista, y quiénes más habilidades aprendieron.</p>
      </div>
      <Tabs defaultValue="temporada">
        <TabsList>
          <TabsTrigger value="temporada">Temporada</TabsTrigger>
          {verHabilidades && <TabsTrigger value="habilidades">Habilidades aprendidas</TabsTrigger>}
          {verDeportistas && <TabsTrigger value="deportista">Por deportista</TabsTrigger>}
        </TabsList>
        <TabsContent value="temporada" className="pt-4"><Temporada /></TabsContent>
        {verHabilidades && <TabsContent value="habilidades" className="pt-4"><Habilidades /></TabsContent>}
        {verDeportistas && <TabsContent value="deportista" className="pt-4"><PorDeportista /></TabsContent>}
      </Tabs>
    </div>
  );
}
