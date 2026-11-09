"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import { listarGrupos, type Grupo } from "@/app/lib/evaluaciones";
import {
  descargarIcs, destinatarios, enviarComunicado, enviosDe, historialComunicados,
  type Comunicado, type Destinatarios, type EnvioDetalle, type ResultadoEnvio,
} from "@/app/lib/comunicados";

export default function ComunicadosPantalla() {
  const { permissions } = useUser();
  const puedeEnviar = permissions.includes("enviar_comunicados");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupo, setGrupo] = useState("TODO");
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sistema, setSistema] = useState(true);
  const [correo, setCorreo] = useState(true);
  const [dest, setDest] = useState<Destinatarios | null>(null);
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);
  const [historial, setHistorial] = useState<Comunicado[]>([]);
  const [abierto, setAbierto] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<EnvioDetalle[]>([]);
  const [ocupado, setOcupado] = useState(false);

  const gid = grupo === "TODO" ? undefined : Number(grupo);
  const cargarHistorial = () => historialComunicados().then(setHistorial).catch(() => {});

  useEffect(() => { listarGrupos().then(setGrupos).catch(() => toast.error("No se pudieron cargar los grupos")); cargarHistorial(); }, []);
  useEffect(() => {
    destinatarios(gid).then((d) => { setDest(d); if (!d.correoDisponible) setCorreo(false); })
      .catch((e) => toast.error(getErrorMessage(e, "No se pudo calcular los destinatarios")));
  }, [grupo]); // eslint-disable-line react-hooks/exhaustive-deps

  const nombreGrupo = (id: number | null) => (id ? grupos.find((g) => g.id === id)?.nombre ?? `Grupo ${id}` : "Todo el club");

  const enviar = async () => {
    if (!sistema && !correo) { toast.error("Elige portal, correo o ambos"); return; }
    const cuantos = (correo ? dest?.correos ?? 0 : 0) + (sistema ? dest?.usuariosPortal ?? 0 : 0);
    if (!window.confirm(`Se enviará a ${dest?.deportistas ?? 0} deportista(s) de «${dest?.grupo}» (${cuantos} envío(s)). ¿Enviar ahora?`)) return;
    setOcupado(true);
    try {
      const r = await enviarComunicado({ grupoId: gid, asunto, mensaje, sistema, correo });
      setResultado(r);
      toast.success("Comunicado enviado");
      setAsunto(""); setMensaje("");
      cargarHistorial();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo enviar el comunicado"));
    } finally {
      setOcupado(false);
    }
  };

  const bajar = (ruta: string, nombre: string) => descargarIcs(ruta, nombre).catch((e) => toast.error(getErrorMessage(e, "No se pudo descargar el calendario")));

  const verDetalle = async (id: number) => {
    if (abierto === id) { setAbierto(null); return; }
    setAbierto(id);
    setDetalle(await enviosDe(id).catch(() => []));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comunicados y calendario</h1>
        <p className="text-muted-foreground">Avisa a las familias de un grupo (o de todo el club) por el portal y por correo, y descarga calendarios para Google, Apple u Outlook.</p>
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label>Destino</Label>
            <Select value={grupo} onValueChange={setGrupo}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">Todo el club</SelectItem>
                {grupos.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {dest && (
            <p className="text-sm text-muted-foreground">
              {dest.deportistas} deportista(s) activos · {dest.usuariosPortal} con acceso al portal · {dest.correos} correo(s)
              {dest.sinContacto > 0 && <> · <b>{dest.sinContacto}</b> sin ningún contacto</>}
            </p>
          )}
        </div>
        {dest && !dest.correoDisponible && (
          <p className="rounded-md border border-amber-500 p-3 text-sm">El correo no está configurado en el servidor (SMTP), así que solo se puede avisar por el portal.</p>
        )}
        {puedeEnviar && (
          <>
            <div><Label>Asunto</Label><Input maxLength={150} value={asunto} onChange={(e) => setAsunto(e.target.value)} /></div>
            <div><Label>Mensaje</Label><Textarea rows={6} maxLength={3000} value={mensaje} onChange={(e) => setMensaje(e.target.value)} /><p className="text-xs text-muted-foreground">{mensaje.length}/3000</p></div>
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2"><Checkbox checked={sistema} onCheckedChange={(v) => setSistema(v === true)} /> Notificación en el portal</label>
              <label className="flex items-center gap-2"><Checkbox checked={correo} disabled={!dest?.correoDisponible} onCheckedChange={(v) => setCorreo(v === true)} /> Correo</label>
            </div>
            <Button disabled={ocupado || !asunto.trim() || !mensaje.trim()} onClick={enviar}>Enviar comunicado</Button>
          </>
        )}
        {resultado && (
          <div className="rounded-md bg-muted p-3 text-sm">
            Enviado a {resultado.deportistas} deportista(s): {resultado.notificados} aviso(s) en el portal, {resultado.correosEnviados} correo(s) enviado(s)
            {resultado.correosFallidos > 0 && <>, <b>{resultado.correosFallidos} fallido(s)</b>: {resultado.fallidos.join(", ")}</>}
            {resultado.sinContacto > 0 && <>. {resultado.sinContacto} deportista(s) sin contacto no recibieron nada.</>}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <h2 className="font-semibold">Calendarios (.ics)</h2>
        <p className="text-sm text-muted-foreground">Importa el archivo en Google Calendar, Apple Calendar u Outlook. El de entrenamientos se repite cada semana; el de eventos trae los próximos del club.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={!gid} onClick={() => gid && bajar(`/api/comunicados/calendario/grupo/${gid}`, `entrenamientos-${nombreGrupo(gid)}.ics`)}>
            Entrenamientos de {gid ? nombreGrupo(gid) : "(elige un grupo)"}
          </Button>
          <Button variant="outline" onClick={() => bajar("/api/comunicados/calendario/eventos", "eventos-y-competencias.ics")}>Eventos y competencias</Button>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Historial</h2>
        <div className="divide-y rounded-md border">
          {historial.map((c) => (
            <div key={c.id} className="space-y-1 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{c.asunto}</div>
                <div className="text-xs text-muted-foreground">{c.fechaCreacion.replace("T", " ").slice(0, 16)} · {nombreGrupo(c.grupoId)}</div>
              </div>
              <p className="whitespace-pre-wrap text-muted-foreground">{c.mensaje}</p>
              <div className="text-xs">
                {c.notificados} portal · {c.correosEnviados} correo(s){c.correosFallidos > 0 ? ` · ${c.correosFallidos} fallido(s)` : ""}
                {c.sinContacto > 0 ? ` · ${c.sinContacto} sin contacto` : ""}
                <Button size="sm" variant="ghost" onClick={() => verDetalle(c.id)}>{abierto === c.id ? "Ocultar" : "Ver envíos"}</Button>
              </div>
              {abierto === c.id && (
                <ul className="list-disc pl-5 text-xs">
                  {detalle.map((e) => <li key={e.id}>{e.canal} · {e.destino} · {e.estado}{e.detalle ? ` (${e.detalle})` : ""}</li>)}
                </ul>
              )}
            </div>
          ))}
          {historial.length === 0 && <p className="p-6 text-center text-muted-foreground">Aún no has enviado comunicados.</p>}
        </div>
      </div>
    </div>
  );
}
