import { api } from "@/lib/api";

export interface Habilidad {
  id: number;
  codigo: string;
  nivel: string;
  categoria: string;
  estilo: string | null;
  tier: string | null;
  nombre: string;
  nombreEn: string | null;
}

export interface DriverDef {
  nombre: string;
  etiqueta: string;
  maxNivel: number;
}

export interface Deduccion {
  driver: string;
  nivel: number;
}

export interface EstadoHabilidad {
  habilidad: Habilidad;
  estado: "INICIAL" | "EN_DESARROLLO" | "DOMINADA";
  ultimoPuntaje: number;
  mejorPuntaje: number;
  fechaUltima: string;
  totalEvaluaciones: number;
}

export interface ProgresoNivel {
  nivel: string;
  totalCatalogo: number;
  evaluadas: number;
  dominadas: number;
}

export interface EstadoDeportista {
  habilidades: EstadoHabilidad[];
  porNivel: ProgresoNivel[];
}

export interface ItemHistorial {
  id: number;
  fecha: string;
  valorInicial: number;
  totalDeducciones: number;
  puntaje: number;
  observaciones: string | null;
  deducciones: Deduccion[];
}

export interface ResultadoEvaluacion {
  evaluacionId: number;
  valorInicial: number;
  totalDeducciones: number;
  puntaje: number;
  estado: string;
}

export const NIVELES = ["N1", "N2", "N3", "N4"];
export const CATEGORIAS: Record<string, string> = {
  ELEVACION: "Elevaciones",
  GIMNASIA_ESTATICA: "Gimnasia estática",
  GIMNASIA_CARRERA: "Gimnasia con carrera",
  LANZAMIENTO: "Lanzamientos",
};
export const ESTILOS: Record<string, string> = {
  INVERSION: "Inversión",
  SUELTO: "Suelto",
  GIRO: "Giro",
  COMBINACION: "Combinación",
  COED: "Coed",
  DESMONTE: "Desmonte",
  SIN_GIRO: "Sin giro",
  CON_GIRO: "Con giro",
};
export const TIERS: Record<string, string> = { APROPIADA: "Apropiada", AVANZADA: "Avanzada", ELITE: "Élite" };
export const ESTADOS: Record<string, string> = {
  INICIAL: "Inicial",
  EN_DESARROLLO: "En desarrollo",
  DOMINADA: "Dominada",
};

/** Valor inicial de ejecución: 4.0 en elevaciones y gimnasia, 2.0 en lanzamientos (rúbrica). */
export const valorInicial = (categoria: string) => (categoria === "LANZAMIENTO" ? 2 : 4);

/** Puntaje de una evaluación: valor inicial menos 0.1 por nivel de cada driver (nunca menos de 0). */
export const calcularPuntaje = (categoria: string, deducciones: Deduccion[]) => {
  const total = deducciones.reduce((s, d) => s + d.nivel, 0) / 10;
  return Math.max(0, Math.round((valorInicial(categoria) - total) * 10) / 10);
};

export const listarCatalogo = (f: { nivel?: string; categoria?: string; estilo?: string }) =>
  api.get<Habilidad[]>("/api/habilidades", { params: f }).then((r) => r.data);
export const driversDe = (categoria: string) =>
  api.get<DriverDef[]>(`/api/habilidades/drivers/${categoria}`).then((r) => r.data);
export const estadoDeportista = (deportistaId: number) =>
  api.get<EstadoDeportista>(`/api/habilidades/deportista/${deportistaId}`).then((r) => r.data);
export const historialHabilidad = (deportistaId: number, habilidadId: number) =>
  api.get<ItemHistorial[]>(`/api/habilidades/deportista/${deportistaId}/${habilidadId}/historial`).then((r) => r.data);
export const evaluarHabilidad = (body: {
  deportistaId: number;
  habilidadId: number;
  fecha?: string;
  observaciones?: string;
  deducciones: Deduccion[];
}) => api.post<ResultadoEvaluacion>("/api/habilidades/evaluar", body).then((r) => r.data);
