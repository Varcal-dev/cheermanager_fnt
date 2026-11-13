import { api } from "@/lib/api";

export interface Carnet {
  deportistaId: number;
  codigo: string;
  nombre: string;
  club: string;
  estado: string;
  vigente: boolean;
  grupos: string[];
  foto: string | null;
}

export const obtenerCarnet = (deportistaId: number) =>
  api.get<Carnet>(`/api/carnet/deportista/${deportistaId}`).then((r) => r.data);
export const verificarCarnet = (codigo: string) =>
  api.get<Carnet>("/api/carnet/verificar", { params: { codigo } }).then((r) => r.data);

/** Foto del deportista (imagen binaria; el endpoint exige sesión, por eso no es un <img src> directo). */
export const obtenerFotoDeportista = (deportistaId: number) =>
  api.get<Blob>(`/api/deportistas/${deportistaId}/foto`, { responseType: "blob" }).then((r) => r.data);

/** Sube o reemplaza la foto (JPEG, PNG, GIF o WebP, máx. 5 MB). Exige `modificar_deportista`. */
export const subirFotoDeportista = (deportistaId: number, archivo: File) => {
  const datos = new FormData();
  datos.append("archivo", archivo);
  return api.post(`/api/deportistas/${deportistaId}/foto`, datos);
};

export interface ResultadoEscaneo {
  registrado: boolean;
  yaRegistrado: boolean;
  nombre: string;
  grupos: string[];
  mensaje: string;
  advertencia: string | null;
}

/** Marca "Presente" al escanear un carnet en un horario (fecha por defecto: hoy). Exige `registrar_asistencia`. */
export const escanearAsistencia = (codigo: string, horarioId: number, fecha?: string) =>
  api.post<ResultadoEscaneo>("/api/asistencias/escaneo", { codigo, horarioId, fecha }).then((r) => r.data);
