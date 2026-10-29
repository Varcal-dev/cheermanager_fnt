// Tipos y llamadas compartidas por la pantalla de Usuarios y sus componentes.

import { api } from "@/lib/api";

export interface Rol {
  id: number;
  nombre: string;
}

export interface GeneroCatalogo {
  id: number;
  genero: string;
}

export interface PersonaResumen {
  id: number;
  nombre: string;
  apellidos: string;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  rolId: number | null;
  rol: string;
  fechaUltimoAcceso: string;
  horaUltimoAcceso: string;
  activo: boolean;
  nombre?: string;
  apellidos?: string;
}

/** Convierte la respuesta de GET /api/usuario/listar a lo que muestra la tabla. */
export function aUsuario(u: any): Usuario {
  const fechaRaw = u.ultimoAcceso ? new Date(u.ultimoAcceso) : null;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    rolId: u.rolId,
    rol: u.rolNombre || "Sin Rol",
    fechaUltimoAcceso: fechaRaw ? fechaRaw.toLocaleDateString("es-CO", { dateStyle: "short" }) : "Sin acceso",
    horaUltimoAcceso: fechaRaw ? fechaRaw.toLocaleTimeString("es-CO", { timeStyle: "medium" }) : "",
    activo: u.activo,
    nombre: u.nombre,
    apellidos: u.apellidos,
  };
}

// Cada acción rápida hace PUT a /api/usuario/actualizar/{id}. Ese endpoint siempre re-asigna username y
// email desde el DTO (no los deja intactos si vienen vacíos), por eso todas las llamadas parten de los
// valores actuales del usuario para no borrarlos por accidente.
export async function actualizarUsuario(
  usuario: Usuario,
  cambios: Partial<{ username: string; email: string; rolId: number; activo: boolean }>,
): Promise<void> {
  await api.put(`/api/usuario/actualizar/${usuario.id}`, {
    username: usuario.username,
    email: usuario.email,
    rolId: usuario.rolId,
    activo: usuario.activo,
    ...cambios,
  });
}
