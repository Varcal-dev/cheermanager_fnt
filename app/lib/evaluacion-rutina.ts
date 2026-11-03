import { api } from "@/lib/api";

// ───────────────────────── Catálogos de la rúbrica (solo lectura) ─────────
// La configuración (niveles, tablas de cantidad, topes, drivers) tiene su
// propio CRUD en el backend (/api/rubrica-config/*) pero todavía no tiene
// pantalla propia — se maneja directo en BD por ahora. Acá solo se consume
// en modo lectura, para armar el formulario de captura dinámicamente.

export type TipoCalculoSubCriterio =
  | "ESCALON_HABILIDADES_GRUPOS"
  | "ESCALON_CANTIDAD_SIMPLE"
  | "ESCALON_GIMNASIA"
  | "VALOR_INICIAL_MENOS_DRIVERS"
  | "RANGO_DIRECTO_JUEZ";

export type Seccion = "Construcciones" | "Gimnasia" | "Ejecucion" | "General";

export interface GrupoOpcion {
  id: number;
  nombre: string;
}

export interface NivelCompetencia {
  id: number;
  nombre: string;
  modalidad: string;
  activo: boolean;
  /** Máximo de puntos de la rúbrica del nivel (Prep 42.5, Élite 50, Novice 10 / 18). */
  puntajeMaximo?: number | null;
  /** Solo Novice: % desde el que es "Excelente" / "Superior". Sin umbrales el nivel cierra sobre 100. */
  umbralExcelente?: number | null;
  umbralSuperior?: number | null;
}

export interface SubCriterioRubrica {
  id: number;
  nombre: string;
  seccion: Seccion;
  tipoCalculo: TipoCalculoSubCriterio;
}

export interface DriverSubCriterio {
  id: number;
  nombre: string; // "Grado de Dificultad" | "Participacion Maxima"
  subCriterio: SubCriterioRubrica;
}

export interface EscalonDriverNivel {
  id: number;
  driver: DriverSubCriterio;
  nivel: NivelCompetencia;
  orden: number;
  descripcion: string;
  valor: number;
}

export interface TopeSeccionNivel {
  id: number;
  nivel: NivelCompetencia;
  subCriterio: SubCriterioRubrica;
  orden: number;
  valorPuntaje: number;
  condicionHabilidadesDiferentes: number | null;
  condicionGrupoMinimo: string | null;
  condicionSincronizadas: number | null;
  descripcionRubrica: string | null;
}

export const listarGrupos = () =>
  api.get("/api/grupos").then((res) => res.data as GrupoOpcion[]);

export const listarNiveles = () =>
  api.get("/api/rubrica-config/niveles").then((res) => res.data as NivelCompetencia[]);

export const listarSubCriterios = () =>
  api
    .get("/api/rubrica-config/sub-criterios")
    .then((res) => res.data as SubCriterioRubrica[]);

export const listarDrivers = (subCriterioId: number) =>
  api
    .get(`/api/rubrica-config/drivers/${subCriterioId}`)
    .then((res) => res.data as DriverSubCriterio[]);

export const listarEscalonesDriver = (driverId: number, nivelId: number) =>
  api
    .get("/api/rubrica-config/escalones-driver", { params: { driverId, nivelId } })
    .then((res) => res.data as EscalonDriverNivel[]);

export interface TopeDriverNivel {
  id: number;
  driver: DriverSubCriterio;
  nivel: NivelCompetencia;
  topeMaximo: number;
  valorNivelBasico: number | null;
  valorNivelAlto: number | null;
  /** Solo si la 2.ª habilidad vale distinto (Gimnasia Estática Élite: 0.4 / 0.6). */
  valorBasicoHabilidad2?: number | null;
  valorAltoHabilidad2?: number | null;
}

// Todos los escalones de un nivel en una sola llamada: sirve para saber qué sub-criterios aplican al nivel
// (Prep no tiene lanzamientos; Novice no tiene hojas de dificultad) y qué valor inicial usa cada ejecución.
export const listarTopesSeccionPorNivel = (nivelId: number) =>
  api
    .get(`/api/rubrica-config/topes-seccion/nivel/${nivelId}`)
    .then((res) => res.data as TopeSeccionNivel[]);

export const listarTopesSeccion = (nivelId: number, subCriterioId: number) =>
  api
    .get("/api/rubrica-config/topes-seccion", { params: { nivelId, subCriterioId } })
    .then((res) => res.data as TopeSeccionNivel[]);

// El backend devuelve 204 (sin body) si no hay configuración para ese
// driver+nivel — se trata como "sin datos de guía", no como error.
export const obtenerTopeDriver = (driverId: number, nivelId: number) =>
  api
    .get("/api/rubrica-config/topes-driver", { params: { driverId, nivelId } })
    .then((res) => (res.status === 204 ? null : (res.data as TopeDriverNivel)));

