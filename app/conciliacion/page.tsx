"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Conciliación de pagos no efectivo contra el extracto del banco. Permiso: conciliar_pagos.

interface PagoFila {
  id: number;
  fecha: string;
  monto: number;
  metodo: string;
  tipo: string;
  numeroFactura: string;
  referencia: string | null;
  conciliado: boolean;
  conciliadoEn: string | null;
}

interface Sugerencia {
  fila: number;
  fecha: string;
  valor: number;
  descripcion: string;
  referencia: string;
  pagoId: number;
  criterio: "REFERENCIA" | "MONTO_FECHA" | "AMBIGUA";
  diasDiferencia: number;
}

interface LineaSinPago {
  fila: number;
  fecha: string;
  valor: number;
  descripcion: string;
  referencia: string;
}

interface Informe {
  lineasLeidas: number;
  lineasIgnoradas: number;
  avisos: string[];
  sugerencias: Sugerencia[];
  lineasSinPago: LineaSinPago[];
  pagosSinLinea: PagoFila[];
}

function fechaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const moneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const CRITERIO: Record<Sugerencia["criterio"], string> = {
  REFERENCIA: "Misma referencia y valor",
  MONTO_FECHA: "Mismo valor y fecha cercana",
  AMBIGUA: "Dudosa: revísala",
};

