import { api } from "@/lib/api";

export type TipoInteres = "CLASE_PRUEBA" | "INSCRIPCION" | "LISTA_ESPERA";
export type EstadoInteres = "NUEVO" | "CONTACTADO" | "PRUEBA_AGENDADA" | "ASISTIO" | "EN_ESPERA" | "INSCRITO" | "DESCARTADO";

export interface Interesado {
  id: number; tipo: TipoInteres; estado: EstadoInteres; contactoNombre: string; contactoCorreo: string; contactoTelefono: string;
  deportistaNombre: string; deportistaNacimiento: string; edad: number; experiencia: string | null; mensaje: string | null;
  grupoId: number | null; fechaPrueba: string | null; notas: string | null; fechaCreacion: string; posicionEspera: number | null;
}
export interface ResumenInteresados { porEstado: Record<EstadoInteres, number>; enEspera: number; items: Interesado[] }

export const ESTADOS_INTERES: { valor: EstadoInteres; etiqueta: string }[] = [
  { valor: "NUEVO", etiqueta: "Nuevo" },
  { valor: "CONTACTADO", etiqueta: "Contactado" },
  { valor: "PRUEBA_AGENDADA", etiqueta: "Prueba agendada" },
  { valor: "ASISTIO", etiqueta: "Asistió a la prueba" },
  { valor: "EN_ESPERA", etiqueta: "En lista de espera" },
  { valor: "INSCRITO", etiqueta: "Inscrito" },
  { valor: "DESCARTADO", etiqueta: "Descartado" },
];
export const etiquetaEstadoInteres = (e: EstadoInteres) => ESTADOS_INTERES.find((x) => x.valor === e)?.etiqueta ?? e;
export const ETIQUETA_TIPO_INTERES: Record<TipoInteres, string> = {
  CLASE_PRUEBA: "Clase de prueba", INSCRIPCION: "Inscripción", LISTA_ESPERA: "Lista de espera",
};

export const listarInteresados = () => api.get<ResumenInteresados>("/api/interesados").then((r) => r.data);
export const actualizarInteresado = (id: number, body: { estado?: EstadoInteres; grupoId?: number; fechaPrueba?: string; notas?: string }) =>
  api.put<Interesado>(`/api/interesados/${id}`, body).then((r) => r.data);
