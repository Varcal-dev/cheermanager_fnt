// Tipos compartidos por la pantalla de Entrenadores y sus componentes.

export interface Persona {
  id: number;
  nombre: string;
  apellidos: string;
  direccion?: string;
  telefono?: string;
  fechaNacimiento?: string;
  generoId?: number;
}

export interface EstadoPersona {
  id: number;
  estado: string;
}

export interface Genero {
  id: number;
  genero: string;
}

export interface Entrenador {
  id: number;
  persona: Persona;
  especializacion?: string;
  fechaContratacion?: string;
  estado?: EstadoPersona;
}

export interface AsignacionEntrenador {
  id: number;
  grupoId: number;
  grupoNombre: string;
  rol: string;
  fechaInicio: string;
  fechaFin: string | null;
}

export interface HorarioEntrenador {
  asignacionId: number;
  grupoId: number;
  grupoNombre: string;
  rol: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
}

/** Fecha legible, o "—" si falta o no es válida (antes salía "Invalid Date"). */
export function fechaLegible(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}
