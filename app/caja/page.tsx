"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useUser } from "@/context/UserContext";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Caja diaria: resumen del día, cierre con conteo de efectivo y reapertura. Permisos: ver_caja / cerrar_caja / reabrir_caja.

interface Linea {
  nombre: string;
  cantidad: number;
  total: number;
}

interface Resumen {
  fecha: string;
  estado: "ABIERTA" | "CERRADA" | "REABIERTA";
  revision: number | null;
  totalPagado: number;
  efectivoEsperado: number;
  porMetodo: Linea[];
  porTipo: Linea[];
  pendientes: number;
  totalPendiente: number;
  anulados: number;
  totalAnulado: number;
  efectivoContado: number | null;
  diferencia: number | null;
  nota: string | null;
  cerradoPor: string | null;
  cerradoEn: string | null;
  reabiertoPor: string | null;
  reabiertoEn: string | null;
  motivoReapertura: string | null;
  desfaseConCierre: boolean;
}

interface Cierre {
  fecha: string;
  estado: string;
  revision: number;
  totalPagado: number;
  efectivoEsperado: number;
  efectivoContado: number | null;
  diferencia: number | null;
  nota: string | null;
  cerradoPor: string | null;
  cerradoEn: string | null;
  reabiertoPor: string | null;
  motivoReapertura: string | null;
}

function hoyLocal(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

const moneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const pesos = (n: number | null | undefined) => (n === null || n === undefined ? "—" : moneda.format(n));

function fechaHora(s: string | null): string {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString("es-CO");
}

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === "CERRADA") return <Badge>Cerrada</Badge>;
  if (estado === "REABIERTA") return <Badge variant="secondary">Reabierta</Badge>;
  return <Badge variant="outline">Abierta</Badge>;
}

