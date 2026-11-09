import { api } from "@/lib/api";

export interface TemporadaBasica { id: number; nombre: string; desde: string; hasta: string }
export interface ResultadoFila {
  eventoId: number; evento: string; fecha: string | null; grupoId: number; grupo: string;
  posicion: number | null; puntaje: number | null; premio: string | null;
}
export interface RankingGrupo {
  grupoId: number; grupo: string; eventos: number; mejorPosicion: number | null; oros: number; podios: number;
  mejorPuntaje: number | null; promedioPuntaje: number | null;
}
export interface RankingTemporada { temporada: TemporadaBasica; grupos: RankingGrupo[]; resultados: ResultadoFila[] }
export interface HistorialDeportista { deportistaId: number; nombre: string; eventos: number; podios: number; resultados: ResultadoFila[] }
export interface Aprendida { habilidadId: number; codigo: string; nombre: string; nivel: string; categoria: string; fecha: string }
export interface AprendizajeFila { deportistaId: number; nombre: string; cantidad: number; habilidades: Aprendida[] }
export interface RankingHabilidades { anio: number; mes: number | null; totalClub: number; porMes: number[]; filas: AprendizajeFila[] }
export interface DeportistaOpcion { deportistaId: number; nombre: string; apellidos: string }

export const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
export const MESES_LARGOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export const temporadasRanking = () => api.get<TemporadaBasica[]>("/api/ranking/temporadas").then((r) => r.data);
export const rankingTemporada = (temporadaId?: number) =>
  api.get<RankingTemporada>("/api/ranking/temporada", { params: temporadaId ? { temporadaId } : {} }).then((r) => r.data);
export const historialDeportista = (id: number) => api.get<HistorialDeportista>(`/api/ranking/deportista/${id}`).then((r) => r.data);
export const rankingHabilidades = (anio: number, mes?: number) =>
  api.get<RankingHabilidades>("/api/ranking/habilidades", { params: mes ? { anio, mes } : { anio } }).then((r) => r.data);
export const listarDeportistasOpcion = () => api.get<DeportistaOpcion[]>("/api/deportistas").then((r) => r.data);

export const medalla = (pos: number | null) => (pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos ? `${pos}º` : "—");
