"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import {
  CANALES, TIPOS, etiquetaTipo, listarSolicitudes, ponerEnTramite, prorrogarSolicitud, registrarSolicitud,
  responderSolicitud, type EstadoSolicitud, type SolicitudTitular, type TipoSolicitud,
} from "@/app/lib/solicitudes-titular";

const ESTADOS: { valor: "TODAS" | EstadoSolicitud; etiqueta: string }[] = [
  { valor: "TODAS", etiqueta: "Todas" },
  { valor: "RECIBIDA", etiqueta: "Recibidas" },
  { valor: "EN_TRAMITE", etiqueta: "En trámite" },
  { valor: "RESPONDIDA", etiqueta: "Respondidas" },
];

function Plazo({ s }: { s: SolicitudTitular }) {
  if (s.estado === "RESPONDIDA") {
    return <Badge variant={s.respondidaEnPlazo ? "secondary" : "destructive"}>{s.respondidaEnPlazo ? "Respondida en plazo" : "Respondida fuera de plazo"}</Badge>;
  }
  if (s.vencida) return <Badge variant="destructive">Vencida ({Math.abs(s.diasHabilesRestantes)} día(s) háb.)</Badge>;
  return <Badge variant={s.diasHabilesRestantes <= 3 ? "destructive" : "outline"}>{s.diasHabilesRestantes} día(s) háb. restantes</Badge>;
}

type Accion = { tipo: "prorroga" | "respuesta"; solicitud: SolicitudTitular } | null;

