"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api";
import { fechaCorta, suscripcionApi, type ResumenSuscripcion } from "@/app/lib/suscripcion";
import { moneda, paquetesApi, type VistaPaquetes } from "@/app/lib/paquetes";

export default function PaquetesClubPantalla() {
  const [clubes, setClubes] = useState<ResumenSuscripcion[]>([]);
  const [clubId, setClubId] = useState<string>("");
  const [vista, setVista] = useState<VistaPaquetes | null>(null);
  const [resumen, setResumen] = useState<ResumenSuscripcion | null>(null);
  const [form, setForm] = useState({ paqueteId: "", cantidad: "1", fin: "", precio: "" });
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    suscripcionApi.todas().then((x) => setClubes(x.filter((c) => c.clubId !== 1))).catch((e) => toast.error(getErrorMessage(e, "No se pudieron cargar los clubes")));
  }, []);

  const cargar = async (id: string) => {
    setClubId(id);
    setVista(null);
    setResumen(null);
    if (!id) return;
    try {
      const [v, r] = await Promise.all([paquetesApi.deClub(Number(id)), suscripcionApi.todas()]);
      setVista(v);
      setResumen(r.find((c) => c.clubId === Number(id)) ?? null);
      setClubes(r.filter((c) => c.clubId !== 1));
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo cargar el club"));
    }
  };

  const accion = async (fn: () => Promise<VistaPaquetes>, ok: string) => {
    setOcupado(true);
    try {
      setVista(await fn());
      toast.success(ok);
      const r = await suscripcionApi.todas();
      setResumen(r.find((c) => c.clubId === Number(clubId)) ?? null);
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo completar la acción"));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paquetes de cupo</h1>
        <p className="text-muted-foreground">Suma deportistas al cupo del plan de un club. El cobro se hace dentro de su mensualidad.</p>
      </div>

      <div className="max-w-sm">
        <Label>Club</Label>
        <Select value={clubId} onValueChange={cargar}>
          <SelectTrigger><SelectValue placeholder="Elige un club" /></SelectTrigger>
          <SelectContent>
            {clubes.map((c) => <SelectItem key={c.clubId} value={String(c.clubId)}>{c.clubNombre} · {c.planNombre ?? "sin plan"}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {vista && vista.planId === null && <p className="text-muted-foreground">Este club no tiene un plan asignado: asígnaselo primero en Clubes.</p>}

      {vista && vista.planId !== null && (
        <>
          {resumen && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border p-3"><div className="text-2xl font-bold">{resumen.deportistasActivos} / {resumen.limiteEfectivo ?? "∞"}</div><div className="text-sm text-muted-foreground">Deportistas activos / cupo efectivo</div></div>
              <div className="rounded-md border p-3"><div className="text-2xl font-bold">+{vista.cupoExtra}</div><div className="text-sm text-muted-foreground">Cupo por paquetes vigentes</div></div>
              <div className="rounded-md border p-3"><div className="text-2xl font-bold">{vista.paquetesVigentes} / {vista.maximoPaquetes}</div><div className="text-sm text-muted-foreground">Paquetes vigentes / tope del plan</div></div>
            </div>
          )}

          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-2">Paquete</th><th className="p-2">Cantidad</th><th className="p-2">Desde</th><th className="p-2">Hasta</th><th className="p-2">Precio mensual</th><th className="p-2">Estado</th><th className="p-2" /></tr></thead>
              <tbody>
                {vista.asignados.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-2">{a.nombre}</td><td className="p-2">{a.cantidad}</td>
                    <td className="p-2">{fechaCorta(a.fechaInicio)}</td><td className="p-2">{a.fechaFin ? fechaCorta(a.fechaFin) : "Sin fin"}</td>
                    <td className="p-2">{a.precioAcordado !== null ? `${moneda(a.precioAcordado)} (acordado)` : "—"}</td>
                    <td className="p-2"><Badge variant={a.vigente ? "default" : "secondary"}>{a.vigente ? "Vigente" : "No vigente"}</Badge></td>
                    <td className="p-2 text-right">
                      {(a.vigente || new Date(a.fechaInicio) > new Date()) && (
                        <Button size="sm" variant="ghost" disabled={ocupado} onClick={() => { if (confirm("¿Terminar este paquete hoy? Solo se permite si los deportistas activos siguen cabiendo.")) accion(() => paquetesApi.terminar(Number(clubId), a.id), "Paquete terminado"); }}>Terminar</Button>
                      )}
                    </td>
                  </tr>
                ))}
                {vista.asignados.length === 0 && <tr><td className="p-6 text-center text-muted-foreground" colSpan={7}>Este club no tiene paquetes.</td></tr>}
              </tbody>
            </table>
          </div>

          {vista.maximoPaquetes === 0 ? (
            <p className="text-sm text-muted-foreground">Este plan no admite paquetes (se pacta por contrato).</p>
          ) : (
            <div className="grid max-w-3xl gap-3 rounded-md border p-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <Label>Paquete</Label>
                <Select value={form.paqueteId} onValueChange={(v) => setForm({ ...form, paqueteId: v })}>
                  <SelectTrigger><SelectValue placeholder="Elige un paquete" /></SelectTrigger>
                  <SelectContent>{vista.ofrecidos.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.nombre} · {moneda(p.precioMensual)}/mes</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Cantidad</Label><Input type="number" min={1} value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} /></div>
              <div><Label>Hasta (opcional)</Label><Input type="date" value={form.fin} onChange={(e) => setForm({ ...form, fin: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Precio acordado (opcional, COP/mes)</Label><Input type="number" min={0} value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} /></div>
              <div className="flex items-end sm:col-span-2">
                <Button disabled={ocupado || !form.paqueteId} onClick={async () => {
                  await accion(() => paquetesApi.asignar(Number(clubId), {
                    paqueteId: Number(form.paqueteId), cantidad: Number(form.cantidad) || 1,
                    fechaFin: form.fin || undefined, precioAcordado: form.precio ? Number(form.precio) : undefined,
                  }), "Paquete asignado");
                  setForm({ paqueteId: "", cantidad: "1", fin: "", precio: "" });
                }}>Asignar paquete</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
