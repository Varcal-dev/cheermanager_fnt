"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Printer, Loader2, Send, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import AvisosPortal from "@/app/components/portal/AvisosPortal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCOP, formatFecha, type Factura, type Pago } from "@/app/lib/facturas-pagos";
import {
  descargarCSV,
  obtenerMiPerfil,
  portalAsistencias,
  portalCancelarSolicitud,
  portalEvaluaciones,
  portalFacturas,
  portalObjetivos,
  portalPagos,
  portalRutinas,
  portalSolicitar,
  portalSolicitudes,
  portalTemporadasAbiertas,
  type AsistenciaItem,
  type DeportistaResumen,
  type EvaluacionItem,
  type MiPerfil,
  type ObjetivoItem,
  type RutinaItem,
  type Solicitud,
  type TemporadaItem,
} from "@/app/lib/portal";

const ETIQUETA_CUENTA: Record<string, string> = {
  PAGADA: "Pagada",
  ABONO_PARCIAL: "Abono parcial",
  PENDIENTE: "Pendiente",
  EN_MORA: "En mora",
  ANULADA: "Anulada",
};

const ETIQUETA_SOLICITUD: Record<string, string> = {
  PENDIENTE: "Pendiente de revisión",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
};

function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{children}</p>;
}

function Acciones({ onCsv, deshabilitado }: { onCsv: () => void; deshabilitado?: boolean }) {
  return (
    <div className="flex gap-2 justify-end print:hidden">
      <Button size="sm" variant="outline" onClick={onCsv} disabled={deshabilitado}>
        <Download className="h-4 w-4 mr-1" /> Descargar (Excel/CSV)
      </Button>
      <Button size="sm" variant="outline" onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-1" /> Imprimir / PDF
      </Button>
    </div>
  );
}

