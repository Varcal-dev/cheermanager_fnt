"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

interface Resultado {
  id: number;
  eventoId: number;
  grupoEntrenamientoId: number;
  nombreGrupo: string;
  posicion: number;
  puntaje: number;
  premioId: number | null;
  descripcionPremio: string | null;
  observaciones: string;
}

interface GrupoEvento {
  id: number;
  grupoEntrenamientoId: number;
  nombreGrupo: string;
}

interface PremioEvento {
  id: number;
  descripcion: string;
  premio: string;
}

const FORM_VACIO = {
  grupoEntrenamientoId: "",
  posicion: "",
  puntaje: "",
  premioId: "",
  observaciones: "",
};

export default function ResultadosEventoPanel({ eventoId }: { eventoId: number }) {
  const [cargando, setCargando] = useState(true);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [gruposInscritos, setGruposInscritos] = useState<GrupoEvento[]>([]);
  const [premios, setPremios] = useState<PremioEvento[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [resultadoEnEdicion, setResultadoEnEdicion] = useState<Resultado | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    Promise.allSettled([
      api.get(`/api/resultados-competencia/evento/${eventoId}`),
      api.get(`/api/grupos-evento/evento/${eventoId}`),
      api.get(`/api/premios-evento/evento/${eventoId}`),
    ]).then(([resResultados, resGrupos, resPremios]) => {
      if (resResultados.status === "fulfilled") setResultados(resResultados.value.data);
      else toast.error("No se pudieron cargar los resultados");

      if (resGrupos.status === "fulfilled") setGruposInscritos(resGrupos.value.data);
      if (resPremios.status === "fulfilled") setPremios(resPremios.value.data);

      setCargando(false);
    });
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  const abrirNuevo = () => {
    setResultadoEnEdicion(null);
    setForm(FORM_VACIO);
    setModalAbierto(true);
  };

  const abrirEdicion = (r: Resultado) => {
    setResultadoEnEdicion(r);
    setForm({
      grupoEntrenamientoId: String(r.grupoEntrenamientoId),
      posicion: String(r.posicion),
      puntaje: String(r.puntaje),
      premioId: r.premioId ? String(r.premioId) : "",
      observaciones: r.observaciones ?? "",
    });
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.grupoEntrenamientoId || !form.posicion || !form.puntaje) {
      toast.error("Grupo, posición y puntaje son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      const payload = {
        eventoId,
        grupoEntrenamientoId: Number(form.grupoEntrenamientoId),
        posicion: Number(form.posicion),
        puntaje: Number(form.puntaje),
        premioId: form.premioId ? Number(form.premioId) : null,
        observaciones: form.observaciones,
      };
      if (resultadoEnEdicion) {
        await api.put(`/api/resultados-competencia/${resultadoEnEdicion.id}`, payload);
        toast.success("Resultado actualizado");
      } else {
        await api.post("/api/resultados-competencia", payload);
        toast.success("Resultado registrado");
      }
      setModalAbierto(false);
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo guardar el resultado",
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este resultado?")) return;
    try {
      await api.delete(`/api/resultados-competencia/${id}`);
      toast.success("Resultado eliminado");
      cargar();
    } catch {
      toast.error("No se pudo eliminar el resultado");
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={abrirNuevo} disabled={gruposInscritos.length === 0}>
          <Trophy className="h-4 w-4 mr-1" /> Registrar Resultado
        </Button>
      </div>
      {gruposInscritos.length === 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Primero inscribe al menos un grupo en la pestaña "Grupos".
        </p>
      )}

      {resultados.length === 0 ? (
        <p className="text-center py-4 text-muted-foreground">
          Ningún resultado registrado todavía.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Posición</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Puntaje</TableHead>
              <TableHead>Premio</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultados
              .slice()
              .sort((a, b) => a.posicion - b.posicion)
              .map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">#{r.posicion}</TableCell>
                  <TableCell>{r.nombreGrupo}</TableCell>
                  <TableCell>{r.puntaje}</TableCell>
                  <TableCell>{r.descripcionPremio ?? "—"}</TableCell>
                  <TableCell>{r.observaciones}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEdicion(r)}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => eliminar(r.id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {resultadoEnEdicion ? "Editar resultado" : "Registrar resultado"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Grupo</Label>
              <Select
                value={form.grupoEntrenamientoId}
                onValueChange={(v) => setForm({ ...form, grupoEntrenamientoId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {gruposInscritos.map((g) => (
                    <SelectItem key={g.grupoEntrenamientoId} value={String(g.grupoEntrenamientoId)}>
                      {g.nombreGrupo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 grid gap-1.5">
                <Label>Posición</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.posicion}
                  onChange={(e) => setForm({ ...form, posicion: e.target.value })}
                />
              </div>
              <div className="flex-1 grid gap-1.5">
                <Label>Puntaje</Label>
                <Input
                  type="number"
                  step={0.01}
                  value={form.puntaje}
                  onChange={(e) => setForm({ ...form, puntaje: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>
                Premio <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Select
                value={form.premioId}
                onValueChange={(v) => setForm({ ...form, premioId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin premio asociado" />
                </SelectTrigger>
                <SelectContent>
                  {premios.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Observaciones</Label>
              <Textarea
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAbierto(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando}>
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}