function Contenido() {
  const { permissions } = useUser();
  const puedeCerrar = permissions.includes("cerrar_caja");
  const puedeReabrir = permissions.includes("reabrir_caja");

  const [fecha, setFecha] = useState(hoyLocal());
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cierres, setCierres] = useState<Cierre[]>([]);
  const [cargando, setCargando] = useState(false);
  const [contado, setContado] = useState("");
  const [nota, setNota] = useState("");
  const [motivo, setMotivo] = useState("");

  const cargar = useCallback(async () => {
    if (!fecha) return;
    setCargando(true);
    try {
      const [r, c] = await Promise.all([
        api.get<Resumen>("/api/caja/resumen", { params: { fecha } }),
        api.get<Cierre[]>("/api/caja/cierres"),
      ]);
      setResumen(r.data);
      setCierres(c.data);
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo cargar la caja"));
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    cargar();
    setContado("");
    setNota("");
    setMotivo("");
  }, [cargar]);

  const contadoNum = contado.trim() === "" ? null : Number(contado.replace(/\./g, "").replace(",", "."));
  const contadoValido = contadoNum !== null && !isNaN(contadoNum) && contadoNum >= 0;
  const diferenciaVista = resumen && contadoValido ? contadoNum! - resumen.efectivoEsperado : null;

  async function cerrar() {
    if (!resumen || !contadoValido) return;
    setCargando(true);
    try {
      await api.post("/api/caja/cierres", { fecha, efectivoContado: contadoNum, nota: nota.trim() || null });
      toast.success("Caja cerrada");
      await cargar();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo cerrar la caja"));
      setCargando(false);
    }
  }

  async function reabrir() {
    setCargando(true);
    try {
      await api.post(`/api/caja/cierres/${fecha}/reabrir`, { motivo: motivo.trim() });
      toast.success("Caja reabierta: ya puedes corregir pagos de ese día");
      await cargar();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo reabrir la caja"));
      setCargando(false);
    }
  }

  const cerrada = resumen?.estado === "CERRADA";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Caja</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de lo recaudado cada día y cierre con el efectivo contado. Un día cerrado no admite registrar, confirmar ni anular pagos
          hasta que se reabra.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="fecha">Día</Label>
          <Input id="fecha" type="date" value={fecha} max={hoyLocal()} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <Button variant="outline" onClick={cargar} disabled={cargando}>
          Actualizar
        </Button>
        {resumen && <EstadoBadge estado={resumen.estado} />}
      </div>

      {resumen && (
        <>
          {resumen.desfaseConCierre && (
            <Card className="border-destructive">
              <CardContent className="pt-6 text-sm">
                Los pagos de este día cambiaron después del cierre (el total actual no coincide con el que se cerró). Reabre la caja y
                vuelve a cerrarla para dejarla al día.
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Total recaudado</CardDescription>
                <CardTitle>{pesos(resumen.totalPagado)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Efectivo esperado en caja</CardDescription>
                <CardTitle>{pesos(resumen.efectivoEsperado)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Pendientes / anulados del día</CardDescription>
                <CardTitle className="text-base font-medium">
                  {resumen.pendientes} pendiente(s) · {pesos(resumen.totalPendiente)}
                  <br />
                  {resumen.anulados} anulado(s) · {pesos(resumen.totalAnulado)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { titulo: "Por método de pago", lineas: resumen.porMetodo },
              { titulo: "Por tipo de pago", lineas: resumen.porTipo },
            ].map((b) => (
              <Card key={b.titulo}>
                <CardHeader>
                  <CardTitle className="text-base">{b.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  {b.lineas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin pagos confirmados este día.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead className="text-right">Pagos</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {b.lineas.map((l) => (
                          <TableRow key={l.nombre}>
                            <TableCell>{l.nombre}</TableCell>
                            <TableCell className="text-right">{l.cantidad}</TableCell>
                            <TableCell className="text-right">{pesos(l.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {cerrada ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cierre (revisión {resumen.revision})</CardTitle>
                <CardDescription>
                  Cerrada por {resumen.cerradoPor ?? "—"} el {fechaHora(resumen.cerradoEn)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Efectivo contado: <strong>{pesos(resumen.efectivoContado)}</strong> · Diferencia:{" "}
                  <strong>{pesos(resumen.diferencia)}</strong>
                </p>
                {resumen.nota && <p>Nota: {resumen.nota}</p>}
                {puedeReabrir && (
                  <div className="flex flex-wrap items-end gap-2 border-t pt-3">
                    <div className="min-w-64 flex-1">
                      <Label htmlFor="motivo">Motivo para reabrir (mínimo 5 caracteres)</Label>
                      <Input id="motivo" value={motivo} maxLength={300} onChange={(e) => setMotivo(e.target.value)} />
                    </div>
                    <Button variant="destructive" onClick={reabrir} disabled={cargando || motivo.trim().length < 5}>
                      Reabrir caja
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            puedeCerrar && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cerrar la caja del día</CardTitle>
                  <CardDescription>
                    Cuenta el efectivo y escríbelo. Si no coincide con lo esperado ({pesos(resumen.efectivoEsperado)}), explica la
                    diferencia en la nota.
                    {resumen.estado === "REABIERTA" && resumen.motivoReapertura && (
                      <> Reabierta por {resumen.reabiertoPor ?? "—"}: {resumen.motivoReapertura}.</>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="contado">Efectivo contado (COP)</Label>
                      <Input id="contado" inputMode="decimal" value={contado} onChange={(e) => setContado(e.target.value)} />
                      {diferenciaVista !== null && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {diferenciaVista === 0
                            ? "Cuadra exacto."
                            : diferenciaVista > 0
                              ? `Sobran ${pesos(diferenciaVista)}`
                              : `Faltan ${pesos(-diferenciaVista)}`}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="nota">Nota {diferenciaVista !== null && diferenciaVista !== 0 ? "(obligatoria)" : "(opcional)"}</Label>
                      <Input id="nota" value={nota} maxLength={300} onChange={(e) => setNota(e.target.value)} />
                    </div>
                  </div>
                  <Button
                    onClick={cerrar}
                    disabled={
                      cargando || !contadoValido || (diferenciaVista !== null && diferenciaVista !== 0 && nota.trim() === "")
                    }
                  >
                    Cerrar caja
                  </Button>
                </CardContent>
              </Card>
            )
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cierres recientes (últimos 60 días)</CardTitle>
        </CardHeader>
        <CardContent>
          {cierres.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay cierres.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Recaudado</TableHead>
                  <TableHead className="text-right">Contado</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                  <TableHead>Cerró</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cierres.map((c) => (
                  <TableRow key={c.fecha} className="cursor-pointer" onClick={() => setFecha(c.fecha)}>
                    <TableCell>{c.fecha}</TableCell>
                    <TableCell>
                      <EstadoBadge estado={c.estado} />
                    </TableCell>
                    <TableCell className="text-right">{pesos(c.totalPagado)}</TableCell>
                    <TableCell className="text-right">{pesos(c.efectivoContado)}</TableCell>
                    <TableCell className="text-right">{pesos(c.diferencia)}</TableCell>
                    <TableCell>{c.cerradoPor ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CajaPage() {
  return (
    <ProtectedRoute requiredPermission="ver_caja">
      <Contenido />
    </ProtectedRoute>
  );
}
