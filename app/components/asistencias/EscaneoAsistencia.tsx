"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Loader2, ScanLine, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { escanearAsistencia, type ResultadoEscaneo } from "@/app/lib/carnet";

interface Horario {
  id: number;
  dia: string;
  horaInicio: string;
  horaFin: string;
  grupos: { grupoId: number; nombreGrupo: string }[];
}

type Tono = "ok" | "repetido" | "aviso" | "error";
interface Lectura {
  clave: number;
  tono: Tono;
  titulo: string;
  detalle: string;
  hora: string;
}

const dos = (n: number) => String(n).padStart(2, "0");
const aISO = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const hhmm = (h: string) => h.slice(0, 5);
const etiqueta = (h: Horario) =>
  `${hhmm(h.horaInicio)}-${hhmm(h.horaFin)} · ${h.grupos.map((g) => g.nombreGrupo).join(", ") || "Sin grupo"}`;

const mensajeError = (e: unknown, defecto: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? defecto;

// La cámara usa BarcodeDetector (Chrome/Edge/Android). Donde no existe (Safari/iPhone) queda el lector USB/Bluetooth,
// que escribe el código como un teclado y termina con Enter.
interface DetectorQR {
  detect: (fuente: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
}
const crearDetector = (): DetectorQR | null => {
  const Ctor = (globalThis as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => DetectorQR }).BarcodeDetector;
  return Ctor ? new Ctor({ formats: ["qr_code"] }) : null;
};

const ESTILO: Record<Tono, { caja: string; icono: typeof CheckCircle2 }> = {
  ok: { caja: "border-green-600 bg-green-600/10 text-green-700 dark:text-green-400", icono: CheckCircle2 },
  repetido: { caja: "border-blue-600 bg-blue-600/10 text-blue-700 dark:text-blue-400", icono: CheckCircle2 },
  aviso: { caja: "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400", icono: AlertTriangle },
  error: { caja: "border-destructive bg-destructive/10 text-destructive", icono: XCircle },
};

export default function EscaneoAsistencia() {
  const [fecha, setFecha] = useState(() => aISO(new Date()));
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [horarioId, setHorarioId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [camara, setCamara] = useState(false);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const contador = useRef(0);
  const ultimo = useRef<{ codigo: string; t: number }>({ codigo: "", t: 0 });
  // Se decide en el cliente (tras montar) para no desajustar el HTML del servidor.
  const [soportaCamara, setSoportaCamara] = useState(false);
  useEffect(() => setSoportaCamara(crearDetector() !== null), []);

  useEffect(() => {
    api
      .get<Horario[]>("/api/horarios")
      .then((r) => setHorarios(r.data ?? []))
      .catch(() => setHorarios([]))
      .finally(() => setCargando(false));
  }, []);

  // Horarios del día elegido; si ese día no hay ninguno, se ofrecen todos (reposiciones, sesiones extra).
  const nombreDia = useMemo(() => {
    const [a, m, d] = fecha.split("-").map(Number);
    return DIAS[new Date(a, m - 1, d).getDay()];
  }, [fecha]);
  const delDia = useMemo(() => horarios.filter((h) => norm(h.dia) === nombreDia), [horarios, nombreDia]);
  const opciones = delDia.length > 0 ? delDia : horarios;

  // Preselecciona la sesión en curso (o la próxima del día).
  useEffect(() => {
    if (opciones.length === 0) {
      setHorarioId("");
      return;
    }
    if (opciones.some((h) => String(h.id) === horarioId)) return;
    const ahora = new Date().getHours() * 60 + new Date().getMinutes();
    const min = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    const ordenadas = [...opciones].sort((a, b) => min(a.horaInicio) - min(b.horaInicio));
    const elegida = ordenadas.find((h) => min(h.horaFin) > ahora) ?? ordenadas[0];
    setHorarioId(String(elegida.id));
  }, [opciones, horarioId]);

  const registrar = useCallback(
    async (texto: string) => {
      const limpio = texto.trim();
      if (!limpio || !horarioId) return;
      // Evita doble lectura del mismo carnet (la cámara lo ve varias veces seguidas).
      const ahora = Date.now();
      if (ultimo.current.codigo === limpio && ahora - ultimo.current.t < 4000) return;
      ultimo.current = { codigo: limpio, t: ahora };

      setEnviando(true);
      const hora = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const clave = ++contador.current;
      try {
        const r: ResultadoEscaneo = await escanearAsistencia(limpio, Number(horarioId), fecha);
        const tono: Tono = !r.registrado ? "error" : r.advertencia ? "aviso" : r.yaRegistrado ? "repetido" : "ok";
        const detalle = [r.mensaje, r.advertencia, r.grupos.length ? r.grupos.join(" · ") : null].filter(Boolean).join(" — ");
        setLecturas((l) => [{ clave, tono, titulo: r.nombre, detalle, hora }, ...l].slice(0, 30));
        if (navigator.vibrate) navigator.vibrate(tono === "ok" ? 60 : [60, 40, 60]);
      } catch (e) {
        setLecturas((l) => [{ clave, tono: "error" as Tono, titulo: "No se pudo registrar", detalle: mensajeError(e, "Error de conexión"), hora }, ...l].slice(0, 30));
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } finally {
        setEnviando(false);
        setCodigo("");
        entrada.current?.focus();
      }
    },
    [horarioId, fecha],
  );

  // Cámara: lee un cuadro cada 350 ms mientras esté activa.
  useEffect(() => {
    if (!camara) return;
    const detector = crearDetector();
    if (!detector) return;
    let flujo: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let activo = true;
    setErrorCamara(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (!activo) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        flujo = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
        timer = setInterval(async () => {
          if (!video.current || video.current.readyState < 2) return;
          try {
            const r = await detector.detect(video.current);
            if (r[0]?.rawValue) void registrar(r[0].rawValue);
          } catch {
            /* un cuadro sin código: se ignora */
          }
        }, 350);
      })
      .catch(() => {
        setErrorCamara("No se pudo abrir la cámara. Revisa el permiso del navegador.");
        setCamara(false);
      });
    return () => {
      activo = false;
      if (timer) clearInterval(timer);
      flujo?.getTracks().forEach((t) => t.stop());
    };
  }, [camara, registrar]);

  const presentes = lecturas.filter((l) => l.tono === "ok" || l.tono === "aviso").length;
  const ultimoResultado = lecturas[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Asistencia con carnet</h1>
        <p className="text-sm text-muted-foreground">
          Elige la sesión y escanea el QR del carnet de cada deportista: queda marcado como presente. Para marcar ausentes o corregir,
          usa la pantalla de Asistencias.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-1">
            <Label htmlFor="esc-fecha" className="text-xs text-muted-foreground">Fecha</Label>
            <Input id="esc-fecha" type="date" value={fecha} max={aISO(new Date())} onChange={(e) => e.target.value && setFecha(e.target.value)} className="w-44" />
          </div>
          <div className="min-w-64 flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Sesión</Label>
            <Select value={horarioId} onValueChange={setHorarioId} disabled={opciones.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={cargando ? "Cargando…" : "No hay horarios"} />
              </SelectTrigger>
              <SelectContent>
                {opciones.map((h) => (
                  <SelectItem key={h.id} value={String(h.id)}>
                    {delDia.length === 0 ? `${h.dia} · ` : ""}
                    {etiqueta(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!cargando && delDia.length === 0 && horarios.length > 0 && (
            <p className="w-full text-xs text-amber-600">No hay entrenamientos programados ese día; se muestran todos los horarios.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="h-4 w-4" /> Escanear
            </CardTitle>
            <CardDescription>Con lector USB o Bluetooth, deja el cursor en el campo y escanea. También puedes usar la cámara.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void registrar(codigo);
              }}
              className="flex gap-2"
            >
              <Input
                ref={entrada}
                autoFocus
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Código del carnet (CM1.…)"
                disabled={!horarioId}
                autoComplete="off"
                className="font-mono text-sm"
              />
              <Button type="submit" disabled={!horarioId || !codigo.trim() || enviando}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Marcar"}
              </Button>
            </form>

            {soportaCamara ? (
              <Button variant="outline" onClick={() => setCamara((c) => !c)} disabled={!horarioId} className="w-full">
                {camara ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
                {camara ? "Apagar cámara" : "Usar la cámara"}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Este navegador no puede leer QR con la cámara (en iPhone/Safari pasa). Usa un lector, o Chrome en Android.
              </p>
            )}
            {errorCamara && <p className="text-sm text-destructive">{errorCamara}</p>}
            {camara && (
              <video ref={video} muted playsInline className="aspect-video w-full rounded-md border bg-black object-cover" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Último escaneo</CardTitle>
            <CardDescription>
              <Badge variant="secondary">{presentes} presentes marcados en esta pantalla</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ultimoResultado ? (
              <FilaResultado l={ultimoResultado} grande />
            ) : (
              <p className="text-sm text-muted-foreground">Aún no has escaneado ningún carnet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {lecturas.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de esta sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lecturas.slice(1).map((l) => (
              <FilaResultado key={l.clave} l={l} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FilaResultado({ l, grande }: { l: Lectura; grande?: boolean }) {
  const { caja, icono: Icono } = ESTILO[l.tono];
  return (
    <div className={`flex items-start gap-3 rounded-md border p-3 ${caja}`} role={l.tono === "error" ? "alert" : "status"}>
      <Icono className={grande ? "h-8 w-8 shrink-0" : "h-5 w-5 shrink-0"} />
      <div className="min-w-0 flex-1">
        <div className={grande ? "text-lg font-semibold" : "font-medium"}>{l.titulo}</div>
        <div className="text-sm">{l.detalle}</div>
      </div>
      <span className="text-xs opacity-70">{l.hora}</span>
    </div>
  );
}
