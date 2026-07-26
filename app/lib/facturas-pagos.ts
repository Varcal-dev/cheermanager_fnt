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
}

export type EstadoPago = "Pagado" | "Pendiente" | "Vencido";

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
}

export interface TipoPago {
  id: number;
  tipo: string;
}

export interface MetodoPago {
  id: number;
  metodo: string;
}

export type EstadoCuentaFactura = "Pagado" | "Abono parcial" | "Sin pagos";

export interface FacturaConSaldo extends Factura {
  totalPagado: number;
  saldoPendiente: number;
  estadoCuenta: EstadoCuentaFactura;
}

export interface ResumenGeneracionCobros {
  periodo: string;
  facturasGeneradas: number;
  yaFacturadas: number;
  errores: string[];
}

// ---------- Cálculo de saldo ----------
//
// Factura no tiene columna de estado de pago (es una decisión de diseño
// del backend: el estado vive en los registros de Pago, no en Factura). Por
// eso el saldo/estado de cada factura se calcula acá, cruzando la lista de
// facturas con la de pagos, en vez de esperar un campo que no existe.

export function calcularFacturasConSaldo(
  facturas: Factura[],
  pagos: Pago[],
): FacturaConSaldo[] {
  return facturas.map((factura) => calcularUnaFacturaConSaldo(factura, pagos));
}

// Misma lógica que arriba pero para una sola factura.
export function calcularUnaFacturaConSaldo(
  factura: Factura,
  pagosDeFactura: Pago[],
): FacturaConSaldo {
  const totalPagado = pagosDeFactura
    .filter((p) => p.facturaId === factura.id && p.estado === "Pagado")
    .reduce((acc, p) => acc + p.monto, 0);

  const saldoPendiente = Math.max(0, factura.total - totalPagado);

  let estadoCuenta: EstadoCuentaFactura = "Sin pagos";
  if (saldoPendiente <= 0) estadoCuenta = "Pagado";
  else if (totalPagado > 0) estadoCuenta = "Abono parcial";

  return { ...factura, totalPagado, saldoPendiente, estadoCuenta };
}

// Etiqueta legible para distinguir el tipo de factura en la UI.
export function etiquetaTipoFactura(factura: Factura): string {
  if (!factura.periodo) return "Inscripción";
  const [anio, mes] = factura.periodo.split("-");
  const nombreMes = new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString(
    "es-CO",
    { month: "long", year: "numeric" },
  );
  return `Mensualidad — ${nombreMes}`;
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

export async function eliminarPago(id: number): Promise<void> {
  await api.delete(`/api/pagos/${id}`);
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