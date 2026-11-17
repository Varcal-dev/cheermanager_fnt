import { api } from "@/lib/api";

// Perfil 360 del deportista: la misma forma para la puerta del club y la del portal.
// Toda sección puede venir null (sin permiso o no aplica) salvo `estado`.

export type EstadoVencimiento = "VIGENTE" | "POR_VENCER" | "VENCIDO" | "SIN_REGISTRO";

export interface VencimientoPerfil {
  tipo: "CERTIFICADO_MEDICO" | "EPS" | "SEGURO" | "LICENCIA";
  estado: EstadoVencimiento;
  fechaVencimiento: string | null;
  diasRestantes: number | null;
  entidad: string | null;
}

export interface DatosEstado {
  deportistaId: number;
  nombre: string;
  estado: string | null;
  nivel: string | null;
  grupos: string[];
  planPago: string | null;
  fechaRegistro: string | null;
  antiguedadMeses: number | null;
  edad: number | null;
  vencimientos: VencimientoPerfil[];
}

export interface FacturaPendientePerfil {
  id: number;
  numero: string;
  concepto: string | null;
  descripcion: string | null;
  fechaVencimiento: string | null;
  saldo: number;
  estadoCuenta: string | null;
  diasMora: number | null;
}

export interface PagoRecientePerfil {
  id: number;
  fecha: string | null;
  numeroFactura: string | null;
  metodo: string | null;
  monto: number;
  estado: string | null;
}

export interface DatosFacturacion {
  saldoPendiente: number;
  facturasEnMora: number;
  montoEnMora: number;
  proximoVencimiento: string | null;
  pendientes: FacturaPendientePerfil[];
  /** null si el rol del club no tiene ver_pago. */
  ultimosPagos: PagoRecientePerfil[] | null;
}

export interface MesAsistencia {
  mes: string; // "yyyy-MM"
  presentes: number;
  total: number;
  porcentaje: number | null;
}

export interface DatosAsistencia {
  porcentajeMes: number | null;
  presentesMes: number;
  totalMes: number;
  porcentaje90d: number | null;
  presentes90d: number;
  total90d: number;
  tardes90d: number;
  ausentes90d: number;
  rachaActual: number;
  meses: MesAsistencia[];
}

export interface AvanceNivel {
  nivel: string;
  totalCatalogo: number;
  evaluadas: number;
  dominadas: number;
  porcentaje: number;
}

export interface ResumenHabilidades {
  dominadas: number;
  enDesarrollo: number;
  evaluadas: number;
  totalCatalogo: number;
  nivelEnCurso: string | null;
  avanceNivelEnCurso: number | null;
  porNivel: AvanceNivel[];
  aprendidasAnio: number;
}

export interface DatosEvolucion {
  promedioGeneral: number | null;
  evaluaciones: number;
  serie: { fecha: string; promedio: number }[];
  porCategoria: { categoria: string; promedio: number; evaluaciones: number }[];
  habilidades: ResumenHabilidades;
  aprendidasPorMes: { mes: string; cantidad: number }[];
  /** Solo la puerta del club; el portal nunca compara con otros atletas. */
  posicion: { anio: number; aprendidas: number; posicion: number | null; deportistasConAprendizaje: number } | null;
}

export interface PerfilDeportista {
  estado: DatosEstado;
  facturacion: DatosFacturacion | null;
  asistencia: DatosAsistencia | null;
  evolucion: DatosEvolucion | null;
  notaFacturacion: string | null;
}

export const perfilClub = (deportistaId: number) =>
  api.get<PerfilDeportista>(`/api/deportistas/${deportistaId}/resumen`).then((r) => r.data);

export const perfilPortal = (deportistaId: number) =>
  api.get<PerfilDeportista>(`/api/portal/deportistas/${deportistaId}/resumen`).then((r) => r.data);
