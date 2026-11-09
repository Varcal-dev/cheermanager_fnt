import { api } from "@/lib/api";

export interface Destinatarios {
  grupoId: number | null; grupo: string; deportistas: number; correos: number; usuariosPortal: number;
  sinContacto: number; correoDisponible: boolean;
}
export interface ResultadoEnvio {
  comunicadoId: number; deportistas: number; notificados: number; correosEnviados: number; correosFallidos: number;
  sinContacto: number; fallidos: string[];
}
export interface Comunicado {
  id: number; grupoId: number | null; asunto: string; mensaje: string; canalSistema: boolean; canalCorreo: boolean;
  deportistas: number; notificados: number; correosEnviados: number; correosFallidos: number; sinContacto: number;
  fechaCreacion: string;
}
export interface EnvioDetalle { id: number; canal: string; destino: string; estado: string; detalle: string | null }

export const destinatarios = (grupoId?: number) =>
  api.get<Destinatarios>("/api/comunicados/destinatarios", { params: grupoId ? { grupoId } : {} }).then((r) => r.data);
export const enviarComunicado = (body: { grupoId?: number; asunto: string; mensaje: string; sistema: boolean; correo: boolean }) =>
  api.post<ResultadoEnvio>("/api/comunicados", body).then((r) => r.data);
export const historialComunicados = () => api.get<Comunicado[]>("/api/comunicados").then((r) => r.data);
export const enviosDe = (id: number) => api.get<EnvioDetalle[]>(`/api/comunicados/${id}/envios`).then((r) => r.data);

/** Descarga un .ics (la peticion lleva la sesion, por eso no es un simple enlace). */
export async function descargarIcs(ruta: string, nombre: string) {
  const res = await api.get<Blob>(ruta, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
