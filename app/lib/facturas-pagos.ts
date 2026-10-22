"use client";

import { api } from "@/lib/api";

// ---------- Tipos ----------

export interface Persona {
  id: number;
  nombre: string;
  apellidos: string;
}

export interface Descuento {
  id: number;
  nombre: string;
  descripcion?: string;
  porcentaje: number;
  fechaInicio?: string;
  fechaFin?: string;
  activo?: boolean;
}

export interface Factura {
  id: number;
  numeroFactura: string;
  fechaEmision: string;
  persona: Persona;
  descripcion: string;
  // OJO: casi siempre es null. El descuento del PlanPago ya viene aplicado
  // directamente en `total` (no se puede reconstruir el % desde acá). Este
  // campo solo se llena cuando la factura tuvo un descuento de Convenio.
  descuento: Descuento | null;
  total: number;
  // "yyyy-MM" solo en facturas de mensualidad (identifica a qué mes
  // corresponde el cobro). null en la factura de inscripción y en las
  // creadas manualmente.
  periodo?: string | null;

  // --- Cartera (la calcula el servidor) ---
  fechaVencimiento?: string | null; // emisión + 10 días
  concepto?: string | null; // INSCRIPCION | MENSUALIDAD | TIENDA | UNIFORME | COMPETENCIA | EVENTO | OTRO
  eventoId?: number | null;
  anulada?: boolean;
  motivoAnulacion?: string | null;
  totalPagado?: number;
  saldoPendiente?: number;
  /** PAGADA | ABONO_PARCIAL | PENDIENTE | EN_MORA | ANULADA */
  estadoCuenta?: string;
  diasMora?: number | null;
}

export type EstadoPago = "Pagado" | "Pendiente" | "Vencido" | "Anulado";

export interface Pago {
  id: number;
  facturaId: number;
  numeroFactura: string;
  totalFactura: number;
  tipoPagoId: number;
  tipoPago: string;
  metodoPagoId: number;
  metodoPago: string;
  fecha: string;
  estado: EstadoPago;
  monto: number;
  saldoPendienteFactura: number;
  motivoAnulacion?: string | null;
  fechaAnulacion?: string | null;
}

export interface TipoPago {
  id: number;
  tipo: string;
}

export interface MetodoPago {
  id: number;
  metodo: string;
}

export type EstadoCuentaFactura =
  | "Pagado"
  | "Abono parcial"
  | "Sin pagos"
  | "En mora"
  | "Anulada";

export interface FacturaConSaldo
  extends Omit<Factura, "estadoCuenta" | "totalPagado" | "saldoPendiente"> {
  totalPagado: number;
  saldoPendiente: number;
  estadoCuenta: EstadoCuentaFactura;
}

// Código del servidor -> etiqueta que se muestra.
const ETIQUETA_ESTADO: Record<string, EstadoCuentaFactura> = {
  PAGADA: "Pagado",
  ABONO_PARCIAL: "Abono parcial",
  PENDIENTE: "Sin pagos",
  EN_MORA: "En mora",
  ANULADA: "Anulada",
};

/** Variante de <Badge> para cada estado de cuenta. */
export function variantEstadoCuenta(
  estado: EstadoCuentaFactura,
): "success" | "outline" | "destructive" | "secondary" {
  switch (estado) {
    case "Pagado":
      return "success";
    case "Abono parcial":
      return "outline";
    case "En mora":
      return "destructive";
    default:
      return "secondary";
  }
}

export interface ResumenGeneracionCobros {
  periodo: string;
  facturasGeneradas: number;
  yaFacturadas: number;
  errores: string[];
}

// ---------- Estado de cuenta ----------
//
// El servidor ya devuelve el estado de cada factura (pagada / abono / mora /
// anulada) con las reglas del club: vence a los 10 días de emitida, y sin
// pagar después de esa fecha está EN MORA. Aquí solo se traduce a etiqueta.
// Si por alguna razón la respuesta no trae esos campos (backend viejo), se
// calcula localmente con los pagos como respaldo.

export function calcularFacturasConSaldo(
  facturas: Factura[],
  pagos: Pago[],
): FacturaConSaldo[] {
  return facturas.map((factura) => calcularUnaFacturaConSaldo(factura, pagos));
}

export function calcularUnaFacturaConSaldo(
  factura: Factura,
  pagosDeFactura: Pago[],
): FacturaConSaldo {
  const { estadoCuenta: codigo, totalPagado: tp, saldoPendiente: sp, ...resto } = factura;

  if (codigo && ETIQUETA_ESTADO[codigo] && tp !== undefined && sp !== undefined) {
    return {
      ...resto,
      totalPagado: tp,
      saldoPendiente: sp,
      estadoCuenta: ETIQUETA_ESTADO[codigo],
    };
  }

  // Respaldo local
  const totalPagado = pagosDeFactura
    .filter((p) => p.facturaId === factura.id && p.estado === "Pagado")
    .reduce((acc, p) => acc + p.monto, 0);
  const saldoPendiente = factura.anulada ? 0 : Math.max(0, factura.total - totalPagado);

  let estadoCuenta: EstadoCuentaFactura = "Sin pagos";
  if (factura.anulada) estadoCuenta = "Anulada";
  else if (saldoPendiente <= 0) estadoCuenta = "Pagado";
  else if (
    factura.fechaVencimiento &&
    new Date().toISOString().slice(0, 10) > factura.fechaVencimiento
  )
    estadoCuenta = "En mora";
  else if (totalPagado > 0) estadoCuenta = "Abono parcial";

  return { ...resto, totalPagado, saldoPendiente, estadoCuenta };
}

