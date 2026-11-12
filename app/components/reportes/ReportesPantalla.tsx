"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, FileSpreadsheet, Loader2, TrendingUp, Wallet } from "lucide-react";
import { toast } from "react-toastify";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCOP } from "@/app/lib/facturas-pagos";
import {
  descargarExporte,
  obtenerReporteFinanciero,
  type ItemReporte,
  type ReporteFinanciero,
  type TipoExporte,
} from "@/app/lib/reportes";

// ── Fechas (siempre en hora local, nunca toISOString: en Colombia corre el día después de las 19:00) ──
const dos = (n: number) => String(n).padStart(2, "0");
const aISO = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;

function rangoPredefinido(clave: "12m" | "anio" | "mes"): { desde: string; hasta: string } {
  const hoy = new Date();
  if (clave === "mes") return { desde: aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: aISO(hoy) };
  if (clave === "anio") return { desde: aISO(new Date(hoy.getFullYear(), 0, 1)), hasta: aISO(hoy) };
  // Últimos 12 meses completos incluyendo el actual: desde el día 1 de hace 11 meses.
  return { desde: aISO(new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1)), hasta: aISO(hoy) };
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const etiquetaMes = (m: string) => {
  const [a, mm] = m.split("-");
  return `${MESES[Number(mm) - 1]} ${a.slice(2)}`;
};

const NOMBRE_CONCEPTO: Record<string, string> = {
  MENSUALIDAD: "Mensualidades",
  INSCRIPCION: "Inscripciones",
  UNIFORME: "Uniformes",
  EVENTO: "Eventos",
  VENTA: "Tienda",
  OTROS: "Otros",
};

const EXPORTES: { tipo: TipoExporte; titulo: string; detalle: string; permiso: "finanzas" | "listados" }[] = [
  { tipo: "facturas", titulo: "Facturas", detalle: "Emisión, vencimiento, total, pagado, saldo y estado (incluye anuladas)", permiso: "finanzas" },
  { tipo: "pagos", titulo: "Pagos", detalle: "Fecha, factura, tipo y método de pago, estado, referencia y conciliación", permiso: "finanzas" },
  { tipo: "cierres-caja", titulo: "Cierres de caja", detalle: "Total pagado, efectivo esperado y contado, diferencia", permiso: "finanzas" },
  { tipo: "asistencia", titulo: "Asistencia", detalle: "Una fila por deportista, fecha y horario, con su estado", permiso: "listados" },
  { tipo: "evaluaciones", titulo: "Evaluaciones", detalle: "Puntaje por criterio, deportista y fecha", permiso: "listados" },
];

function Kpi({ icono: Icono, titulo, valor, nota, alerta }: {
  icono: typeof Wallet;
  titulo: string;
  valor: string;
  nota?: string;
  alerta?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icono className={`h-4 w-4 ${alerta ? "text-destructive" : ""}`} />
          {titulo}
        </div>
        <div className={`mt-1 text-2xl font-semibold ${alerta ? "text-destructive" : ""}`}>{valor}</div>
        {nota && <div className="text-xs text-muted-foreground">{nota}</div>}
      </CardContent>
    </Card>
  );
}