function Contenido() {
  const hoy = new Date();
  const [desde, setDesde] = useState(fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
  const [hasta, setHasta] = useState(fechaLocal(hoy));
  const [filtro, setFiltro] = useState<"pendientes" | "conciliados" | "todos">("pendientes");
  const [pagos, setPagos] = useState<PagoFila[]>([]);
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState<{ id: number; valor: string } | null>(null);

  const entrada = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [informe, setInforme] = useState<Informe | null>(null);
  const [aceptadas, setAceptadas] = useState<Set<number>>(new Set()); // ids de pago aceptados

  const cargar = useCallback(async () => {
    if (!desde || !hasta) return;
    setCargando(true);
    try {
      const params: Record<string, string> = { desde, hasta };
      if (filtro === "pendientes") params.conciliado = "false";
      if (filtro === "conciliados") params.conciliado = "true";
      const { data } = await api.get<PagoFila[]>("/api/conciliacion/pagos", { params });
      setPagos(data);
      setSeleccion(new Set());
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudieron cargar los pagos"));
    } finally {
      setCargando(false);
    }
  }, [desde, hasta, filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function marcar(ids: number[], conciliado: boolean) {
    if (ids.length === 0) return false;
    try {
      await api.post("/api/conciliacion/marcar", { ids, conciliado });
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo actualizar"));
      return false;
    }
  }

  async function marcarSeleccion(conciliado: boolean) {
    if (await marcar(Array.from(seleccion), conciliado)) {
      toast.success(conciliado ? "Pagos conciliados" : "Conciliación retirada");
      await cargar();
    }
  }

  async function guardarReferencia() {
    if (!editando) return;
    try {
      await api.patch(`/api/conciliacion/pagos/${editando.id}/referencia`, { referencia: editando.valor });
      setEditando(null);
      await cargar();
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo guardar la referencia"));
    }
  }

  async function analizar() {
    if (!archivo) return;
    setCargando(true);
    try {
      const datos = new FormData();
      datos.append("archivo", archivo);
      const { data } = await api.post<Informe>("/api/conciliacion/extracto", datos);
      setInforme(data);
      // Se aceptan de antemano solo las sugerencias seguras; las dudosas las decide la persona.
      setAceptadas(new Set(data.sugerencias.filter((s) => s.criterio !== "AMBIGUA").map((s) => s.pagoId)));
    } catch (e) {
      toast.error(getErrorMessage(e, "No se pudo analizar el extracto"));
    } finally {
      setCargando(false);
    }
  }

  async function confirmarSugerencias() {
    if (await marcar(Array.from(aceptadas), true)) {
      toast.success(`${aceptadas.size} pago(s) conciliado(s)`);
      setInforme(null);
      setArchivo(null);
      if (entrada.current) entrada.current.value = "";
      await cargar();
    }
  }

  function alternar<T>(set: Set<T>, v: T, poner: (s: Set<T>) => void) {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    poner(n);
  }

  const todosMarcados = pagos.length > 0 && pagos.every((p) => seleccion.has(p.id));
  const pagoPorId = new Map<number, PagoFila>();
  pagos.forEach((p) => pagoPorId.set(p.id, p));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Conciliación</h1>
        <p className="text-sm text-muted-foreground">
          Verifica los pagos por transferencia, Nequi, tarjeta u otros medios contra el extracto del banco. El efectivo se verifica en el
          cierre de caja. Conciliar no cambia montos ni estados: solo deja constancia de quién verificó y cuándo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cruzar con el extracto del banco</CardTitle>
          <CardDescription>
            Sube el extracto en CSV (columnas fecha y valor; también se leen descripción y referencia). El sistema solo sugiere: nada
            se concilia hasta que confirmes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={entrada}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setArchivo(e.target.files?.[0] ?? null);
                setInforme(null);
              }}
              className="text-sm"
            />
            <Button onClick={analizar} disabled={!archivo || cargando}>
              Analizar extracto
            </Button>
          </div>

          {informe && (
            <div className="space-y-4">
              <p className="text-sm">
                {informe.lineasLeidas} ingreso(s) leído(s)
                {informe.lineasIgnoradas > 0 && ` · ${informe.lineasIgnoradas} fila(s) omitida(s) (egresos, ceros o con error)`} ·{" "}
                {informe.sugerencias.length} coincidencia(s) · {informe.lineasSinPago.length} sin pago · {informe.pagosSinLinea.length} pago(s)
                sin línea en el extracto
              </p>
              {informe.avisos.length > 0 && (
                <ul className="list-disc pl-5 text-xs text-muted-foreground">
                  {informe.avisos.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              )}

              {informe.sugerencias.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>Fila</TableHead>
                      <TableHead>Extracto</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Pago (factura)</TableHead>
                      <TableHead>Criterio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {informe.sugerencias.map((s) => (
                      <TableRow key={s.fila}>
                        <TableCell>
                          <Checkbox
                            checked={aceptadas.has(s.pagoId)}
                            onCheckedChange={() => alternar(aceptadas, s.pagoId, setAceptadas)}
                            aria-label={`Aceptar fila ${s.fila}`}
                          />
                        </TableCell>
                        <TableCell>{s.fila}</TableCell>
                        <TableCell className="text-sm">
                          {s.fecha} · {s.descripcion || "—"}
                          {s.referencia && <span className="text-muted-foreground"> · {s.referencia}</span>}
                        </TableCell>
                        <TableCell className="text-right">{moneda.format(s.valor)}</TableCell>
                        <TableCell className="text-sm">
                          #{s.pagoId}
                          {pagoPorId.get(s.pagoId) ? ` · ${pagoPorId.get(s.pagoId)!.numeroFactura}` : ""}
                          {s.diasDiferencia > 0 && <span className="text-muted-foreground"> · {s.diasDiferencia} día(s) de diferencia</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.criterio === "AMBIGUA" ? "destructive" : "secondary"}>{CRITERIO[s.criterio]}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {informe.sugerencias.length > 0 && (
                <Button onClick={confirmarSugerencias} disabled={aceptadas.size === 0}>
                  Conciliar {aceptadas.size} pago(s) marcado(s)
                </Button>
              )}

              {informe.lineasSinPago.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">En el extracto, sin pago registrado</h3>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Dinero que entró al banco y no aparece en el sistema: registra el pago o revisa si es de otro concepto.
                  </p>
                  <Table>
                    <TableBody>
                      {informe.lineasSinPago.map((l) => (
                        <TableRow key={l.fila}>
                          <TableCell>Fila {l.fila}</TableCell>
                          <TableCell>{l.fecha}</TableCell>
                          <TableCell>{l.descripcion || "—"}</TableCell>
                          <TableCell>{l.referencia || "—"}</TableCell>
                          <TableCell className="text-right">{moneda.format(l.valor)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {informe.pagosSinLinea.length > 0 && (
                <div>
                  <h3 className="mb-1 text-sm font-medium">En el sistema, sin línea en el extracto</h3>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Pagos del mismo periodo que no se ven en el banco: confirma que el dinero llegó.
                  </p>
                  <Table>
                    <TableBody>
                      {informe.pagosSinLinea.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>#{p.id}</TableCell>
                          <TableCell>{p.fecha}</TableCell>
                          <TableCell>{p.metodo}</TableCell>
                          <TableCell>{p.numeroFactura}</TableCell>
                          <TableCell>{p.referencia ?? "—"}</TableCell>
                          <TableCell className="text-right">{moneda.format(p.monto)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagos no efectivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="desde">Desde</Label>
              <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="hasta">Hasta</Label>
              <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="filtro">Mostrar</Label>
              <select
                id="filtro"
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value as typeof filtro)}
              >
                <option value="pendientes">Sin conciliar</option>
                <option value="conciliados">Conciliados</option>
                <option value="todos">Todos</option>
              </select>
            </div>
            <Button variant="outline" onClick={cargar} disabled={cargando}>
              Actualizar
            </Button>
            <Button onClick={() => marcarSeleccion(true)} disabled={seleccion.size === 0}>
              Conciliar seleccionados ({seleccion.size})
            </Button>
            <Button variant="outline" onClick={() => marcarSeleccion(false)} disabled={seleccion.size === 0}>
              Quitar conciliación
            </Button>
          </div>

          {pagos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pagos para mostrar con estos filtros.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={todosMarcados}
                      onCheckedChange={() => setSeleccion(todosMarcados ? new Set() : new Set(pagos.map((p) => p.id)))}
                      aria-label="Seleccionar todos"
                    />
                  </TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Checkbox
                        checked={seleccion.has(p.id)}
                        onCheckedChange={() => alternar(seleccion, p.id, setSeleccion)}
                        aria-label={`Seleccionar pago ${p.id}`}
                      />
                    </TableCell>
                    <TableCell>{p.fecha}</TableCell>
                    <TableCell>{p.numeroFactura}</TableCell>
                    <TableCell>{p.metodo}</TableCell>
                    <TableCell>{p.tipo}</TableCell>
                    <TableCell>
                      {editando?.id === p.id ? (
                        <div className="flex gap-1">
                          <Input
                            value={editando.valor}
                            maxLength={100}
                            className="h-8 w-40"
                            onChange={(e) => setEditando({ id: p.id, valor: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") guardarReferencia();
                              if (e.key === "Escape") setEditando(null);
                            }}
                            autoFocus
                          />
                          <Button size="sm" onClick={guardarReferencia}>
                            Guardar
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-left text-sm underline-offset-2 hover:underline"
                          onClick={() => setEditando({ id: p.id, valor: p.referencia ?? "" })}
                        >
                          {p.referencia ?? "añadir…"}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{moneda.format(p.monto)}</TableCell>
                    <TableCell>
                      {p.conciliado ? <Badge>Conciliado</Badge> : <Badge variant="outline">Sin conciliar</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConciliacionPage() {
  return (
    <ProtectedRoute requiredPermission="conciliar_pagos">
      <Contenido />
    </ProtectedRoute>
  );
}
