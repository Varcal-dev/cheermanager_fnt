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
import { Award, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

export interface PremioEvento {
  id: number;
  eventoId: number;
  descripcion: string;
  premio: string;
}

const FORM_VACIO = { descripcion: "", premio: "" };

export default function PremiosEventoPanel({ eventoId }: { eventoId: number }) {
  const [cargando, setCargando] = useState(true);
  const [premios, setPremios] = useState<PremioEvento[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [premioEnEdicion, setPremioEnEdicion] = useState<PremioEvento | null>(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    api
      .get(`/api/premios-evento/evento/${eventoId}`)
      .then((res) => setPremios(res.data))
      .catch(() => toast.error("No se pudieron cargar los premios"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  const abrirNuevo = () => {
    setPremioEnEdicion(null);
    setForm(FORM_VACIO);
    setModalAbierto(true);
  };

  const abrirEdicion = (premio: PremioEvento) => {
    setPremioEnEdicion(premio);
    setForm({ descripcion: premio.descripcion, premio: premio.premio });
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!form.descripcion.trim() || !form.premio.trim()) {
      toast.error("Descripción y premio son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      if (premioEnEdicion) {
        await api.put(`/api/premios-evento/${premioEnEdicion.id}`, {
          eventoId,
          ...form,
        });
        toast.success("Premio actualizado");
      } else {
        await api.post("/api/premios-evento", { eventoId, ...form });
        toast.success("Premio agregado");
      }
      setModalAbierto(false);
      cargar();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.response?.data || "No se pudo guardar el premio",
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar este premio?")) return;
    try {
      await api.delete(`/api/premios-evento/${id}`);
      toast.success("Premio eliminado");
      cargar();
    } catch {
      toast.error("No se pudo eliminar el premio");
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
        <Button size="sm" variant="outline" onClick={abrirNuevo}>
          <Award className="h-4 w-4 mr-1" /> Nuevo Premio
        </Button>
      </div>

      {premios.length === 0 ? (
        <p className="text-center py-4 text-muted-foreground">
          Ningún premio registrado todavía.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Premio</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {premios.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.descripcion}</TableCell>
                <TableCell>{p.premio}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => abrirEdicion(p)}>
                      <Pencil className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => eliminar(p.id)}>
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
            <DialogTitle>{premioEnEdicion ? "Editar premio" : "Nuevo premio"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Descripción</Label>
              <Input
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Ej. 1er lugar Nivel 3 Youth"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Premio</Label>
              <Input
                value={form.premio}
                onChange={(e) => setForm({ ...form, premio: e.target.value })}
                placeholder="Ej. Trofeo + beca 20% próxima temporada"
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