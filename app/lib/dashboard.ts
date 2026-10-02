import { api } from "@/lib/api";

// Tipos alineados 1:1 con los DTOs reales del backend
// (com.varcal.cheermanager.DTO.Dashboard.*). El backend tiene los 9
// endpoints construidos (/api/dashboard/inicio, /personas, /finanzas,
// /eventos, /organizacion, /horarios, /evaluacion, /administracion,
// /tienda). Ya conectamos /inicio y /eventos antes; acá va el resto.

export interface ProximoEventoResumen {
  eventoId: number;
  nombre: string;
  fecha: string; // yyyy-MM-dd
  diasRestantes: number;
}

export interface ResumenInicio {
  deportistasActivos: number;
  totalGrupos: number;
  proximoEvento: ProximoEventoResumen | null;
  carteraPendienteTotal: number;
  facturasConSaldoPendiente: number;
  porcentajeAsistenciaUltimos7Dias: number | null;
  alertasCondicionMedicaActiva: number;
}

export const obtenerResumenInicio = () =>
  api.get("/api/dashboard/inicio").then((res) => res.data as ResumenInicio);

export interface ProximoEventoDashboard {
  eventoId: number;
  nombre: string;
  fecha: string;
  gruposInscritos: number;
}

export interface PremioGanado {
  eventoId: number;
  nombreEvento: string;
  fechaEvento: string;
  nombreGrupo: string;
  posicion: number;
  puntaje: number;
  descripcionPremio: string;
}

export interface ResumenEventos {
  proximosEventos: ProximoEventoDashboard[];
  podiosTemporada: number;
  premiosGanados: PremioGanado[];
}

export const obtenerResumenEventos = () =>
  api.get("/api/dashboard/eventos").then((res) => res.data as ResumenEventos);

// ---------- Financiero ----------

export interface MorosidadPorPlan {
  nombrePlan: string;
  totalFacturas: number;
  facturasConSaldoPendiente: number;
  porcentajeMorosidad: number | null;
}

export interface TendenciaMensual {
  mes: string; // "2026-06"
  recaudado: number;
}

export interface ResumenFinanzas {
  recaudoMesActual: number;
  facturadoMesActual: number;
  carteraPendienteTotal: number;
  facturasConSaldoPendiente: number;
  morosidadPorPlan: MorosidadPorPlan[];
  ingresoTiendaMesActual: number;
  ingresoConDescuentoMesActual: number;
  tendenciaUltimos6Meses: TendenciaMensual[];
}

export const obtenerResumenFinanzas = () =>
  api.get("/api/dashboard/finanzas").then((res) => res.data as ResumenFinanzas);

// ---------- Personas (deportistas + entrenadores) ----------

export interface EntrenadorResumen {
  entrenadorId: number;
  nombreCompleto: string;
  especializacion: string;
  estado: string;
  gruposACargo: number;
}

export interface MovimientoEstado {
  deportistaId: number;
  nombreCompleto: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  fechaCambio: string;
  esAlta: boolean;
  motivo: string;
}

export interface ResumenPersonas {
  totalDeportistas: number;
  deportistasPorEstado: Record<string, number>;
  deportistasPorGenero: Record<string, number>;
  deportistasPorDivision: Record<string, number>;
  deportistasConCondicionMedicaActiva: number;
  altasRecientes: number;
  bajasRecientes: number;
  movimientosRecientes: MovimientoEstado[];
  totalEntrenadores: number;
  entrenadores: EntrenadorResumen[];
}

export const obtenerResumenPersonas = (diasAltasBajas = 30) =>
  api
    .get("/api/dashboard/personas", { params: { diasAltasBajas } })
    .then((res) => res.data as ResumenPersonas);

// ---------- Organización (grupos) ----------

export interface GrupoOcupacion {
  grupoId: number;
  nombreGrupo: string;
  nivel: string;
  division: string;
  deportistasActivos: number;
  hombres: number;
  mujeres: number;
  cantidadMinRequerida: number | null;
  cantidadMaxSugerida: number | null;
  mixto: boolean;
}

