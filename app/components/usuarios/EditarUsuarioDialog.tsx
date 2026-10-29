"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api";
import { actualizarUsuario, type Rol, type Usuario } from "@/app/usuarios/types";

interface Props {
  /** Usuario a editar; null = diálogo cerrado. */
  usuario: Usuario | null;
  roles: Rol[];
  onClose: () => void;
  onGuardado: () => void;
}

export default function EditarUsuarioDialog({ usuario, roles, onClose, onGuardado }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [rolId, setRolId] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setUsername(usuario.username);
      setEmail(usuario.email);
      setRolId(usuario.rolId ? String(usuario.rolId) : "");
    }
  }, [usuario]);

  const guardar = async () => {
    if (!usuario) return;
    if (!username.trim()) {
      toast.error("El nombre de usuario no puede quedar vacío");
      return;
    }
    setGuardando(true);
    try {
      await actualizarUsuario(usuario, {
        username: username.trim(),
        email: email.trim(),
        rolId: rolId ? parseInt(rolId) : undefined,
      });
      toast.success("Usuario actualizado");
      onClose();
      onGuardado();
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      toast.error(getErrorMessage(error, "No se pudo actualizar el usuario"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={usuario !== null} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>Actualiza el usuario, correo o rol de {usuario?.username}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Nombre de Usuario</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={rolId} onValueChange={setRolId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((rol) => (
                  <SelectItem key={rol.id} value={String(rol.id)}>
                    {rol.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
