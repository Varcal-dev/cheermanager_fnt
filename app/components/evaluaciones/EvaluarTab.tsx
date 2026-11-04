"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  PUNTAJE_MAXIMO, hoyLocal, listarMiembros, porCategoria,
  type Criterio, type Grupo, type Miembro, type ResultadoLote,
} from "@/app/lib/evaluaciones";

type Modo = "criterio" | "deportista";

const valido = (v: string) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= PUNTAJE_MAXIMO;

export default function EvaluarTab({ grupos, criterios }: { grupos: Grupo[]; criterios: Criterio[] }) {
  const [modo, setModo] = useState<Modo>("criterio");
  const [grupoId, setGrupoId] = useState("");
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [fecha, setFecha] = useState(hoyLocal());
  const [criterioId, setCriterioId] = useState("");
  const [deportistaId, setDeportistaId] = useState("");
  const [notas, setNotas] = useState<Record<string, string>>({}); // clave: deportistaId (modo criterio) o criterioId (modo deportista)
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setMiembros([]);
    setDeportistaId("");
    setNotas({});
    setErrores({});
    if (!grupoId) return;
    listarMiembros(Number(grupoId)).then(setMiembros).catch(() => toast.error("No se pudo cargar el grupo"));
  }, [grupoId]);

  useEffect(() => {
    setNotas({});
    setErrores({});
  }, [modo, criterioId, deportistaId]);

  const nombrePorId = useMemo(() => new Map(miembros.map((m) => [String(m.deportistaId), m.nombre])), [miembros]);
  const nombreCriterio = useMemo(() => new Map(criterios.map((c) => [String(c.id), c.nombre])), [criterios]);
  const llenas = Object.entries(notas).filter(([, v]) => v !== "");
  const hayInvalidas = llenas.some(([, v]) => !valido(v));
  const listo = llenas.length > 0 && !hayInvalidas && !!fecha && (modo === "criterio" ? !!criterioId : !!deportistaId);

  async function enviar() {
    setEnviando(true);
    setErrores({});
    try {
      const res =
        modo === "criterio"
          ? await api.post<ResultadoLote>("/api/evaluaciones/por-criterio", {
              criterioId: Number(criterioId),
              fecha,
              registros: llenas.map(([id, v]) => ({ deportistaId: Number(id), puntajeObtenido: Number(v) })),
            })
          : await api.post<ResultadoLote>("/api/evaluaciones/masivo", {
              deportistaId: Number(deportistaId),
              fecha,
              registros: llenas.map(([id, v]) => ({ criterioId: Number(id), puntajeObtenido: Number(v) })),
            });
      const { registradas, errores: errs } = res.data;
      if (registradas.length > 0) toast.success(`${registradas.length} evaluación(es) guardada(s)`);
      const fallidas = Object.keys(errs ?? {});
      if (fallidas.length > 0) {
        setErrores(errs);
        // se quitan las que sí se guardaron para poder reenviar solo las fallidas
        setNotas((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => fallidas.includes(k))));
        toast.warn(`${fallidas.length} no se guardaron: revisa los mensajes en rojo`);
      } else {
        setNotas({});
      }
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudieron guardar las evaluaciones"));
    } finally {
      setEnviando(false);
    }
  }

  const campo = (clave: string) => (
    <div>
      <Input
        type="number" min={0} max={PUNTAJE_MAXIMO} step={1} className="h-8 w-24"
        value={notas[clave] ?? ""} aria-label={`Puntaje ${nombrePorId.get(clave) ?? nombreCriterio.get(clave) ?? clave}`}
        onChange={(e) => setNotas({ ...notas, [clave]: e.target.value })}
      />
      {notas[clave] && !valido(notas[clave]) && <p className="text-xs text-red-600">0 a {PUNTAJE_MAXIMO}</p>}
      {errores[clave] && <p className="max-w-xs text-xs text-red-600">{errores[clave]}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={modo === "criterio" ? "default" : "outline"} onClick={() => setModo("criterio")}>Un criterio a todo el grupo</Button>
        <Button variant={modo === "deportista" ? "default" : "outline"} onClick={() => setModo("deportista")}>Un deportista, varios criterios</Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div>
            <Label htmlFor="v-grupo">Grupo</Label>
            <select id="v-grupo" className="h-9 rounded-md border bg-background px-2 text-sm" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
              <option value="">Elige un grupo</option>
              {grupos.map((g) => (<option key={g.id} value={g.id}>{g.nombre}</option>))}
            </select>
          </div>
          <div>
            <Label htmlFor="v-fecha">Fecha</Label>
            <Input id="v-fecha" type="date" max={hoyLocal()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          {modo === "criterio" ? (
            <div>
              <Label htmlFor="v-criterio">Criterio</Label>
              <select id="v-criterio" className="h-9 rounded-md border bg-background px-2 text-sm" value={criterioId} onChange={(e) => setCriterioId(e.target.value)}>
                <option value="">Elige un criterio</option>
                {porCategoria(criterios).map(([cat, lista]) => (
                  <optgroup key={cat} label={cat}>
                    {lista.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                  </optgroup>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <Label htmlFor="v-deportista">Deportista</Label>
              <select id="v-deportista" className="h-9 rounded-md border bg-background px-2 text-sm" value={deportistaId} onChange={(e) => setDeportistaId(e.target.value)}>
                <option value="">Elige un deportista</option>
                {miembros.map((m) => (<option key={m.deportistaId} value={m.deportistaId}>{m.nombre}</option>))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {grupoId && miembros.length === 0 && <p className="text-sm text-muted-foreground">Este grupo no tiene deportistas activos.</p>}
      {criterios.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay criterios de evaluación: créalos en “Criterios de evaluación”.</p>}

      {modo === "criterio" && criterioId && miembros.length > 0 && (
        <Table>
          <TableHeader><TableRow><TableHead>Deportista</TableHead><TableHead>Puntaje (0–{PUNTAJE_MAXIMO})</TableHead></TableRow></TableHeader>
          <TableBody>
            {miembros.map((m) => (
              <TableRow key={m.deportistaId}>
                <TableCell>{m.nombre}</TableCell>
                <TableCell>{campo(String(m.deportistaId))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {modo === "deportista" && deportistaId && (
        <Table>
          <TableHeader><TableRow><TableHead>Criterio</TableHead><TableHead>Puntaje (0–{PUNTAJE_MAXIMO})</TableHead></TableRow></TableHeader>
          <TableBody>
            {porCategoria(criterios).map(([cat, lista]) => (
              <Fragment key={cat}>
                <TableRow><TableCell colSpan={2} className="bg-muted/50 text-xs font-semibold uppercase">{cat}</TableCell></TableRow>
                {lista.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell>{campo(String(c.id))}</TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={enviar} disabled={!listo || enviando}>Guardar {llenas.length > 0 ? `(${llenas.length})` : ""}</Button>
        <p className="text-xs text-muted-foreground">Solo se guardan los puntajes que escribas. No se repite el mismo criterio para un deportista el mismo día.</p>
      </div>
    </div>
  );
}
