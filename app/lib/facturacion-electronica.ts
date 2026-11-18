import { api } from "@/lib/api";

// Facturación electrónica DIAN (V45): configuración fiscal del club y documentos emitidos.

export interface ConfigFacturacion {
  activa: boolean;
  proveedor: string;
  ambiente: "PRUEBAS" | "PRODUCCION";
  emitirAl: "PAGO" | "COBRO";
  tipoPersona: "NATURAL" | "JURIDICA" | null;
  nit: string | null;
  dv: string | null;
  razonSocial: string | null;
  nombreComercial: string | null;
  responsableIva: boolean;
  tratamientoIva: "EXCLUIDO" | "GRAVADO";
  tarifaIva: number;
  municipioCodigo: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  rangoNumeracionId: number | null;
  prefijo: string | null;
}

export interface EstadoFacturacion {
  config: ConfigFacturacion;
  credencialesConfiguradas: boolean;
  faltantes: string[];
}

export interface DocumentoElectronico {
  id: number;
  facturaId: number;
  tipo: string;
  estado: "PENDIENTE" | "EMITIDA" | "RECHAZADA" | "ERROR";
  referencia: string;
  ambiente: string;
  numero: string | null;
  cufe: string | null;
  urlPdf: string | null;
  mensajeError: string | null;
  intentos: number;
  creadoEn: string;
  emitidoEn: string | null;
}

// Mismo algoritmo de la DIAN que usa el servidor: sirve para sugerir el DV al escribir el NIT.
const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
export function calcularDv(nit: string): string {
  const n = nit.replace(/\D/g, "");
  if (!n || n.length > PESOS.length) return "";
  let suma = 0;
  for (let i = 0; i < n.length; i++) suma += Number(n[n.length - 1 - i]) * PESOS[i];
  const r = suma % 11;
  return String(r > 1 ? 11 - r : r);
}

export const facturacionElectronicaApi = {
  estado: async () => (await api.get<EstadoFacturacion>("/api/facturacion-electronica/config")).data,
  guardar: async (c: ConfigFacturacion) => (await api.put<EstadoFacturacion>("/api/facturacion-electronica/config", c)).data,
  documentos: async () => (await api.get<DocumentoElectronico[]>("/api/facturacion-electronica/documentos")).data,
};
