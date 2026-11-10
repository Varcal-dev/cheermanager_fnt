import { api } from "@/lib/api";

export type EstadoParticipante = "PENDIENTE" | "CONFIRMADO" | "NO_VA";
export type RolAcompanante = "ENTRENADOR" | "ACUDIENTE" | "OTRO";
export interface OpcionViaje { eventoId: number; evento: string; fecha: string | null; viajeId: number | null; estado: "SIN_VIAJE" | "ABIERTO" | "CERRADO" }
export interface ParticipanteViaje {
  id: number; tipo: "DEPORTISTA" | "ACOMPANANTE"; deportistaId: number | null; nombre: string; documento: string | null; rol: RolAcompanante | null;
  edad: number | null; menor: boolean; estado: EstadoParticipante; autorizacion: boolean; fechaAutorizacion: string | null; notas: string | null;
  costo: number; abonado: number; saldo: number;
}
export interface ResumenViaje {
  deportistas: number; acompanantes: number; confirmados: number; pendientes: number; noVan: number; menoresSinAutorizacion: number;
  costoTotal: number; abonadoTotal: number; saldoTotal: number;
}
export interface VistaViaje {
  id: number; eventoId: number; evento: string; fechaEvento: string | null; destino: string; fechaSalida: string; fechaRegreso: string;
  puntoEncuentro: string | null; transporte: string | null; alojamiento: string | null; costoPorPersona: number | null; notas: string | null;
  estado: "ABIERTO" | "CERRADO"; resumen: ResumenViaje; participantes: ParticipanteViaje[];
}
export interface SolicitudViaje {
  destino: string; fechaSalida: string; fechaRegreso: string; puntoEncuentro?: string; transporte?: string; alojamiento?: string;
  costoPorPersona?: number; notas?: string;
}

export const moneda = (n: number | null | undefined) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n ?? 0);

export const opcionesViaje = () => api.get<OpcionViaje[]>("/api/viajes/eventos").then((r) => r.data);
export const vistaViaje = (id: number) => api.get<VistaViaje>(`/api/viajes/${id}`).then((r) => r.data);
export const crearViaje = (eventoId: number, b: SolicitudViaje) => api.post<VistaViaje>(`/api/viajes/evento/${eventoId}`, b).then((r) => r.data);
export const actualizarViaje = (id: number, b: SolicitudViaje) => api.put<VistaViaje>(`/api/viajes/${id}`, b).then((r) => r.data);
export const cargarDelegacion = (id: number) => api.post<{ agregados: number; viaje: VistaViaje }>(`/api/viajes/${id}/delegacion`).then((r) => r.data);
export const agregarAcompanante = (id: number, b: { nombre: string; documento?: string; rol: RolAcompanante }) =>
  api.post<VistaViaje>(`/api/viajes/${id}/acompanantes`, b).then((r) => r.data);
export const cambiarParticipante = (id: number, b: { estado?: EstadoParticipante; autorizacion?: boolean; notas?: string }) =>
  api.put<VistaViaje>(`/api/viajes/participantes/${id}`, b).then((r) => r.data);
export const quitarParticipante = (id: number) => api.delete<VistaViaje>(`/api/viajes/participantes/${id}`).then((r) => r.data);
export const abonar = (id: number, monto: number, nota?: string) => api.post<VistaViaje>(`/api/viajes/participantes/${id}/abonos`, { monto, nota }).then((r) => r.data);
export const cerrarViaje = (id: number) => api.post<VistaViaje>(`/api/viajes/${id}/cerrar`).then((r) => r.data);
export const reabrirViaje = (id: number) => api.post<VistaViaje>(`/api/viajes/${id}/reabrir`).then((r) => r.data);
