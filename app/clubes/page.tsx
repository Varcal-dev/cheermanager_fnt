"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Plus, Power, Settings2 } from "lucide-react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ETIQUETA_VIGENCIA,
  fechaCorta,
  suscripcionApi,
  type EstadoSuscripcion,
  type PagoSuscripcion,
  type Plan,
  type ResumenSuscripcion,
  type Vigencia,
} from "@/app/lib/suscripcion";

// Administración de clubes (multi-club) y de su suscripción. Solo el superadmin de la plataforma (permiso gestionar_clubes).

interface Club {
  id: number;
  nombre: string;
  slug: string;
  activo: boolean;
  fechaCreacion: string;
}

const VACIO = {
  nombre: "",
  slug: "",
  adminUsername: "",
  adminEmail: "",
  adminPassword: "",
  cargarPlantilla: true,
};

const FORM_PAGO = { monto: "", meses: "1", metodo: "", referencia: "", nota: "" };

const VARIANTE_VIGENCIA: Record<Vigencia, "default" | "secondary" | "destructive" | "outline"> = {
  ILIMITADA: "secondary",
  VIGENTE: "default",
  EN_GRACIA: "outline",
  SOLO_LECTURA: "destructive",
};

const dinero = (n: number) => n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function ClubesPage() {
  const [clubes, setClubes] = useState<Club[]>([]);
  const [suscripciones, setSuscripciones] = useState<Record<number, ResumenSuscripcion>>({});
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [paraCambiar, setParaCambiar] = useState<Club | null>(null);

  // Suscripción de un club
  const [editando, setEditando] = useState<ResumenSuscripcion | null>(null);
  const [pagos, setPagos] = useState<PagoSuscripcion[]>([]);
  const [ajuste, setAjuste] = useState({
    planId: "",
    estado: "ACTIVA" as EstadoSuscripcion,
    vigenteHasta: "",
    sinVencimiento: false,
    diasGracia: "5",
    limite: "",
    notas: "",
  });
  const [pago, setPago] = useState(FORM_PAGO);
  const [guardandoSusc, setGuardandoSusc] = useState(false);

  const cargar = async () => {
    try {
      const [res, susc, pl] = await Promise.all([
        api.get("/api/clubes"),
        suscripcionApi.todas(),
        suscripcionApi.planes(),
      ]);
      setClubes(res.data ?? []);
      setSuscripciones(Object.fromEntries(susc.map((s) => [s.clubId, s])));
      setPlanes(pl);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron cargar los clubes"));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const crear = async () => {
    if (form.adminPassword.length < 10) {
      toast.error("La clave inicial del administrador debe tener al menos 10 caracteres");
      return;
    }
    setGuardando(true);
    try {
      await api.post("/api/clubes", {
        ...form,
        slug: form.slug.trim() || null, // el back lo genera a partir del nombre si no se envía
      });
      toast.success("Club creado (empieza con 30 días de prueba)");
      setAbierto(false);
      setForm(VACIO);
      cargar();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear el club"));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarActivo = async () => {
    if (!paraCambiar) return;
    try {
      await api.patch(`/api/clubes/${paraCambiar.id}/activo`, { activo: !paraCambiar.activo });
      toast.success(paraCambiar.activo ? "Club suspendido" : "Club reactivado");
      setParaCambiar(null);
      cargar();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo cambiar el estado del club"));
    }
  };

  // ---- Suscripción ----
  const abrirSuscripcion = async (s: ResumenSuscripcion) => {
    setEditando(s);
    setPago(FORM_PAGO);
    setAjuste({
      planId: s.planId ? String(s.planId) : "",
      estado: s.estadoSuscripcion ?? "ACTIVA",
      vigenteHasta: s.vigenteHasta ?? "",
      sinVencimiento: s.vigenteHasta === null,
      diasGracia: String(s.diasGracia ?? 5),
      limite: s.limiteDeportistas !== null ? String(s.limiteDeportistas) : "",
      notas: s.notas ?? "",
    });
    setPagos([]);
    try {
      setPagos(await suscripcionApi.pagos(s.clubId));
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo cargar el historial de cobros"));
    }
  };

  const aplicarResumen = (r: ResumenSuscripcion) => {
    setSuscripciones((prev) => ({ ...prev, [r.clubId]: r }));
    setEditando(r);
    setAjuste((a) => ({ ...a, vigenteHasta: r.vigenteHasta ?? "", sinVencimiento: r.vigenteHasta === null, estado: r.estadoSuscripcion ?? a.estado }));
  };

  const guardarAjuste = async () => {
    if (!editando) return;
    const gracia = Number(ajuste.diasGracia);
    if (!Number.isInteger(gracia) || gracia < 0 || gracia > 60) {
      toast.error("Los días de gracia deben estar entre 0 y 60");
      return;
    }
    const limiteTexto = ajuste.limite.trim();
    if (limiteTexto !== "" && (!Number.isInteger(Number(limiteTexto)) || Number(limiteTexto) < 1)) {
      toast.error("El límite de deportistas debe ser un entero de al menos 1 (o vacío para usar el del plan)");
      return;
    }
    if (!ajuste.sinVencimiento && !ajuste.vigenteHasta) {
      toast.error("Indica hasta cuándo está vigente o marca \"Sin vencimiento\"");
      return;
    }
    setGuardandoSusc(true);
    try {
      const r = await suscripcionApi.actualizar(editando.clubId, {
        planId: ajuste.planId ? Number(ajuste.planId) : undefined,
        estadoSuscripcion: ajuste.estado,
        sinVencimiento: ajuste.sinVencimiento,
        vigenteHasta: ajuste.sinVencimiento ? undefined : ajuste.vigenteHasta,
        diasGracia: gracia,
        limiteDeportistas: limiteTexto === "" ? undefined : Number(limiteTexto),
        quitarLimite: limiteTexto === "",
        notas: ajuste.notas,
      });
      aplicarResumen(r);
      toast.success("Suscripción actualizada");
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar la suscripción"));
    } finally {
      setGuardandoSusc(false);
    }
  };

  const registrarCobro = async () => {
    if (!editando) return;
    const monto = Number(pago.monto);
    const meses = Number(pago.meses);
    if (pago.monto.trim() === "" || !Number.isFinite(monto) || monto < 0) {
      toast.error("Escribe el monto cobrado (0 si es una cortesía)");
      return;
    }
    if (!Number.isInteger(meses) || meses < 1 || meses > 24) {
      toast.error("Los meses deben estar entre 1 y 24");
      return;
    }
    setGuardandoSusc(true);
    try {
      const r = await suscripcionApi.registrarPago(editando.clubId, {
        monto,
        meses,
        metodo: pago.metodo.trim() || undefined,
        referencia: pago.referencia.trim() || undefined,
        nota: pago.nota.trim() || undefined,
      });
      aplicarResumen(r);
      setPago(FORM_PAGO);
      setPagos(await suscripcionApi.pagos(editando.clubId));
      toast.success(`Cobro registrado: vigente hasta ${fechaCorta(r.vigenteHasta)}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo registrar el cobro"));
    } finally {
      setGuardandoSusc(false);
    }
  };

  const planSeleccionado = useMemo(() => planes.find((p) => String(p.id) === ajuste.planId) ?? null, [planes, ajuste.planId]);

  return (
    <ProtectedRoute requiredPermission="gestionar_clubes">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clubes</h1>
            <p className="text-muted-foreground">
              Cada club ve únicamente sus propios datos. Aquí das de alta nuevos clubes, administras su plan y suscripción, o suspendes uno.
            </p>
          </div>
          <Button onClick={() => setAbierto(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo club
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Suscripción</TableHead>
                  <TableHead>Deportistas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : (
                  clubes.map((c) => {
                    const s = suscripciones[c.id];
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.nombre}
                          {c.id === 1 && <span className="ml-2 text-xs text-muted-foreground">(Plataforma)</span>}
                          <div className="text-xs font-normal text-muted-foreground">{c.slug}</div>
                        </TableCell>
                        <TableCell>{c.id === 1 ? "—" : s?.planNombre ?? "Sin plan"}</TableCell>
                        <TableCell>
                          {c.id === 1 || !s ? (
                            "—"
                          ) : (
                            <div className="space-y-1">
                              <Badge variant={VARIANTE_VIGENCIA[s.vigencia]}>
                                {s.estadoSuscripcion === "PRUEBA" && s.vigencia !== "SOLO_LECTURA" ? "Prueba" : ETIQUETA_VIGENCIA[s.vigencia]}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {s.vigenteHasta ? `Hasta ${fechaCorta(s.vigenteHasta)}` : "Sin vencimiento"}
                                {s.diasRestantes !== null && s.diasRestantes >= 0 && s.diasRestantes <= 7 ? ` (${s.diasRestantes} d)` : ""}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {s ? `${s.deportistasActivos}${s.limiteEfectivo !== null ? ` / ${s.limiteEfectivo}` : ""}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.activo ? "default" : "secondary"}>{c.activo ? "Activo" : "Suspendido"}</Badge>
                        </TableCell>
                        <TableCell>
                          {c.id !== 1 && (
                            <div className="flex flex-wrap gap-2">
                              {s && (
                                <Button size="sm" variant="outline" onClick={() => abrirSuscripcion(s)}>
                                  <CreditCard className="mr-1 h-4 w-4" /> Suscripción
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => setParaCambiar(c)}>
                                <Power className="mr-1 h-4 w-4" /> {c.activo ? "Suspender" : "Reactivar"}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Nuevo club */}
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Nuevo club</DialogTitle>
              <DialogDescription>
                Se crea el club con los roles base (Administrador, Entrenador, Director, Coordinador, Asistente, Tesorero, Inventario,
                Deportista y Acudiente), su administrador y 30 días de prueba con el plan Start. El username y el correo deben ser
                únicos en toda la plataforma.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Nombre del club</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div>
                <Label>Identificador (opcional)</Label>
                <Input
                  placeholder="se genera del nombre si lo dejas vacío"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div>
                <Label>Usuario del administrador</Label>
                <Input value={form.adminUsername} onChange={(e) => setForm({ ...form, adminUsername: e.target.value })} />
              </div>
              <div>
                <Label>Correo del administrador</Label>
                <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
              </div>
              <div>
                <Label>Clave inicial (mínimo 10 caracteres)</Label>
                <Input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.cargarPlantilla}
                  onCheckedChange={(c) => setForm({ ...form, cargarPlantilla: c === true })}
                />
                Cargar niveles (Nivel 1–6) y divisiones de ejemplo (editables)
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button onClick={crear} disabled={guardando}>
                {guardando ? "Creando..." : "Crear club"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspender / reactivar */}
        <Dialog open={!!paraCambiar} onOpenChange={(o) => !o && setParaCambiar(null)}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>{paraCambiar?.activo ? "Suspender club" : "Reactivar club"}</DialogTitle>
              <DialogDescription>
                {paraCambiar?.activo
                  ? `Los usuarios de "${paraCambiar?.nombre}" perderán el acceso de inmediato.`
                  : `Los usuarios de "${paraCambiar?.nombre}" podrán volver a iniciar sesión.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setParaCambiar(null)}>
                Cancelar
              </Button>
              <Button variant={paraCambiar?.activo ? "destructive" : "default"} onClick={cambiarActivo}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suscripción */}
        <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
            <DialogHeader>
              <DialogTitle>Suscripción de {editando?.clubNombre}</DialogTitle>
              <DialogDescription>
                {editando && (
                  <>
                    {editando.deportistasActivos} deportistas activos
                    {editando.limiteEfectivo !== null ? ` de ${editando.limiteEfectivo} permitidos` : " (sin límite)"}. Con la suscripción
                    vencida el club queda en solo lectura: puede consultar, pero no crear ni modificar.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Registrar cobro */}
              <section className="space-y-3 rounded-lg border p-4">
                <h3 className="flex items-center gap-2 font-semibold">
                  <CreditCard className="h-4 w-4" /> Registrar cobro y renovar
                </h3>
                <p className="text-xs text-muted-foreground">
                  El periodo nuevo empieza al día siguiente del vencimiento actual (o hoy si ya venció) y deja la suscripción en Activa.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Monto cobrado (COP)</Label>
                    <Input inputMode="numeric" value={pago.monto} onChange={(e) => setPago({ ...pago, monto: e.target.value })} />
                    {planSeleccionado?.precioMensual != null && (
                      <button
                        type="button"
                        className="mt-1 text-xs text-primary underline"
                        onClick={() => setPago({ ...pago, monto: String(planSeleccionado.precioMensual! * (Number(pago.meses) || 1)) })}
                      >
                        Usar el precio del plan ({dinero(planSeleccionado.precioMensual)} por mes)
                      </button>
                    )}
                  </div>
                  <div>
                    <Label>Meses que cubre</Label>
                    <Input inputMode="numeric" value={pago.meses} onChange={(e) => setPago({ ...pago, meses: e.target.value })} />
                  </div>
                  <div>
                    <Label>Método (opcional)</Label>
                    <Input placeholder="Transferencia, efectivo…" value={pago.metodo} onChange={(e) => setPago({ ...pago, metodo: e.target.value })} />
                  </div>
                  <div>
                    <Label>Referencia (opcional)</Label>
                    <Input value={pago.referencia} onChange={(e) => setPago({ ...pago, referencia: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Nota (opcional)</Label>
                  <Input value={pago.nota} onChange={(e) => setPago({ ...pago, nota: e.target.value })} />
                </div>
                <Button onClick={registrarCobro} disabled={guardandoSusc}>
                  Registrar cobro
                </Button>

                {pagos.length > 0 && (
                  <div className="pt-2">
                    <Label>Cobros anteriores</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Periodo</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Método / ref.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagos.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{fechaCorta(p.fechaPago)}</TableCell>
                            <TableCell>
                              {fechaCorta(p.periodoDesde)} – {fechaCorta(p.periodoHasta)} ({p.meses} m)
                            </TableCell>
                            <TableCell>{dinero(p.monto)}</TableCell>
                            <TableCell>{[p.metodo, p.referencia].filter(Boolean).join(" · ") || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>

              {/* Ajustes manuales */}
              <section className="space-y-3 rounded-lg border p-4">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Settings2 className="h-4 w-4" /> Ajustes de la suscripción
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Plan</Label>
                    <Select value={ajuste.planId} onValueChange={(v) => setAjuste({ ...ajuste, planId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {planes.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.nombre}
                            {p.maxDeportistas !== null ? ` · hasta ${p.maxDeportistas}` : ""}
                            {p.precioMensual !== null ? ` · ${dinero(p.precioMensual)}/mes` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select value={ajuste.estado} onValueChange={(v) => setAjuste({ ...ajuste, estado: v as EstadoSuscripcion })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRUEBA">Prueba</SelectItem>
                        <SelectItem value="ACTIVA">Activa</SelectItem>
                        <SelectItem value="CANCELADA">Cancelada (solo lectura)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vigente hasta</Label>
                    <Input
                      type="date"
                      disabled={ajuste.sinVencimiento}
                      value={ajuste.vigenteHasta}
                      onChange={(e) => setAjuste({ ...ajuste, vigenteHasta: e.target.value })}
                    />
                    <label className="mt-1 flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={ajuste.sinVencimiento}
                        onCheckedChange={(c) => setAjuste({ ...ajuste, sinVencimiento: c === true })}
                      />
                      Sin vencimiento
                    </label>
                  </div>
                  <div>
                    <Label>Días de gracia (solo suscripción activa)</Label>
                    <Input inputMode="numeric" value={ajuste.diasGracia} onChange={(e) => setAjuste({ ...ajuste, diasGracia: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Límite propio de deportistas activos</Label>
                    <Input
                      inputMode="numeric"
                      placeholder={
                        editando?.limiteDelPlan != null ? `vacío = el del plan (${editando.limiteDelPlan})` : "vacío = el del plan (sin límite)"
                      }
                      value={ajuste.limite}
                      onChange={(e) => setAjuste({ ...ajuste, limite: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notas internas (el club no las ve)</Label>
                  <Textarea rows={2} value={ajuste.notas} onChange={(e) => setAjuste({ ...ajuste, notas: e.target.value })} />
                </div>
                <Button variant="outline" onClick={guardarAjuste} disabled={guardandoSusc}>
                  Guardar ajustes
                </Button>
              </section>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditando(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
