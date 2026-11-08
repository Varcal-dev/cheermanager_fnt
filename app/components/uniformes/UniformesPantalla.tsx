"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/context/UserContext";
import { getErrorMessage } from "@/lib/api";
import { formatCOP } from "@/app/lib/facturas-pagos";
import { listarGrupos, type Grupo } from "@/app/lib/evaluaciones";
import {
  PRENDAS, crearPedido, facturarPedido, listarPedidos, tallasACsv, tallasDeGrupo,
  type Pedido, type ResultadoFacturacion, type ResumenTallas,
} from "@/app/lib/uniformes";

function SelectorGrupo({ grupos, valor, onChange }: { grupos: Grupo[]; valor: string; onChange: (v: string) => void }) {
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger className="w-64"><SelectValue placeholder="Grupo" /></SelectTrigger>
      <SelectContent>{grupos.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.nombre}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function Tallas({ grupos }: { grupos: Grupo[] }) {
  const [grupo, setGrupo] = useState("");
  const [resumen, setResumen] = useState<ResumenTallas | null>(null);
  const elegir = (v: string) => {
    setGrupo(v);
    tallasDeGrupo(Number(v)).then(setResumen).catch((e) => toast.error(getErrorMessage(e, "No se pudieron cargar las tallas")));
  };
  const descargar = () => {
    if (!resumen) return;
    const url = URL.createObjectURL(new Blob([tallasACsv(resumen)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `tallas-${resumen.grupo.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SelectorGrupo grupos={grupos} valor={grupo} onChange={elegir} />
        {resumen && <Button variant="outline" onClick={descargar}>Descargar CSV</Button>}
      </div>
      {resumen && (
        <>
          {resumen.sinTallaUniforme > 0 && (
            <p className="rounded-md border border-amber-500 p-3 text-sm">
              {resumen.sinTallaUniforme} deportista(s) sin talla de uniforme: complétala en su ficha deportiva antes de pedir.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {PRENDAS.map((p) => (
              <div key={p.clave} className="rounded-md border p-3">
                <div className="text-sm font-semibold">{p.etiqueta}</div>
                {Object.keys(resumen.conteo[p.clave] ?? {}).length === 0 && <div className="text-xs text-muted-foreground">Sin datos</div>}
                {Object.entries(resumen.conteo[p.clave] ?? {}).map(([talla, n]) => (
                  <div key={talla} className="flex justify-between text-sm"><span>{talla}</span><b>{n}</b></div>
                ))}
              </div>
            ))}
          </div>
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr><th className="p-2">Deportista</th>{PRENDAS.map((p) => <th key={p.clave} className="p-2">{p.etiqueta}</th>)}</tr>
              </thead>
              <tbody>
                {resumen.filas.map((f) => (
                  <tr key={f.deportistaId} className="border-t">
                    <td className="p-2">{f.nombre}</td>
                    {PRENDAS.map((p) => <td key={p.clave} className="p-2">{f[p.clave] ?? "—"}</td>)}
                  </tr>
                ))}
                {resumen.filas.length === 0 && <tr><td className="p-4 text-center text-muted-foreground" colSpan={6}>El grupo no tiene deportistas activos.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Pedidos({ grupos }: { grupos: Grupo[] }) {
  const { permissions } = useUser();
  const puedeCrear = permissions.includes("crear_factura");
  const [lista, setLista] = useState<Pedido[]>([]);
  const [resultado, setResultado] = useState<ResultadoFacturacion | null>(null);
  const [form, setForm] = useState({ nombre: "", grupo: "", valor: "", cuotas: "1", vence: "" });
  const [ocupado, setOcupado] = useState(false);

  const cargar = () => listarPedidos().then(setLista).catch(() => toast.error("No se pudieron cargar los pedidos"));
  useEffect(() => { cargar(); }, []);

  const crear = async () => {
    if (!form.nombre.trim() || !form.grupo || !form.valor) {
      toast.error("Completa nombre, grupo y valor por deportista.");
      return;
    }
    setOcupado(true);
    try {
      await crearPedido({
        nombre: form.nombre.trim(), grupoId: Number(form.grupo), valorPorDeportista: Number(form.valor),
        numeroCuotas: Number(form.cuotas), primerVencimiento: form.vence || undefined,
      });
      setForm({ nombre: "", grupo: "", valor: "", cuotas: "1", vence: "" });
      toast.success("Pedido creado. Haz la vista previa antes de facturar.");
      cargar();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo crear el pedido"));
    } finally {
      setOcupado(false);
    }
  };

  const correr = async (p: Pedido, simular: boolean) => {
    if (!simular && !window.confirm(`Se crearán ${p.numeroCuotas} factura(s) por deportista activo del grupo ${p.grupo}. ¿Facturar?`)) return;
    setOcupado(true);
    try {
      const r = await facturarPedido(p.id, simular);
      setResultado(r);
      if (!simular) { toast.success(`Se facturó a ${r.facturados.length} deportista(s)`); cargar(); }
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo facturar el pedido"));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="space-y-6">
      {puedeCrear && (
        <div className="space-y-3 rounded-md border p-4">
          <h3 className="font-semibold">Nuevo pedido de uniformes</h3>
          <div className="grid gap-3 sm:grid-cols-5">
            <div className="sm:col-span-2"><Label>Nombre</Label><Input value={form.nombre} maxLength={120} placeholder="Uniforme competencia 2027" onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div><Label>Grupo</Label><SelectorGrupo grupos={grupos} valor={form.grupo} onChange={(v) => setForm({ ...form, grupo: v })} /></div>
            <div><Label>Valor por deportista</Label><Input type="number" min={0} value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} /></div>
            <div><Label>Cuotas (1–12)</Label><Input type="number" min={1} max={12} value={form.cuotas} onChange={(e) => setForm({ ...form, cuotas: e.target.value })} /></div>
            <div><Label>Vence la 1.ª cuota</Label><Input type="date" value={form.vence} onChange={(e) => setForm({ ...form, vence: e.target.value })} /></div>
          </div>
          <p className="text-xs text-muted-foreground">Si no indicas fecha, la 1.ª cuota vence en 10 días; las demás, mes a mes.</p>
          <Button onClick={crear} disabled={ocupado}>Crear pedido</Button>
        </div>
      )}

      <div className="rounded-md border divide-y">
        {lista.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
            <div>
              <div className="font-medium">{p.nombre}</div>
              <div className="text-xs text-muted-foreground">
                {p.grupo} · {formatCOP(p.valorPorDeportista)} en {p.numeroCuotas} cuota(s) · 1.ª vence {p.primerVencimiento} · {p.deportistasFacturados} facturado(s)
              </div>
            </div>
            {puedeCrear && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={ocupado} onClick={() => correr(p, true)}>Vista previa</Button>
                <Button size="sm" disabled={ocupado} onClick={() => correr(p, false)}>Facturar</Button>
              </div>
            )}
          </div>
        ))}
        {lista.length === 0 && <p className="p-6 text-center text-muted-foreground">Aún no hay pedidos.</p>}
      </div>

      {resultado && (
        <div className="space-y-2 rounded-md border p-4 text-sm">
          <h4 className="font-semibold">{resultado.simulacion ? "Vista previa" : "Resultado"}: {resultado.nombre}</h4>
          <p>
            {resultado.facturados.length} deportista(s) · {resultado.cuotas} cuota(s) · {formatCOP(resultado.totalFacturado)}
            {resultado.sinTallaUniforme > 0 && <> · <b>{resultado.sinTallaUniforme}</b> sin talla de uniforme</>}
          </p>
          <ul className="list-disc pl-5">
            {resultado.facturados.map((l) => <li key={l.personaId}>{l.nombre}{!resultado.simulacion ? ` — ${l.facturas.join(", ")}` : ""}</li>)}
          </ul>
          {resultado.omitidos.length > 0 && (
            <>
              <h5 className="font-medium pt-2">Omitidos</h5>
              <ul className="list-disc pl-5 text-muted-foreground">
                {resultado.omitidos.map((l) => <li key={l.personaId}>{l.nombre}: {l.motivo}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function UniformesPantalla() {
  const { permissions } = useUser();
  const verPedidos = permissions.includes("ver_factura");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  useEffect(() => { listarGrupos().then(setGrupos).catch(() => toast.error("No se pudieron cargar los grupos")); }, []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Uniformes</h1>
        <p className="text-muted-foreground">Tallas por grupo para pedir al proveedor y cobro del uniforme en cuotas.</p>
      </div>
      <Tabs defaultValue="tallas">
        <TabsList>
          <TabsTrigger value="tallas">Tallas por grupo</TabsTrigger>
          {verPedidos && <TabsTrigger value="pedidos">Pedidos y cuotas</TabsTrigger>}
        </TabsList>
        <TabsContent value="tallas" className="pt-4"><Tallas grupos={grupos} /></TabsContent>
        {verPedidos && <TabsContent value="pedidos" className="pt-4"><Pedidos grupos={grupos} /></TabsContent>}
      </Tabs>
    </div>
  );
}
