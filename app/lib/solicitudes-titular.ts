import { api } from "@/lib/api";

export type TipoSolicitud = "CONSULTA" | "ACTUALIZACION" | "SUPRESION" | "REVOCATORIA" | "RECLAMO";
export type EstadoSolicitud = "RECIBIDA" | "EN_TRAMITE" | "RESPONDIDA";

export interface SolicitudTitular {
  id: number;
  tipo: TipoSolicitud;
  estado: EstadoSolicitud;
  canal: string;
  solicitanteNombre: string;
  solicitanteDocumento: string | null;
  solicitanteContacto: string | null;
  personaId: number | null;
  descripcion: string;
  fechaRecepcion: string;
  fechaLimite: string;
  prorrogada: boolean;
  motivoProrroga: string | null;
  respuesta: string | null;
  fechaRespuesta: string | null;
  vencida: boolean;
  diasHabilesRestantes: number;
  respondidaEnPlazo: boolean | null;
}

export const TIPOS: { valor: TipoSolicitud; etiqueta: string; plazo: string }[] = [
  { valor: "CONSULTA", etiqueta: "Consulta (ver sus datos)", plazo: "10 días hábiles" },
  { valor: "ACTUALIZACION", etiqueta: "Reclamo: corregir o actualizar", plazo: "15 días hábiles" },
  { valor: "SUPRESION", etiqueta: "Reclamo: suprimir datos", plazo: "15 días hábiles" },
  { valor: "REVOCATORIA", etiqueta: "Reclamo: revocar autorización", plazo: "15 días hábiles" },
  { valor: "RECLAMO", etiqueta: "Reclamo: presunto incumplimiento", plazo: "15 días hábiles" },
];

export const CANALES = [
  { valor: "CORREO", etiqueta: "Correo" },
  { valor: "PRESENCIAL", etiqueta: "Presencial" },
  { valor: "TELEFONO", etiqueta: "Teléfono" },
  { valor: "PORTAL", etiqueta: "Portal" },
  { valor: "OTRO", etiqueta: "Otro" },
];

export const etiquetaTipo = (t: TipoSolicitud) => TIPOS.find((x) => x.valor === t)?.etiqueta ?? t;

export const listarSolicitudes = () => api.get<SolicitudTitular[]>("/api/solicitudes-titular").then((r) => r.data);
export const registrarSolicitud = (body: {
  tipo: TipoSolicitud;
  solicitanteNombre: string;
  solicitanteDocumento?: string;
  solicitanteContacto?: string;
  canal: string;
  descripcion: string;
  fechaRecepcion?: string;
}) => api.post<SolicitudTitular>("/api/solicitudes-titular", body).then((r) => r.data);
export const ponerEnTramite = (id: number) =>
  api.patch<SolicitudTitular>(`/api/solicitudes-titular/${id}/en-tramite`).then((r) => r.data);
export const prorrogarSolicitud = (id: number, motivo: string) =>
  api.post<SolicitudTitular>(`/api/solicitudes-titular/${id}/prorroga`, { motivo }).then((r) => r.data);
export const responderSolicitud = (id: number, respuesta: string) =>
  api.post<SolicitudTitular>(`/api/solicitudes-titular/${id}/respuesta`, { respuesta }).then((r) => r.data);
