"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import { api, getErrorMessage } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Acudientes (padres/tutores) y consentimientos de datos (Ley 1581) de un deportista.
// Esto es registro de EVIDENCIA, no asesoría legal: el texto que se firma lo debe validar un abogado.

interface Props {
  deportistaId: number;
  personaId: number;
  fechaNacimiento?: string | null;
}

interface Vinculo {
  vinculoId: number;
  acudienteId: number;
  nombre: string;
  apellidos: string;
  telefono?: string;
  email?: string;
  parentesco?: string;
  principal: boolean;
  autorizaRecoger: boolean;
}

interface AcudienteLista {
  id: number;
  nombre: string;
  apellidos: string;
  numeroDocumento?: string;
}

interface Consentimiento {
  id: number;
  tipo: string;
  versionTexto: string;
  canal: string;
  acudienteId?: number | null;
  fechaOtorgado: string;
  fechaRevocado?: string | null;
  motivoRevocacion?: string | null;
  vigente: boolean;
}

const TIPOS: { valor: string; etiqueta: string }[] = [
  { valor: "TRATAMIENTO_DATOS", etiqueta: "Tratamiento de datos personales" },
  { valor: "DATOS_SALUD", etiqueta: "Datos de salud" },
  { valor: "IMAGEN", etiqueta: "Uso de imagen (fotos y videos)" },
];

const esMenorDeEdad = (fecha?: string | null) => {
  if (!fecha) return null; // sin fecha no se puede saber (el back tampoco adivina)
  const nac = new Date(fecha);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad < 18;
};

