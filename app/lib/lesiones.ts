import { api } from "@/lib/api";

export type Zona = "CABEZA_CUELLO" | "HOMBRO" | "CODO_MUNECA_MANO" | "ESPALDA" | "CADERA" | "RODILLA" | "TOBILLO_PIE" | "MUSCULAR" | "OTRA";
export type Gravedad = "LEVE" | "MODERADA" | "GRAVE";
export type Restriccion = "SIN_ENTRENAR" | "MODIFICADO" | "SIN_RESTRICCION";
export type EstadoLesion = "ACTIVA" | "EN_RETORNO" | "ALTA";

export interface Lesion {
  id: number; deportistaId: number; nombre: string; fechaLesion: string; zona: Zona; descripcion: string;
  gravedad: Gravedad; restriccion: Restriccion; estado: EstadoLesion; fechaEstimadaRetorno: string | null;
  fechaAlta: string | null; avalMedico: boolean; avalDetalle: string | null; dias: number; retornoAtrasado: boolean;
}
export interface ResumenLesiones { sinEntrenar: number; modificado: number; enRetorno: number; retornosAtrasados: number; items: Lesion[] }
export interface NotaLesion { id: number; fecha: string; nota: string; estado: EstadoLesion; restriccion: Restriccion }
export interface DetalleLesion { lesion: Lesion; seguimientos: NotaLesion[] }
export interface Candidato { deportistaId: number; nombre: string }

export const ZONAS: { valor: Zona; etiqueta: string }[] = [
  { valor: "CABEZA_CUELLO", etiqueta: "Cabeza / cuello" },
  { valor: "HOMBRO", etiqueta: "Hombro" },
  { valor: "CODO_MUNECA_MANO", etiqueta: "Codo / muñeca / mano" },
  { valor: "ESPALDA", etiqueta: "Espalda" },
  { valor: "CADERA", etiqueta: "Cadera" },
  { valor: "RODILLA", etiqueta: "Rodilla" },
  { valor: "TOBILLO_PIE", etiqueta: "Tobillo / pie" },
  { valor: "MUSCULAR", etiqueta: "Muscular" },
  { valor: "OTRA", etiqueta: "Otra" },
];
export const etiquetaZona = (z: Zona) => ZONAS.find((x) => x.valor === z)?.etiqueta ?? z;
export const ETIQUETA_RESTRICCION: Record<Restriccion, string> = {
  SIN_ENTRENAR: "No entrena", MODIFICADO: "Entrenamiento modificado", SIN_RESTRICCION: "Sin restricción",
};
export const ETIQUETA_ESTADO: Record<EstadoLesion, string> = { ACTIVA: "Activa", EN_RETORNO: "En retorno", ALTA: "Alta" };

export const listarLesiones = (vigentes: boolean) =>
  api.get<ResumenLesiones>("/api/lesiones", { params: { vigentes } }).then((r) => r.data);
export const candidatosLesion = () => api.get<Candidato[]>("/api/lesiones/candidatos").then((r) => r.data);
export const detalleLesion = (id: number) => api.get<DetalleLesion>(`/api/lesiones/${id}`).then((r) => r.data);
export const registrarLesion = (deportistaId: number, body: {
  zona: Zona; descripcion: string; gravedad: Gravedad; restriccion: Restriccion; fechaLesion?: string; fechaEstimadaRetorno?: string;
}) => api.post<Lesion>(`/api/lesiones/deportista/${deportistaId}`, body).then((r) => r.data);
export const seguimientoLesion = (id: number, body: {
  nota: string; estado?: EstadoLesion; restriccion?: Restriccion; fechaEstimadaRetorno?: string; avalMedico?: boolean; avalDetalle?: string;
}) => api.post<Lesion>(`/api/lesiones/${id}/seguimientos`, body).then((r) => r.data);
