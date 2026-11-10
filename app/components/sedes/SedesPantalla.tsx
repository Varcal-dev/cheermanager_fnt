"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import {
  TIPOS_ESPACIO, actualizarEspacio, actualizarSede, asignarEspacio, crearEspacio, crearSede, etiquetaTipoEspacio,
  listarSedes, quitarEspacio, tableroSedes, type SedeVista, type Tablero, type TipoEspacio,
} from "@/app/lib/sedes";

const hhmm = (h: string) => h.slice(0, 5);

export default function SedesPantalla() {
  const { permissions } = useUser();
  const puede = permissions.includes("gestionar_sedes");
  const [tab, setTab] = useState<"sedes" | "ocupacion">("sedes");
  const [sedes, setSedes] = useState<SedeVista[]>([]);
  const [tablero, setTablero] = useState<Tablero | null>(null);
  const [nuevaSede, setNuevaSede] = useState({ nombre: "", direccion: "", ciudad: "" });
  const [nuevoEsp, setNuevoEsp] = useState<Record<number, { nombre: string; tipo: TipoEspacio; capacidad: string; simultaneos: string }>>({});
  const [ocupado, setOcupado] = useState(false);

  const cargar = async () => {
    try { setSedes(await listarSedes()); setTablero(await tableroSedes()); }
    catch (e) { toast.error(getErrorMessage(e, "No se pudieron cargar las sedes")); }
  };
  useEffect(() => { cargar(); }, []);

  const ejecutar = async (fn: () => Promise<unknown>, ok: string) => {
    setOcupado(true);
    try { await fn(); toast.success(ok); await cargar(); }
    catch (e) { toast.error(getErrorMessage(e, "No se pudo completar la acción")); }
    finally { setOcupado(false); }
  };

  const espForm = (id: number) => nuevoEsp[id] ?? { nombre: "", tipo: "COLCHONETA" as TipoEspacio, capacidad: "", simultaneos: "1" };

  const asignar = async (heId: number, espacioId: string) => {
    setOcupado(true);
    try {
      const r = await asignarEspacio(heId, Number(espacioId));
      toast.success("Espacio asignado");
      r.advertencias.forEach((a) => toast.warn(a));
      await cargar();
    } catch (e) { toast.error(getErrorMessage(e, "No se pudo asignar el espacio")); }
    finally { setOcupado(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sedes y espacios</h1>
        <p className="text-muted-foreground">
          Define dónde entrena el club y asigna un espacio a cada horario de grupo. El sistema avisa cuando dos grupos chocan en el mismo
          espacio (cada espacio admite un número de grupos a la vez) o cuando un grupo no cabe.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant={tab === "sedes" ? "default" : "outline"} onClick={() => setTab("sedes")}>Sedes y espacios</Button>
        <Button variant={tab === "ocupacion" ? "default" : "outline"} onClick={() => setTab("ocupacion")}>
          Ocupación{tablero && tablero.sinEspacio.length > 0 ? ` (${tablero.sinEspacio.length} sin espacio)` : ""}
        </Button>
      </div>

      {tab === "sedes" && (
        <div className="space-y-6">
          {puede && (
            <div className="flex flex-wrap items-end gap-3 rounded-md border p-4">
              <div><Label>Nueva sede</Label><Input value={nuevaSede.nombre} onChange={(e) => setNuevaSede({ ...nuevaSede, nombre: e.target.value })} placeholder="Nombre" /></div>
              <div><Label>Dirección</Label><Input value={nuevaSede.direccion} onChange={(e) => setNuevaSede({ ...nuevaSede, direccion: e.target.value })} /></div>
              <div><Label>Ciudad</Label><Input value={nuevaSede.ciudad} onChange={(e) => setNuevaSede({ ...nuevaSede, ciudad: e.target.value })} /></div>
              <Button disabled={ocupado} onClick={() => ejecutar(async () => { await crearSede(nuevaSede); setNuevaSede({ nombre: "", direccion: "", ciudad: "" }); }, "Sede creada")}>Crear sede</Button>
            </div>
          )}
          {sedes.map((s) => {
            const f = espForm(s.id);
            return (
              <div key={s.id} className="space-y-3 rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-lg font-semibold">{s.nombre} {!s.activa && <Badge variant="outline">Desactivada</Badge>}</div>
                    <div className="text-sm text-muted-foreground">{[s.direccion, s.ciudad].filter(Boolean).join(" · ") || "Sin dirección"}</div>
                  </div>
                  {puede && <Button size="sm" variant="outline" disabled={ocupado} onClick={() => ejecutar(() => actualizarSede(s.id, { activa: !s.activa }), s.activa ? "Sede desactivada" : "Sede activada")}>{s.activa ? "Desactivar" : "Activar"}</Button>}
                </div>
                <div className="divide-y rounded-md border">
                  {s.espacios.map((e) => (
                    <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 p-2 text-sm">
                      <div>
                        {e.nombre} <Badge variant="secondary">{etiquetaTipoEspacio(e.tipo)}</Badge>{" "}
                        <span className="text-muted-foreground">
                          {e.capacidad ? `cap. ${e.capacidad}` : "sin capacidad"} · {e.gruposSimultaneos} grupo(s) a la vez · {e.usos} horario(s)
                        </span>
                        {!e.activo && <Badge className="ml-2" variant="outline">Desactivado</Badge>}
                      </div>
                      {puede && <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => ejecutar(() => actualizarEspacio(e.id, { activo: !e.activo }), e.activo ? "Espacio desactivado" : "Espacio activado")}>{e.activo ? "Desactivar" : "Activar"}</Button>}
                    </div>
                  ))}
                  {s.espacios.length === 0 && <p className="p-3 text-sm text-muted-foreground">Esta sede aún no tiene espacios.</p>}
                </div>
                {puede && s.activa && (
                  <div className="flex flex-wrap items-end gap-2">
                    <div><Label>Espacio</Label><Input value={f.nombre} onChange={(e) => setNuevoEsp({ ...nuevoEsp, [s.id]: { ...f, nombre: e.target.value } })} placeholder="Colchoneta A" /></div>
                    <div className="w-40">
                      <Label>Tipo</Label>
                      <Select value={f.tipo} onValueChange={(v) => setNuevoEsp({ ...nuevoEsp, [s.id]: { ...f, tipo: v as TipoEspacio } })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TIPOS_ESPACIO.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.etiqueta}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="w-28"><Label>Capacidad</Label><Input type="number" min={1} value={f.capacidad} onChange={(e) => setNuevoEsp({ ...nuevoEsp, [s.id]: { ...f, capacidad: e.target.value } })} /></div>
                    <div className="w-32"><Label>Grupos a la vez</Label><Input type="number" min={1} max={10} value={f.simultaneos} onChange={(e) => setNuevoEsp({ ...nuevoEsp, [s.id]: { ...f, simultaneos: e.target.value } })} /></div>
                    <Button disabled={ocupado} onClick={() => ejecutar(async () => {
                      await crearEspacio(s.id, { nombre: f.nombre, tipo: f.tipo, capacidad: f.capacidad ? Number(f.capacidad) : undefined, gruposSimultaneos: Number(f.simultaneos) || 1 });
                      setNuevoEsp({ ...nuevoEsp, [s.id]: { nombre: "", tipo: f.tipo, capacidad: "", simultaneos: "1" } });
                    }, "Espacio creado")}>Agregar espacio</Button>
                  </div>
                )}
              </div>
            );
          })}
          {sedes.length === 0 && <p className="rounded-md border p-6 text-center text-muted-foreground">Aún no hay sedes. Crea la primera arriba.</p>}
        </div>
      )}

      {tab === "ocupacion" && tablero && (
        <div className="space-y-6">
          {tablero.sinEspacio.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold">Horarios de grupo sin espacio</h2>
              <div className="divide-y rounded-md border">
                {tablero.sinEspacio.map((h) => (
                  <div key={h.horarioEntrenamientoId} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                    <div><b>{h.grupo}</b> · {h.diaNombre} {hhmm(h.horaInicio)}–{hhmm(h.horaFin)}</div>
                    {puede && (
                      <Select onValueChange={(v) => asignar(h.horarioEntrenamientoId, v)}>
                        <SelectTrigger className="w-64"><SelectValue placeholder="Asignar espacio…" /></SelectTrigger>
                        <SelectContent>{tablero.espacios.map((e) => <SelectItem key={e.espacioId} value={String(e.espacioId)}>{e.sede} · {e.espacio}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {tablero.espacios.map((e) => (
            <div key={e.espacioId} className="space-y-2">
              <h2 className="font-semibold">{e.sede} · {e.espacio} <span className="text-sm font-normal text-muted-foreground">({e.gruposSimultaneos} grupo(s) a la vez)</span></h2>
              <div className="divide-y rounded-md border">
                {e.usos.map((u) => (
                  <div key={u.asignacionId} className="flex items-center justify-between gap-2 p-2 text-sm">
                    <div>{u.diaNombre} {hhmm(u.horaInicio)}–{hhmm(u.horaFin)} · <b>{u.grupo}</b></div>
                    {puede && <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => ejecutar(() => quitarEspacio(u.horarioEntrenamientoId), "Espacio quitado")}>Quitar</Button>}
                  </div>
                ))}
                {e.usos.length === 0 && <p className="p-3 text-sm text-muted-foreground">Sin horarios asignados.</p>}
              </div>
            </div>
          ))}
          {tablero.espacios.length === 0 && <p className="rounded-md border p-6 text-center text-muted-foreground">Crea una sede con espacios para asignar horarios.</p>}
        </div>
      )}
    </div>
  );
}
