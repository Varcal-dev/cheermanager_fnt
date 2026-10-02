import { api } from "@/lib/api";

// Tipos alineados 1:1 con AuditoriaDTO (backend) y con la forma estándar de
// Page<T> que devuelve Spring Data.

export type AccionAuditoria = "INSERT" | "UPDATE" | "DELETE";

export interface RegistroAuditoria {
  id: number;
  usuarioId: number | null;
  usuarioUsername: string | null;
  tablaAfectada: string;
  accion: AccionAuditoria;
  registroId: number | null;
  valoresAnteriores: string | null; // JSON en texto, null en INSERT
  nuevosValores: string | null; // JSON en texto, null en DELETE
  fecha: string; // ISO datetime
  ipUsuario: string | null;
}

export interface PaginaSpring<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página actual (0-based)
  size: number;
}

export interface FiltrosAuditoria {
  tabla?: string;
  accion?: AccionAuditoria;
  usuarioId?: number;
  desde?: string; // ISO datetime
  hasta?: string; // ISO datetime
  q?: string;
  page?: number;
  size?: number;
}

export const obtenerAuditoria = (filtros: FiltrosAuditoria = {}) =>
  api
    .get("/api/auditoria", {
      params: {
        tabla: filtros.tabla,
        accion: filtros.accion,
        usuarioId: filtros.usuarioId,
        desde: filtros.desde,
        hasta: filtros.hasta,
        q: filtros.q,
        page: filtros.page ?? 0,
        size: filtros.size ?? 20,
        sort: "fecha,desc",
      },
    })
    .then((res) => res.data as PaginaSpring<RegistroAuditoria>);

export const obtenerTablasAuditadas = () =>
  api.get("/api/auditoria/tablas").then((res) => res.data as string[]);

// El backend guarda valoresAnteriores/nuevosValores como texto JSON (para no
// acoplar la tabla auditoria a la forma exacta de cada entidad). Este helper
// centraliza el parseo tolerante a fallos para el panel de detalle.
export function parsearSnapshot(json: string | null): Record<string, unknown> | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}