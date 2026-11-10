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
import { listarGrupos, type Grupo } from "@/app/lib/evaluaciones";
import {
  ESTADOS_INTERES, ETIQUETA_TIPO_INTERES, actualizarInteresado, etiquetaEstadoInteres, listarInteresados,
  type EstadoInteres, type Interesado, type ResumenInteresados,
} from "@/app/lib/interesados";

export default function InteresadosPantalla() {
  const { permissions } = useUser();
  const puedeGestionar = permissions.includes("gestionar_interesados");
  const [datos, setDatos] = useState<ResumenInteresados | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [filtro, setFiltro] = useState<"ABIERTOS" | "TODOS" | EstadoInteres>("ABIERTOS");
  const [sel, setSel] = useState<Interesado | null>(null);
  const [form, setForm] = useState({ estado: "NUEVO" as EstadoInteres, grupo: "NINGUNO", prueba: "", notas: "" });
  const [ocupado, setOcupado] = useState(false);

  const cargar = () => listarInteresados().then(setDatos).catch((e) => toast.error(getErrorMessage(e, "No se pudieron cargar las solicitudes")));
  useEffect(() => { cargar(); listarGrupos().then(setGrupos).catch(() => {}); }, []);

  const nombreGrupo = (id: number | null) => (id ? grupos.find((g) => g.id === id)?.nombre ?? `Grupo ${id}` : "—");
  const abrir = (i: Interesado) => {
    setSel(i);
    setForm({ estado: i.estado, grupo: i.grupoId ? String(i.grupoId) : "NINGUNO", prueba: i.fechaPrueba ?? "", notas: i.notas ?? "" });
  };
  const guardar = async () => {
    if (!sel) return;
    setOcupado(true);
    try {
      await actualizarInteresado(sel.id, {
        estado: form.estado, grupoId: form.grupo === "NINGUNO" ? undefined : Number(form.grupo),
        fechaPrueba: form.prueba || undefined, notas: form.notas,
      });
      toast.success("Solicitud actualizada");
      setSel(null);
      await cargar();
    } catch (e) { toast.error(getErrorMessage(e, "No se pudo actualizar")); }
    finally { setOcupado(false); }
  };

  const items = (datos?.items ?? []).filter((i) =>
    filtro === "TODOS" ? true : filtro === "ABIERTOS" ? !["INSCRITO", "DESCARTADO"].includes(i.estado) : i.estado === filtro);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pre-inscripciones</h1>
        <p className="text-muted-foreground">
          Personas que dejaron sus datos en el formulario público del club: clase de prueba, inscripción o lista de espera.
          El enlace del formulario es <code>/unete.html?club=&lt;slug-del-club&gt;</code>. Al inscribirlas, hazlo en Deportistas / Inscripciones y márcalas aquí como Inscrito.
        </p>
      </div>

      {datos && (
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.porEstado.NUEVO}</div><div className="text-sm text-muted-foreground">Nuevos</div></div>
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.porEstado.PRUEBA_AGENDADA}</div><div className="text-sm text-muted-foreground">Pruebas agendadas</div></div>
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.enEspera}</div><div className="text-sm text-muted-foreground">En lista de espera</div></div>
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.porEstado.INSCRITO}</div><div className="text-sm text-muted-foreground">Inscritos</div></div>
        </div>
      )}

      <div className="w-64">
        <Label>Mostrar</Label>
        <Select value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ABIERTOS">Abiertos (sin inscritos ni descartados)</SelectItem>
            <SelectItem value="TODOS">Todos</SelectItem>
            {ESTADOS_INTERES.map((e) => <SelectItem key={e.valor} value={e.valor}>{e.etiqueta}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="p-2">Deportista</th><th className="p-2">Contacto</th><th className="p-2">Quiere</th><th className="p-2">Estado</th><th className="p-2">Prueba</th><th className="p-2">Grupo</th><th className="p-2">Recibida</th><th className="p-2" /></tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t align-top">
                <td className="p-2">{i.deportistaNombre}<div className="text-xs text-muted-foreground">{i.edad} años</div></td>
                <td className="p-2">{i.contactoNombre}<div className="text-xs text-muted-foreground">{i.contactoTelefono} · {i.contactoCorreo}</div></td>
                <td className="p-2">{ETIQUETA_TIPO_INTERES[i.tipo]}</td>
                <td className="p-2"><Badge variant={i.estado === "NUEVO" ? "destructive" : "outline"}>{etiquetaEstadoInteres(i.estado)}</Badge>{i.posicionEspera ? <div className="text-xs">Puesto {i.posicionEspera} en espera</div> : null}</td>
                <td className="p-2">{i.fechaPrueba ?? "—"}</td>
                <td className="p-2">{nombreGrupo(i.grupoId)}</td>
                <td className="p-2">{i.fechaCreacion.slice(0, 10)}</td>
                <td className="p-2 text-right"><Button size="sm" variant="outline" onClick={() => abrir(i)}>{puedeGestionar ? "Gestionar" : "Ver"}</Button></td>
              </tr>
            ))}
            {datos && items.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={8}>Sin solicitudes en esta vista.</td></tr>}
            {!datos && <tr><td className="p-6 text-center text-muted-foreground" colSpan={8}>Cargando…</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sel?.deportistaNombre}</DialogTitle>
            <DialogDescription>{sel && `${ETIQUETA_TIPO_INTERES[sel.tipo]} · ${sel.contactoNombre} · ${sel.contactoTelefono}`}</DialogDescription>
          </DialogHeader>
          {sel?.experiencia && <p className="text-sm"><b>Experiencia:</b> {sel.experiencia}</p>}
          {sel?.mensaje && <p className="whitespace-pre-wrap text-sm"><b>Mensaje:</b> {sel.mensaje}</p>}
          {puedeGestionar && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v as EstadoInteres })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ESTADOS_INTERES.map((e) => <SelectItem key={e.valor} value={e.valor}>{e.etiqueta}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grupo</Label>
                <Select value={form.grupo} onValueChange={(v) => setForm({ ...form, grupo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NINGUNO">Sin grupo</SelectItem>
                    {grupos.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Fecha de la clase de prueba</Label><Input type="date" value={form.prueba} onChange={(e) => setForm({ ...form, prueba: e.target.value })} /></div>
              <div className="col-span-2"><Label>Notas internas</Label><Textarea rows={3} maxLength={500} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSel(null)}>Cerrar</Button>
            {puedeGestionar && <Button disabled={ocupado} onClick={guardar}>Guardar</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
