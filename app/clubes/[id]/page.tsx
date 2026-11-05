"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound, LifeBuoy, Plus } from "lucide-react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import ClaveTemporalDialog from "@/app/components/Forms/ClaveTemporalDialog";
import { entrarComoSoporte } from "@/app/components/SoporteBanner";
import { api, getAuthToken, getErrorMessage } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Detalle de un club para el superadmin: sus usuarios, alta de usuarios, claves temporales y entrada como
// administrador del club (soporte). Usa /api/plataforma/clubes/{id}/... (permiso gestionar_clubes).

interface UsuarioClub {
  id: number;
  username: string;
  email: string;
  rol: string | null;
  activo: boolean;
  ultimoAcceso: string | null;
  requiereCambioPassword: boolean;
}
interface RolClub {
  id: number;
  nombre: string;
}
interface ClubInfo {
  id: number;
  nombre: string;
  slug: string;
  activo: boolean;
}

const FORM_VACIO = { username: "", email: "", rolId: "" };

export default function ClubDetallePage() {
  const { id } = useParams<{ id: string }>();
  const clubId = Number(id);

  const [club, setClub] = useState<ClubInfo | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioClub[]>([]);
  const [roles, setRoles] = useState<RolClub[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [clave, setClave] = useState<{ clave: string; username: string } | null>(null);
  const [entrando, setEntrando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [c, u, r] = await Promise.all([
        api.get(`/api/clubes/${clubId}`),
        api.get(`/api/plataforma/clubes/${clubId}/usuarios`),
        api.get(`/api/plataforma/clubes/${clubId}/roles`),
      ]);
      setClub(c.data);
      setUsuarios(u.data ?? []);
      setRoles(r.data ?? []);
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo cargar el club"));
    } finally {
      setCargando(false);
    }
  }, [clubId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async () => {
    if (!form.username.trim() || !form.email.trim() || !form.rolId) {
      toast.error("Usuario, correo y rol son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      const res = await api.post(`/api/plataforma/clubes/${clubId}/usuarios`, {
        username: form.username.trim(),
        email: form.email.trim(),
        rolId: Number(form.rolId),
      });
      toast.success("Usuario creado");
      setNuevoAbierto(false);
      setForm(FORM_VACIO);
      setClave({ clave: res.data.claveTemporal, username: res.data.username });
      cargar();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear el usuario"));
    } finally {
      setGuardando(false);
    }
  };

  const generarClave = async (u: UsuarioClub) => {
    try {
      const res = await api.post(`/api/plataforma/clubes/${clubId}/usuarios/${u.id}/clave-temporal`);
      setClave({ clave: res.data.claveTemporal, username: u.username });
      cargar();
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo generar la clave temporal"));
    }
  };

  const entrar = async () => {
    setEntrando(true);
    try {
      const res = await api.post(`/api/plataforma/clubes/${clubId}/acceso`);
      entrarComoSoporte(res.data.token, getAuthToken());
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo entrar al club"));
      setEntrando(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission="gestionar_clubes">
      <div className="space-y-6">
        <Link href="/clubes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4" /> Clubes
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{club?.nombre ?? "Club"}</h1>
            <p className="text-muted-foreground">
              {club?.slug}{" "}
              {club && <Badge variant={club.activo ? "default" : "secondary"}>{club.activo ? "Activo" : "Suspendido"}</Badge>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setNuevoAbierto(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo usuario
            </Button>
            <Button onClick={entrar} disabled={entrando || !club?.activo}>
              <LifeBuoy className="mr-2 h-4 w-4" /> {entrando ? "Entrando…" : "Entrar como administrador"}
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          &quot;Entrar como administrador&quot; abre el club con los permisos de su Administrador durante 1 hora y deja registro en el
          log de acceso del club. No puede aceptar los términos legales: eso lo hace el propio club.
        </p>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Último acceso</TableHead>
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
                ) : usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Este club no tiene usuarios activos.
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.username}
                        {u.requiereCambioPassword && <span className="ml-2 text-xs text-amber-600">(debe cambiar clave)</span>}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{u.rol ?? "—"}</Badge>
                      </TableCell>
                      <TableCell>{u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString("es-CO") : "Nunca"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => generarClave(u)}>
                          <KeyRound className="mr-1 h-4 w-4" /> Clave temporal
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={nuevoAbierto} onOpenChange={setNuevoAbierto}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Nuevo usuario de {club?.nombre}</DialogTitle>
              <DialogDescription>
                Se crea con una clave temporal que verás una sola vez. Deportista y Acudiente se crean desde el club, junto a su persona.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Usuario</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <Label>Correo (único en toda la plataforma)</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={form.rolId} onValueChange={(v) => setForm({ ...form, rolId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNuevoAbierto(false)}>
                Cancelar
              </Button>
              <Button onClick={crear} disabled={guardando}>
                {guardando ? "Creando…" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ClaveTemporalDialog clave={clave?.clave ?? null} username={clave?.username} onClose={() => setClave(null)} />
      </div>
    </ProtectedRoute>
  );
}
