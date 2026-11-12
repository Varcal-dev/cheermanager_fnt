import { api } from "@/lib/api";

// Reporte financiero consolidado y exportes CSV por rango de fechas.
// Permisos: generar_reporte_financiero (finanzas) y exportar_listados (asistencia y evaluaciones).

export interface MesReporte {
  mes: string; // "2026-10"
  facturado: number;
  cobrado: number;
}

export interface ItemReporte {
  nombre: string;
  monto: number;
  cantidad: number;
}

export interface TramoMora {
  etiqueta: string;
  facturas: number;
  saldo: number;
}

export interface CarteraReporte {
  facturasConSaldo: number;
  saldoPendiente: number;
  facturasEnMora: number;
  saldoEnMora: number;
  antiguedad: TramoMora[];
}

export interface ReporteFinanciero {
  desde: string;
  hasta: string;
  totales: { facturado: number; facturas: number; cobrado: number; pagos: number };
  meses: MesReporte[];
  porConcepto: ItemReporte[];
  porMetodo: ItemReporte[];
  cartera: CarteraReporte;
}

export type TipoExporte = "facturas" | "pagos" | "cierres-caja" | "asistencia" | "evaluaciones";

export async function obtenerReporteFinanciero(desde: string, hasta: string): Promise<ReporteFinanciero> {
  const { data } = await api.get("/api/reportes/financiero", { params: { desde, hasta } });
  return data;
}

/** Descarga el CSV del exporte en el rango dado (se guarda con el navegador). */
export async function descargarExporte(tipo: TipoExporte, desde: string, hasta: string): Promise<void> {
  const { data } = await api.get(`/api/exportes/${tipo}`, { params: { desde, hasta }, responseType: "blob" });
  const url = URL.createObjectURL(new Blob([data], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tipo}-${desde}-a-${hasta}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Análisis histórico mensual (permiso ver_dash_organizacion) ──
export interface MesAnalisis {
  mes: string;
  altas: number;
  sesiones: number;
  asistidas: number;
  tasaAsistencia: number | null;
  deportistasActivos: number;
  retencion: number | null;
  promedioEvaluacion: number | null;
  evaluaciones: number;
  cobrado: number;
}
export interface RiesgoAsistencia {
  deportistaId: number;
  nombre: string;
  sesiones: number;
  asistidas: number;
  tasa: number;
}
export interface Analisis {
  desde: string;
  hasta: string;
  resumen: { altas: number; tasaAsistencia: number | null; retencionPromedio: number | null; promedioEvaluacion: number | null; cobrado: number };
  meses: MesAnalisis[];
  enRiesgo: RiesgoAsistencia[];
}

export async function obtenerAnalisis(desde: string, hasta: string): Promise<Analisis> {
  const { data } = await api.get("/api/reportes/analisis", { params: { desde, hasta } });
  return data;
}
