import { api } from "@/lib/api";

// Pago en línea de la suscripción con Wompi (V46).

export interface EstadoPagoEnLinea {
  habilitado: boolean;
  sandbox: boolean;
  precioMensual: number;
  costoPaquetes: number;
  totalMensual: number;
  faltantes: string[];
}

export interface CobroWompi {
  url: string;
  referencia: string;
  montoCentavos: number;
  meses: number;
  sandbox: boolean;
}

export type EstadoTransaccion = "CREADA" | "APROBADA" | "RECHAZADA" | "ANULADA" | "ERROR";

export interface TransaccionWompi {
  referencia: string;
  estado: EstadoTransaccion;
  meses: number;
  montoCentavos: number;
  mensaje: string | null;
}

export const pagosWompiApi = {
  estado: async () => (await api.get<EstadoPagoEnLinea>("/api/suscripcion/pagar/estado")).data,
  iniciar: async (meses: number) => (await api.post<CobroWompi>("/api/suscripcion/pagar", { meses })).data,
  consultar: async (referencia: string) => (await api.get<TransaccionWompi>(`/api/suscripcion/pagar/${encodeURIComponent(referencia)}`)).data,
};