// ───────────────────────── Evaluación de rutina (captura) ─────────────────

export type GrupoMinimo = "NINGUNO" | "MENOS_MAYORIA" | "MAYORIA" | "GRAN_PARTE" | "MAXIMO";

export interface DeduccionDriverInput {
  nombreDriver: string;
  nivelDeduccion: 0 | 1 | 2 | 3;
}

export interface DriverConstruccionInput {
  driverId: number;
  numeroHabilidad?: number | null;
  esNivelAlto?: boolean | null;
  escalonSeleccionadoId?: number | null;
}

export interface RegistroSubCriterioInput {
  subCriterioId: number;
  habilidadesDiferentes?: number | null;
  /** De las habilidades diferentes, cuántas se hicieron sincronizadas / en canon. */
  habilidadesSincronizadas?: number | null;
  grupoMinimoAlcanzado?: GrupoMinimo | null;
  puntajeFinalManual?: number | null;
  /** Creatividad y Showmanship: un puntaje por juez (Construcción, Gimnasia, General); el back los promedia. */
  puntajesJueces?: number[];
  deducciones?: DeduccionDriverInput[];
  driversConstruccion?: DriverConstruccionInput[];
}

export type TipoDeduccion = "CAIDA" | "SEGURIDAD" | "TIEMPO" | "OTRA";

export interface DeduccionRutinaInput {
  tipo: TipoDeduccion;
  descripcion?: string;
  cantidad: number;
  /** Puntos que resta cada vez (positivo), sobre la escala de 100. */
  puntosUnitarios: number;
}

export interface DeduccionRutinaResultado extends DeduccionRutinaInput {
  total: number;
}

export interface EvaluacionRutinaInput {
  grupoId: number;
  nivelId: number;
  fecha: string; // yyyy-MM-dd
  evento: string;
  cantidadAtletas: number;
  observaciones?: string;
  registros: RegistroSubCriterioInput[];
  deducciones?: DeduccionRutinaInput[];
}

export interface RegistroSubCriterioResultado {
  id: number | null;
  subCriterioId: number;
  nombreSubCriterio: string;
  seccion: Seccion;
  puntajeBase: number;
  puntajeDrivers: number;
  puntajeFinal: number;
  detalleCalculo: string | null;
}

export interface EvaluacionRutinaResultado {
  id: number | null;
  grupoId: number;
  nombreGrupo: string;
  nivelId: number;
  nivel: string;
  fecha: string;
  evento: string;
  cantidadAtletas: number;
  puntajeTotal: number;
  observaciones: string | null;
  registros: RegistroSubCriterioResultado[];
  /** Cierre: puntajeTotal es la suma bruta de la rúbrica; puntajeFinal es sobre 100 (o el total en Novice). */
  puntajeMaximo?: number | null;
  porcentaje?: number | null;
  deduccionesTotal?: number | null;
  puntajeFinal?: number | null;
  banda?: string | null;
  deducciones?: DeduccionRutinaResultado[];
}

// Calcula el desglose completo (con detalleCalculo) SIN guardar nada. Pensado
// para el paso de revisión: comparar el total contra la hoja de papel antes
// de confirmar.
export const previsualizarEvaluacion = (dto: EvaluacionRutinaInput) =>
  api
    .post("/api/evaluaciones-rutina/preview", dto)
    .then((res) => res.data as EvaluacionRutinaResultado);

export const guardarEvaluacion = (dto: EvaluacionRutinaInput) =>
  api
    .post("/api/evaluaciones-rutina", dto)
    .then((res) => res.data as EvaluacionRutinaResultado);

export const listarEvaluacionesPorGrupo = (grupoId: number) =>
  api
    .get(`/api/evaluaciones-rutina/grupo/${grupoId}`)
    .then((res) => res.data as EvaluacionRutinaResultado[]);

export const obtenerEvaluacion = (id: number) =>
  api
    .get(`/api/evaluaciones-rutina/${id}`)
    .then((res) => res.data as EvaluacionRutinaResultado);

export const eliminarEvaluacion = (id: number) =>
  api.delete(`/api/evaluaciones-rutina/${id}`);

export const SECCIONES: Seccion[] = ["Construcciones", "Gimnasia", "Ejecucion", "General"];

export const ETIQUETA_GRUPO_MINIMO: Record<GrupoMinimo, string> = {
  NINGUNO: "No alcanza el mínimo",
  MENOS_MAYORIA: "Menos de la mayoría",
  MAYORIA: "Mayoría",
  GRAN_PARTE: "Gran parte",
  MAXIMO: "Máximo",
};
