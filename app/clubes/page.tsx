"use client";

import { useEffect, useState } from "react";
import { Plus, Power } from "lucide-react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import { api, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

// Administración de clubes (multi-club). Solo el superadmin de la plataforma (permiso gestionar_clubes).

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

export default function ClubesPage() {
  const [clubes, setClubes] = useState<Club[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [paraCambiar, setParaCambiar] = useState<Club | null>(null);

  const cargar = async () => {
    try {
      const res = await api.get("/api/clubes");
      setClubes(res.data ?? []);
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
      toast.success("Club creado");
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

  return (
    <ProtectedRoute requiredPermission="gestionar_clubes">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clubes</h1>
            <p className="text-muted-foreground">
              Cada club ve únicamente sus propios datos. Aquí das de alta nuevos clubes o suspendes uno.
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
                  <TableHead>Identificador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargando ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Cargando…
                    </TableCell>
                  </TableRow>
                ) : (
                  clubes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {c.nombre}
                        {c.id === 1 && <span className="ml-2 text-xs text-muted-foreground">(Plataforma)</span>}
                      </TableCell>
                      <TableCell>{c.slug}</TableCell>
                      <TableCell>
                        <Badge variant={c.activo ? "default" : "secondary"}>{c.activo ? "Activo" : "Suspendido"}</Badge>
                      </TableCell>
                      <TableCell>{c.fechaCreacion ? new Date(c.fechaCreacion).toLocaleDateString("es-CO") : "—"}</TableCell>
                      <TableCell>
                        {c.id !== 1 && (
                          <Button size="sm" variant="outline" onClick={() => setParaCambiar(c)}>
                            <Power className="mr-1 h-4 w-4" /> {c.activo ? "Suspender" : "Reactivar"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
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
                Se crea el club con los roles base (Administrador, Entrenador, Deportista) y su administrador.
                El username y el correo deben ser únicos en toda la plataforma.
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
      </div>
    </ProtectedRoute>
  );
}
