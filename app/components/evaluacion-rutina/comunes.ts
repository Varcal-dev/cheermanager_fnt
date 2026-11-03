import type { RegistroSubCriterioInput, Seccion, SubCriterioRubrica, TopeSeccionNivel } from "@/app/lib/evaluacion-rutina";

export const ETIQUETA_SECCION: Record<Seccion, string> = {
  Construcciones: "Construcciones",
  Gimnasia: "Gimnasia",
  Ejecucion: "Ejecución",
  General: "General",
};

// Respaldo para pre-cargar el valor inicial de Ejecución (4.0 o 2.0) según el nombre del sub-criterio,
// por si el nivel no trae el valor en su configuración. Lo normal es leerlo de la rúbrica del nivel
// (ver valorInicialDelNivel); queda editable por si el juez corrige.
export function valorInicialSugerido(nombre: string): number {
  const n = nombre.toLowerCase();
  return n.includes("lanzamiento") || n.includes("salto") ? 2.0 : 4.0;
}

/** Valor inicial de una ejecución según la rúbrica del nivel (escalón de orden 1 del sub-criterio). */
export function valorInicialDelNivel(sc: SubCriterioRubrica, topes: TopeSeccionNivel[]): number {
  const t = topes.find((x) => x.subCriterio.id === sc.id);
  return t ? Number(t.valorPuntaje) : valorInicialSugerido(sc.nombre);
}

/** Creatividad y Showmanship son el promedio de 3 jueces (Construcción, Gimnasia, General). */
export const JUECES_PROMEDIO = ["Juez de Construcción", "Juez de Gimnasia", "Juez General"] as const;
export function esPromedioDeJueces(nombre: string): boolean {
  const n = nombre.toLowerCase();
  return n.includes("creatividad") || n.includes("showmanship");
}

/** Rango [mínimo, máximo] que la rúbrica del nivel permite para un sub-criterio de rango directo. */
export function rangoDelNivel(sc: SubCriterioRubrica, topes: TopeSeccionNivel[]): { min: number; max: number } | null {
  const v = topes.filter((x) => x.subCriterio.id === sc.id).map((x) => Number(x.valorPuntaje));
  return v.length ? { min: Math.min(...v), max: Math.max(...v) } : null;
}

export function registroVacio(sc: SubCriterioRubrica, valorInicial?: number): RegistroSubCriterioInput {
  switch (sc.tipoCalculo) {
    case "VALOR_INICIAL_MENOS_DRIVERS":
      return { subCriterioId: sc.id, puntajeFinalManual: valorInicial ?? valorInicialSugerido(sc.nombre), deducciones: [] };
    case "RANGO_DIRECTO_JUEZ":
      return esPromedioDeJueces(sc.nombre)
        ? { subCriterioId: sc.id, puntajesJueces: [] }
        : { subCriterioId: sc.id, puntajeFinalManual: undefined };
    case "ESCALON_CANTIDAD_SIMPLE":
      return {
        subCriterioId: sc.id,
        habilidadesDiferentes: undefined,
        habilidadesSincronizadas: undefined,
        grupoMinimoAlcanzado: undefined,
      };
    case "ESCALON_GIMNASIA":
      return { subCriterioId: sc.id, grupoMinimoAlcanzado: undefined, driversConstruccion: [] };
    case "ESCALON_HABILIDADES_GRUPOS":
    default:
      return {
        subCriterioId: sc.id,
        habilidadesDiferentes: undefined,
        habilidadesSincronizadas: undefined,
        grupoMinimoAlcanzado: undefined,
        driversConstruccion: [],
      };
  }
}

/** Fecha de hoy en la zona horaria del navegador (toISOString() da la de UTC: de noche en Colombia ya es "mañana"). */
export function hoyLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Muestra una fecha "yyyy-MM-dd" sin que la zona horaria la corra un día atrás. */
export function formatearFecha(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}
