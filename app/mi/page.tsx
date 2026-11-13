"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Printer, Loader2, Send, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import AvisosPortal from "@/app/components/portal/AvisosPortal";
import AvisoAutorizaciones from "@/app/components/portal/AvisoAutorizaciones";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortalCarnet from "@/app/components/portal/PortalCarnet";
import PortalHorarios from "@/app/components/portal/PortalHorarios";
import PortalProgreso from "@/app/components/portal/PortalProgreso";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TablaResponsiva } from "@/app/components/TablaResponsiva";
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

const TABS = [
  "carnet", "horarios", "progreso", "facturas", "pagos", "asistencias", "evaluaciones", "objetivos", "rutinas", "temporada",
] as const;
type Tab = (typeof TABS)[number];
const TAB_INICIAL: Tab = "facturas";

function Acciones({ onCsv, deshabilitado }: { onCsv: () => void; deshabilitado?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2 justify-end print:hidden">
      <Button size="sm" variant="outline" onClick={onCsv} disabled={deshabilitado}>
        <Download className="h-4 w-4 mr-1" /> Descargar (Excel/CSV)
      </Button>
      <Button size="sm" variant="outline" onClick={() => window.print()}>
        <Printer className="h-4 w-4 mr-1" /> Imprimir / PDF
      </Button>
    </div>
  );
}

// La pestaña activa vive en la URL (/mi?tab=pagos): así la barra inferior del teléfono y los enlaces
// pueden llevar directo a Facturas, Horarios o Carnet, y "atrás" del navegador se comporta como se espera.
export default function PortalPage() {
  return (
    <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin" />}>
      <PortalContenido />
    </Suspense>
  );
}

