import { api } from "@/lib/api";

// Paquetes de deportistas adicionales (V40). El superadmin los asigna a un club; suman al cupo de su plan.

export interface PaqueteOfrecido {
  id: number;
  nombre: string;
  deportistasExtra: number;
  precioMensual: number;
}

export interface AsignacionPaquete {
  id: number;
  paqueteId: number;
  nombre: string;
  cantidad: number;
  deportistasExtra: number;
  fechaInicio: string; // yyyy-MM-dd
  fechaFin: string | null;
  precioAcordado: number | null;
  vigente: boolean;
}

export interface VistaPaquetes {
  planId: number | null;
  maximoPaquetes: number;
  paquetesVigentes: number;
  cupoExtra: number;
  ofrecidos: PaqueteOfrecido[];
  asignados: AsignacionPaquete[];
}

export interface AsignarPaquete {
  paqueteId: number;
  cantidad?: number;
  fechaInicio?: string;
  fechaFin?: string;
  precioAcordado?: number;
}

export const paquetesApi = {
  propios: async () => (await api.get<VistaPaquetes>("/api/suscripcion/paquetes")).data,
  deClub: async (clubId: number) => (await api.get<VistaPaquetes>(`/api/clubes/${clubId}/paquetes`)).data,
  asignar: async (clubId: number, body: AsignarPaquete) =>
    (await api.post<VistaPaquetes>(`/api/clubes/${clubId}/paquetes`, body)).data,
  terminar: async (clubId: number, asignacionId: number) =>
    (await api.delete<VistaPaquetes>(`/api/clubes/${clubId}/paquetes/${asignacionId}`)).data,
};

export const moneda = (n: number | null | undefined) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n ?? 0);
