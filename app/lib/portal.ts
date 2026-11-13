"use client";

import { api } from "@/lib/api";
import type { Factura, Pago } from "@/app/lib/facturas-pagos";
import type { Carnet } from "@/app/lib/carnet";

// ---------- Tipos del portal (solo lectura) ----------

export interface InscripcionResumen {
  id: number;
  temporada: string | null;
  estado: string | null;
  fechaInscripcion: string;
  fechaVencimiento: string | null;
}

export interface DeportistaResumen {
  id: number;
  nombre: string;
  estado: string | null;
  grupos: string[];
  asistenciasPresentes: number;
  asistenciasTotales: number;
  porcentajeAsistencia: number | null;
  inscripciones: InscripcionResumen[];
}

export interface MiPerfil {
  tipo: "DEPORTISTA" | "ACUDIENTE";
  nombre: string;
  deportistas: DeportistaResumen[];
}

export interface AsistenciaItem {
  fecha: string;
  estado: string | null;
  dia: string | null;
  horaInicio: string | null;
  horaFin: string | null;
}

export interface EvaluacionItem {
  fecha: string;
  criterio: string;
  categoria: string | null;
  puntaje: number | null;
}

export interface ObjetivoItem {
  nombre: string;
  descripcion: string | null;
  fechaCreacion: string | null;
  estado: string | null;
}

export interface RutinaItem {
  id: number;
  fecha: string;
  grupo: string;
  nivel: string | null;
  evento: string | null;
  puntajeTotal: number | null;
  observaciones: string | null;
}

export interface TemporadaItem {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export type EstadoSolicitud = "PENDIENTE" | "APROBADA" | "RECHAZADA" | "CANCELADA";

export interface Solicitud {
  id: number;
  deportistaId: number;
  deportista: string;
  temporadaId: number;
  temporada: string;
  temporadaInicio: string;
  temporadaFin: string;
  estado: EstadoSolicitud;
  observaciones: string | null;
  fechaSolicitud: string;
  fechaResolucion: string | null;
  motivoResolucion: string | null;
  inscripcionId: number | null;
}

// ---------- API ----------

export const obtenerMiPerfil = async (): Promise<MiPerfil> => (await api.get("/api/portal/yo")).data;

const de = (id: number, ruta: string) => `/api/portal/deportistas/${id}/${ruta}`;

export const portalFacturas = async (id: number): Promise<Factura[]> => (await api.get(de(id, "facturas"))).data ?? [];
export const portalPagos = async (id: number): Promise<Pago[]> => (await api.get(de(id, "pagos"))).data ?? [];
// Sin fechas, el back devuelve los últimos 90 días.
export const portalAsistencias = async (id: number, desde?: string, hasta?: string): Promise<AsistenciaItem[]> =>
  (await api.get(de(id, "asistencias"), { params: { desde, hasta } })).data ?? [];

export interface HorarioItem {
  grupoId: number;
  grupo: string;
  dia: string | null;
  horaInicio: string | null; // "HH:mm"
  horaFin: string | null;
}
export const portalHorarios = async (id: number): Promise<HorarioItem[]> =>
  (await api.get(de(id, "horarios"))).data ?? [];

/** Carnet con el mismo QR firmado que ve el club. */
export const portalCarnet = async (id: number): Promise<Carnet> => (await api.get<Carnet>(de(id, "carnet"))).data;
export const portalFoto = (id: number): Promise<Blob> =>
  api.get<Blob>(de(id, "foto"), { responseType: "blob" }).then((r) => r.data);
export const portalEvaluaciones = async (id: number): Promise<EvaluacionItem[]> =>
  (await api.get(de(id, "evaluaciones"))).data ?? [];
export const portalObjetivos = async (id: number): Promise<ObjetivoItem[]> =>
  (await api.get(de(id, "objetivos"))).data ?? [];
export const portalRutinas = async (id: number): Promise<RutinaItem[]> => (await api.get(de(id, "rutinas"))).data ?? [];
export const portalSolicitudes = async (id: number): Promise<Solicitud[]> =>
  (await api.get(de(id, "solicitudes"))).data ?? [];
export const portalTemporadasAbiertas = async (): Promise<TemporadaItem[]> =>
  (await api.get("/api/portal/temporadas-abiertas")).data ?? [];
export const portalSolicitar = async (id: number, temporadaId: number, observaciones?: string): Promise<Solicitud> =>
  (await api.post(de(id, "solicitudes"), { temporadaId, observaciones: observaciones || null })).data;
export const portalCancelarSolicitud = async (solicitudId: number): Promise<Solicitud> =>
  (await api.patch(`/api/portal/solicitudes/${solicitudId}/cancelar`)).data;

// ---------- Avisos del club (recordatorios de pago, etc.) ----------

export interface AvisoPortal {
  id: number;
  mensaje: string;
  fecha: string;
  vista: boolean;
}

export interface ListaAvisos {
  noVistas: number;
  items: AvisoPortal[];
}

export const portalNotificaciones = async (): Promise<ListaAvisos> =>
  (await api.get("/api/portal/notificaciones")).data;
export const portalMarcarAvisoVisto = async (id: number) => api.patch(`/api/portal/notificaciones/${id}/vista`);
export const portalMarcarAvisosVistos = async () => api.post("/api/portal/notificaciones/marcar-todas");

// ---------- Admin: solicitudes ----------

export const listarSolicitudes = async (estado?: string): Promise<Solicitud[]> =>
  (await api.get("/api/solicitudes-inscripcion", { params: estado ? { estado } : {} })).data ?? [];
export const aprobarSolicitud = async (id: number, planPagoId: number, planMensualidadId: number | null) =>
  (await api.patch(`/api/solicitudes-inscripcion/${id}/aprobar`, { planPagoId, planMensualidadId })).data;
export const rechazarSolicitud = async (id: number, motivo: string) =>
  (await api.patch(`/api/solicitudes-inscripcion/${id}/rechazar`, { motivo })).data;

// ---------- Descarga de reportes personales ----------

/** Descarga un CSV (con BOM para que Excel respete las tildes). */
export function descargarCSV(nombreArchivo: string, columnas: string[], filas: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => {
    const t = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const csv = [columnas, ...filas].map((f) => f.map(esc).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo.endsWith(".csv") ? nombreArchivo : `${nombreArchivo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}