export interface ResumenOrganizacion {
  gruposConOcupacion: GrupoOcupacion[];
  gruposPorDebajoDelMinimo: GrupoOcupacion[];
  gruposPorNivel: Record<string, number>;
}

export const obtenerResumenOrganizacion = () =>
  api
    .get("/api/dashboard/organizacion")
    .then((res) => res.data as ResumenOrganizacion);

// ---------- Horarios (asistencia) ----------

export interface AsistenciaPorGrupo {
  grupoId: number;
  nombreGrupo: string;
  totalRegistros: number;
  presentes: number;
  porcentaje: number | null;
}

export interface DeportistaEnRiesgo {
  deportistaId: number;
  nombreCompleto: string;
  porcentaje: number;
}

export interface ResumenHorarios {
  diasAnalizados: number;
  porcentajeAsistenciaGeneral: number | null;
  asistenciaPorGrupo: AsistenciaPorGrupo[];
  deportistasEnRiesgo: DeportistaEnRiesgo[];
}

export const obtenerResumenHorarios = (dias = 30) =>
  api
    .get("/api/dashboard/horarios", { params: { dias } })
    .then((res) => res.data as ResumenHorarios);

// ---------- Evaluación ----------

export interface UltimoPuntajeGrupo {
  grupoId: number;
  nombreGrupo: string;
  nivel: string;
  fecha: string;
  evento: string;
  puntajeTotal: number;
}

export interface ResumenEvaluacion {
  ultimosPuntajesPorGrupo: UltimoPuntajeGrupo[];
}

export const obtenerResumenEvaluacion = () =>
  api
    .get("/api/dashboard/evaluacion")
    .then((res) => res.data as ResumenEvaluacion);

export interface PuntoProgresion {
  fecha: string;
  evento: string;
  esEventoOficial: boolean;
  puntajeTotal: number;
}

export interface ProgresionGrupo {
  grupoId: number;
  nombreGrupo: string;
  puntos: PuntoProgresion[];
}

export const obtenerProgresionGrupo = (grupoId: number) =>
  api
    .get(`/api/dashboard/evaluacion/progresion/${grupoId}`)
    .then((res) => res.data as ProgresionGrupo);

// ---------- Administración ----------

export interface RegistroAuditoriaResumen {
  usuario: string;
  tablaAfectada: string;
  accion: string;
  registroId: number | null;
  fecha: string;
}

export interface ResumenAdministracion {
  recaudoMesActual: number;
  carteraPendienteTotal: number;
  porcentajeAsistenciaGeneral30Dias: number | null;
  puntajePromedioClub: number | null;
  gruposConEvaluacionReciente: number;
  loginsExitosos7Dias: number;
  loginsFallidos7Dias: number;
  usuariosActivos7Dias: number;
  auditoriaReciente: RegistroAuditoriaResumen[];
}

export const obtenerResumenAdministracion = () =>
  api
    .get("/api/dashboard/administracion")
    .then((res) => res.data as ResumenAdministracion);

// ---------- Tienda ----------

export interface ProductoMasVendido {
  nombreProducto: string;
  unidadesVendidas: number;
  ingresoGenerado: number;
}

export interface VarianteStockBajo {
  productoVarianteId: number;
  skuVariante: string;
  nombreProducto: string;
  talla: string;
  color: string;
  stockActual: number;
}

export interface ResumenTienda {
  ingresoMesActual: number;
  unidadesVendidasMesActual: number;
  ventasMesActual: number;
  ingresoPorCategoria: Record<string, number>;
  topProductosVendidos: ProductoMasVendido[];
  variantesConStockBajo: VarianteStockBajo[];
}

export const obtenerResumenTienda = () =>
  api.get("/api/dashboard/tienda").then((res) => res.data as ResumenTienda);