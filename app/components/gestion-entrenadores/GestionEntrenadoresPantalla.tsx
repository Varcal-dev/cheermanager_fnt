"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import {
  TIPOS_CERTIFICACION, alertasCertificaciones, eliminarHoras, etiquetaCertificacion, horasACsv, horasDelPeriodo,
  listarEntrenadores, precargarHoras, registrarCertificacion, registrarHoras,
  type AlertaCertificacion, type AlertasCertificaciones, type EntrenadorBasico, type PeriodoHoras, type TipoCertificacion,
} from "@/app/lib/gestion-entrenadores";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const nombreDe = (e: EntrenadorBasico) => `${e.persona.nombre} ${e.persona.apellidos}`;

function EstadoBadge({ a }: { a: AlertaCertificacion }) {
  if (a.estado === "VENCIDA") return <Badge variant="destructive">Vencida hace {Math.abs(a.diasRestantes ?? 0)} día(s)</Badge>;
  if (a.estado === "POR_VENCER") return <Badge variant="destructive">Vence en {a.diasRestantes} día(s)</Badge>;
  if (a.estado === "SIN_REGISTRO") return <Badge variant="outline">Sin registrar</Badge>;
  return <Badge variant="secondary">{a.fechaVencimiento ? "Vigente" : "Vigente (no vence)"}</Badge>;
}