export default function AcudientesConsentimientosPanel({ deportistaId, personaId, fechaNacimiento }: Props) {
  const { permissions } = useUser();
  const verAcudientes = permissions.includes("ver_acudientes");
  const gestionarAcudientes = permissions.includes("gestionar_acudientes");
  const verConsentimientos = permissions.includes("ver_consentimientos");
  const gestionarConsentimientos = permissions.includes("gestionar_consentimientos");
  const menor = esMenorDeEdad(fechaNacimiento);

  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([]);

  // --- vincular acudiente ---
  const [vincularAbierto, setVincularAbierto] = useState(false);
  const [modo, setModo] = useState<"existente" | "nuevo">("existente");
  const [todos, setTodos] = useState<AcudienteLista[]>([]);
  const [acudienteSel, setAcudienteSel] = useState("");
  const [nuevo, setNuevo] = useState({
    nombre: "",
    apellidos: "",
    tipoDocumento: "CC",
    numeroDocumento: "",
    telefono: "",
    email: "",
  });
  const [parentesco, setParentesco] = useState("");
  const [autorizaRecoger, setAutorizaRecoger] = useState(true);
  const [guardandoVinculo, setGuardandoVinculo] = useState(false);

  // --- registrar consentimiento ---
  const [consentTipo, setConsentTipo] = useState<string | null>(null);
  const [versionTexto, setVersionTexto] = useState("");
  const [canal, setCanal] = useState("PAPEL");
  const [otorgaAcudienteId, setOtorgaAcudienteId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardandoConsent, setGuardandoConsent] = useState(false);

  // --- revocar ---
  const [revocando, setRevocando] = useState<Consentimiento | null>(null);
  const [motivo, setMotivo] = useState("");

  const cargarVinculos = useCallback(async () => {
    if (!verAcudientes) return;
    try {
      const res = await api.get(`/api/acudientes/deportista/${deportistaId}`);
      setVinculos(res.data ?? []);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron cargar los acudientes"));
    }
  }, [deportistaId, verAcudientes]);

  const cargarConsentimientos = useCallback(async () => {
    if (!verConsentimientos) return;
    try {
      const res = await api.get(`/api/consentimientos/persona/${personaId}`);
      setConsentimientos(res.data ?? []);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudieron cargar los consentimientos"));
    }
  }, [personaId, verConsentimientos]);

  useEffect(() => {
    cargarVinculos();
    cargarConsentimientos();
  }, [cargarVinculos, cargarConsentimientos]);

  const abrirVincular = async () => {
    setModo("existente");
    setAcudienteSel("");
    setParentesco("");
    setAutorizaRecoger(true);
    setNuevo({ nombre: "", apellidos: "", tipoDocumento: "CC", numeroDocumento: "", telefono: "", email: "" });
    setVincularAbierto(true);
    try {
      const res = await api.get("/api/acudientes");
      setTodos(res.data ?? []);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo cargar la lista de acudientes"));
    }
  };

  const guardarVinculo = async () => {
    setGuardandoVinculo(true);
    try {
      let acudienteId: number;
      if (modo === "nuevo") {
        if (!nuevo.nombre.trim() || !nuevo.apellidos.trim()) {
          toast.error("Nombre y apellidos del acudiente son obligatorios");
          return;
        }
        const creado = await api.post("/api/acudientes", nuevo);
        acudienteId = creado.data.id;
      } else {
        if (!acudienteSel) {
          toast.error("Selecciona un acudiente");
          return;
        }
        acudienteId = Number(acudienteSel);
      }
      // El primer acudiente que se vincula queda como principal (lo decide el back).
      await api.post(`/api/acudientes/deportista/${deportistaId}`, {
        acudienteId,
        parentesco: parentesco.trim() || null,
        principal: null,
        autorizaRecoger,
      });
      toast.success("Acudiente vinculado");
      setVincularAbierto(false);
      cargarVinculos();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo vincular el acudiente"));
    } finally {
      setGuardandoVinculo(false);
    }
  };

  const desvincular = async (v: Vinculo) => {
    if (!confirm(`¿Quitar a ${v.nombre} ${v.apellidos} como acudiente de este deportista?`)) return;
    try {
      await api.delete(`/api/acudientes/vinculos/${v.vinculoId}`);
      toast.success("Vínculo eliminado");
      cargarVinculos();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo quitar el vínculo"));
    }
  };

  const abrirConsentimiento = (tipo: string) => {
    setConsentTipo(tipo);
    setVersionTexto("");
    setCanal("PAPEL");
    setObservaciones("");
    setOtorgaAcudienteId(vinculos.find((v) => v.principal)?.acudienteId?.toString() ?? vinculos[0]?.acudienteId?.toString() ?? "");
  };

  const guardarConsentimiento = async () => {
    if (!consentTipo) return;
    if (!versionTexto.trim()) {
      toast.error("Indica la versión del texto de autorización que se firmó");
      return;
    }
    setGuardandoConsent(true);
    try {
      await api.post("/api/consentimientos", {
        personaId,
        tipo: consentTipo,
        versionTexto: versionTexto.trim(),
        canal,
        acudienteId: menor ? Number(otorgaAcudienteId) || null : null,
        observaciones: observaciones.trim() || null,
      });
      toast.success("Consentimiento registrado");
      setConsentTipo(null);
      cargarConsentimientos();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo registrar el consentimiento"));
    } finally {
      setGuardandoConsent(false);
    }
  };

  const revocar = async () => {
    if (!revocando) return;
    try {
      await api.patch(`/api/consentimientos/${revocando.id}/revocar`, { motivo: motivo.trim() || null });
      toast.success("Consentimiento revocado");
      setRevocando(null);
      setMotivo("");
      cargarConsentimientos();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo revocar el consentimiento"));
    }
  };

  if (!verAcudientes && !verConsentimientos) {
    return <p className="text-sm text-muted-foreground">No tienes permiso para ver acudientes ni consentimientos.</p>;
  }

  const vigentePorTipo = (tipo: string) => consentimientos.find((c) => c.tipo === tipo && c.vigente);

  return (
    <div className="space-y-8">
      {verAcudientes && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Acudientes</h4>
            {gestionarAcudientes && (
              <Button size="sm" variant="outline" onClick={abrirVincular}>
                <UserPlus className="h-4 w-4 mr-1" /> Vincular acudiente
              </Button>
            )}
          </div>
          {menor && vinculos.length === 0 && (
            <p className="text-sm text-amber-600">
              Este deportista es menor de edad y todavía no tiene acudiente.
            </p>
          )}
          {vinculos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin acudientes registrados.</p>
          ) : (
            <ul className="space-y-2">
              {vinculos.map((v) => (
                <li key={v.vinculoId} className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm">
                    <p className="font-medium">
                      {v.nombre} {v.apellidos}
                      {v.principal && <Badge className="ml-2">Principal</Badge>}
                    </p>
                    <p className="text-muted-foreground">
                      {[v.parentesco, v.telefono, v.email].filter(Boolean).join(" · ") || "—"}
                      {v.autorizaRecoger ? " · Autorizado a recoger" : ""}
                    </p>
                  </div>
                  {gestionarAcudientes && (
                    <Button size="sm" variant="ghost" onClick={() => desvincular(v)} aria-label="Quitar acudiente">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {verConsentimientos && (
        <section className="space-y-3">
          <h4 className="font-semibold">Consentimientos (Ley 1581)</h4>
          {menor === null && (
            <p className="text-sm text-amber-600">
              Falta la fecha de nacimiento: sin ella no se puede registrar un consentimiento.
            </p>
          )}
          <ul className="space-y-2">
            {TIPOS.map((t) => {
              const vigente = vigentePorTipo(t.valor);
              return (
                <li key={t.valor} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3 text-sm">
                    {vigente ? (
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <ShieldOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{t.etiqueta}</p>
                      <p className="text-muted-foreground">
                        {vigente
                          ? `Vigente desde ${new Date(vigente.fechaOtorgado).toLocaleDateString("es-CO")} · texto ${vigente.versionTexto} · ${vigente.canal}`
                          : "Sin consentimiento vigente"}
                      </p>
                    </div>
                  </div>
                  {gestionarConsentimientos &&
                    (vigente ? (
                      <Button size="sm" variant="outline" onClick={() => setRevocando(vigente)}>
                        Revocar
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => abrirConsentimiento(t.valor)} disabled={menor === null}>
                        <Plus className="h-4 w-4 mr-1" /> Registrar
                      </Button>
                    ))}
                </li>
              );
            })}
          </ul>
          {consentimientos.some((c) => !c.vigente) && (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">Historial de revocados</summary>
              <ul className="mt-2 space-y-1">
                {consentimientos
                  .filter((c) => !c.vigente)
                  .map((c) => (
                    <li key={c.id}>
                      {TIPOS.find((t) => t.valor === c.tipo)?.etiqueta ?? c.tipo} · otorgado{" "}
                      {new Date(c.fechaOtorgado).toLocaleDateString("es-CO")} · revocado{" "}
                      {c.fechaRevocado ? new Date(c.fechaRevocado).toLocaleDateString("es-CO") : ""}
                      {c.motivoRevocacion ? ` (${c.motivoRevocacion})` : ""}
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {/* Vincular acudiente */}
      <Dialog open={vincularAbierto} onOpenChange={setVincularAbierto}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Vincular acudiente</DialogTitle>
            <DialogDescription>
              Un acudiente puede serlo de varios deportistas (hermanos). El primero que se vincula queda como principal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={modo === "existente"} onChange={() => setModo("existente")} /> Ya registrado
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={modo === "nuevo"} onChange={() => setModo("nuevo")} /> Nuevo
              </label>
            </div>
            {modo === "existente" ? (
              <Select value={acudienteSel} onValueChange={setAcudienteSel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un acudiente" />
                </SelectTrigger>
                <SelectContent>
                  {todos.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.nombre} {a.apellidos}
                      {a.numeroDocumento ? ` · ${a.numeroDocumento}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nombre</Label>
                  <Input value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
                </div>
                <div>
                  <Label>Apellidos</Label>
                  <Input value={nuevo.apellidos} onChange={(e) => setNuevo({ ...nuevo, apellidos: e.target.value })} />
                </div>
                <div>
                  <Label>Tipo doc.</Label>
                  <Input value={nuevo.tipoDocumento} onChange={(e) => setNuevo({ ...nuevo, tipoDocumento: e.target.value })} />
                </div>
                <div>
                  <Label>N.º documento</Label>
                  <Input value={nuevo.numeroDocumento} onChange={(e) => setNuevo({ ...nuevo, numeroDocumento: e.target.value })} />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} />
                </div>
                <div>
                  <Label>Correo</Label>
                  <Input type="email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} />
                </div>
              </div>
            )}
            <div>
              <Label>Parentesco</Label>
              <Input placeholder="Madre, padre, tutor…" value={parentesco} onChange={(e) => setParentesco(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={autorizaRecoger} onCheckedChange={(c) => setAutorizaRecoger(c === true)} />
              Autorizado a recoger al deportista
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVincularAbierto(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarVinculo} disabled={guardandoVinculo}>
              {guardandoVinculo ? "Guardando..." : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrar consentimiento */}
      <Dialog open={consentTipo !== null} onOpenChange={(o) => !o && setConsentTipo(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Registrar consentimiento</DialogTitle>
            <DialogDescription>
              {TIPOS.find((t) => t.valor === consentTipo)?.etiqueta}. Se guarda como evidencia: no se edita ni se
              borra, solo se puede revocar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Versión del texto firmado</Label>
              <Input placeholder="Ej. Política v1 – 2026" value={versionTexto} onChange={(e) => setVersionTexto(e.target.value)} />
            </div>
            <div>
              <Label>Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAPEL">Papel (firmado)</SelectItem>
                  <SelectItem value="DIGITAL">Digital</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {menor && (
              <div>
                <Label>Lo otorga el acudiente</Label>
                {vinculos.length === 0 ? (
                  <p className="text-sm text-amber-600">
                    El titular es menor de edad: primero vincula un acudiente.
                  </p>
                ) : (
                  <Select value={otorgaAcudienteId} onValueChange={setOtorgaAcudienteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el acudiente" />
                    </SelectTrigger>
                    <SelectContent>
                      {vinculos.map((v) => (
                        <SelectItem key={v.acudienteId} value={String(v.acudienteId)}>
                          {v.nombre} {v.apellidos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            <div>
              <Label>Observaciones (opcional)</Label>
              <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConsentTipo(null)}>
              Cancelar
            </Button>
            <Button onClick={guardarConsentimiento} disabled={guardandoConsent || (menor === true && vinculos.length === 0)}>
              {guardandoConsent ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revocar */}
      <Dialog open={revocando !== null} onOpenChange={(o) => !o && setRevocando(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Revocar consentimiento</DialogTitle>
            <DialogDescription>El registro se conserva como evidencia, marcado como revocado.</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Motivo (opcional)</Label>
            <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevocando(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={revocar}>
              Revocar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
