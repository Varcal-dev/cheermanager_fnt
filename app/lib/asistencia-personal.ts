import { api } from "@/lib/api";

export type Evento = "ENTRADA" | "SALIDA" | "REPETIDO" | "COMPLETO";

export interface ResultadoMarcacion {
  evento: Evento;
  nombre: string;
  fecha: string;
  horaEntrada: string | null;
  horaSalida: string | null;
  mensaje: string;
}
export interface FilaAsistenciaPersonal {
  id: number;
  entrenadorId: number;
  nombre: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string | null;
  horas: number | null;
  origen: "ESCANEO" | "MANUAL";
}
export interface TotalPersonal { entrenadorId: number; nombre: string; dias: number; horas: number }
export interface ReportePersonal { desde: string; hasta: string; filas: FilaAsistenciaPersonal[]; totales: TotalPersonal[] }
export interface CarnetPersonal { entrenadorId: number; codigo: string; nombre: string; club: string; estado: string; vigente: boolean }

const base = "/api/asistencia-personal";
export const marcarPersonal = (codigo: string) => api.post<ResultadoMarcacion>(`${base}/escaneo`, { codigo }).then((r) => r.data);
export const asistenciaPersonalHoy = () => api.get<FilaAsistenciaPersonal[]>(`${base}/hoy`).then((r) => r.data);
export const reportePersonal = (desde: string, hasta: string, entrenadorId?: number) =>
  api.get<ReportePersonal>(base, { params: { desde, hasta, entrenadorId } }).then((r) => r.data);
export const guardarManualPersonal = (b: { entrenadorId: number; fecha: string; horaEntrada: string; horaSalida: string | null }) =>
  api.post<FilaAsistenciaPersonal>(`${base}/manual`, b).then((r) => r.data);
export const eliminarAsistenciaPersonal = (id: number) => api.delete(`${base}/${id}`);
export const carnetEntrenador = (id: number) => api.get<CarnetPersonal>(`/api/carnet/entrenador/${id}`).then((r) => r.data);