const NOMBRE_CONCEPTO: Record<string, string> = {
  INSCRIPCION: "Inscripción",
  MENSUALIDAD: "Mensualidad",
  TIENDA: "Tienda",
  UNIFORME: "Uniforme",
  COMPETENCIA: "Competencia",
  EVENTO: "Evento",
  OTRO: "Otro cobro",
};

// Etiqueta legible para distinguir el tipo de factura en la UI.
export function etiquetaTipoFactura(factura: Factura): string {
  if (factura.periodo) {
    const [anio, mes] = factura.periodo.split("-");
    const nombreMes = new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString(
      "es-CO",
      { month: "long", year: "numeric" },
    );
    return `Mensualidad — ${nombreMes}`;
  }
  if (factura.concepto && NOMBRE_CONCEPTO[factura.concepto]) {
    return NOMBRE_CONCEPTO[factura.concepto];
  }
  return "Inscripción";
}

/** "20/10/2026" a partir de "2026-10-20" sin corrimiento de zona horaria. */
export function formatFecha(iso?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// ---------- Llamadas a la API ----------

export async function obtenerFacturas(): Promise<Factura[]> {
  const { data } = await api.get("/api/facturas");
  return data;
}

export async function obtenerPagos(): Promise<Pago[]> {
  const { data } = await api.get("/api/pagos");
  return data;
}

export async function obtenerTiposPago(): Promise<TipoPago[]> {
  const { data } = await api.get("/api/tipos-pago");
  return data;
}

export async function obtenerMetodosPago(): Promise<MetodoPago[]> {
  const { data } = await api.get("/api/metodos-pago");
  return data;
}

// Todas las facturas generadas para una inscripción (la de inscripción +
// cada mensualidad ya facturada). Si la inscripción es anterior a esta
// automatización, el backend responde 404 con un mensaje explicativo.
export async function obtenerFacturasDeInscripcion(
  inscripcionId: number,
): Promise<Factura[]> {
  const { data } = await api.get(`/api/inscripciones/${inscripcionId}/facturas`);
  return data;
}

export async function obtenerPagosPorFactura(
  facturaId: number,
): Promise<Pago[]> {
  const { data } = await api.get(`/api/pagos/factura/${facturaId}`);
  return data;
}

export async function registrarPago(payload: {
  facturaId: number;
  tipoPagoId: number;
  metodoPagoId: number;
  fecha: string;
  estado: EstadoPago;
  monto: number;
}): Promise<Pago> {
  const { data } = await api.post("/api/pagos", payload);
  return data;
}

export async function cambiarEstadoPago(
  id: number,
  estado: EstadoPago,
): Promise<Pago> {
  const { data } = await api.patch(`/api/pagos/${id}/estado`, { estado });
  return data;
}

// Los pagos no se borran: se anulan con motivo (queda fecha y usuario).
export async function anularPago(id: number, motivo: string): Promise<Pago> {
  const { data } = await api.patch(`/api/pagos/${id}/anular`, { motivo });
  return data;
}

// Las facturas tampoco se borran: se anulan con motivo.
export async function anularFactura(id: number, motivo: string): Promise<Factura> {
  const { data } = await api.patch(`/api/facturas/${id}/anular`, { motivo });
  return data;
}

export interface FacturaManualPayload {
  personaId: number;
  concepto: "UNIFORME" | "COMPETENCIA" | "EVENTO" | "OTRO";
  descripcion: string;
  total: number;
  fechaEmision?: string;
  fechaVencimiento?: string;
  eventoId?: number | null;
}

// Cobro manual fuera de la mensualidad (uniforme, competencia, evento, otro).
export async function crearFacturaManual(
  payload: FacturaManualPayload,
): Promise<Factura> {
  const { data } = await api.post("/api/facturas", payload);
  return data;
}

// Dispara la generación de cobros de mensualidad de un período ("yyyy-MM").
// Si no se pasa período, el backend usa el mes actual.
export async function generarCobrosMensualidad(
  periodo?: string,
): Promise<ResumenGeneracionCobros> {
  const { data } = await api.post(
    "/api/inscripciones/generar-cobros-mensualidad",
    null,
    { params: periodo ? { periodo } : {} },
  );
  return data;
}

// ---------- Utilidades ----------

export function formatCOP(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor || 0);
}

export function mensajeError(error: any, fallback: string): string {
  return error?.response?.data?.message || fallback;
}