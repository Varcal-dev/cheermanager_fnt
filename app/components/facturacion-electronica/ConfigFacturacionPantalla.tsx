"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api";
import {
  calcularDv,
  facturacionElectronicaApi,
  type ConfigFacturacion,
  type DocumentoElectronico,
  type EstadoFacturacion,
} from "@/app/lib/facturacion-electronica";

const texto = (v: string | null | undefined) => v ?? "";

export default function ConfigFacturacionPantalla() {
  const [estado, setEstado] = useState<EstadoFacturacion | null>(null);
  const [form, setForm] = useState<ConfigFacturacion | null>(null);
  const [docs, setDocs] = useState<DocumentoElectronico[]>([]);
  const [ocupado, setOcupado] = useState(false);

  const cargar = async () => {
    try {
      const [e, d] = await Promise.all([facturacionElectronicaApi.estado(), facturacionElectronicaApi.documentos()]);
      setEstado(e);
      setForm(e.config);
      setDocs(d);
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo cargar la configuración"));
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  if (!form || !estado) return <p className="text-muted-foreground">Cargando…</p>;

  const set = <K extends keyof ConfigFacturacion>(k: K, v: ConfigFacturacion[K]) => setForm({ ...form, [k]: v });
  const dvSugerido = calcularDv(texto(form.nit));

  const guardar = async () => {
    setOcupado(true);
    try {
      const e = await facturacionElectronicaApi.guardar(form);
      setEstado(e);
      setForm(e.config);
      toast.success("Configuración guardada");
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo guardar"));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturación electrónica</h1>
        <p className="text-muted-foreground">
          Datos fiscales del club para emitir factura electrónica DIAN. Mientras esté apagada, el club factura como hasta ahora.
          Confirma estos datos con tu contador.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
        <Switch checked={form.activa} onCheckedChange={(v) => set("activa", v)} id="activa" />
        <Label htmlFor="activa" className="font-medium">Facturación electrónica activa</Label>
        <Badge variant={form.activa ? "default" : "secondary"}>{form.activa ? "Activa" : "Apagada"}</Badge>
        <Badge variant={estado.credencialesConfiguradas ? "default" : "destructive"}>
          {estado.credencialesConfiguradas ? "Proveedor conectado en el servidor" : "Falta conectar el proveedor en el servidor"}
        </Badge>
      </div>

      {estado.faltantes.length > 0 && (
        <p className="text-sm text-muted-foreground">Para poder activarla falta: {estado.faltantes.join(", ")}.</p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo de persona</Label>
          <Select value={form.tipoPersona ?? ""} onValueChange={(v) => set("tipoPersona", v as ConfigFacturacion["tipoPersona"])}>
            <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NATURAL">Persona natural</SelectItem>
              <SelectItem value="JURIDICA">Persona jurídica (SAS)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Razón social o nombre</Label>
          <Input value={texto(form.razonSocial)} onChange={(e) => set("razonSocial", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>NIT (sin dígito de verificación)</Label>
          <Input inputMode="numeric" value={texto(form.nit)} onChange={(e) => set("nit", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Dígito de verificación</Label>
          <div className="flex gap-2">
            <Input maxLength={1} value={texto(form.dv)} onChange={(e) => set("dv", e.target.value)} />
            {dvSugerido && form.dv !== dvSugerido && (
              <Button type="button" variant="outline" onClick={() => set("dv", dvSugerido)}>Usar {dvSugerido}</Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Nombre comercial (opcional)</Label>
          <Input value={texto(form.nombreComercial)} onChange={(e) => set("nombreComercial", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Correo</Label>
          <Input type="email" value={texto(form.email)} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Dirección</Label>
          <Input value={texto(form.direccion)} onChange={(e) => set("direccion", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Código del municipio</Label>
          <Input value={texto(form.municipioCodigo)} onChange={(e) => set("municipioCodigo", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input value={texto(form.telefono)} onChange={(e) => set("telefono", e.target.value)} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 sm:col-span-2">
          <Switch checked={form.responsableIva} onCheckedChange={(v) => set("responsableIva", v)} id="riva" />
          <Label htmlFor="riva">Responsable de IVA</Label>
        </div>
        <div className="space-y-2">
          <Label>Tratamiento del IVA en los cobros</Label>
          <Select value={form.tratamientoIva} onValueChange={(v) => set("tratamientoIva", v as ConfigFacturacion["tratamientoIva"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EXCLUIDO">Excluido (sin IVA)</SelectItem>
              <SelectItem value="GRAVADO">Gravado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.tratamientoIva === "GRAVADO" && (
          <div className="space-y-2">
            <Label>Tarifa de IVA (%)</Label>
            <Input type="number" min={0} max={100} value={form.tarifaIva} onChange={(e) => set("tarifaIva", Number(e.target.value))} />
          </div>
        )}
        <div className="space-y-2">
          <Label>Id del rango de numeración (resolución)</Label>
          <Input type="number" value={form.rangoNumeracionId ?? ""} onChange={(e) => set("rangoNumeracionId", e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div className="space-y-2">
          <Label>Prefijo</Label>
          <Input value={texto(form.prefijo)} onChange={(e) => set("prefijo", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Ambiente</Label>
          <Select value={form.ambiente} onValueChange={(v) => set("ambiente", v as ConfigFacturacion["ambiente"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PRUEBAS">Pruebas (habilitación)</SelectItem>
              <SelectItem value="PRODUCCION">Producción</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Emitir la factura</Label>
          <Select value={form.emitirAl} onValueChange={(v) => set("emitirAl", v as ConfigFacturacion["emitirAl"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PAGO">Al registrar el pago</SelectItem>
              <SelectItem value="COBRO">Al crear el cobro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <Button onClick={guardar} disabled={ocupado}>{ocupado ? "Guardando…" : "Guardar configuración"}</Button>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Documentos electrónicos</h2>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no se ha emitido ninguno.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {docs.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <Badge variant={d.estado === "EMITIDA" ? "default" : d.estado === "PENDIENTE" ? "secondary" : "destructive"}>{d.estado}</Badge>
                <span>{d.numero ?? d.referencia}</span>
                <span className="text-muted-foreground">Factura #{d.facturaId}</span>
                {d.mensajeError && <span className="text-destructive">{d.mensajeError}</span>}
                {d.urlPdf && <a className="underline" href={d.urlPdf} target="_blank" rel="noreferrer">PDF</a>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
