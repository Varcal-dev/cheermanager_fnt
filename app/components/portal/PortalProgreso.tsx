"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { portalAsistencias, portalEvaluaciones, type AsistenciaItem, type EvaluacionItem } from "@/app/lib/portal";

const dos = (n: number) => String(n).padStart(2, "0");
const aISO = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const promedio = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Gráficos del deportista: asistencia mes a mes (últimos 6 meses) y evolución de sus evaluaciones.
export default function PortalProgreso({ deportistaId }: { deportistaId: number }) {
  const [asistencias, setAsistencias] = useState<AsistenciaItem[] | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionItem[] | null>(null);

  useEffect(() => {
    let activo = true;
    setAsistencias(null);
    setEvaluaciones(null);
    const hoy = new Date();
    const desde = aISO(new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1));
    portalAsistencias(deportistaId, desde, aISO(hoy))
      .then((a) => activo && setAsistencias(a))
      .catch(() => activo && setAsistencias([]));
    portalEvaluaciones(deportistaId)
      .then((e) => activo && setEvaluaciones(e))
      .catch(() => activo && setEvaluaciones([]));
    return () => {
      activo = false;
    };
  }, [deportistaId]);

  const porMes = useMemo(() => {
    const hoy = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i, 1);
      return { clave: `${d.getFullYear()}-${dos(d.getMonth() + 1)}`, etiqueta: MESES[d.getMonth()], presentes: 0, total: 0 };
    });
    for (const a of asistencias ?? []) {
      const m = meses.find((x) => x.clave === a.fecha.slice(0, 7));
      if (!m) continue;
      m.total++;
      if (a.estado === "Presente") m.presentes++;
    }
    return meses.map((m) => ({ ...m, porcentaje: m.total ? Math.round((m.presentes / m.total) * 100) : null }));
  }, [asistencias]);

  const evolucion = useMemo(() => {
    const porFecha = new Map<string, number[]>();
    for (const e of evaluaciones ?? []) {
      if (e.puntaje === null) continue;
      porFecha.set(e.fecha, [...(porFecha.get(e.fecha) ?? []), e.puntaje]);
    }
    return Array.from(porFecha.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, ps]) => ({ fecha: `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`, promedio: Math.round(promedio(ps) * 10) / 10 }));
  }, [evaluaciones]);

  const porCategoria = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const e of evaluaciones ?? []) {
      if (e.puntaje === null) continue;
      const k = e.categoria ?? "Sin categoría";
      m.set(k, [...(m.get(k) ?? []), e.puntaje]);
    }
    return Array.from(m.entries()).map(([categoria, ps]) => ({ categoria, promedio: Math.round(promedio(ps) * 10) / 10 }));
  }, [evaluaciones]);

  if (asistencias === null || evaluaciones === null) return <Loader2 className="h-5 w-5 animate-spin" />;

  const hayAsistencia = porMes.some((m) => m.total > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asistencia por mes</CardTitle>
          <CardDescription>Porcentaje de sesiones a las que asististe (últimos 6 meses).</CardDescription>
        </CardHeader>
        <CardContent>
          {hayAsistencia ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porMes}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="etiqueta" tickLine={false} fontSize={12} />
                  <YAxis domain={[0, 100]} unit="%" tickLine={false} fontSize={12} width={40} />
                  <RTooltip formatter={(v) => (v === null || v === undefined ? "Sin sesiones" : `${v}%`)} />
                  <Bar dataKey="porcentaje" name="Asistencia" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no hay asistencias registradas en estos meses.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolución de tus evaluaciones</CardTitle>
          <CardDescription>Promedio de los puntajes en cada fecha de evaluación.</CardDescription>
        </CardHeader>
        <CardContent>
          {evolucion.length >= 2 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucion}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="fecha" tickLine={false} fontSize={12} />
                  <YAxis tickLine={false} fontSize={12} width={32} />
                  <RTooltip />
                  <Line type="monotone" dataKey="promedio" name="Promedio" stroke="hsl(var(--chart-2))" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {evolucion.length === 1 ? "Con una sola evaluación aún no se puede ver la evolución." : "Todavía no tienes evaluaciones."}
            </p>
          )}
        </CardContent>
      </Card>

      {porCategoria.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Promedio por categoría de habilidad</CardTitle>
            <CardDescription>Sobre todas tus evaluaciones: ayuda a ver dónde estás más fuerte.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porCategoria} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} fontSize={12} />
                  <YAxis type="category" dataKey="categoria" tickLine={false} fontSize={12} width={110} />
                  <RTooltip />
                  <Bar dataKey="promedio" name="Promedio" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
