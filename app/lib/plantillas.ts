import { api } from "@/lib/api";

export type Modalidad = "Prep" | "Elite";
export type TipoItem = "RUBRICA" | "HABILIDAD" | "CLUB";

export interface ItemEntrada { tipo: TipoItem; ref: number }
export interface PlantillaEntrada {
  nombre: string;
  modalidad: Modalidad | null;
  descripcion: string;
  items: ItemEntrada[];
}
export interface CriterioPlantilla { criterioId: number; nombre: string; categoria: string; orden: number }
export interface Plantilla {
  id: number;
  nombre: string;
  tipo: string;
  modalidad: Modalidad | null;
  descripcion: string | null;
  criterios: CriterioPlantilla[];
}
export interface RubricaItem { id: number; nombre: string; seccion: string }
export interface HabilidadItem { id: number; codigo: string; nivel: string; categoria: string; nombre: string }
export interface Catalogo { modalidad: Modalidad | null; rubrica: RubricaItem[]; habilidades: HabilidadItem[] }
export interface FilaResultado {
  deportistaId: number;
  nombre: string;
  puntajes: Record<string, number>;
  promedio: number;
  evaluados: number;
  total: number;
}
export interface ResultadosPlantilla {
  plantillaId: number;
  nombre: string;
  fecha: string;
  criterios: CriterioPlantilla[];
  filas: FilaResultado[];
}

const base = "/api/evaluacion-plantillas";
export const listarPlantillas = () => api.get<Plantilla[]>(base).then((r) => r.data);
export const catalogoPlantilla = (modalidad: Modalidad | null) =>
  api.get<Catalogo>(`${base}/catalogo`, { params: modalidad ? { modalidad } : {} }).then((r) => r.data);
export const crearPlantilla = (b: PlantillaEntrada) => api.post<Plantilla>(base, b).then((r) => r.data);
export const actualizarPlantilla = (id: number, b: PlantillaEntrada) =>
  api.put<Plantilla>(`${base}/${id}`, b).then((r) => r.data);
export const eliminarPlantilla = (id: number) => api.delete(`${base}/${id}`);
export const fechasPlantilla = (id: number) => api.get<string[]>(`${base}/${id}/fechas`).then((r) => r.data);
export const resultadosPlantilla = (id: number, fecha: string) =>
  api.get<ResultadosPlantilla>(`${base}/${id}/resultados`, { params: { fecha } }).then((r) => r.data);
