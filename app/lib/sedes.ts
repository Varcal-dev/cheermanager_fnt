import { api } from "@/lib/api";

export type TipoEspacio = "COLCHONETA" | "GIMNASIO" | "SALON" | "CANCHA" | "EXTERIOR" | "OTRO";
export interface EspacioVista { id: number; sedeId: number; nombre: string; tipo: TipoEspacio; capacidad: number | null; gruposSimultaneos: number; activo: boolean; usos: number }
export interface SedeVista { id: number; nombre: string; direccion: string | null; ciudad: string | null; notas: string | null; activa: boolean; espacios: EspacioVista[] }
export interface UsoEspacio { asignacionId: number; horarioEntrenamientoId: number; grupoId: number; grupo: string; dia: number; diaNombre: string; horaInicio: string; horaFin: string }
export interface OcupacionEspacio { espacioId: number; espacio: string; sede: string; gruposSimultaneos: number; usos: UsoEspacio[] }
export interface SinEspacio { horarioEntrenamientoId: number; grupoId: number; grupo: string; dia: number; diaNombre: string; horaInicio: string; horaFin: string }
export interface Tablero { espacios: OcupacionEspacio[]; sinEspacio: SinEspacio[] }
export interface ResultadoAsignacion { asignacionId: number; espacioId: number; advertencias: string[] }

export const TIPOS_ESPACIO: { valor: TipoEspacio; etiqueta: string }[] = [
  { valor: "COLCHONETA", etiqueta: "Colchoneta" }, { valor: "GIMNASIO", etiqueta: "Gimnasio" }, { valor: "SALON", etiqueta: "Salón" },
  { valor: "CANCHA", etiqueta: "Cancha" }, { valor: "EXTERIOR", etiqueta: "Exterior" }, { valor: "OTRO", etiqueta: "Otro" },
];
export const etiquetaTipoEspacio = (t: TipoEspacio) => TIPOS_ESPACIO.find((x) => x.valor === t)?.etiqueta ?? t;

export const listarSedes = () => api.get<SedeVista[]>("/api/sedes").then((r) => r.data);
export const tableroSedes = () => api.get<Tablero>("/api/sedes/tablero").then((r) => r.data);
export const crearSede = (body: { nombre: string; direccion?: string; ciudad?: string; notas?: string }) => api.post("/api/sedes", body).then((r) => r.data);
export const actualizarSede = (id: number, body: { nombre?: string; direccion?: string; ciudad?: string; notas?: string; activa?: boolean }) =>
  api.put(`/api/sedes/${id}`, body).then((r) => r.data);
export const crearEspacio = (sedeId: number, body: { nombre: string; tipo: TipoEspacio; capacidad?: number; gruposSimultaneos?: number }) =>
  api.post(`/api/sedes/${sedeId}/espacios`, body).then((r) => r.data);
export const actualizarEspacio = (id: number, body: { nombre?: string; tipo?: TipoEspacio; capacidad?: number; gruposSimultaneos?: number; activo?: boolean }) =>
  api.put(`/api/sedes/espacios/${id}`, body).then((r) => r.data);
export const asignarEspacio = (horarioEntrenamientoId: number, espacioId: number) =>
  api.put<ResultadoAsignacion>(`/api/sedes/horarios/${horarioEntrenamientoId}/espacio`, { espacioId }).then((r) => r.data);
export const quitarEspacio = (horarioEntrenamientoId: number) => api.delete(`/api/sedes/horarios/${horarioEntrenamientoId}/espacio`).then((r) => r.data);
