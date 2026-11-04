import { api } from "@/lib/api";

export const PUNTAJE_MAXIMO = 10;

export interface EvaluacionFila {
  id: number;
  deportistaId: number;
  nombreDeportista: string;
  criterioId: number;
  nombreCriterio: string;
  categoria: string;
  fecha: string;
  puntajeObtenido: number;
}

export interface Pagina {
  contenido: EvaluacionFila[];
  total: number;
  pagina: number;
  tamano: number;
  totalPaginas: number;
}

export interface Criterio {
  id: number;
  nombre: string;
  categoriaId: number;
  categoria: string;
  enUso: boolean;
}

export interface Grupo {
  id: number;
  nombre: string;
}

export interface Miembro {
  deportistaId: number;
  nombre: string;
}

export interface PromedioCriterio {
  criterioId: number;
  criterio: string;
  categoria: string;
  promedio: number;
  evaluaciones: number;
  deportistas: number;
}

export interface ResultadoLote {
  registradas: EvaluacionFila[];
  errores: Record<string, string>;
}

export const listarGrupos = () => api.get<Grupo[]>("/api/grupos").then((r) => r.data);
export const listarCriterios = () => api.get<Criterio[]>("/api/criterios-evaluacion").then((r) => r.data);
export const listarMiembros = (grupoId: number) =>
  api.get<Miembro[]>(`/api/evaluaciones/grupo/${grupoId}/deportistas`).then((r) => r.data);

/** Fecha local (no UTC) en formato AAAA-MM-DD. */
export function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Color de la nota: rojo bajo 5, ámbar 5–7, verde desde 8. */
export function claseNota(p: number): string {
  if (p >= 8) return "text-green-600";
  if (p >= 5) return "text-amber-600";
  return "text-red-600";
}

/** Agrupa criterios por categoría conservando el orden. */
export function porCategoria(criterios: Criterio[]): [string, Criterio[]][] {
  const mapa = new Map<string, Criterio[]>();
  for (const c of criterios) {
    if (!mapa.has(c.categoria)) mapa.set(c.categoria, []);
    mapa.get(c.categoria)!.push(c);
  }
  return Array.from(mapa.entries());
}