function Certificaciones({ puedeEditar, entrenadores }: { puedeEditar: boolean; entrenadores: EntrenadorBasico[] }) {
  const [datos, setDatos] = useState<AlertasCertificaciones | null>(null);
  const [dias, setDias] = useState("30");
  const [todos, setTodos] = useState(false);
  const [dialogo, setDialogo] = useState(false);
  const vacio = { entrenador: "", tipo: "PRIMEROS_AUXILIOS" as TipoCertificacion, nombre: "", entidad: "", emision: "", vence: "" };
  const [form, setForm] = useState(vacio);
  const [ocupado, setOcupado] = useState(false);

  const cargar = () => alertasCertificaciones(Number(dias) || 30, todos).then(setDatos).catch((e) => toast.error(getErrorMessage(e, "No se pudieron cargar las certificaciones")));
  useEffect(() => { cargar(); }, [dias, todos]); // eslint-disable-line react-hooks/exhaustive-deps

  const abrir = (a?: AlertaCertificacion) => {
    setForm({ ...vacio, entrenador: a ? String(a.entrenadorId) : "", tipo: a?.tipo ?? "PRIMEROS_AUXILIOS", nombre: a?.certificacion ?? "" });
    setDialogo(true);
  };
  const pideNombre = TIPOS_CERTIFICACION.find((t) => t.valor === form.tipo)?.pideNombre;

  const guardar = async () => {
    if (!form.entrenador) { toast.error("Elige el entrenador"); return; }
    setOcupado(true);
    try {
      await registrarCertificacion(Number(form.entrenador), {
        tipo: form.tipo, nombre: form.nombre || undefined, entidad: form.entidad || undefined,
        fechaEmision: form.emision || undefined, fechaVencimiento: form.vence || undefined,
      });
      toast.success("Certificación registrada");
      setDialogo(false);
      await cargar();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo registrar"));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        A cada entrenador activo se le exige primeros auxilios y seguridad deportiva. Otras certificaciones (RCP, cursos de
        federación) aparecen cuando las registras. Registrar una nueva reemplaza a la anterior del mismo tipo.
      </p>
      {datos && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.vencidas}</div><div className="text-sm text-muted-foreground">Vencidas</div></div>
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.porVencer}</div><div className="text-sm text-muted-foreground">Por vencer en {dias} días</div></div>
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.sinRegistro}</div><div className="text-sm text-muted-foreground">Sin registrar</div></div>
        </div>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div><Label>Avisar con (días)</Label><Input className="w-28" type="number" min={0} max={365} value={dias} onChange={(e) => setDias(e.target.value)} /></div>
        <Button variant={todos ? "default" : "outline"} onClick={() => setTodos(!todos)}>{todos ? "Mostrando todas" : "Solo pendientes"}</Button>
        {puedeEditar && <Button onClick={() => abrir()}>Registrar certificación</Button>}
      </div>
      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-2">Entrenador</th><th className="p-2">Certificación</th><th className="p-2">Estado</th><th className="p-2">Vence</th><th className="p-2" /></tr></thead>
          <tbody>
            {(datos?.items ?? []).map((a, i) => (
              <tr key={`${a.entrenadorId}-${a.tipo}-${a.certificacion}-${i}`} className="border-t">
                <td className="p-2">{a.nombre}</td>
                <td className="p-2">{etiquetaCertificacion(a.tipo, a.certificacion)}</td>
                <td className="p-2"><EstadoBadge a={a} /></td>
                <td className="p-2">{a.fechaVencimiento ?? "—"}</td>
                <td className="p-2 text-right">{puedeEditar && <Button size="sm" variant="outline" onClick={() => abrir(a)}>{a.estado === "SIN_REGISTRO" ? "Registrar" : "Renovar"}</Button>}</td>
              </tr>
            ))}
            {(datos?.items.length ?? 0) === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={5}>{datos ? "Todo al día." : "Cargando…"}</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar certificación</DialogTitle><DialogDescription>Guarda solo los datos del documento.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Entrenador</Label>
              <Select value={form.entrenador} onValueChange={(v) => setForm({ ...form, entrenador: v })}>
                <SelectTrigger><SelectValue placeholder="Elige" /></SelectTrigger>
                <SelectContent>{entrenadores.map((e) => <SelectItem key={e.id} value={String(e.id)}>{nombreDe(e)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as TipoCertificacion })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_CERTIFICACION.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.etiqueta}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {pideNombre && <div className="col-span-2"><Label>Nombre del curso</Label><Input maxLength={120} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>}
            <div className="col-span-2"><Label>Entidad</Label><Input maxLength={120} value={form.entidad} onChange={(e) => setForm({ ...form, entidad: e.target.value })} /></div>
            <div><Label>Emisión</Label><Input type="date" value={form.emision} onChange={(e) => setForm({ ...form, emision: e.target.value })} /></div>
            <div><Label>Vence{pideNombre ? " (opcional)" : ""}</Label><Input type="date" value={form.vence} onChange={(e) => setForm({ ...form, vence: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogo(false)}>Cancelar</Button><Button disabled={ocupado} onClick={guardar}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Horas({ puedeEditar, entrenadores }: { puedeEditar: boolean; entrenadores: EntrenadorBasico[] }) {
  const hoy = new Date();
  const [desde, setDesde] = useState(iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
  const [hasta, setHasta] = useState(iso(hoy));
  const [datos, setDatos] = useState<PeriodoHoras | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [dialogo, setDialogo] = useState(false);
  const [form, setForm] = useState({ entrenador: "", fecha: iso(hoy), horas: "", descripcion: "" });

  const cargar = () => horasDelPeriodo(desde, hasta).then(setDatos).catch((e) => toast.error(getErrorMessage(e, "No se pudieron cargar las horas")));
  useEffect(() => { cargar(); }, [desde, hasta]); // eslint-disable-line react-hooks/exhaustive-deps

  const correr = async (fn: () => Promise<unknown>, ok: string) => {
    setOcupado(true);
    try { await fn(); toast.success(ok); await cargar(); return true; }
    catch (e) { toast.error(getErrorMessage(e, "No se pudo completar la acción")); return false; }
    finally { setOcupado(false); }
  };

  const precargar = async () => {
    if (!window.confirm("Se crearán las horas de los horarios de cada grupo para el periodo (sin duplicar). Luego corriges a mano lo que no se dictó. ¿Continuar?")) return;
    setOcupado(true);
    try {
      const r = await precargarHoras(desde, hasta);
      toast.success(`Se crearon ${r.creadas} registro(s) (${r.horas} h); ${r.omitidas} ya existían`);
      await cargar();
    } catch (e) { toast.error(getErrorMessage(e, "No se pudo precargar")); }
    finally { setOcupado(false); }
  };

  const guardar = async () => {
    if (!form.entrenador || !form.horas) { toast.error("Elige el entrenador y las horas"); return; }
    const ok = await correr(() => registrarHoras({ entrenadorId: Number(form.entrenador), fecha: form.fecha, horas: Number(form.horas), descripcion: form.descripcion || undefined }), "Horas registradas");
    if (ok) { setDialogo(false); setForm({ ...form, horas: "", descripcion: "" }); }
  };

  const descargar = () => {
    if (!datos) return;
    const url = URL.createObjectURL(new Blob([horasACsv(datos)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `horas-entrenadores-${desde}-a-${hasta}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div><Label>Desde</Label><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
        <div><Label>Hasta</Label><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
        {puedeEditar && <Button variant="outline" disabled={ocupado} onClick={precargar}>Precargar desde horarios</Button>}
        {puedeEditar && <Button disabled={ocupado} onClick={() => setDialogo(true)}>Registrar horas</Button>}
        {datos && <Button variant="outline" onClick={descargar}>Descargar CSV</Button>}
      </div>

      {datos && (
        <>
          <div className="rounded-md border p-3">
            <div className="text-2xl font-bold">{datos.totalHoras} h</div>
            <div className="text-sm text-muted-foreground">dictadas en el periodo</div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {datos.totales.map((t) => (
              <div key={t.entrenadorId} className="rounded-md border p-3 text-sm">
                <div className="font-semibold">{t.entrenador}</div>
                <div>{t.horas} h · {t.sesiones} sesión(es)</div>
              </div>
            ))}
          </div>
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-2">Fecha</th><th className="p-2">Entrenador</th><th className="p-2">Horas</th><th className="p-2">Origen</th><th className="p-2">Detalle</th><th className="p-2" /></tr></thead>
              <tbody>
                {datos.registros.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.fecha}</td><td className="p-2">{r.entrenador}</td><td className="p-2">{r.horas}</td>
                    <td className="p-2">{r.origen === "HORARIO" ? "Horario" : "Manual"}</td><td className="p-2">{r.descripcion ?? "—"}</td>
                    <td className="p-2 text-right">{puedeEditar && <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => window.confirm("¿Quitar este registro?") && correr(() => eliminarHoras(r.id), "Registro eliminado")}>Quitar</Button>}</td>
                  </tr>
                ))}
                {datos.registros.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={6}>Sin horas en este periodo.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar horas dictadas</DialogTitle><DialogDescription>Una clase extra, un reemplazo o un taller. Máximo 12 horas por registro.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Entrenador</Label>
              <Select value={form.entrenador} onValueChange={(v) => setForm({ ...form, entrenador: v })}>
                <SelectTrigger><SelectValue placeholder="Elige" /></SelectTrigger>
                <SelectContent>{entrenadores.map((e) => <SelectItem key={e.id} value={String(e.id)}>{nombreDe(e)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></div>
            <div><Label>Horas</Label><Input type="number" step="0.25" min={0.25} max={12} value={form.horas} onChange={(e) => setForm({ ...form, horas: e.target.value })} /></div>
            <div className="col-span-2"><Label>Detalle</Label><Input maxLength={200} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogo(false)}>Cancelar</Button><Button disabled={ocupado} onClick={guardar}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function GestionEntrenadoresPantalla() {
  const { permissions } = useUser();
  const puedeEditar = permissions.includes("modificar_entrenador");
  const [entrenadores, setEntrenadores] = useState<EntrenadorBasico[]>([]);
  useEffect(() => {
    listarEntrenadores()
      .then((l) => setEntrenadores(l.filter((e) => (e.estado?.estado ?? "Activo").toLowerCase() === "activo")))
      .catch(() => toast.error("No se pudo cargar la lista de entrenadores"));
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de entrenadores</h1>
        <p className="text-muted-foreground">Certificaciones con vencimiento y horas dictadas (base para la liquidación).</p>
      </div>
      <Tabs defaultValue="certificaciones">
        <TabsList><TabsTrigger value="certificaciones">Certificaciones</TabsTrigger><TabsTrigger value="horas">Horas dictadas</TabsTrigger></TabsList>
        <TabsContent value="certificaciones" className="pt-4"><Certificaciones puedeEditar={puedeEditar} entrenadores={entrenadores} /></TabsContent>
        <TabsContent value="horas" className="pt-4"><Horas puedeEditar={puedeEditar} entrenadores={entrenadores} /></TabsContent>
      </Tabs>
    </div>
  );
}
