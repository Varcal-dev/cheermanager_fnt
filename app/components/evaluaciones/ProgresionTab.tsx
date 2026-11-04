"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PUNTAJE_MAXIMO, listarMiembros, porCategoria, type Criterio, type EvaluacionFila, type Grupo, type Miembro } from "@/app/lib/evaluaciones";

export default function ProgresionTab({ grupos, criterios }: { grupos: Grupo[]; criterios: Criterio[] }) {
  const [grupoId, setGrupoId] = useState("");
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [deportistaId, setDeportistaId] = useState("");
  const [criterioId, setCriterioId] = useState("");
  const [serie, setSerie] = useState<EvaluacionFila[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    setMiembros([]);
    setDeportistaId("");
    if (!grupoId) return;
    listarMiembros(Number(grupoId)).then(setMiembros).catch(() => toast.error("No se pudo cargar el grupo"));
  }, [grupoId]);

  useEffect(() => {
    setSerie([]);
    if (!deportistaId || !criterioId) return;
    setCargando(true);
    api
      .get<EvaluacionFila[]>(`/api/evaluaciones/deportista/${deportistaId}/criterio/${criterioId}/progresion`)
      .then((r) => setSerie(r.data))
      .catch((e) => toast.error(getErrorMessage(e, "No se pudo cargar la progresión")))
      .finally(() => setCargando(false));
  }, [deportistaId, criterioId]);

  const promedio = useMemo(
    () => (serie.length ? Math.round((serie.reduce((a, e) => a + e.puntajeObtenido, 0) / serie.length) * 100) / 100 : null),
    [serie],
  );
  const variacion = serie.length >= 2 ? serie[serie.length - 1].puntajeObtenido - serie[0].puntajeObtenido : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div>
            <Label htmlFor="p-grupo">Grupo</Label>
            <select id="p-grupo" className="h-9 rounded-md border bg-background px-2 text-sm" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
              <option value="">Elige un grupo</option>
              {grupos.map((g) => (<option key={g.id} value={g.id}>{g.nombre}</option>))}
            </select>
          </div>
          <div>
            <Label htmlFor="p-deportista">Deportista</Label>
            <select id="p-deportista" className="h-9 rounded-md border bg-background px-2 text-sm" value={deportistaId} onChange={(e) => setDeportistaId(e.target.value)} disabled={!grupoId}>
              <option value="">Elige un deportista</option>
              {miembros.map((m) => (<option key={m.deportistaId} value={m.deportistaId}>{m.nombre}</option>))}
            </select>
          </div>
          <div>
            <Label htmlFor="p-criterio">Criterio</Label>
            <select id="p-criterio" className="h-9 rounded-md border bg-background px-2 text-sm" value={criterioId} onChange={(e) => setCriterioId(e.target.value)}>
              <option value="">Elige un criterio</option>
              {porCategoria(criterios).map(([cat, lista]) => (
                <optgroup key={cat} label={cat}>
                  {lista.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                </optgroup>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {deportistaId && criterioId && !cargando && serie.length === 0 && (
        <p className="text-sm text-muted-foreground">Este deportista aún no tiene evaluaciones en este criterio.</p>
      )}

      {serie.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm">
              {serie.length} evaluación(es) · promedio <strong>{promedio}</strong>
              {variacion !== null && (
                <> · de la primera a la última: <strong>{variacion > 0 ? `+${variacion}` : variacion}</strong></>
              )}
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie.map((e) => ({ fecha: e.fecha, puntaje: e.puntajeObtenido }))} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, PUNTAJE_MAXIMO]} allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="puntaje" name="Puntaje" stroke="#2563eb" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
