"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import {
  ETIQUETA_ESTADO, ETIQUETA_RESTRICCION, ZONAS, candidatosLesion, detalleLesion, etiquetaZona, listarLesiones,
  registrarLesion, seguimientoLesion,
  type Candidato, type DetalleLesion, type EstadoLesion, type Gravedad, type Lesion, type Restriccion,
  type ResumenLesiones, type Zona,
} from "@/app/lib/lesiones";

const NUEVA = {
  deportistaId: "", zona: "" as "" | Zona, descripcion: "", gravedad: "LEVE" as Gravedad,
  restriccion: "MODIFICADO" as Restriccion, fecha: "", retorno: "",
};
const SEG = { nota: "", estado: "SIN_CAMBIO" as "SIN_CAMBIO" | EstadoLesion, retorno: "", aval: false, avalDetalle: "" };

function EstadoBadge({ l }: { l: Lesion }) {
  const v = l.estado === "ALTA" ? "secondary" : l.restriccion === "SIN_ENTRENAR" ? "destructive" : "outline";
  return <Badge variant={v}>{ETIQUETA_ESTADO[l.estado]}</Badge>;
}

export default function LesionesPantalla() {
  const { permissions } = useUser();
  const puedeGestionar = permissions.includes("gestionar_lesiones");
  const [datos, setDatos] = useState<ResumenLesiones | null>(null);
  const [vigentes, setVigentes] = useState(true);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [nueva, setNueva] = useState(NUEVA);
  const [abrirNueva, setAbrirNueva] = useState(false);
  const [detalle, setDetalle] = useState<DetalleLesion | null>(null);
  const [seg, setSeg] = useState(SEG);
  const [ocupado, setOcupado] = useState(false);

  const cargar = () =>
    listarLesiones(vigentes).then(setDatos).catch((e) => toast.error(getErrorMessage(e, "No se pudieron cargar las lesiones")));
  useEffect(() => { cargar(); }, [vigentes]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (puedeGestionar) candidatosLesion().then(setCandidatos).catch(() => {}); }, [puedeGestionar]);

  const guardarNueva = async () => {
    if (!nueva.deportistaId || !nueva.zona) { toast.error("Elige el deportista y la zona"); return; }
    setOcupado(true);
    try {
      await registrarLesion(Number(nueva.deportistaId), {
        zona: nueva.zona, descripcion: nueva.descripcion, gravedad: nueva.gravedad, restriccion: nueva.restriccion,
        fechaLesion: nueva.fecha || undefined, fechaEstimadaRetorno: nueva.retorno || undefined,
      });
      toast.success("Lesión registrada");
      setAbrirNueva(false); setNueva(NUEVA);
      await cargar();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo registrar la lesión"));
    } finally { setOcupado(false); }
  };

  const abrirDetalle = async (l: Lesion) => {
    setSeg(SEG);
    try { setDetalle(await detalleLesion(l.id)); } catch (e) { toast.error(getErrorMessage(e, "No se pudo abrir la lesión")); }
  };

  const guardarSeg = async () => {
    if (!detalle) return;
    setOcupado(true);
    try {
      await seguimientoLesion(detalle.lesion.id, {
        nota: seg.nota,
        estado: seg.estado === "SIN_CAMBIO" ? undefined : seg.estado,
        fechaEstimadaRetorno: seg.retorno || undefined,
        avalMedico: seg.aval || undefined,
        avalDetalle: seg.aval ? seg.avalDetalle || undefined : undefined,
      });
      toast.success("Seguimiento guardado");
      setDetalle(await detalleLesion(detalle.lesion.id));
      setSeg(SEG);
      await cargar();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo guardar el seguimiento"));
    } finally { setOcupado(false); }
  };

  const l = detalle?.lesion;
  const cerrada = l?.estado === "ALTA";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lesiones y retorno al juego</h1>
        <p className="text-muted-foreground">
          Registra la lesión, qué puede hacer el deportista mientras tanto y su retorno progresivo hasta el alta. Una lesión grave
          solo se cierra con aval médico. Son datos de salud: se muestran solo a quien tiene el permiso.
        </p>
      </div>

      {datos && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.sinEntrenar}</div><div className="text-sm text-muted-foreground">No entrenan</div></div>
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.modificado}</div><div className="text-sm text-muted-foreground">Entrenamiento modificado</div></div>
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.enRetorno}</div><div className="text-sm text-muted-foreground">En retorno</div></div>
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.retornosAtrasados}</div><div className="text-sm text-muted-foreground">Retorno atrasado</div></div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {puedeGestionar && <Button onClick={() => setAbrirNueva(true)}>Registrar lesión</Button>}
        <Button variant="outline" onClick={() => setVigentes(!vigentes)}>{vigentes ? "Mostrando abiertas" : "Mostrando todas (con altas)"}</Button>
      </div>

      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="p-2">Deportista</th><th className="p-2">Zona</th><th className="p-2">Gravedad</th><th className="p-2">Estado</th><th className="p-2">Puede hacer</th><th className="p-2">Retorno estimado</th><th className="p-2">Días</th><th className="p-2" /></tr>
          </thead>
          <tbody>
            {(datos?.items ?? []).map((x) => (
              <tr key={x.id} className="border-t">
                <td className="p-2">{x.nombre}</td>
                <td className="p-2">{etiquetaZona(x.zona)}</td>
                <td className="p-2">{x.gravedad.charAt(0) + x.gravedad.slice(1).toLowerCase()}</td>
                <td className="p-2"><EstadoBadge l={x} /></td>
                <td className="p-2">{ETIQUETA_RESTRICCION[x.restriccion]}</td>
                <td className="p-2">
                  {x.fechaEstimadaRetorno ?? "—"} {x.retornoAtrasado && <Badge variant="destructive">Atrasado</Badge>}
                </td>
                <td className="p-2">{x.dias}</td>
                <td className="p-2 text-right"><Button size="sm" variant="outline" onClick={() => abrirDetalle(x)}>Abrir</Button></td>
              </tr>
            ))}
            {datos && datos.items.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={8}>Sin lesiones {vigentes ? "abiertas" : "registradas"}.</td></tr>}
            {!datos && <tr><td className="p-6 text-center text-muted-foreground" colSpan={8}>Cargando…</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={abrirNueva} onOpenChange={setAbrirNueva}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar lesión</DialogTitle>
            <DialogDescription>Una lesión grave empieza con el deportista sin entrenar. No abras otra en la misma zona: agrega un seguimiento.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Deportista</Label>
              <Select value={nueva.deportistaId} onValueChange={(v) => setNueva({ ...nueva, deportistaId: v })}>
                <SelectTrigger><SelectValue placeholder="Elige…" /></SelectTrigger>
                <SelectContent>{candidatos.map((c) => <SelectItem key={c.deportistaId} value={String(c.deportistaId)}>{c.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Zona</Label>
              <Select value={nueva.zona} onValueChange={(v) => setNueva({ ...nueva, zona: v as Zona })}>
                <SelectTrigger><SelectValue placeholder="Elige…" /></SelectTrigger>
                <SelectContent>{ZONAS.map((z) => <SelectItem key={z.valor} value={z.valor}>{z.etiqueta}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gravedad</Label>
              <Select value={nueva.gravedad} onValueChange={(v) => setNueva({ ...nueva, gravedad: v as Gravedad, restriccion: v === "GRAVE" ? "SIN_ENTRENAR" : nueva.restriccion })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEVE">Leve</SelectItem><SelectItem value="MODERADA">Moderada</SelectItem><SelectItem value="GRAVE">Grave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Qué puede hacer mientras tanto</Label>
              <Select value={nueva.restriccion} onValueChange={(v) => setNueva({ ...nueva, restriccion: v as Restriccion })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIN_ENTRENAR">No entrena</SelectItem>
                  <SelectItem value="MODIFICADO" disabled={nueva.gravedad === "GRAVE"}>Entrenamiento modificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Descripción</Label>
              <Textarea rows={3} maxLength={300} value={nueva.descripcion} onChange={(e) => setNueva({ ...nueva, descripcion: e.target.value })} />
            </div>
            <div><Label>Fecha de la lesión</Label><Input type="date" value={nueva.fecha} onChange={(e) => setNueva({ ...nueva, fecha: e.target.value })} /></div>
            <div><Label>Retorno estimado</Label><Input type="date" value={nueva.retorno} onChange={(e) => setNueva({ ...nueva, retorno: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbrirNueva(false)}>Cancelar</Button>
            <Button disabled={ocupado} onClick={guardarNueva}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detalle} onOpenChange={(o) => !o && setDetalle(null)}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{l ? `${l.nombre} · ${etiquetaZona(l.zona)}` : ""}</DialogTitle>
            <DialogDescription>
              {l && <>{ETIQUETA_ESTADO[l.estado]} · {ETIQUETA_RESTRICCION[l.restriccion]} · {l.dias} día(s){l.avalMedico ? " · con aval médico" : ""}</>}
            </DialogDescription>
          </DialogHeader>
          {l && <p className="whitespace-pre-wrap text-sm">{l.descripcion}</p>}
          <ul className="space-y-2 text-sm">
            {detalle?.seguimientos.map((n) => (
              <li key={n.id} className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground">{n.fecha} · {ETIQUETA_ESTADO[n.estado]} · {ETIQUETA_RESTRICCION[n.restriccion]}</div>
                <div className="whitespace-pre-wrap">{n.nota}</div>
              </li>
            ))}
            {detalle && detalle.seguimientos.length === 0 && <li className="text-muted-foreground">Sin seguimientos todavía.</li>}
          </ul>
          {puedeGestionar && !cerrada && (
            <div className="space-y-3 rounded-md border p-3">
              <div><Label>Nota de seguimiento</Label><Textarea rows={3} maxLength={500} value={seg.nota} onChange={(e) => setSeg({ ...seg, nota: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Cambiar estado</Label>
                  <Select value={seg.estado} onValueChange={(v) => setSeg({ ...seg, estado: v as typeof seg.estado })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIN_CAMBIO">Sin cambio</SelectItem>
                      <SelectItem value="ACTIVA">Activa (recaída)</SelectItem>
                      <SelectItem value="EN_RETORNO">En retorno (modificado)</SelectItem>
                      <SelectItem value="ALTA">Alta (sin restricción)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Nuevo retorno estimado</Label><Input type="date" value={seg.retorno} onChange={(e) => setSeg({ ...seg, retorno: e.target.value })} /></div>
              </div>
              {seg.estado === "ALTA" && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={seg.aval} onChange={(e) => setSeg({ ...seg, aval: e.target.checked })} />
                    Hay aval médico{l?.gravedad === "GRAVE" ? " (obligatorio en lesiones graves)" : ""}
                  </label>
                  {seg.aval && <Input maxLength={150} placeholder="Quién lo da y fecha (p. ej. Dr. Pérez, 5/11)" value={seg.avalDetalle} onChange={(e) => setSeg({ ...seg, avalDetalle: e.target.value })} />}
                </div>
              )}
              <Button disabled={ocupado || seg.nota.trim().length < 3} onClick={guardarSeg}>Guardar seguimiento</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
