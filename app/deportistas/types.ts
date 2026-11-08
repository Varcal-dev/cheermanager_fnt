// Tipos y constantes compartidos por la pantalla de Deportistas y sus componentes.

export interface Deportista {
  deportistaId: number;
  personaId: number;
  nombre: string;
  apellidos: string;
  numeroDocumento: string;
  tipoDocumento: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  generoId: number;
  genero: string;
  altura: number;
  peso: number;
  fechaRegistro: string;
  contactoEmergencia: string;
  estadoId: number;
  estadoNombre: string;
  nivelActualId: number;
  /** null si el deportista aún no tiene nivel en el club (se asigna tras evaluar). */
  nivelNombre: string | null;
  convenioId: number | null;
  convenioNombre: string | null;
  grupos: string[];
}

export interface Nivel {
  id: number;
  nombre: string;
}

export interface Genero {
  id: number;
  genero: string;
}

export interface Estado {
  id: number;
  estado: string;
}

export const TIPOS_DOCUMENTO: { value: string; label: string }[] = [
  { value: "RC", label: "Registro Civil (RC)" },
  { value: "TI", label: "Tarjeta de Identidad (TI)" },
  { value: "CC", label: "Cédula de Ciudadanía (CC)" },
  { value: "CE", label: "Cédula de Extranjería (CE)" },
  { value: "PA", label: "Pasaporte (PA)" },
];
