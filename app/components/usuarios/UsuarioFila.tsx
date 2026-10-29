"use client";

import React from "react";
import { ChevronDown, ChevronRight, Eye, EyeOff, Key, Pencil, Shield, Trash2, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Usuario } from "@/app/usuarios/types";

interface Props {
  usuario: Usuario;
  expandido: boolean;
  /** true si esta fila es la cuenta con la que se inició sesión. */
  esUsuarioActual: boolean;
  permissions: string[];
  onToggleExpandido: () => void;
  onEditar: () => void;
  onGenerarClave: () => void;
  onAlternarActivo: () => void;
  onEliminar: () => void;
}

export default function UsuarioFila({
  usuario,
  expandido,
  esUsuarioActual,
  permissions,
  onToggleExpandido,
  onEditar,
  onGenerarClave,
  onAlternarActivo,
  onEliminar,
}: Props) {
  const puedeModificar = permissions.includes("modificar_usuario");
  const puedeRestablecer = permissions.includes("restablecer_clave_usuario");
  const puedeEliminar = permissions.includes("eliminar_usuario");

  return (
    <>
      <TableRow>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={onToggleExpandido}>
            {expandido ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 font-display text-xs font-semibold text-accent">
              {usuario.username?.slice(0, 2).toUpperCase()}
            </span>
            <span>{usuario.username}</span>
            {esUsuarioActual && <Badge variant="outline">Tú</Badge>}
          </div>
        </TableCell>
        <TableCell>{usuario.email}</TableCell>
        <TableCell>
          <Badge variant="outline">{usuario.rol}</Badge>
        </TableCell>
        <TableCell>
          {usuario.fechaUltimoAcceso !== "Sin acceso" ? (
            <>
              <div>{usuario.fechaUltimoAcceso}</div>
              <div className="text-sm text-muted-foreground">{usuario.horaUltimoAcceso}</div>
            </>
          ) : (
            "Sin acceso"
          )}
        </TableCell>
        <TableCell>
          <Badge variant={usuario.activo ? "success" : "secondary"}>{usuario.activo ? "Activo" : "Inactivo"}</Badge>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            {puedeModificar && (
              <Button variant="outline" size="sm" onClick={onEditar}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserCog className="h-4 w-4 mr-1" /> Acciones
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {puedeRestablecer && (
                  <DropdownMenuItem onClick={onGenerarClave}>
                    <Key className="h-4 w-4 mr-2" /> Generar clave temporal
                  </DropdownMenuItem>
                )}
                {puedeModificar && (
                  <>
                    <DropdownMenuItem onClick={onEditar}>
                      <Shield className="h-4 w-4 mr-2" /> Cambiar Rol
                    </DropdownMenuItem>
                    {/* Nadie puede desactivarse a sí mismo: se quedaría fuera del sistema. */}
                    {!esUsuarioActual && (
                      <DropdownMenuItem onClick={onAlternarActivo}>
                        {usuario.activo ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" /> Desactivar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" /> Activar
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {puedeEliminar && !esUsuarioActual && (
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onEliminar}>
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      {expandido && (
        <TableRow className="bg-muted/50">
          <TableCell colSpan={7} className="p-0">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-display font-semibold mb-2">Información de Usuario</h4>
                  <div className="space-y-2">
                    <Dato etiqueta="ID:" valor={<span className="font-figures">{usuario.id}</span>} />
                    <Dato etiqueta="Nombre de Usuario:" valor={usuario.username} />
                    <Dato etiqueta="Email:" valor={usuario.email} />
                    <Dato etiqueta="Rol:" valor={usuario.rol} />
                    {usuario.nombre && (
                      <Dato etiqueta="Persona asociada:" valor={`${usuario.nombre} ${usuario.apellidos ?? ""}`} />
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-display font-semibold mb-2">Acciones Rápidas</h4>
                  <div className="space-y-2">
                    {puedeRestablecer && (
                      <Button size="sm" variant="outline" className="w-full justify-start" onClick={onGenerarClave}>
                        <Key className="h-4 w-4 mr-2" /> Generar clave temporal
                      </Button>
                    )}
                    {puedeModificar && (
                      <Button size="sm" variant="outline" className="w-full justify-start" onClick={onEditar}>
                        <Shield className="h-4 w-4 mr-2" /> Cambiar Rol
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2">
      <span className="text-muted-foreground">{etiqueta}</span>
      <span>{valor}</span>
    </div>
  );
}
