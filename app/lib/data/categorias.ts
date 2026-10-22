// Catálogos y datos de ejemplo para CheerManager (Ratels All Stars)
// Basado en la estructura de FEDECOLCHEER (Nivel + División)

export type EstadoCategoria = "activo" | "inactivo" | "borrador"

export type Nivel = {
  id: string
  nombre: string
}

export type Division = {
  id: string
  nombre: string
}

export type Categoria = {
  id: string
  nombre: string
  nivelId: string
  divisionId: string
  estado: EstadoCategoria
  anioAplicacion: number
  // Rango de año de nacimiento permitido (null = sin límite)
  anioNacMin: number | null
  anioNacMax: number | null
  // Cantidad de atletas permitidos (null = sin límite)
  atletasMin: number | null
  atletasMax: number | null
  restricciones: string
}

// Niveles oficiales FEDECOLCHEER
export const NIVELES: Nivel[] = [
  { id: "n1", nombre: "Nivel 1" },
  { id: "n2", nombre: "Nivel 2" },
  { id: "n3", nombre: "Nivel 3" },
  { id: "n4", nombre: "Nivel 4" },
  { id: "n5", nombre: "Nivel 5" },
  { id: "n6", nombre: "Nivel 6" },
  { id: "n7", nombre: "Nivel 7" },
]

// Divisiones por rango de edad
export const DIVISIONES: Division[] = [
  { id: "d-tiny", nombre: "Tiny" },
  { id: "d-mini", nombre: "Mini" },
  { id: "d-youth", nombre: "Youth" },
  { id: "d-junior", nombre: "Junior" },
  { id: "d-senior", nombre: "Senior" },
  { id: "d-open", nombre: "Open" },
]

export const ESTADOS: { value: EstadoCategoria; label: string }[] = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
  { value: "borrador", label: "Borrador" },
]

export const CATEGORIAS_EJEMPLO: Categoria[] = [
  {
    id: "c1",
    nombre: "Mini Nivel 1",
    nivelId: "n1",
    divisionId: "d-mini",
    estado: "activo",
    anioAplicacion: 2026,
    anioNacMin: 2015,
    anioNacMax: 2020,
    atletasMin: 5,
    atletasMax: 24,
    restricciones: "Sin acrobacias de lanzamiento. Pirámides máximo 2 niveles.",
  },
  {
    id: "c2",
    nombre: "Youth Nivel 2",
    nivelId: "n2",
    divisionId: "d-youth",
    estado: "activo",
    anioAplicacion: 2026,
    anioNacMin: 2013,
    anioNacMax: 2018,
    atletasMin: 5,
    atletasMax: 30,
    restricciones: "Permitido extensión a una pierna con asistencia.",
  },
  {
    id: "c3",
    nombre: "Junior Nivel 3",
    nivelId: "n3",
    divisionId: "d-junior",
    estado: "activo",
    anioAplicacion: 2026,
    anioNacMin: 2010,
    anioNacMax: 2015,
    atletasMin: 5,
    atletasMax: 30,
    restricciones: "Twist simple permitido. Canastas hasta cuarto de giro.",
  },
  {
    id: "c4",
    nombre: "Senior Nivel 4",
    nivelId: "n4",
    divisionId: "d-senior",
    estado: "activo",
    anioAplicacion: 2026,
    anioNacMin: null,
    anioNacMax: 2013,
    atletasMin: 5,
    atletasMax: 38,
    restricciones: "Sin límite de edad superior. Twist doble en canastas.",
  },
  {
    id: "c5",
    nombre: "Senior Nivel 5",
    nivelId: "n5",
    divisionId: "d-senior",
    estado: "activo",
    anioAplicacion: 2026,
    anioNacMin: null,
    anioNacMax: 2013,
    atletasMin: 5,
    atletasMax: 38,
    restricciones: "Elite. Se permite twist completo en canastas y pirámides.",
  },
  {
    id: "c6",
    nombre: "Open Nivel 6",
    nivelId: "n6",
    divisionId: "d-open",
    estado: "activo",
    anioAplicacion: 2026,
    anioNacMin: null,
    anioNacMax: 2011,
    atletasMin: 5,
    atletasMax: 38,
    restricciones: "Mayores de 15 años. Nivel internacional.",
  },
  {
    id: "c7",
    nombre: "Tiny Novice",
    nivelId: "n1",
    divisionId: "d-tiny",
    estado: "activo",
    anioAplicacion: 2026,
    anioNacMin: 2018,
    anioNacMax: 2022,
    atletasMin: 5,
    atletasMax: 20,
    restricciones: "Categoría de iniciación. Sin acrobacias aéreas.",
  },
  {
    id: "c8",
    nombre: "Junior Nivel 4",
    nivelId: "n4",
    divisionId: "d-junior",
    estado: "inactivo",
    anioAplicacion: 2025,
    anioNacMin: 2010,
    anioNacMax: 2015,
    atletasMin: 5,
    atletasMax: 30,
    restricciones: "Reemplazada por Junior Nivel 3 en la temporada 2026.",
  },
  {
    id: "c9",
    nombre: "Open Nivel 7",
    nivelId: "n7",
    divisionId: "d-open",
    estado: "borrador",
    anioAplicacion: 2027,
    anioNacMin: null,
    anioNacMax: 2010,
    atletasMin: 5,
    atletasMax: 38,
    restricciones: "Propuesta pendiente de aprobación FEDECOLCHEER.",
  },
  {
    id: "c10",
    nombre: "Mini Nivel 2",
    nivelId: "n2",
    divisionId: "d-mini",
    estado: "activo",
    anioAplicacion: 2026,
    anioNacMin: 2015,
    anioNacMax: 2020,
    atletasMin: 5,
    atletasMax: 24,
    restricciones: "",
  },
]

export function nombreNivel(id: string): string {
  return NIVELES.find((n) => n.id === id)?.nombre ?? "—"
}

export function nombreDivision(id: string): string {
  return DIVISIONES.find((d) => d.id === id)?.nombre ?? "—"
}

export function etiquetaEstado(estado: EstadoCategoria): string {
  return ESTADOS.find((e) => e.value === estado)?.label ?? estado
}

// Rango de edad legible a partir de años de nacimiento min/max
export function rangoEdadLegible(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Sin límite"
  if (min == null && max != null) return `Hasta ${max}`
  if (min != null && max == null) return `Desde ${min}`
  return `${min} - ${max}`
}

// Cantidad de atletas legible
export function rangoAtletasLegible(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Sin límite"
  if (min == null && max != null) return `Hasta ${max}`
  if (min != null && max == null) return `Mín. ${min}`
  return `${min} - ${max}`
}