function TablaItems({ titulo, items, traducir }: { titulo: string; items: ItemReporte[]; traducir?: boolean }) {
  const total = items.reduce((s, i) => s + i.monto, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos en este rango.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.nombre}>
                  <TableCell>{traducir ? (NOMBRE_CONCEPTO[i.nombre] ?? i.nombre) : i.nombre}</TableCell>
                  <TableCell className="text-right">{i.cantidad}</TableCell>
                  <TableCell className="text-right">{formatCOP(i.monto)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {total > 0 ? `${Math.round((i.monto / total) * 100)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReportesPantalla() {
  const { permissions } = useUser();
  const puedeFinanzas = permissions.includes("generar_reporte_financiero");
  const puedeListados = permissions.includes("exportar_listados");

  const inicial = useMemo(() => rangoPredefinido("12m"), []);
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);
  const [reporte, setReporte] = useState<ReporteFinanciero | null>(null);
  const [cargando, setCargando] = useState(true);
  const [bajando, setBajando] = useState<TipoExporte | null>(null);

  const rangoValido = Boolean(desde) && Boolean(hasta) && desde <= hasta;

  const cargar = useCallback(async () => {
    if (!rangoValido) return;
    setCargando(true);
    try {
      setReporte(await obtenerReporteFinanciero(desde, hasta));
    } catch (e) {
      setReporte(null);
      toast.error(getErrorMessage(e, "No se pudo cargar el reporte"));
    } finally {
      setCargando(false);
    }
  }, [desde, hasta, rangoValido]);

  // Carga inicial y al cambiar un rango válido (los presets cambian ambas fechas a la vez: una sola petición).
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function bajar(tipo: TipoExporte) {
    setBajando(tipo);
    try {
      await descargarExporte(tipo, desde, hasta);
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo descargar el archivo"));
    } finally {
      setBajando(null);
    }
  }

  const aplicar = (clave: "12m" | "anio" | "mes") => {
    const r = rangoPredefinido(clave);
    setDesde(r.desde);
    setHasta(r.hasta);
  };

  const serie = (reporte?.meses ?? []).map((m) => ({ ...m, etiqueta: etiquetaMes(m.mes) }));
  const c = reporte?.cartera;
  const t = reporte?.totales;
  const tasa = t && t.facturado > 0 ? Math.round((t.cobrado / t.facturado) * 100) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Resumen financiero del club y descarga de datos en CSV (se abren directo en Excel). Los exportes usan el mismo rango de fechas.
        </p>
      </div>

      {/* Rango de fechas */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-1">
            <Label htmlFor="rep-desde" className="text-xs text-muted-foreground">Desde</Label>
            <Input id="rep-desde" type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} className="w-44" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rep-hasta" className="text-xs text-muted-foreground">Hasta</Label>
            <Input id="rep-hasta" type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className="w-44" />
          </div>
          <div className="flex flex-wrap gap-2 pb-0.5">
            <Button variant="outline" size="sm" onClick={() => aplicar("mes")}>Este mes</Button>
            <Button variant="outline" size="sm" onClick={() => aplicar("anio")}>Este año</Button>
            <Button variant="outline" size="sm" onClick={() => aplicar("12m")}>Últimos 12 meses</Button>
          </div>
          {!rangoValido && <p className="w-full text-sm text-destructive">La fecha inicial debe ser anterior o igual a la final.</p>}
        </CardContent>
      </Card>

      {cargando && !reporte ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando reporte…
        </p>
      ) : reporte && t && c ? (
        <div className={cargando ? "space-y-6 opacity-60 transition-opacity" : "space-y-6"} aria-busy={cargando}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icono={TrendingUp} titulo="Facturado" valor={formatCOP(t.facturado)} nota={`${t.facturas} facturas vigentes`} />
            <Kpi icono={Wallet} titulo="Cobrado" valor={formatCOP(t.cobrado)} nota={tasa !== null ? `${tasa}% de lo facturado (${t.pagos} pagos)` : `${t.pagos} pagos`} />
            <Kpi icono={FileSpreadsheet} titulo="Saldo por cobrar hoy" valor={formatCOP(c.saldoPendiente)} nota={`${c.facturasConSaldo} facturas con saldo`} />
            <Kpi icono={AlertTriangle} titulo="En mora hoy" valor={formatCOP(c.saldoEnMora)} nota={`${c.facturasEnMora} facturas vencidas`} alerta={c.facturasEnMora > 0} />
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">
            Facturado y cobrado dependen del rango elegido. El saldo por cobrar y la mora son siempre los de hoy. «Cobrado» puede incluir pagos de facturas emitidas antes del rango.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Facturado y cobrado por mes</CardTitle>
              <CardDescription>Facturas por fecha de emisión; pagos por fecha de pago.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serie}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="etiqueta" tickLine={false} fontSize={12} />
                    <YAxis tickLine={false} fontSize={12} tickFormatter={(v) => (v >= 1_000_000 ? `${v / 1_000_000}M` : v >= 1000 ? `${v / 1000}k` : String(v))} width={48} />
                    <RTooltip formatter={(v: number) => formatCOP(v)} />
                    <Legend />
                    <Bar dataKey="facturado" name="Facturado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cobrado" name="Cobrado" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <TablaItems titulo="Facturado por concepto" items={reporte.porConcepto} traducir />
            <TablaItems titulo="Cobrado por método de pago" items={reporte.porMetodo} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Antigüedad de la mora</CardTitle>
              <CardDescription>Días transcurridos desde el vencimiento de cada factura con saldo.</CardDescription>
            </CardHeader>
            <CardContent>
              {c.facturasEnMora === 0 ? (
                <p className="text-sm text-muted-foreground">No hay facturas en mora.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tramo</TableHead>
                      <TableHead className="text-right">Facturas</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.antiguedad.map((x) => (
                      <TableRow key={x.etiqueta}>
                        <TableCell>{x.etiqueta}</TableCell>
                        <TableCell className="text-right">{x.facturas}</TableCell>
                        <TableCell className="text-right">{formatCOP(x.saldo)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        !cargando && <p className="text-sm text-muted-foreground">No se pudo mostrar el reporte para este rango.</p>
      )}

      {/* Exportes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Descargar datos (CSV)</CardTitle>
          <CardDescription>
            Rango: {desde || "—"} a {hasta || "—"}. Máximo 5 años por descarga. Los datos de salud no se incluyen en ningún exporte.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {EXPORTES.filter((e) => (e.permiso === "finanzas" ? puedeFinanzas : puedeListados)).map((e) => (
            <div key={e.tipo} className="flex items-start justify-between gap-3 rounded-md border p-3">
              <div>
                <div className="font-medium">{e.titulo}</div>
                <div className="text-xs text-muted-foreground">{e.detalle}</div>
              </div>
              <Button size="sm" variant="outline" disabled={!rangoValido || bajando !== null} onClick={() => bajar(e.tipo)}>
                {bajando === e.tipo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                CSV
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
