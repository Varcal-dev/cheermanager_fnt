"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import {
  TIPOS_DOCUMENTO, etiquetaDocumento, listarAlertas, registrarDocumento,
  type AlertaDocumento, type AlertasDocumentos, type TipoDocumento,
} from "@/app/lib/vencimientos";

const VACIO = { entidad: "", numero: "", emision: "", vence: "" };

function Estado({ a }: { a: AlertaDocumento }) {
  if (a.estado === "VENCIDO") return <Badge variant="destructive">Vencido hace {Math.abs(a.diasRestantes ?? 0)} día(s)</Badge>;
  if (a.estado === "POR_VENCER") return <Badge variant="destructive">Vence en {a.diasRestantes} día(s)</Badge>;
  if (a.estado === "SIN_REGISTRO") return <Badge variant="outline">Sin registrar</Badge>;
  return <Badge variant="secondary">{a.fechaVencimiento ? "Vigente" : "Vigente (no vence)"}</Badge>;
}

export default function VencimientosPantalla() {
  const { permissions } = useUser();
  const puedeRegistrar = permissions.includes("modificar_deportista");
  const [datos, setDatos] = useState<AlertasDocumentos | null>(null);
  const [dias, setDias] = useState("30");
  const [todos, setTodos] = useState(false);
  const [tipo, setTipo] = useState<"TODOS" | TipoDocumento>("TODOS");
  const [objetivo, setObjetivo] = useState<AlertaDocumento | null>(null);
  const [form, setForm] = useState(VACIO);
  const [ocupado, setOcupado] = useState(false);

  const cargar = () =>
    listarAlertas(Number(dias) || 30, todos).then(setDatos).catch((e) => toast.error(getErrorMessage(e, "No se pudieron cargar los vencimientos")));
  useEffect(() => { cargar(); }, [dias, todos]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = (datos?.items ?? []).filter((a) => tipo === "TODOS" || a.tipo === tipo);
  const def = objetivo ? TIPOS_DOCUMENTO.find((t) => t.valor === objetivo.tipo) : undefined;

  const abrir = (a: AlertaDocumento) => { setForm(VACIO); setObjetivo(a); };

  const guardar = async () => {
    if (!objetivo) return;
    setOcupado(true);
    try {
      await registrarDocumento(objetivo.deportistaId, {
        tipo: objetivo.tipo,
        entidad: form.entidad || undefined,
        numero: form.numero || undefined,
        fechaEmision: form.emision || undefined,
        fechaVencimiento: form.vence || undefined,
      });
      toast.success("Documento registrado");
      setObjetivo(null);
      await cargar();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo registrar el documento"));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vencimientos</h1>
        <p className="text-muted-foreground">
          Certificado médico, EPS, seguro y licencia de los deportistas activos. A cada deportista se le exige certificado
          médico y EPS; seguro y licencia aparecen cuando ya fueron registrados. Solo se guardan fechas y datos del
          documento, no su contenido médico.
        </p>
      </div>

      {datos && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.vencidos}</div><div className="text-sm text-muted-foreground">Vencidos</div></div>
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.porVencer}</div><div className="text-sm text-muted-foreground">Por vencer en {dias} días</div></div>
          <div className="rounded-md border p-3"><div className="text-2xl font-bold">{datos.sinRegistro}</div><div className="text-sm text-muted-foreground">Sin registrar</div></div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Documento</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as "TODOS" | TipoDocumento)}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              {TIPOS_DOCUMENTO.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.etiqueta}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Avisar con (días)</Label>
          <Input className="w-28" type="number" min={0} max={365} value={dias} onChange={(e) => setDias(e.target.value)} />
        </div>
        <Button variant={todos ? "default" : "outline"} onClick={() => setTodos(!todos)}>
          {todos ? "Mostrando todos" : "Solo pendientes"}
        </Button>
      </div>

      <div className="overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="p-2">Deportista</th><th className="p-2">Documento</th><th className="p-2">Estado</th><th className="p-2">Vence</th><th className="p-2">Entidad</th><th className="p-2" /></tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={`${a.deportistaId}-${a.tipo}`} className="border-t">
                <td className="p-2">{a.nombre}</td>
                <td className="p-2">{etiquetaDocumento(a.tipo)}</td>
                <td className="p-2"><Estado a={a} /></td>
                <td className="p-2">{a.fechaVencimiento ?? "—"}</td>
                <td className="p-2">{a.entidad ?? "—"}</td>
                <td className="p-2 text-right">
                  {puedeRegistrar && <Button size="sm" variant="outline" onClick={() => abrir(a)}>{a.estado === "SIN_REGISTRO" ? "Registrar" : "Renovar"}</Button>}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={6}>{datos ? "Todo al día." : "Cargando…"}</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!objetivo} onOpenChange={(o) => !o && setObjetivo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{objetivo ? `${etiquetaDocumento(objetivo.tipo)} · ${objetivo.nombre}` : ""}</DialogTitle>
            <DialogDescription>El registro nuevo reemplaza al anterior, que queda en el historial.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Entidad</Label><Input maxLength={120} value={form.entidad} onChange={(e) => setForm({ ...form, entidad: e.target.value })} /></div>
            <div><Label>Número</Label><Input maxLength={60} value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} /></div>
            <div><Label>Fecha de emisión</Label><Input type="date" value={form.emision} onChange={(e) => setForm({ ...form, emision: e.target.value })} /></div>
            <div>
              <Label>Vence{def && !def.venceSiempre ? " (opcional)" : ""}</Label>
              <Input type="date" value={form.vence} onChange={(e) => setForm({ ...form, vence: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setObjetivo(null)}>Cancelar</Button>
            <Button disabled={ocupado} onClick={guardar}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
