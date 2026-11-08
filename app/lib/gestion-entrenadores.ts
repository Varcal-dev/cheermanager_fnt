import { api } from "@/lib/api";

export type TipoCertificacion = "PRIMEROS_AUXILIOS" | "RCP" | "SEGURIDAD_DEPORTIVA" | "CURSO_FEDERACION" | "OTRA";
export type EstadoCertificacion = "VENCIDA" | "POR_VENCER" | "SIN_REGISTRO" | "VIGENTE";

export interface AlertaCertificacion {
  entrenadorId: number;
  nombre: string;
  tipo: TipoCertificacion;
  certificacion: string | null;
  estado: EstadoCertificacion;
  fechaVencimiento: string | null;
  diasRestantes: number | null;
}

export interface AlertasCertificaciones {
  vencidas: number;
  porVencer: number;
  sinRegistro: number;
  items: AlertaCertificacion[];
}

export interface RegistroHoras {
  id: number;
  entrenadorId: number;
  entrenador: string;
  grupoId: number | null;
  fecha: string;
  horas: number;
  descripcion: string | null;
  origen: "MANUAL" | "HORARIO";
}

export interface TotalEntrenador {
  entrenadorId: number;
  entrenador: string;
  horas: number;
  sesiones: number;
}

export interface PeriodoHoras {
  desde: string;
  hasta: string;
  totalHoras: number;
  totales: TotalEntrenador[];
  registros: RegistroHoras[];
}

export interface EntrenadorBasico {
  id: number;
  persona: { nombre: string; apellidos: string };
  estado?: { estado: string };
}

export const TIPOS_CERTIFICACION: { valor: TipoCertificacion; etiqueta: string; pideNombre: boolean }[] = [
  { valor: "PRIMEROS_AUXILIOS", etiqueta: "Primeros auxilios", pideNombre: false },
  { valor: "SEGURIDAD_DEPORTIVA", etiqueta: "Seguridad deportiva (spotting / cheer)", pideNombre: false },
  { valor: "RCP", etiqueta: "RCP", pideNombre: false },
  { valor: "CURSO_FEDERACION", etiqueta: "Curso de federación", pideNombre: true },
  { valor: "OTRA", etiqueta: "Otra", pideNombre: true },
];

export const etiquetaCertificacion = (t: TipoCertificacion, nombre?: string | null) =>
  nombre || TIPOS_CERTIFICACION.find((x) => x.valor === t)?.etiqueta || t;

const base = "/api/entrenador-gestion";
export const listarEntrenadores = () => api.get<EntrenadorBasico[]>("/api/entrenadores").then((r) => r.data);
export const alertasCertificaciones = (dias: number, todos: boolean) =>
  api.get<AlertasCertificaciones>(`${base}/certificaciones/alertas`, { params: { dias, todos } }).then((r) => r.data);
export const registrarCertificacion = (
  entrenadorId: number,
  body: { tipo: TipoCertificacion; nombre?: string; entidad?: string; fechaEmision?: string; fechaVencimiento?: string },
) => api.post(`${base}/certificaciones/${entrenadorId}`, body).then((r) => r.data);
export const horasDelPeriodo = (desde: string, hasta: string) =>
  api.get<PeriodoHoras>(`${base}/horas`, { params: { desde, hasta } }).then((r) => r.data);
export const registrarHoras = (body: { entrenadorId: number; fecha: string; horas: number; descripcion?: string }) =>
  api.post(`${base}/horas`, body).then((r) => r.data);
export const eliminarHoras = (id: number) => api.delete(`${base}/horas/${id}`).then((r) => r.data);
export const precargarHoras = (desde: string, hasta: string) =>
  api.post<{ creadas: number; omitidas: number; horas: number }>(`${base}/horas/precargar`, null, { params: { desde, hasta } }).then((r) => r.data);

/** CSV de horas del periodo (separador ; y BOM para Excel). */
export const horasACsv = (p: PeriodoHoras) => {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const filas = [["Entrenador", "Fecha", "Horas", "Origen", "Descripción"], ...p.registros.map((r) => [r.entrenador, r.fecha, r.horas, r.origen, r.descripcion ?? ""])];
  return "﻿" + filas.map((f) => f.map(esc).join(";")).join("\r\n");
};
