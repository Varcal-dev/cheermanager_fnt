import { api } from "@/lib/api";

export type PasoMatricula = "deportista" | "plan" | "grupo" | "confirmacion";

export interface DeportistaDisponible {
  deportista_id: number;
  nombre_completo: string;
  nivel: string;
}

export interface GrupoElegible {
  grupoId: number;
  nombreGrupo: string;
  tipoGrupo: string | null;
  categoriaNivel: string | null;
  cupoActual: number;
  cupoMaximo: number | null;
  elegible: boolean;
  motivo: string | null;
}

export interface EstadoMatricula {
  paso: PasoMatricula;
  deportista: DeportistaDisponible | null;
  inscripcionId: number | null;
  facturaId: number | null;
  grupoId: number | null;
  grupoNombre: string | null;
}

export const ESTADO_INICIAL: EstadoMatricula = {
  paso: "deportista",
  deportista: null,
  inscripcionId: null,
  facturaId: null,
  grupoId: null,
  grupoNombre: null,
};

// El corazón de la reanudación: dado lo que ya existe en el backend para
// esta inscripción (o nada, si es una matrícula nueva), decide en qué
// paso debe abrir el wizard. Nunca le preguntamos al usuario "¿dónde
// quedaste?" — lo calculamos de los datos reales.
export function determinarEstadoInicial(inscripcion?: {
  inscripcion_id: number;
  deportista_id: number;
  deportista: string;
  nivel: string;
  grupo_asignado: string | null;
}): EstadoMatricula {
  if (!inscripcion) return ESTADO_INICIAL;

  const deportista: DeportistaDisponible = {
    deportista_id: inscripcion.deportista_id,
    nombre_completo: inscripcion.deportista,
    nivel: inscripcion.nivel,
  };

  if (!inscripcion.grupo_asignado) {
    return {
      ...ESTADO_INICIAL,
      paso: "grupo",
      deportista,
      inscripcionId: inscripcion.inscripcion_id,
    };
  }

  return {
    ...ESTADO_INICIAL,
    paso: "confirmacion",
    deportista,
    inscripcionId: inscripcion.inscripcion_id,
    grupoNombre: inscripcion.grupo_asignado,
  };
}

// Para el flujo "Matricular" iniciado desde /deportistas: el deportista ya
// viene identificado (id, nombre, nivel llegan por query params), así que
// el wizard arranca directo en el paso "plan" sin repetir la búsqueda del
// paso 1 — esa búsqueda ya la hizo el usuario en la lista de deportistas.
export function estadoParaDeportistaPreseleccionado(
  deportista: DeportistaDisponible,
): EstadoMatricula {
  return { ...ESTADO_INICIAL, paso: "plan", deportista };
}

export async function obtenerGruposElegibles(deportistaId: number) {
  const res = await api.get(`/api/deportistas/${deportistaId}/grupos-elegibles`);
  return res.data as {
    deportistaId: number;
    nombreCompleto: string;
    elegibles: GrupoElegible[];
    noElegibles: GrupoElegible[];
  };
}

// Input type="date": si el navegador concatena en vez de sobrescribir al
// escribir sobre el segmento del año, el valor puede terminar con un año
// de más de 4 dígitos (ej. "12026-03-12"). El backend lo rechaza con un
// HttpMessageNotReadableException crudo. No lo "adivinamos" y recortamos
// solos (es una fecha de vencimiento financiera, un recorte equivocado
// sería peor que el error) — solo lo detectamos y bloqueamos el envío con
// un mensaje claro para que el usuario lo corrija.
export const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

// Límite razonable para el atributo `max` de los <input type="date">, para
// que el navegador ayude a acotar el año mientras se escribe.
export const FECHA_MAXIMA = `${new Date().getFullYear() + 5}-12-31`;