export default function PortalPage() {
  const [perfil, setPerfil] = useState<MiPerfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState<string>("");

  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaItem[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionItem[]>([]);
  const [objetivos, setObjetivos] = useState<ObjetivoItem[]>([]);
  const [rutinas, setRutinas] = useState<RutinaItem[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [temporadas, setTemporadas] = useState<TemporadaItem[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  const [temporadaSel, setTemporadaSel] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await obtenerMiPerfil();
        setPerfil(p);
        if (p.deportistas.length > 0) setSeleccionado(String(p.deportistas[0].id));
        setTemporadas(await portalTemporadasAbiertas());
      } catch (e) {
        toast.error(getErrorMessage(e, "No se pudo cargar tu información"));
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const cargarDeportista = useCallback(async (id: number) => {
    setCargandoDatos(true);
    try {
      const [f, p, a, e, o, r, s] = await Promise.all([
        portalFacturas(id),
        portalPagos(id),
        portalAsistencias(id),
        portalEvaluaciones(id),
        portalObjetivos(id),
        portalRutinas(id),
        portalSolicitudes(id),
      ]);
      setFacturas(f);
      setPagos(p);
      setAsistencias(a);
      setEvaluaciones(e);
      setObjetivos(o);
      setRutinas(r);
      setSolicitudes(s);
    } catch (err) {
      toast.error(getErrorMessage(err, "No se pudieron cargar los datos"));
    } finally {
      setCargandoDatos(false);
    }
  }, []);

  useEffect(() => {
    if (seleccionado) cargarDeportista(Number(seleccionado));
  }, [seleccionado, cargarDeportista]);

  const dep: DeportistaResumen | undefined = perfil?.deportistas.find((d) => String(d.id) === seleccionado);
  const nombreArchivo = (tipo: string) =>
    `${tipo}-${(dep?.nombre ?? "deportista").replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 10)}`;

  const solicitar = async () => {
    if (!dep || !temporadaSel) {
      toast.error("Selecciona la temporada");
      return;
    }
    setEnviando(true);
    try {
      await portalSolicitar(dep.id, Number(temporadaSel), observaciones.trim());
      toast.success("Solicitud enviada. El club la revisará.");
      setTemporadaSel("");
      setObservaciones("");
      setSolicitudes(await portalSolicitudes(dep.id));
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo enviar la solicitud"));
    } finally {
      setEnviando(false);
    }
  };

  const cancelar = async (s: Solicitud) => {
    if (!confirm("¿Cancelar esta solicitud?")) return;
    try {
      await portalCancelarSolicitud(s.id);
      toast.success("Solicitud cancelada");
      if (dep) setSolicitudes(await portalSolicitudes(dep.id));
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo cancelar"));
    }
  };

  const activas = facturas.filter((f) => !f.anulada);
  const enMora = activas.filter((f) => f.estadoCuenta === "EN_MORA");
  const saldoTotal = activas.reduce((s, f) => s + (f.saldoPendiente ?? 0), 0);

  return (
    <ProtectedRoute requiredPermission="acceder_portal">
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-semibold">Mi portal</h1>
          <p className="text-sm text-muted-foreground">
            {perfil ? `Hola, ${perfil.nombre}. ` : ""}Consulta de solo lectura. Para cambios, comunícate con el club.
          </p>
        </div>

        <AvisosPortal />

        {cargando ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : !perfil || perfil.deportistas.length === 0 ? (
          <Vacio>No hay deportistas asociados a tu cuenta. Pide al club que los vincule.</Vacio>
        ) : (
          <>
            {perfil.deportistas.length > 1 && (
              <div className="max-w-xs print:hidden">
                <Select value={seleccionado} onValueChange={setSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Deportista" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfil.deportistas.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {dep && (
              <Card>
                <CardHeader>
                  <CardTitle>{dep.nombre}</CardTitle>
                  <CardDescription>
                    {dep.estado ?? "—"} · Grupos: {dep.grupos.length ? dep.grupos.join(", ") : "sin grupo"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Asistencia (últimos 90 días)</p>
                    <p className="text-lg font-semibold">
                      {dep.porcentajeAsistencia === null ? "—" : `${dep.porcentajeAsistencia}%`}
                      <span className="text-sm font-normal text-muted-foreground">
                        {" "}
                        ({dep.asistenciasPresentes}/{dep.asistenciasTotales})
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saldo pendiente</p>
                    <p className="text-lg font-semibold">{formatCOP(saldoTotal)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Facturas en mora</p>
                    <p className={`text-lg font-semibold ${enMora.length ? "text-destructive" : ""}`}>{enMora.length}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {cargandoDatos && <Loader2 className="h-5 w-5 animate-spin" />}

            <Tabs defaultValue="facturas">
              <TabsList className="flex-wrap h-auto print:hidden">
                <TabsTrigger value="facturas">Facturas</TabsTrigger>
                <TabsTrigger value="pagos">Pagos</TabsTrigger>
                <TabsTrigger value="asistencias">Asistencia</TabsTrigger>
                <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
                <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
                <TabsTrigger value="rutinas">Rutinas</TabsTrigger>
                <TabsTrigger value="temporada">Inscripción</TabsTrigger>
              </TabsList>

              <TabsContent value="facturas" className="space-y-3">
                <Acciones
                  deshabilitado={!facturas.length}
                  onCsv={() =>
                    descargarCSV(
                      nombreArchivo("facturas"),
                      ["Número", "Concepto", "Descripción", "Emisión", "Vence", "Total", "Pagado", "Saldo", "Estado"],
                      facturas.map((f) => [
                        f.numeroFactura, f.concepto, f.descripcion, f.fechaEmision, f.fechaVencimiento,
                        f.total, f.totalPagado, f.saldoPendiente, ETIQUETA_CUENTA[f.estadoCuenta ?? ""] ?? f.estadoCuenta,
                      ]),
                    )
                  }
                />
                {facturas.length === 0 ? (
                  <Vacio>Sin facturas.</Vacio>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Factura</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Emisión</TableHead>
                        <TableHead>Vence</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturas.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell>{f.numeroFactura}</TableCell>
                          <TableCell>{f.descripcion}</TableCell>
                          <TableCell>{formatFecha(f.fechaEmision)}</TableCell>
                          <TableCell>{formatFecha(f.fechaVencimiento)}</TableCell>
                          <TableCell className="text-right">{formatCOP(f.total)}</TableCell>
                          <TableCell className="text-right">{formatCOP(f.saldoPendiente ?? 0)}</TableCell>
                          <TableCell>
                            <Badge variant={f.estadoCuenta === "EN_MORA" ? "destructive" : f.estadoCuenta === "PAGADA" ? "success" : "secondary"}>
                              {ETIQUETA_CUENTA[f.estadoCuenta ?? ""] ?? f.estadoCuenta}
                              {f.estadoCuenta === "EN_MORA" && f.diasMora ? ` · ${f.diasMora} d` : ""}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="pagos" className="space-y-3">
                <Acciones
                  deshabilitado={!pagos.length}
                  onCsv={() =>
                    descargarCSV(
                      nombreArchivo("pagos"),
                      ["Fecha", "Factura", "Método", "Monto", "Estado"],
                      pagos.map((p) => [p.fecha, p.numeroFactura, p.metodoPago, p.monto, p.estado]),
                    )
                  }
                />
                {pagos.length === 0 ? (
                  <Vacio>Sin pagos registrados.</Vacio>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Factura</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagos.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{formatFecha(p.fecha)}</TableCell>
                          <TableCell>{p.numeroFactura}</TableCell>
                          <TableCell>{p.metodoPago}</TableCell>
                          <TableCell className="text-right">{formatCOP(p.monto)}</TableCell>
                          <TableCell>
                            <Badge variant={p.estado === "Anulado" ? "destructive" : "secondary"}>{p.estado}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="asistencias" className="space-y-3">
                <Acciones
                  deshabilitado={!asistencias.length}
                  onCsv={() =>
                    descargarCSV(
                      nombreArchivo("asistencia"),
                      ["Fecha", "Día", "Inicio", "Fin", "Estado"],
                      asistencias.map((a) => [a.fecha, a.dia, a.horaInicio, a.horaFin, a.estado]),
                    )
                  }
                />
                {asistencias.length === 0 ? (
                  <Vacio>Sin registros de asistencia en los últimos 90 días.</Vacio>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asistencias.map((a, i) => (
                        <TableRow key={i}>
                          <TableCell>{formatFecha(a.fecha)}</TableCell>
                          <TableCell>
                            {[a.dia, a.horaInicio && a.horaFin ? `${a.horaInicio.slice(0, 5)}–${a.horaFin.slice(0, 5)}` : null]
                              .filter(Boolean)
                              .join(" ")}
                          </TableCell>
                          <TableCell>{a.estado}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="evaluaciones" className="space-y-3">
                <Acciones
                  deshabilitado={!evaluaciones.length}
                  onCsv={() =>
                    descargarCSV(
                      nombreArchivo("evaluaciones"),
                      ["Fecha", "Categoría", "Criterio", "Puntaje"],
                      evaluaciones.map((e) => [e.fecha, e.categoria, e.criterio, e.puntaje]),
                    )
                  }
                />
                {evaluaciones.length === 0 ? (
                  <Vacio>Sin evaluaciones.</Vacio>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Criterio</TableHead>
                        <TableHead className="text-right">Puntaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluaciones.map((e, i) => (
                        <TableRow key={i}>
                          <TableCell>{formatFecha(e.fecha)}</TableCell>
                          <TableCell>{e.categoria}</TableCell>
                          <TableCell>{e.criterio}</TableCell>
                          <TableCell className="text-right">{e.puntaje}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="objetivos" className="space-y-3">
                <Acciones
                  deshabilitado={!objetivos.length}
                  onCsv={() =>
                    descargarCSV(
                      nombreArchivo("objetivos"),
                      ["Objetivo", "Descripción", "Creado", "Estado"],
                      objetivos.map((o) => [o.nombre, o.descripcion, o.fechaCreacion, o.estado]),
                    )
                  }
                />
                {objetivos.length === 0 ? (
                  <Vacio>Sin objetivos.</Vacio>
                ) : (
                  <ul className="space-y-2">
                    {objetivos.map((o, i) => (
                      <li key={i} className="rounded-md border p-3 text-sm">
                        <p className="font-medium">
                          {o.nombre} {o.estado && <Badge variant="secondary" className="ml-2">{o.estado}</Badge>}
                        </p>
                        {o.descripcion && <p className="text-muted-foreground">{o.descripcion}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="rutinas" className="space-y-3">
                <Acciones
                  deshabilitado={!rutinas.length}
                  onCsv={() =>
                    descargarCSV(
                      nombreArchivo("rutinas"),
                      ["Fecha", "Grupo", "Nivel", "Evento", "Puntaje total", "Observaciones"],
                      rutinas.map((r) => [r.fecha, r.grupo, r.nivel, r.evento, r.puntajeTotal, r.observaciones]),
                    )
                  }
                />
                {rutinas.length === 0 ? (
                  <Vacio>Sin evaluaciones de rutina para su grupo actual.</Vacio>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Nivel</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead className="text-right">Puntaje</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rutinas.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{formatFecha(r.fecha)}</TableCell>
                          <TableCell>{r.grupo}</TableCell>
                          <TableCell>{r.nivel}</TableCell>
                          <TableCell>{r.evento}</TableCell>
                          <TableCell className="text-right">{r.puntajeTotal}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="temporada" className="space-y-4">
                {dep && dep.inscripciones.length > 0 && (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Mis inscripciones</p>
                    {dep.inscripciones.map((i) => (
                      <p key={i.id} className="text-muted-foreground">
                        {i.temporada ?? "Sin temporada"} · {i.estado} · desde {formatFecha(i.fechaInscripcion)}
                        {i.fechaVencimiento ? ` hasta ${formatFecha(i.fechaVencimiento)}` : ""}
                      </p>
                    ))}
                  </div>
                )}

                <Card className="print:hidden">
                  <CardHeader>
                    <CardTitle className="text-base">Solicitar inscripción a una temporada</CardTitle>
                    <CardDescription>
                      El club revisa cada solicitud y, si la aprueba, define el plan y genera los cobros.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {temporadas.length === 0 ? (
                      <Vacio>No hay temporadas abiertas por ahora.</Vacio>
                    ) : (
                      <>
                        <Select value={temporadaSel} onValueChange={setTemporadaSel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la temporada" />
                          </SelectTrigger>
                          <SelectContent>
                            {temporadas.map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                {t.nombre} ({formatFecha(t.fechaInicio)} – {formatFecha(t.fechaFin)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Comentarios para el club (opcional)"
                          maxLength={300}
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                        />
                        <Button onClick={solicitar} disabled={enviando || !temporadaSel}>
                          <Send className="h-4 w-4 mr-1" /> {enviando ? "Enviando..." : "Enviar solicitud"}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {solicitudes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Mis solicitudes</p>
                    {solicitudes.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                        <div>
                          <p className="font-medium">
                            {s.temporada}{" "}
                            <Badge variant={s.estado === "RECHAZADA" ? "destructive" : s.estado === "APROBADA" ? "success" : "secondary"}>
                              {ETIQUETA_SOLICITUD[s.estado]}
                            </Badge>
                          </p>
                          <p className="text-muted-foreground">
                            Enviada {formatFecha(s.fechaSolicitud)}
                            {s.motivoResolucion ? ` · ${s.motivoResolucion}` : ""}
                          </p>
                        </div>
                        {s.estado === "PENDIENTE" && (
                          <Button size="sm" variant="ghost" onClick={() => cancelar(s)} aria-label="Cancelar solicitud">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}