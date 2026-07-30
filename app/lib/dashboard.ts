import { api } from "@/lib/api";

// Tipos alineados 1:1 con los DTOs reales del backend
// (com.varcal.cheermanager.DTO.Dashboard.*). El backend ya tiene los 9
// endpoints construidos (/api/dashboard/inicio, /personas, /finanzas,
// /eventos, /organizacion, /horarios, /evaluacion, /administracion,
// /tienda) pero el front nunca los consumió — seguía mostrando datos de
// ejemplo. Empezamos por /inicio, que es la pantalla de aterrizaje.

export interface ProximoEventoResumen {
  eventoId: number;
  nombre: string;
  fecha: string; // yyyy-MM-dd
  diasRestantes: number;
}

export interface ResumenInicio {
  deportistasActivos: number;
  totalGrupos: number;
  proximoEvento: ProximoEventoResumen | null;
  carteraPendienteTotal: number;
  facturasConSaldoPendiente: number;
  porcentajeAsistenciaUltimos7Dias: number | null;
  alertasCondicionMedicaActiva: number;
}

export const obtenerResumenInicio = () =>
  api.get("/api/dashboard/inicio").then((res) => res.data as ResumenInicio);

export interface ProximoEventoDashboard {
  eventoId: number;
  nombre: string;
  fecha: string;
  gruposInscritos: number;
}

export interface PremioGanado {
  eventoId: number;
  nombreEvento: string;
  fechaEvento: string;
  nombreGrupo: string;
  posicion: number;
  puntaje: number;
  descripcionPremio: string;
}

export interface ResumenEventos {
  proximosEventos: ProximoEventoDashboard[];
  podiosTemporada: number;
  premiosGanados: PremioGanado[];
}

export const obtenerResumenEventos = () =>
  api.get("/api/dashboard/eventos").then((res) => res.data as ResumenEventos);