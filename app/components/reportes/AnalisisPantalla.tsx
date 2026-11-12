"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, Bar, BarChart } from "recharts";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCOP } from "@/app/lib/facturas-pagos";
import { obtenerAnalisis, type Analisis } from "@/app/lib/reportes";

const dos = (n: number) => String(n).padStart(2, "0");
const aISO = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const etiqueta = (m: string) => `${MESES[Number(m.split("-")[1]) - 1]} ${m.slice(2, 4)}`;
const pct = (v: number | null) => (v === null ? "—" : `${v}%`);

function rango(meses: number) {
  const h = new Date();
  return { desde: aISO(new Date(h.getFullYear(), h.getMonth() - (meses - 1), 1)), hasta: aISO(h) };
}

function Kpi({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{titulo}</div>
        <div className="mt-1 text-2xl font-semibold">{valor}</div>
        {nota && <div className="text-xs text-muted-foreground">{nota}</div>}
      </CardContent>
    </Card>
  );
}

export default function AnalisisPantalla() {
  const inicial = rango(12);
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);
  const [datos, setDatos] = useState<Analisis | null>(null);
  const [cargando, setCargando] = useState(false);
  const valido = !!desde && !!hasta && desde <= hasta;

  useEffect(() => {
    if (!valido) return;
    let vigente = true;
    setCargando(true);
    obtenerAnalisis(desde, hasta)
      .then((d) => vigente && setDatos(d))
      .catch((e) => vigente && toast.error(getErrorMessage(e, "No se pudo cargar el análisis")))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [desde, hasta, valido]);

  const serie = useMemo(
    () => (datos?.meses ?? []).map((m) => ({ ...m, etiqueta: etiqueta(m.mes) })),
    [datos],
  );
  const aplicar = (n: number) => { const r = rango(n); setDesde(r.desde); setHasta(r.hasta); };
  const r = datos?.resumen;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Análisis histórico</h1>
        <p className="text-sm text-muted-foreground">
          Evolución mensual del club: altas, asistencia, retención, evaluaciones y recaudo.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-1">
            <Label htmlFor="an-desde" className="text-xs text-muted-foreground">Desde</Label>
            <Input id="an-desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="an-hasta" className="text-xs text-muted-foreground">Hasta</Label>
            <Input id="an-hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className="w-44" />
          </div>
          <div className="flex flex-wrap gap-2 pb-0.5">
            <Button variant="outline" size="sm" onClick={() => aplicar(6)}>6 meses</Button>
            <Button variant="outline" size="sm" onClick={() => aplicar(12)}>12 meses</Button>
            <Button variant="outline" size="sm" onClick={() => aplicar(24)}>24 meses</Button>
          </div>
          {!valido && <p className="w-full text-sm text-destructive">La fecha inicial debe ser anterior o igual a la final.</p>}
        </CardContent>
      </Card>

      {cargando && !datos ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p>
      ) : datos && r ? (
        <div className={cargando ? "space-y-6 opacity-60" : "space-y-6"} aria-busy={cargando}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi titulo="Deportistas nuevos" valor={String(r.altas)} nota="por fecha de inscripción" />
            <Kpi titulo="Asistencia" valor={pct(r.tasaAsistencia)} nota="Presente + Tarde sobre sesiones registradas" />
            <Kpi titulo="Retención mensual" valor={pct(r.retencionPromedio)} nota="entrenaron el mes anterior y este" />
            <Kpi titulo="Promedio de evaluación" valor={r.promedioEvaluacion === null ? "—" : r.promedioEvaluacion.toFixed(2)} nota="escala 0 a 10" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Asistencia y retención (%)</CardTitle>
                <CardDescription>Los meses sin datos quedan en blanco.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={serie}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="etiqueta" tickLine={false} fontSize={12} />
                      <YAxis domain={[0, 100]} tickLine={false} fontSize={12} width={36} />
                      <RTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="tasaAsistencia" name="Asistencia" stroke="hsl(var(--chart-1))" strokeWidth={2} connectNulls />
                      <Line type="monotone" dataKey="retencion" name="Retención" stroke="hsl(var(--chart-2))" strokeWidth={2} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Altas y deportistas que entrenan</CardTitle>
                <CardDescription>Entrenan = asistieron al menos una vez en el mes.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serie}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="etiqueta" tickLine={false} fontSize={12} />
                      <YAxis tickLine={false} fontSize={12} width={36} allowDecimals={false} />
                      <RTooltip />
                      <Legend />
                      <Bar dataKey="deportistasActivos" name="Entrenan" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="altas" name="Altas" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Detalle por mes</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Altas</TableHead>
                    <TableHead className="text-right">Entrenan</TableHead>
                    <TableHead className="text-right">Sesiones</TableHead>
                    <TableHead className="text-right">Asistencia</TableHead>
                    <TableHead className="text-right">Retención</TableHead>
                    <TableHead className="text-right">Eval. prom.</TableHead>
                    <TableHead className="text-right">Cobrado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serie.map((m) => (
                    <TableRow key={m.mes}>
                      <TableCell>{m.etiqueta}</TableCell>
                      <TableCell className="text-right">{m.altas}</TableCell>
                      <TableCell className="text-right">{m.deportistasActivos}</TableCell>
                      <TableCell className="text-right">{m.sesiones}</TableCell>
                      <TableCell className="text-right">{pct(m.tasaAsistencia)}</TableCell>
                      <TableCell className="text-right">{pct(m.retencion)}</TableCell>
                      <TableCell className="text-right">{m.promedioEvaluacion === null ? "—" : m.promedioEvaluacion.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{formatCOP(m.cobrado)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deportistas con baja asistencia</CardTitle>
              <CardDescription>Menos de 60% con al menos 4 sesiones registradas en el rango (máx. 25).</CardDescription>
            </CardHeader>
            <CardContent>
              {datos.enRiesgo.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nadie está por debajo del umbral.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deportista</TableHead>
                      <TableHead className="text-right">Asistió</TableHead>
                      <TableHead className="text-right">Sesiones</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datos.enRiesgo.map((x) => (
                      <TableRow key={x.deportistaId}>
                        <TableCell>{x.nombre}</TableCell>
                        <TableCell className="text-right">{x.asistidas}</TableCell>
                        <TableCell className="text-right">{x.sesiones}</TableCell>
                        <TableCell className="text-right text-destructive">{x.tasa}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
