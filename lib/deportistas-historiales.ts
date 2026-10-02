"use client";

import { api } from "@/lib/api";

// ---------- Tipos ----------

export interface HistorialNivel {
  id: number;
  deportistaId: number;
  nombreDeportista: string;
  nivelId: number;
  fechaCambio: string;
  motivo: string | null;
}

export interface HistorialPlan {
  id: number;
  deportistaId: number;
  nombreDeportista: string;
  planPagoId: number;
  nombrePlan: string;
  fechaInicio: string;
  fechaFin: string | null;
  motivoCambio: string | null;
}

export interface HistorialMedico {
  id: number;
  personaId: number;
  descripcion: string;
  fechaRegistro: string;
  tipoRegistro: string | null;
  gravedad: string | null;
  medicoTratante: string | null;
}

export interface PlanPago {
  id: number;
  nombre: string;
  tipoPlan: string;
  descripcion: string;
  valorMensual: number;
  activo: boolean;
}

export interface PaginaHistorialMedico {
  content: HistorialMedico[];
  totalElements: number;
  totalPages: number;
  number: number;
}

// ---------- Historial de Niveles ----------

export async function obtenerHistorialNiveles(
  deportistaId: number,
): Promise<HistorialNivel[]> {
  const { data } = await api.get(`/api/historial-nivel/deportista/${deportistaId}`);
  return data;
}

export async function registrarCambioNivel(payload: {
  deportistaId: number;
  nivelId: number;
  motivo?: string;
  fechaCambio?: string; // yyyy-MM-dd
}): Promise<HistorialNivel> {
  const { data } = await api.post(`/api/historial-nivel`, payload);
  return data;
}

// ---------- Historial de Planes ----------

export async function obtenerHistorialPlanes(
  deportistaId: number,
): Promise<HistorialPlan[]> {
  const { data } = await api.get(`/api/historial-planes/deportista/${deportistaId}`);
  return data;
}

export async function registrarCambioPlan(payload: {
  deportistaId: number;
  planPagoId: number;
  motivoCambio?: string;
  fechaCambio?: string; // yyyy-MM-dd
}): Promise<HistorialPlan> {
  const { data } = await api.post(`/api/historial-planes`, payload);
  return data;
}

export async function obtenerPlanesPago(): Promise<PlanPago[]> {
  const { data } = await api.get(`/api/planes-pago`);
  return data;
}

// ---------- Historial de Estado (solo lectura, se genera automáticamente al editar el deportista) ----------

export interface HistorialEstado {
  id: number;
  deportistaId: number;
  nombreDeportista: string;
  apellidosDeportista: string;
  estadoAnteriorId: number | null;
  estadoAnteriorNombre: string | null;
  estadoNuevoId: number;
  estadoNuevoNombre: string;
  fechaCambio: string; // LocalDateTime
  usuarioId: number | null;
  usuarioUsername: string | null;
  motivoCambio: string | null;
}

export async function obtenerHistorialEstado(deportistaId: number): Promise<HistorialEstado[]> {
  const { data } = await api.get(`/api/deportistas/${deportistaId}/historial-estado`);
  return data;
}

// ---------- Historial Médico ----------

export async function obtenerHistorialMedico(
  deportistaId: number,
  page = 0,
  size = 10,
): Promise<PaginaHistorialMedico> {
  const { data } = await api.get(`/api/deportistas/${deportistaId}/historial-medico`, {
    params: { page, size },
  });
  return data;
}

export async function crearHistorialMedico(
  deportistaId: number,
  payload: {
    descripcion: string;
    fechaRegistro: string; // yyyy-MM-dd
    tipoRegistro?: string;
    gravedad?: string;
    medicoTratante?: string;
  },
): Promise<HistorialMedico> {
  const { data } = await api.post(`/api/deportistas/${deportistaId}/historial-medico`, payload);
  return data;
}

// ---------- Historial Médico: vista de club completo (todas las personas) ----------
// A diferencia de obtenerHistorialMedico/crearHistorialMedico (arriba, que son
// por deportista, para la ficha individual), estas funciones alimentan la
// página global /historial-medico.

export interface RegistroHistorialMedicoGlobal extends HistorialMedico {
  personaNombre: string | null;
  personaApellidos: string | null;
}

export interface PaginaHistorialMedicoGlobal {
  content: RegistroHistorialMedicoGlobal[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface FiltrosHistorialMedico {
  tipoRegistro?: string;
  gravedad?: string;
  q?: string;
  desde?: string; // yyyy-MM-dd
  hasta?: string; // yyyy-MM-dd
  page?: number;
  size?: number;
}

export async function obtenerHistorialMedicoGlobal(
  filtros: FiltrosHistorialMedico = {},
): Promise<PaginaHistorialMedicoGlobal> {
  const { data } = await api.get("/api/historial-medico", {
    params: {
      tipoRegistro: filtros.tipoRegistro,
      gravedad: filtros.gravedad,
      q: filtros.q,
      desde: filtros.desde,
      hasta: filtros.hasta,
      page: filtros.page ?? 0,
      size: filtros.size ?? 20,
      sort: "fechaRegistro,desc",
    },
  });
  return data;
}

export async function actualizarHistorialMedico(
  id: number,
  payload: {
    descripcion: string;
    fechaRegistro: string;
    tipoRegistro?: string;
    gravedad?: string;
    medicoTratante?: string;
  },
): Promise<RegistroHistorialMedicoGlobal> {
  const { data } = await api.put(`/api/historial-medico/${id}`, payload);
  return data;
}

export async function eliminarHistorialMedico(id: number): Promise<void> {
  await api.delete(`/api/historial-medico/${id}`);
}