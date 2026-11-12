"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, Loader2, LogIn, LogOut, Printer, ScanLine, Trash2, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarEntrenadores, type EntrenadorBasico } from "@/app/lib/gestion-entrenadores";
import {
  asistenciaPersonalHoy, carnetEntrenador, eliminarAsistenciaPersonal, guardarManualPersonal, marcarPersonal,
  reportePersonal, type CarnetPersonal, type FilaAsistenciaPersonal, type ReportePersonal, type ResultadoMarcacion,
} from "@/app/lib/asistencia-personal";

const dos = (n: number) => String(n).padStart(2, "0");
const aISO = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const hhmm = (h: string | null) => (h ? h.slice(0, 5) : "—");
const horasTxt = (h: number | null) => (h === null ? "—" : `${Math.floor(h)} h ${dos(Math.round((h % 1) * 60))} min`);

interface DetectorQR { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> }
const crearDetector = (): DetectorQR | null => {
  const C = (globalThis as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => DetectorQR }).BarcodeDetector;
  return C ? new C({ formats: ["qr_code"] }) : null;
};

interface Lectura { clave: number; ok: boolean; titulo: string; detalle: string; hora: string; evento?: ResultadoMarcacion["evento"] }

// ───────── Marcar ─────────
function Marcar() {
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [hoy, setHoy] = useState<FilaAsistenciaPersonal[]>([]);
  const [camara, setCamara] = useState(false);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const [soporta, setSoporta] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const contador = useRef(0);
  const ultimo = useRef({ codigo: "", t: 0 });
  useEffect(() => setSoporta(crearDetector() !== null), []);

  const cargarHoy = useCallback(() => asistenciaPersonalHoy().then(setHoy).catch(() => undefined), []);
  useEffect(() => { void cargarHoy(); }, [cargarHoy]);

  const registrar = useCallback(async (texto: string) => {
    const limpio = texto.trim();
    if (!limpio) return;
    const ahora = Date.now();
    if (ultimo.current.codigo === limpio && ahora - ultimo.current.t < 4000) return;
    ultimo.current = { codigo: limpio, t: ahora };
    setEnviando(true);
    const hora = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const clave = ++contador.current;
    try {
      const r = await marcarPersonal(limpio);
      setLecturas((l) => [{ clave, ok: r.evento === "ENTRADA" || r.evento === "SALIDA", titulo: r.nombre, detalle: r.mensaje, hora, evento: r.evento }, ...l].slice(0, 20));
      if (navigator.vibrate) navigator.vibrate(60);
      void cargarHoy();
    } catch (e) {
      setLecturas((l) => [{ clave, ok: false, titulo: "No se pudo marcar", detalle: getErrorMessage(e, "Error de conexión"), hora }, ...l].slice(0, 20));
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } finally {
      setEnviando(false);
      setCodigo("");
      entrada.current?.focus();
    }
  }, [cargarHoy]);

  useEffect(() => {
    if (!camara) return;
    const detector = crearDetector();
    if (!detector) return;
    let flujo: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let activo = true;
    setErrorCamara(null);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (!activo) { s.getTracks().forEach((t) => t.stop()); return; }
        flujo = s;
        if (video.current) { video.current.srcObject = s; void video.current.play(); }
        timer = setInterval(async () => {
          if (!video.current || video.current.readyState < 2) return;
          try { const r = await detector.detect(video.current); if (r[0]?.rawValue) void registrar(r[0].rawValue); } catch { /* sin código */ }
        }, 350);
      })
      .catch(() => { setErrorCamara("No se pudo abrir la cámara. Revisa el permiso del navegador."); setCamara(false); });
    return () => { activo = false; if (timer) clearInterval(timer); flujo?.getTracks().forEach((t) => t.stop()); };
  }, [camara, registrar]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ScanLine className="h-4 w-4" /> Escanear carnet de personal</CardTitle>
            <CardDescription>La primera lectura del día marca la entrada; la siguiente, la salida. La hora la pone el servidor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={(e) => { e.preventDefault(); void registrar(codigo); }} className="flex gap-2">
              <Input ref={entrada} autoFocus value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código del carnet (CM2.…)" autoComplete="off" className="font-mono text-sm" />
              <Button type="submit" disabled={!codigo.trim() || enviando}>{enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Marcar"}</Button>
            </form>
            {soporta ? (
              <Button variant="outline" className="w-full" onClick={() => setCamara((c) => !c)}>
                {camara ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
                {camara ? "Apagar cámara" : "Usar la cámara"}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Este navegador no lee QR con la cámara (iPhone/Safari). Usa un lector o Chrome en Android.</p>
            )}
            {errorCamara && <p className="text-sm text-destructive">{errorCamara}</p>}
            {camara && <video ref={video} muted playsInline className="aspect-video w-full rounded-md border bg-black object-cover" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Último escaneo</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {lecturas.length === 0 ? <p className="text-sm text-muted-foreground">Aún no has escaneado ningún carnet.</p> : lecturas.slice(0, 5).map((l, i) => (
              <div key={l.clave} className={`flex items-start gap-3 rounded-md border p-3 ${l.ok ? "border-green-600 bg-green-600/10 text-green-700 dark:text-green-400" : l.evento ? "border-blue-600 bg-blue-600/10 text-blue-700 dark:text-blue-400" : "border-destructive bg-destructive/10 text-destructive"}`} role={l.ok || l.evento ? "status" : "alert"}>
                {l.ok ? (l.evento === "SALIDA" ? <LogOut className="h-5 w-5 shrink-0" /> : <LogIn className="h-5 w-5 shrink-0" />) : l.evento ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className={i === 0 ? "text-lg font-semibold" : "font-medium"}>{l.titulo}</div>
                  <div className="text-sm">{l.detalle}</div>
                </div>
                <span className="text-xs opacity-70">{l.hora}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Hoy</CardTitle></CardHeader>
        <CardContent>
          {hoy.length === 0 ? <p className="text-sm text-muted-foreground">Nadie ha marcado hoy.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Entrenador</TableHead><TableHead>Entrada</TableHead><TableHead>Salida</TableHead><TableHead className="text-right">Horas</TableHead></TableRow></TableHeader>
              <TableBody>
                {hoy.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.nombre}</TableCell>
                    <TableCell>{hhmm(f.horaEntrada)}</TableCell>
                    <TableCell>{f.horaSalida ? hhmm(f.horaSalida) : <Badge variant="secondary">En el club</Badge>}</TableCell>
                    <TableCell className="text-right">{horasTxt(f.horas)}</TableCell>
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

// ───────── Registro ─────────
function Registro({ entrenadores }: { entrenadores: EntrenadorBasico[] }) {
  const { permissions } = useUser();
  const puedeVer = permissions.includes("ver_entrenador");
  const puedeEditar = permissions.includes("modificar_entrenador");
  const h = new Date();
  const [desde, setDesde] = useState(aISO(new Date(h.getFullYear(), h.getMonth(), 1)));
  const [hasta, setHasta] = useState(aISO(h));
  const [ent, setEnt] = useState("todos");
  const [rep, setRep] = useState<ReportePersonal | null>(null);
  const [cargando, setCargando] = useState(false);
  const [manual, setManual] = useState<{ abierto: boolean; entrenadorId: string; fecha: string; entrada: string; salida: string }>({ abierto: false, entrenadorId: "", fecha: aISO(h), entrada: "", salida: "" });
  const valido = !!desde && !!hasta && desde <= hasta;

  const cargar = useCallback(() => {
    if (!valido || !puedeVer) return;
    setCargando(true);
    reportePersonal(desde, hasta, ent === "todos" ? undefined : Number(ent))
      .then(setRep)
      .catch((e) => toast.error(getErrorMessage(e, "No se pudo cargar el registro")))
      .finally(() => setCargando(false));
  }, [desde, hasta, ent, valido, puedeVer]);
  useEffect(cargar, [cargar]);

  async function guardarManual() {
    if (!manual.entrenadorId || !manual.fecha || !manual.entrada) return toast.error("Elige entrenador, fecha y hora de entrada");
    try {
      await guardarManualPersonal({ entrenadorId: Number(manual.entrenadorId), fecha: manual.fecha, horaEntrada: manual.entrada, horaSalida: manual.salida || null });
      toast.success("Registro guardado");
      setManual((m) => ({ ...m, abierto: false }));
      cargar();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo guardar"));
    }
  }
  async function borrar(f: FilaAsistenciaPersonal) {
    if (!confirm(`¿Eliminar el registro de ${f.nombre} del ${f.fecha}?`)) return;
    try { await eliminarAsistenciaPersonal(f.id); toast.success("Registro eliminado"); cargar(); }
    catch (e) { toast.error(getErrorMessage(e, "No se pudo eliminar")); }
  }
  function editar(f: FilaAsistenciaPersonal) {
    setManual({ abierto: true, entrenadorId: String(f.entrenadorId), fecha: f.fecha, entrada: hhmm(f.horaEntrada), salida: f.horaSalida ? hhmm(f.horaSalida) : "" });
  }

  if (!puedeVer) return <p className="text-sm text-muted-foreground">No tienes permiso para ver el registro del personal.</p>;
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">Desde</Label><Input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className="w-44" /></div>
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">Hasta</Label><Input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className="w-44" /></div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Entrenador</Label>
            <Select value={ent} onValueChange={setEnt}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {entrenadores.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.persona.nombre} {e.persona.apellidos}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {puedeEditar && <Button variant="outline" onClick={() => setManual((m) => ({ ...m, abierto: true, entrenadorId: "", entrada: "", salida: "" }))}>Registrar a mano</Button>}
          {!valido && <p className="w-full text-sm text-destructive">La fecha inicial debe ser anterior o igual a la final.</p>}
        </CardContent>
      </Card>

      {cargando && !rep ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</p> : rep && (
        <div className={cargando ? "space-y-4 opacity-60" : "space-y-4"}>
          <Card>
            <CardHeader><CardTitle className="text-base">Totales del rango</CardTitle><CardDescription>Las jornadas sin salida registrada no suman horas.</CardDescription></CardHeader>
            <CardContent>
              {rep.totales.length === 0 ? <p className="text-sm text-muted-foreground">Sin registros en este rango.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Entrenador</TableHead><TableHead className="text-right">Días</TableHead><TableHead className="text-right">Horas</TableHead></TableRow></TableHeader>
                  <TableBody>{rep.totales.map((t) => <TableRow key={t.entrenadorId}><TableCell>{t.nombre}</TableCell><TableCell className="text-right">{t.dias}</TableCell><TableCell className="text-right">{horasTxt(t.horas)}</TableCell></TableRow>)}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          {rep.filas.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Detalle</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Entrenador</TableHead><TableHead>Entrada</TableHead><TableHead>Salida</TableHead><TableHead className="text-right">Horas</TableHead><TableHead>Origen</TableHead>{puedeEditar && <TableHead />}</TableRow></TableHeader>
                  <TableBody>
                    {rep.filas.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>{f.fecha}</TableCell><TableCell>{f.nombre}</TableCell><TableCell>{hhmm(f.horaEntrada)}</TableCell><TableCell>{hhmm(f.horaSalida)}</TableCell>
                        <TableCell className="text-right">{horasTxt(f.horas)}</TableCell>
                        <TableCell><Badge variant={f.origen === "MANUAL" ? "outline" : "secondary"}>{f.origen === "MANUAL" ? "Manual" : "Carnet"}</Badge></TableCell>
                        {puedeEditar && (
                          <TableCell className="space-x-1 text-right">
                            <Button size="sm" variant="ghost" onClick={() => editar(f)}>Editar</Button>
                            <Button size="icon" variant="ghost" aria-label="Eliminar" onClick={() => borrar(f)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={manual.abierto} onOpenChange={(o) => setManual((m) => ({ ...m, abierto: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar asistencia a mano</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Entrenador</Label>
              <Select value={manual.entrenadorId} onValueChange={(v) => setManual((m) => ({ ...m, entrenadorId: v }))}>
                <SelectTrigger><SelectValue placeholder="Elige" /></SelectTrigger>
                <SelectContent>{entrenadores.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.persona.nombre} {e.persona.apellidos}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Fecha</Label><Input type="date" value={manual.fecha} max={aISO(new Date())} onChange={(e) => setManual((m) => ({ ...m, fecha: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Entrada</Label><Input type="time" value={manual.entrada} onChange={(e) => setManual((m) => ({ ...m, entrada: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Salida (opcional)</Label><Input type="time" value={manual.salida} onChange={(e) => setManual((m) => ({ ...m, salida: e.target.value }))} /></div>
          </div>
          <p className="text-xs text-muted-foreground">Si ese entrenador ya tiene registro ese día, se corrige.</p>
          <DialogFooter><Button variant="outline" onClick={() => setManual((m) => ({ ...m, abierto: false }))}>Cancelar</Button><Button onClick={guardarManual}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ───────── Carnets ─────────
function Carnets({ entrenadores }: { entrenadores: EntrenadorBasico[] }) {
  const { permissions } = useUser();
  const [carnet, setCarnet] = useState<CarnetPersonal | null>(null);
  const activos = useMemo(() => entrenadores.filter((e) => !e.estado || e.estado.estado.toLowerCase() === "activo"), [entrenadores]);

  if (!permissions.includes("ver_entrenador")) return <p className="text-sm text-muted-foreground">No tienes permiso para ver los carnets del personal.</p>;

  async function abrir(id: number) {
    try { setCarnet(await carnetEntrenador(id)); } catch (e) { toast.error(getErrorMessage(e, "No se pudo generar el carnet")); }
  }
  function imprimir() {
    const el = document.getElementById("carnet-personal-impresion");
    if (!el) return;
    const w = window.open("", "_blank", "width=420,height=620");
    if (!w) return toast.error("El navegador bloqueó la ventana de impresión");
    w.document.write(`<html><head><title>Carnet</title><style>body{font-family:sans-serif;text-align:center;margin:24px}.t{border:2px solid #111;border-radius:12px;padding:20px;width:300px;margin:auto}h2{margin:4px 0}p{margin:2px 0;color:#444}</style></head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-base">Carnets del personal</CardTitle><CardDescription>Cada entrenador activo tiene su QR (distinto al de los deportistas). Imprímelo para que marque entrada y salida.</CardDescription></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {activos.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-md border p-3">
              <span>{e.persona.nombre} {e.persona.apellidos}</span>
              <Button size="sm" variant="outline" onClick={() => abrir(e.id)}>Ver carnet</Button>
            </div>
          ))}
          {activos.length === 0 && <p className="text-sm text-muted-foreground">No hay entrenadores activos.</p>}
        </CardContent>
      </Card>
      <Dialog open={!!carnet} onOpenChange={(o) => !o && setCarnet(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Carnet de personal</DialogTitle></DialogHeader>
          {carnet && (
            <div id="carnet-personal-impresion" className="t mx-auto space-y-2 text-center">
              <p className="text-sm text-muted-foreground">{carnet.club}</p>
              <h2 className="text-lg font-semibold">{carnet.nombre}</h2>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Personal · Entrenador</p>
              <div className="flex justify-center py-2"><QRCodeSVG value={carnet.codigo} size={180} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={imprimir}><Printer className="mr-2 h-4 w-4" />Imprimir</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AsistenciaPersonalPantalla() {
  const { permissions } = useUser();
  const [entrenadores, setEntrenadores] = useState<EntrenadorBasico[]>([]);
  useEffect(() => {
    if (!permissions.includes("ver_entrenador")) return;
    listarEntrenadores().then(setEntrenadores).catch(() => undefined);
  }, [permissions]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Asistencia del personal</h1>
        <p className="text-sm text-muted-foreground">Entrada y salida de los entrenadores con su carnet QR, registro por rango y horas trabajadas.</p>
      </div>
      <Tabs defaultValue="marcar">
        <TabsList>
          <TabsTrigger value="marcar">Marcar</TabsTrigger>
          <TabsTrigger value="registro">Registro</TabsTrigger>
          <TabsTrigger value="carnets">Carnets</TabsTrigger>
        </TabsList>
        <TabsContent value="marcar" className="pt-4"><Marcar /></TabsContent>
        <TabsContent value="registro" className="pt-4"><Registro entrenadores={entrenadores} /></TabsContent>
        <TabsContent value="carnets" className="pt-4"><Carnets entrenadores={entrenadores} /></TabsContent>
      </Tabs>
    </div>
  );
}