export default function SolicitudesTitularPantalla() {
  const { permissions } = useUser();
  const puedeGestionar = permissions.includes("gestionar_consentimientos");
  const [lista, setLista] = useState<SolicitudTitular[]>([]);
  const [filtro, setFiltro] = useState<"TODAS" | EstadoSolicitud>("TODAS");
  const [nuevo, setNuevo] = useState(false);
  const [accion, setAccion] = useState<Accion>(null);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [form, setForm] = useState({ tipo: "CONSULTA" as TipoSolicitud, nombre: "", documento: "", contacto: "", canal: "CORREO", fecha: "", descripcion: "" });

  const cargar = () => listarSolicitudes().then(setLista).catch((e) => toast.error(getErrorMessage(e, "No se pudo cargar la lista")));
  useEffect(() => { cargar(); }, []);

  const visibles = lista.filter((s) => filtro === "TODAS" || s.estado === filtro);
  const vencidas = lista.filter((s) => s.vencida).length;
  const porVencer = lista.filter((s) => s.estado !== "RESPONDIDA" && !s.vencida && s.diasHabilesRestantes <= 3).length;

  const correr = async (fn: () => Promise<unknown>, ok: string) => {
    setOcupado(true);
    try {
      await fn();
      toast.success(ok);
      await cargar();
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo completar la acción"));
      return false;
    } finally {
      setOcupado(false);
    }
  };

  const guardarNueva = async () => {
    const okc = await correr(
      () => registrarSolicitud({
        tipo: form.tipo, solicitanteNombre: form.nombre, solicitanteDocumento: form.documento || undefined,
        solicitanteContacto: form.contacto || undefined, canal: form.canal, descripcion: form.descripcion,
        fechaRecepcion: form.fecha || undefined,
      }),
      "Solicitud registrada",
    );
    if (okc) {
      setNuevo(false);
      setForm({ tipo: "CONSULTA", nombre: "", documento: "", contacto: "", canal: "CORREO", fecha: "", descripcion: "" });
    }
  };

  const confirmarAccion = async () => {
    if (!accion) return;
    const { tipo, solicitud } = accion;
    const ok = await correr(
      () => (tipo === "prorroga" ? prorrogarSolicitud(solicitud.id, texto) : responderSolicitud(solicitud.id, texto)),
      tipo === "prorroga" ? "Prórroga registrada" : "Respuesta registrada",
    );
    if (ok) { setAccion(null); setTexto(""); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultas y reclamos de titulares</h1>
          <p className="text-muted-foreground">
            Ley 1581 de 2012: las consultas se responden en 10 días hábiles y los reclamos en 15 (prórroga única de 5 u 8
            días hábiles, antes de vencer). Los festivos de Colombia ya se descuentan.
          </p>
        </div>
        {puedeGestionar && <Button onClick={() => setNuevo(true)}>Registrar solicitud</Button>}
      </div>

      {(vencidas > 0 || porVencer > 0) && (
        <p className="rounded-md border border-amber-500 p-3 text-sm">
          {vencidas > 0 && <><b>{vencidas}</b> solicitud(es) vencida(s). </>}
          {porVencer > 0 && <><b>{porVencer}</b> vence(n) en 3 días hábiles o menos.</>}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {ESTADOS.map((e) => (
          <Button key={e.valor} size="sm" variant={filtro === e.valor ? "default" : "outline"} onClick={() => setFiltro(e.valor)}>
            {e.etiqueta}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {visibles.map((s) => (
          <Card key={s.id}>
            <CardContent className="space-y-2 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">
                  #{s.id} · {etiquetaTipo(s.tipo)} · {s.solicitanteNombre}
                </div>
                <Plazo s={s} />
              </div>
              <div className="text-xs text-muted-foreground">
                Recibida {s.fechaRecepcion} por {s.canal.toLowerCase()} · límite {s.fechaLimite}
                {s.prorrogada ? " (con prórroga)" : ""} · {s.estado.replace("_", " ").toLowerCase()}
                {s.solicitanteDocumento ? ` · doc. ${s.solicitanteDocumento}` : ""}
                {s.solicitanteContacto ? ` · ${s.solicitanteContacto}` : ""}
              </div>
              <p>{s.descripcion}</p>
              {s.motivoProrroga && <p className="text-muted-foreground">Prórroga: {s.motivoProrroga}</p>}
              {s.respuesta && <p className="rounded-md bg-muted p-2"><b>Respuesta ({s.fechaRespuesta}):</b> {s.respuesta}</p>}
              {puedeGestionar && s.estado !== "RESPONDIDA" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {s.estado === "RECIBIDA" && (
                    <Button size="sm" variant="outline" disabled={ocupado} onClick={() => correr(() => ponerEnTramite(s.id), "Pasó a en trámite")}>En trámite</Button>
                  )}
                  {!s.prorrogada && !s.vencida && (
                    <Button size="sm" variant="outline" disabled={ocupado} onClick={() => { setTexto(""); setAccion({ tipo: "prorroga", solicitud: s }); }}>Prorrogar</Button>
                  )}
                  <Button size="sm" disabled={ocupado} onClick={() => { setTexto(""); setAccion({ tipo: "respuesta", solicitud: s }); }}>Registrar respuesta</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {visibles.length === 0 && <p className="p-6 text-center text-muted-foreground">No hay solicitudes en esta vista.</p>}
      </div>

      <Dialog open={nuevo} onOpenChange={setNuevo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar solicitud de un titular</DialogTitle>
            <DialogDescription>
              Plazo: {TIPOS.find((t) => t.valor === form.tipo)?.plazo}, contado desde la fecha de recepción.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as TipoSolicitud })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.etiqueta}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nombre de quien solicita</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Documento</Label><Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} /></div>
              <div><Label>Contacto (correo o teléfono)</Label><Input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} /></div>
              <div>
                <Label>Canal</Label>
                <Select value={form.canal} onValueChange={(v) => setForm({ ...form, canal: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CANALES.map((c) => <SelectItem key={c.valor} value={c.valor}>{c.etiqueta}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Fecha de recepción</Label><Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></div>
            </div>
            <div><Label>Qué pide</Label><Textarea rows={4} maxLength={2000} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNuevo(false)}>Cancelar</Button>
            <Button disabled={ocupado} onClick={guardarNueva}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!accion} onOpenChange={(o) => !o && setAccion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{accion?.tipo === "prorroga" ? "Prorrogar el plazo" : "Registrar la respuesta dada"}</DialogTitle>
            <DialogDescription>
              {accion?.tipo === "prorroga"
                ? "Solo se puede una vez y antes de vencer. Debes informar al titular el motivo y la nueva fecha."
                : "Deja constancia de lo que se le respondió al titular. Después no se puede modificar."}
            </DialogDescription>
          </DialogHeader>
          <Textarea rows={5} maxLength={accion?.tipo === "prorroga" ? 500 : 2000} value={texto} onChange={(e) => setTexto(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccion(null)}>Cancelar</Button>
            <Button disabled={ocupado} onClick={confirmarAccion}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