function PortalContenido() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab = (TABS as readonly string[]).includes(tabParam ?? "") ? (tabParam as Tab) : TAB_INICIAL;
  const cambiarTab = (v: string) => router.replace(`${pathname}?tab=${v}`, { scroll: false });

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

  // En teléfono la lista de pestañas se desliza de lado: la activa se centra para no quedar fuera de vista.
  const listaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listaRef.current
      ?.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [tab, cargando, seleccionado]);

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
        <AvisoAutorizaciones />

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

            <Tabs value={tab} onValueChange={cambiarTab}>
              <div ref={listaRef} className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 print:hidden">
              <TabsList className="h-auto w-max justify-start">
                <TabsTrigger className="shrink-0" value="carnet">Carnet</TabsTrigger>
                <TabsTrigger className="shrink-0" value="horarios">Horarios</TabsTrigger>
                <TabsTrigger className="shrink-0" value="progreso">Progreso</TabsTrigger>
                <TabsTrigger className="shrink-0" value="facturas">Facturas</TabsTrigger>
                <TabsTrigger className="shrink-0" value="pagos">Pagos</TabsTrigger>
                <TabsTrigger className="shrink-0" value="asistencias">Asistencia</TabsTrigger>
                <TabsTrigger className="shrink-0" value="evaluaciones">Evaluaciones</TabsTrigger>
                <TabsTrigger className="shrink-0" value="objetivos">Objetivos</TabsTrigger>
                <TabsTrigger className="shrink-0" value="rutinas">Rutinas</TabsTrigger>
                <TabsTrigger className="shrink-0" value="temporada">Inscripción</TabsTrigger>
              </TabsList>
              </div>

              <TabsContent value="carnet">
                <PortalCarnet deportistaId={Number(seleccionado)} />
              </TabsContent>

              <TabsContent value="horarios">
                <PortalHorarios deportistaId={Number(seleccionado)} />
              </TabsContent>

              <TabsContent value="progreso">
                <PortalProgreso deportistaId={Number(seleccionado)} />
              </TabsContent>

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
                  <TablaResponsiva
                    filas={facturas}
                    getKey={(f) => f.id}
                    columnas={[
                      { clave: "num", titulo: "Factura", movil: "titulo", celda: (f) => f.numeroFactura },
                      { clave: "desc", titulo: "Descripción", movil: "titulo", celda: (f) => f.descripcion },
                      { clave: "emi", titulo: "Emisión", celda: (f) => formatFecha(f.fechaEmision) },
                      { clave: "ven", titulo: "Vence", celda: (f) => formatFecha(f.fechaVencimiento) },
                      { clave: "tot", titulo: "Total", alinear: "derecha", celda: (f) => formatCOP(f.total) },
                      { clave: "sal", titulo: "Saldo", alinear: "derecha", movil: "destacado", celda: (f) => formatCOP(f.saldoPendiente ?? 0) },
                      {
                        clave: "est",
                        titulo: "Estado",
                        movil: "destacado",
                        celda: (f) => (
                          <Badge variant={f.estadoCuenta === "EN_MORA" ? "destructive" : f.estadoCuenta === "PAGADA" ? "success" : "secondary"}>
                            {ETIQUETA_CUENTA[f.estadoCuenta ?? ""] ?? f.estadoCuenta}
                            {f.estadoCuenta === "EN_MORA" && f.diasMora ? ` · ${f.diasMora} d` : ""}
                          </Badge>
                        ),
                      },
                    ]}
                  />
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
                  <TablaResponsiva
                    filas={pagos}
                    getKey={(p) => p.id}
                    columnas={[
                      { clave: "fec", titulo: "Fecha", movil: "titulo", celda: (p) => formatFecha(p.fecha) },
                      { clave: "fac", titulo: "Factura", celda: (p) => p.numeroFactura },
                      { clave: "met", titulo: "Método", celda: (p) => p.metodoPago },
                      { clave: "mon", titulo: "Monto", alinear: "derecha", movil: "destacado", celda: (p) => formatCOP(p.monto) },
                      {
                        clave: "est",
                        titulo: "Estado",
                        movil: "destacado",
                        celda: (p) => <Badge variant={p.estado === "Anulado" ? "destructive" : "secondary"}>{p.estado}</Badge>,
                      },
                    ]}
                  />
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
                  <TablaResponsiva
                    filas={asistencias}
                    getKey={(_, i) => i}
                    columnas={[
                      { clave: "fec", titulo: "Fecha", movil: "titulo", celda: (a) => formatFecha(a.fecha) },
                      {
                        clave: "hor",
                        titulo: "Horario",
                        movil: "titulo",
                        celda: (a) =>
                          [a.dia, a.horaInicio && a.horaFin ? `${a.horaInicio.slice(0, 5)}–${a.horaFin.slice(0, 5)}` : null]
                            .filter(Boolean)
                            .join(" "),
                      },
                      { clave: "est", titulo: "Estado", movil: "destacado", celda: (a) => a.estado },
                    ]}
                  />
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
                  <TablaResponsiva
                    filas={evaluaciones}
                    getKey={(_, i) => i}
                    columnas={[
                      { clave: "fec", titulo: "Fecha", celda: (e) => formatFecha(e.fecha) },
                      { clave: "cat", titulo: "Categoría", celda: (e) => e.categoria },
                      { clave: "cri", titulo: "Criterio", movil: "titulo", celda: (e) => e.criterio },
                      { clave: "pun", titulo: "Puntaje", alinear: "derecha", movil: "destacado", celda: (e) => e.puntaje },
                    ]}
                  />
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
                  <TablaResponsiva
                    filas={rutinas}
                    getKey={(r) => r.id}
                    columnas={[
                      { clave: "fec", titulo: "Fecha", celda: (r) => formatFecha(r.fecha) },
                      { clave: "gru", titulo: "Grupo", celda: (r) => r.grupo },
                      { clave: "niv", titulo: "Nivel", celda: (r) => r.nivel },
                      { clave: "eve", titulo: "Evento", movil: "titulo", celda: (r) => r.evento },
                      { clave: "pun", titulo: "Puntaje", alinear: "derecha", movil: "destacado", celda: (r) => r.puntajeTotal },
                    ]}
                  />
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
                      <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
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