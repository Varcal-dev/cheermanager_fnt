import { api } from "@/lib/api";

// Plan y suscripción de los clubes (V11). Lo usan la pantalla de Clubes (superadmin) y el aviso del layout.

export type Vigencia = "ILIMITADA" | "VIGENTE" | "EN_GRACIA" | "SOLO_LECTURA";
export type EstadoSuscripcion = "PRUEBA" | "ACTIVA" | "CANCELADA";

export interface Plan {
  id: number;
  codigo: string;
  nombre: string;
  maxDeportistas: number | null;
  precioMensual: number | null;
}

export interface ResumenSuscripcion {
  clubId: number;
  clubNombre: string;
  slug: string;
  clubActivo: boolean;
  planId: number | null;
  planCodigo: string | null;
  planNombre: string | null;
  precioMensual: number | null;
  estadoSuscripcion: EstadoSuscripcion | null;
  vigencia: Vigencia;
  vigenteHasta: string | null; // yyyy-MM-dd
  diasRestantes: number | null; // negativo = ya venció
  diasGracia: number | null;
  limiteDeportistas: number | null; // límite propio del club (null = el del plan)
  limiteDelPlan: number | null;
  limiteEfectivo: number | null; // null = ilimitado
  deportistasActivos: number;
  notas: string | null;
}

export interface ActualizarSuscripcion {
  planId?: number;
  estadoSuscripcion?: EstadoSuscripcion;
  vigenteHasta?: string;
  sinVencimiento?: boolean;
  diasGracia?: number;
  limiteDeportistas?: number;
  quitarLimite?: boolean;
  notas?: string;
}

export interface PagoSuscripcionInput {
  monto: number;
  meses: number;
  metodo?: string;
  referencia?: string;
  fechaPago?: string;
  nota?: string;
}

export interface PagoSuscripcion {
  id: number;
  clubId: number;
  fechaPago: string;
  monto: number;
  meses: number;
  metodo: string | null;
  referencia: string | null;
  periodoDesde: string;
  periodoHasta: string;
  nota: string | null;
  registradoPor: string | null;
}

export const suscripcionApi = {
  propia: async () => (await api.get<ResumenSuscripcion>("/api/suscripcion")).data,
  planes: async () => (await api.get<Plan[]>("/api/clubes/planes")).data ?? [],
  todas: async () => (await api.get<ResumenSuscripcion[]>("/api/clubes/suscripciones")).data ?? [],
  actualizar: async (clubId: number, body: ActualizarSuscripcion) =>
    (await api.put<ResumenSuscripcion>(`/api/clubes/${clubId}/suscripcion`, body)).data,
  pagos: async (clubId: number) =>
    (await api.get<PagoSuscripcion[]>(`/api/clubes/${clubId}/suscripcion/pagos`)).data ?? [],
  registrarPago: async (clubId: number, body: PagoSuscripcionInput) =>
    (await api.post<ResumenSuscripcion>(`/api/clubes/${clubId}/suscripcion/pagos`, body)).data,
};

/** "2027-02-15" -> "15/02/2027" sin pasar por UTC (evita el desfase de un día en Colombia). */
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export const ETIQUETA_VIGENCIA: Record<Vigencia, string> = {
  ILIMITADA: "Sin vencimiento",
  VIGENTE: "Vigente",
  EN_GRACIA: "En gracia",
  SOLO_LECTURA: "Solo lectura",
};
