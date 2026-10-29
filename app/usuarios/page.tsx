"use client";

import { useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { toast } from "react-toastify";
import ProtectedRoute from "@/components/ProtectedRoute";
import ClaveTemporalDialog, { generarClaveTemporal } from "@/app/components/Forms/ClaveTemporalDialog";
import EditarUsuarioDialog from "@/app/components/usuarios/EditarUsuarioDialog";
import EliminarUsuarioDialog from "@/app/components/usuarios/EliminarUsuarioDialog";
import GenerarClaveDialog from "@/app/components/usuarios/GenerarClaveDialog";
import NuevoUsuarioDialog from "@/app/components/usuarios/NuevoUsuarioDialog";
import UsuarioFila from "@/app/components/usuarios/UsuarioFila";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getErrorMessage } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { actualizarUsuario, type Usuario } from "./types";
import { useUsuariosData } from "./useUsuariosData";

const ENCABEZADOS = ["Usuario", "Email", "Rol", "Último Acceso", "Estado", "Acciones"];

function UsuariosContenido() {
  const { permissions, user } = useUser();
  const { usuarios, cargandoInicial, roles, personas, recargar } = useUsuariosData();

  const [busqueda, setBusqueda] = useState("");
  const [rolFiltro, setRolFiltro] = useState<string | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [expandidos, setExpandidos] = useState<number[]>([]);

  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Usuario | null>(null);
  const [paraClave, setParaClave] = useState<Usuario | null>(null);
  const [paraEliminar, setParaEliminar] = useState<Usuario | null>(null);
  const [claveGenerada, setClaveGenerada] = useState<{ clave: string; username: string } | null>(null);

  const alternarExpandido = (id: number) =>
    setExpandidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const alternarActivo = async (usuario: Usuario) => {
    // Defensa extra: el menú ya oculta la opción para la cuenta propia.
    if (usuario.id === user?.id) {
      toast.error("No puedes desactivar tu propia cuenta");
      return;
    }
    try {
      await actualizarUsuario(usuario, { activo: !usuario.activo });
      toast.success(usuario.activo ? "Usuario desactivado" : "Usuario activado");
      recargar();
    } catch (error) {
      console.error("Error al cambiar el estado del usuario:", error);
      toast.error(getErrorMessage(error, "No se pudo cambiar el estado del usuario"));
    }
  };

  // Tras crear el usuario se le genera una clave temporal (si hay permiso) para poder entregársela.
  const alCrear = async (creado: { id: number; username: string } | null) => {
    if (permissions.includes("restablecer_clave_usuario") && creado) {
      const clave = await generarClaveTemporal(creado.id);
      if (clave) setClaveGenerada({ clave, username: creado.username });
    }
    recargar();
  };

  const filtro = busqueda.toLowerCase();
  const visibles = usuarios.filter((u) => {
    const coincide =
      u.username?.toLowerCase().includes(filtro) ||
      u.email?.toLowerCase().includes(filtro) ||
      u.rol?.toLowerCase().includes(filtro);
    const delRol = rolFiltro ? u.rol === rolFiltro : true;
    return coincide && delRol && (mostrarInactivos || u.activo);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        {permissions.includes("crear_usuario") && (
          <Button onClick={() => setNuevoAbierto(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
          </Button>
        )}
      </div>

      <div className="flex justify-between mb-4">
        <div className="relative flex items-center w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2">
            <Switch id="mostrar-inactivos" checked={mostrarInactivos} onCheckedChange={setMostrarInactivos} />
            <Label htmlFor="mostrar-inactivos">Mostrar inactivos</Label>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {rolFiltro || "Filtrar por Rol"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRolFiltro(null)}>Todos los roles</DropdownMenuItem>
              {roles.map((rol) => (
                <DropdownMenuItem key={rol.id} onClick={() => setRolFiltro(rol.nombre)}>
                  {rol.nombre}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {cargandoInicial ? (
            <p className="text-center py-10 text-muted-foreground">Cargando usuarios…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[50px]"></TableHead>
                  {ENCABEZADOS.map((titulo) => (
                    <TableHead key={titulo} className="font-display text-xs uppercase tracking-wide text-muted-foreground">
                      {titulo}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((usuario) => (
                  <UsuarioFila
                    key={usuario.id}
                    usuario={usuario}
                    expandido={expandidos.includes(usuario.id)}
                    esUsuarioActual={usuario.id === user?.id}
                    permissions={permissions}
                    onToggleExpandido={() => alternarExpandido(usuario.id)}
                    onEditar={() => setEnEdicion(usuario)}
                    onGenerarClave={() => setParaClave(usuario)}
                    onAlternarActivo={() => alternarActivo(usuario)}
                    onEliminar={() => setParaEliminar(usuario)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NuevoUsuarioDialog
        open={nuevoAbierto}
        onOpenChange={setNuevoAbierto}
        roles={roles}
        personas={personas}
        onCreado={alCrear}
      />
      <EditarUsuarioDialog usuario={enEdicion} roles={roles} onClose={() => setEnEdicion(null)} onGuardado={recargar} />
      <GenerarClaveDialog usuario={paraClave} onClose={() => setParaClave(null)} onGenerada={setClaveGenerada} />
      <EliminarUsuarioDialog usuario={paraEliminar} onClose={() => setParaEliminar(null)} onEliminado={recargar} />
      <ClaveTemporalDialog
        clave={claveGenerada?.clave ?? null}
        username={claveGenerada?.username}
        onClose={() => setClaveGenerada(null)}
      />
    </div>
  );
}

export default function UsuariosPage() {
  // ProtectedRoute envuelve todo: ni siquiera se piden los datos si no hay permiso.
  return (
    <ProtectedRoute requiredPermission="ver_usuarios">
      <UsuariosContenido />
    </ProtectedRoute>
  );
}
