import { api } from "@/lib/api";

export type RolRoster = "TITULAR" | "SUPLENTE";
export interface Problema { tipo: string; bloquea: boolean; detalle: string }
export interface IntegranteRoster { id: number; deportistaId: number; nombre: string; rol: RolRoster; posicion: string | null; problemas: Problema[] }
export interface CandidatoRoster { deportistaId: number; nombre: string; problemas: Problema[] }
export interface VistaRoster {
  eventoId: number; evento: string; fecha: string | null; grupoId: number; grupo: string;
  estado: "SIN_ROSTER" | "BORRADOR" | "CONFIRMADO"; cupoMaximo: number | null; titulares: number; suplentes: number;
  titularesBloqueados: number; confirmable: boolean; integrantes: IntegranteRoster[]; candidatos: CandidatoRoster[];
}
export interface OpcionRoster {
  eventoId: number; evento: string; fecha: string | null; grupoId: number; grupo: string;
  estado: "SIN_ROSTER" | "BORRADOR" | "CONFIRMADO"; titulares: number; suplentes: number;
}

const base = (e: number, g: number) => `/api/rosters/evento/${e}/grupo/${g}`;
export const opcionesRoster = () => api.get<OpcionRoster[]>("/api/rosters/opciones").then((r) => r.data);
export const vistaRoster = (e: number, g: number) => api.get<VistaRoster>(base(e, g)).then((r) => r.data);
export const agregarIntegrante = (e: number, g: number, deportistaId: number, rol: RolRoster, posicion?: string) =>
  api.post<VistaRoster>(`${base(e, g)}/integrantes`, { deportistaId, rol, posicion }).then((r) => r.data);
export const cambiarIntegrante = (id: number, body: { rol?: RolRoster; posicion?: string }) =>
  api.put<VistaRoster>(`/api/rosters/integrantes/${id}`, body).then((r) => r.data);
export const quitarIntegrante = (id: number) => api.delete<VistaRoster>(`/api/rosters/integrantes/${id}`).then((r) => r.data);
export const fijarCupo = (e: number, g: number, cupoMaximo: number | null) =>
  api.put<VistaRoster>(`${base(e, g)}/cupo`, { cupoMaximo }).then((r) => r.data);
export const confirmarRoster = (e: number, g: number) => api.post<VistaRoster>(`${base(e, g)}/confirmar`).then((r) => r.data);
export const reabrirRoster = (e: number, g: number) => api.post<VistaRoster>(`${base(e, g)}/reabrir`).then((r) => r.data);
