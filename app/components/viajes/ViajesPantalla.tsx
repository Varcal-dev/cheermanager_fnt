"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import {
  abonar, actualizarViaje, agregarAcompanante, cambiarParticipante, cargarDelegacion, cerrarViaje, crearViaje, moneda, opcionesViaje,
  quitarParticipante, reabrirViaje, vistaViaje, type OpcionViaje, type RolAcompanante, type SolicitudViaje, type VistaViaje,
} from "@/app/lib/viajes";

const VACIO = { destino: "", salida: "", regreso: "", encuentro: "", transporte: "", alojamiento: "", costo: "", notas: "" };

export default function ViajesPantalla() {
  const { permissions } = useUser();
  const puede = permissions.includes("gestionar_viajes");
  const [opciones, setOpciones] = useState<OpcionViaje[] | null>(null);
  const [v, setV] = useState<VistaViaje | null>(null);
  const [nuevoPara, setNuevoPara] = useState<OpcionViaje | null>(null);
  const [form, setForm] = useState(VACIO);
  const [editando, setEditando] = useState(false);
  const [acomp, setAcomp] = useState({ nombre: "", documento: "", rol: "ENTRENADOR" as RolAcompanante });
  const [abonos, setAbonos] = useState<Record<number, string>>({});
  const [ocupado, setOcupado] = useState(false);

  const cargarOpciones = () => opcionesViaje().then(setOpciones).catch((e) => toast.error(getErrorMessage(e, "No se pudieron cargar los eventos")));
  useEffect(() => { cargarOpciones(); }, []);

  const abrir = async (id: number) => {
    try { setV(await vistaViaje(id)); } catch (e) { toast.error(getErrorMessage(e, "No se pudo abrir el viaje")); }
  };
  const correr = async (fn: () => Promise<VistaViaje>, ok?: string) => {
    setOcupado(true);
    try { setV(await fn()); if (ok) toast.success(ok); cargarOpciones(); }
    catch (e) { toast.error(getErrorMessage(e, "No se pudo completar la acción")); }
    finally { setOcupado(false); }
  };
  const solicitud = (): SolicitudViaje => ({
    destino: form.destino, fechaSalida: form.salida, fechaRegreso: form.regreso, puntoEncuentro: form.encuentro, transporte: form.transporte,
    alojamiento: form.alojamiento, costoPorPersona: form.costo ? Number(form.costo) : undefined, notas: form.notas,
  });
  const formulario = (
    <div className="grid gap-3 rounded-md border p-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><Label>Destino</Label><Input value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} /></div>
      <div><Label>Salida</Label><Input type="date" value={form.salida} onChange={(e) => setForm({ ...form, salida: e.target.value })} /></div>
      <div><Label>Regreso</Label><Input type="date" value={form.regreso} onChange={(e) => setForm({ ...form, regreso: e.target.value })} /></div>
      <div><Label>Punto de encuentro</Label><Input value={form.encuentro} onChange={(e) => setForm({ ...form, encuentro: e.target.value })} /></div>
      <div><Label>Transporte</Label><Input value={form.transporte} onChange={(e) => setForm({ ...form, transporte: e.target.value })} /></div>
      <div><Label>Alojamiento</Label><Input value={form.alojamiento} onChange={(e) => setForm({ ...form, alojamiento: e.target.value })} /></div>
      <div><Label>Costo por persona (COP)</Label><Input type="number" min={0} value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} /></div>
      <div className="sm:col-span-2"><Label>Notas</Label><Textarea rows={2} maxLength={500} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
    </div>
  );

  if (nuevoPara) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setNuevoPara(null)}>← Volver</Button>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo viaje · {nuevoPara.evento}</h1>
        {nuevoPara.fecha && <p className="text-muted-foreground">El evento es el {nuevoPara.fecha}: debe caer dentro de las fechas del viaje.</p>}
        {formulario}
        <Button disabled={ocupado} onClick={async () => {
          setOcupado(true);
          try { const nuevo = await crearViaje(nuevoPara.eventoId, solicitud()); setV(nuevo); setNuevoPara(null); toast.success("Viaje creado"); cargarOpciones(); }
          catch (e) { toast.error(getErrorMessage(e, "No se pudo crear el viaje")); } finally { setOcupado(false); }
        }}>Crear viaje</Button>
      </div>
    );
  }

  if (!v) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Viajes a competencia</h1>
          <p className="text-muted-foreground">Organiza la delegación, las autorizaciones de los menores y los abonos de cada evento.</p>
        </div>
        <div className="overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left"><tr><th className="p-2">Evento</th><th className="p-2">Fecha</th><th className="p-2">Viaje</th><th className="p-2" /></tr></thead>
            <tbody>
              {(opciones ?? []).map((o) => (
                <tr key={o.eventoId} className="border-t">
                  <td className="p-2">{o.evento}</td><td className="p-2">{o.fecha ?? "—"}</td>
                  <td className="p-2"><Badge variant={o.estado === "CERRADO" ? "secondary" : "outline"}>{o.estado === "SIN_VIAJE" ? "Sin viaje" : o.estado === "ABIERTO" ? "Abierto" : "Cerrado"}</Badge></td>
                  <td className="p-2 text-right">
                    {o.viajeId ? <Button size="sm" variant="outline" onClick={() => abrir(o.viajeId!)}>Abrir</Button>
                      : puede && <Button size="sm" onClick={() => { setForm(VACIO); setNuevoPara(o); }}>Organizar viaje</Button>}
                  </td>
                </tr>
              ))}
              {opciones && opciones.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={4}>No hay eventos. Crea uno en Eventos y competencias.</td></tr>}
              {!opciones && <tr><td className="p-6 text-center text-muted-foreground" colSpan={4}>Cargando…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const abierto = puede && v.estado === "ABIERTO";
  const r = v.resumen;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => { setV(null); setEditando(false); cargarOpciones(); }}>← Volver</Button>
          <h1 className="text-3xl font-bold tracking-tight">{v.evento} · {v.destino}</h1>
          <p className="text-muted-foreground">
            {v.fechaSalida} a {v.fechaRegreso} · {v.estado === "ABIERTO" ? "Abierto" : "Cerrado"} · {v.costoPorPersona ? `${moneda(v.costoPorPersona)} por persona` : "Sin costo definido"}
            {v.transporte ? ` · ${v.transporte}` : ""}{v.alojamiento ? ` · ${v.alojamiento}` : ""}{v.puntoEncuentro ? ` · Encuentro: ${v.puntoEncuentro}` : ""}
          </p>
        </div>
        {puede && (v.estado === "ABIERTO"
          ? <Button disabled={ocupado} onClick={() => correr(() => cerrarViaje(v.id), "Viaje cerrado")}>Cerrar viaje</Button>
          : <Button variant="outline" disabled={ocupado} onClick={() => correr(() => reabrirViaje(v.id), "Viaje reabierto")}>Reabrir</Button>)}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-md border p-3"><div className="text-2xl font-bold">{r.confirmados}</div><div className="text-sm text-muted-foreground">Confirmados ({r.pendientes} pendientes)</div></div>
        <div className="rounded-md border p-3"><div className="text-2xl font-bold">{r.menoresSinAutorizacion}</div><div className="text-sm text-muted-foreground">Menores sin autorización</div></div>
        <div className="rounded-md border p-3"><div className="text-2xl font-bold">{moneda(r.abonadoTotal)}</div><div className="text-sm text-muted-foreground">Abonado de {moneda(r.costoTotal)}</div></div>
        <div className="rounded-md border p-3"><div className="text-2xl font-bold">{moneda(r.saldoTotal)}</div><div className="text-sm text-muted-foreground">Saldo pendiente</div></div>
      </div>

      {abierto && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={ocupado} onClick={async () => {
            setOcupado(true);
            try { const x = await cargarDelegacion(v.id); setV(x.viaje); toast.success(x.agregados ? `${x.agregados} deportista(s) agregados desde los rosters` : "Ya estaban todos"); }
            catch (e) { toast.error(getErrorMessage(e, "No se pudo cargar la delegación")); } finally { setOcupado(false); }
          }}>Cargar deportistas desde los rosters</Button>
          <Button variant="outline" onClick={() => {
            setForm({ destino: v.destino, salida: v.fechaSalida, regreso: v.fechaRegreso, encuentro: v.puntoEncuentro ?? "", transporte: v.transporte ?? "", alojamiento: v.alojamiento ?? "", costo: v.costoPorPersona ? String(v.costoPorPersona) : "", notas: v.notas ?? "" });
            setEditando(!editando);
          }}>{editando ? "Cancelar edición" : "Editar datos del viaje"}</Button>
        </div>
      )}
      {editando && abierto && (
        <div className="space-y-3">{formulario}<Button disabled={ocupado} onClick={async () => { await correr(() => actualizarViaje(v.id, solicitud()), "Viaje actualizado"); setEditando(false); }}>Guardar cambios</Button></div>
      )}

      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-2">Participante</th><th className="p-2">Estado</th><th className="p-2">Autorización</th><th className="p-2">Pagado</th><th className="p-2">Saldo</th><th className="p-2" /></tr></thead>
          <tbody>
            {v.participantes.map((p) => (
              <tr key={p.id} className="border-t align-top">
                <td className="p-2">
                  {p.nombre}
                  <div className="text-xs text-muted-foreground">{p.tipo === "DEPORTISTA" ? (p.edad !== null ? `${p.edad} años${p.menor ? " · menor" : ""}` : "Sin fecha de nacimiento") : `Acompañante · ${p.rol?.toLowerCase()}${p.documento ? " · " + p.documento : ""}`}</div>
                </td>
                <td className="p-2">
                  {abierto ? (
                    <Select value={p.estado} onValueChange={(e) => correr(() => cambiarParticipante(p.id, { estado: e as typeof p.estado }))}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="PENDIENTE">Pendiente</SelectItem><SelectItem value="CONFIRMADO">Confirmado</SelectItem><SelectItem value="NO_VA">No va</SelectItem></SelectContent>
                    </Select>
                  ) : <Badge variant="outline">{p.estado === "NO_VA" ? "No va" : p.estado === "CONFIRMADO" ? "Confirmado" : "Pendiente"}</Badge>}
                </td>
                <td className="p-2">
                  {p.tipo === "DEPORTISTA" ? (
                    <label className="flex items-center gap-2">
                      <input type="checkbox" disabled={!abierto} checked={p.autorizacion} onChange={(e) => correr(() => cambiarParticipante(p.id, { autorizacion: e.target.checked }))} />
                      {p.autorizacion ? `Firmada ${p.fechaAutorizacion ?? ""}` : p.menor ? "Falta carta" : "No requerida"}
                    </label>
                  ) : "—"}
                </td>
                <td className="p-2">{moneda(p.abonado)}</td>
                <td className="p-2">{moneda(p.saldo)}</td>
                <td className="p-2">
                  {puede && p.estado !== "NO_VA" && p.saldo > 0 && (
                    <div className="flex gap-1">
                      <Input className="w-28" type="number" min={1} placeholder="Abono" value={abonos[p.id] ?? ""} onChange={(e) => setAbonos({ ...abonos, [p.id]: e.target.value })} />
                      <Button size="sm" variant="outline" disabled={ocupado || !abonos[p.id]} onClick={async () => { await correr(() => abonar(p.id, Number(abonos[p.id])), "Abono registrado"); setAbonos({ ...abonos, [p.id]: "" }); }}>Abonar</Button>
                    </div>
                  )}
                  {abierto && <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => correr(() => quitarParticipante(p.id))}>Quitar</Button>}
                </td>
              </tr>
            ))}
            {v.participantes.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={6}>Aún no hay participantes. Carga la delegación desde los rosters o agrega acompañantes.</td></tr>}
          </tbody>
        </table>
      </div>

      {abierto && (
        <div className="flex flex-wrap items-end gap-2 rounded-md border p-4">
          <div><Label>Acompañante</Label><Input value={acomp.nombre} onChange={(e) => setAcomp({ ...acomp, nombre: e.target.value })} placeholder="Nombre" /></div>
          <div><Label>Documento</Label><Input value={acomp.documento} onChange={(e) => setAcomp({ ...acomp, documento: e.target.value })} /></div>
          <div className="w-40">
            <Label>Rol</Label>
            <Select value={acomp.rol} onValueChange={(x) => setAcomp({ ...acomp, rol: x as RolAcompanante })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ENTRENADOR">Entrenador</SelectItem><SelectItem value="ACUDIENTE">Acudiente</SelectItem><SelectItem value="OTRO">Otro</SelectItem></SelectContent>
            </Select>
          </div>
          <Button disabled={ocupado} onClick={async () => { await correr(() => agregarAcompanante(v.id, { nombre: acomp.nombre, documento: acomp.documento || undefined, rol: acomp.rol }), "Acompañante agregado"); setAcomp({ ...acomp, nombre: "", documento: "" }); }}>Agregar</Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Los menores de edad (o sin fecha de nacimiento) solo se confirman con la autorización de viaje firmada por el acudiente. Los abonos son un registro interno: no generan factura.</p>
    </div>
  );
}
