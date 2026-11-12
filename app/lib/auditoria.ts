import { api } from "@/lib/api";

// Tipos alineados 1:1 con AuditoriaDTO (backend) y con la forma estándar de
// Page<T> que devuelve Spring Data.

export type AccionAuditoria = "INSERT" | "UPDATE" | "DELETE" | "EXPORTE" | "PERMISOS";

export const ETIQUETA_ACCION: Record<AccionAuditoria, string> = {
  INSERT: "Creación",
  UPDATE: "Actualización",
  DELETE: "Eliminación",
  EXPORTE: "Exporte",
  PERMISOS: "Permisos",
};

export interface RegistroAuditoria {
  id: number;
  usuarioId: number | null;
  usuarioUsername: string | null;
  tablaAfectada: string;
  accion: AccionAuditoria;
  registroId: number | null;
  valoresAnteriores: string | null; // JSON en texto, null en INSERT
  nuevosValores: string | null; // JSON en texto, null en DELETE
  fecha: string; // ISO datetime
  ipUsuario: string | null;
}

export interface PaginaSpring<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página actual (0-based)
  size: number;
}

export interface FiltrosAuditoria {
  tabla?: string;
  accion?: AccionAuditoria;
  usuarioId?: number;
  desde?: string; // ISO datetime
  hasta?: string; // ISO datetime
  q?: string;
  page?: number;
  size?: number;
}

export const obtenerAuditoria = (filtros: FiltrosAuditoria = {}) =>
  api
    .get("/api/auditoria", {
      params: {
        tabla: filtros.tabla,
        accion: filtros.accion,
        usuarioId: filtros.usuarioId,
        desde: filtros.desde,
        hasta: filtros.hasta,
        q: filtros.q,
        page: filtros.page ?? 0,
        size: filtros.size ?? 20,
        sort: "fecha,desc",
      },
    })
    .then((res) => res.data as PaginaSpring<RegistroAuditoria>);

export const obtenerTablasAuditadas = () =>
  api.get("/api/auditoria/tablas").then((res) => res.data as string[]);

// El backend guarda valoresAnteriores/nuevosValores como texto JSON (para no
// acoplar la tabla auditoria a la forma exacta de cada entidad). Este helper
// centraliza el parseo tolerante a fallos para el panel de detalle.
export function parsearSnapshot(json: string | null): Record<string, unknown> | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ── Detalle campo por campo ────────────────────────────────────────────────

const ETIQUETAS_CAMPO: Record<string, string> = {
  id: "Id",
  nombre: "Nombre",
  apellidos: "Apellidos",
  telefono: "Teléfono",
  direccion: "Dirección",
  descripcion: "Descripción",
  estado: "Estado",
  monto: "Monto",
  total: "Total",
  fecha: "Fecha",
  fechaEmision: "Fecha de emisión",
  fechaVencimiento: "Fecha de vencimiento",
  fechaNacimiento: "Fecha de nacimiento",
  fechaInscripcion: "Fecha de inscripción",
  numeroFactura: "N.º de factura",
  numeroDocumento: "N.º de documento",
  tipoDocumento: "Tipo de documento",
  anulada: "Anulada",
  motivoAnulacion: "Motivo de anulación",
  fechaAnulacion: "Fecha de anulación",
  referencia: "Referencia",
  periodo: "Período",
  concepto: "Concepto",
  email: "Correo",
  username: "Usuario",
};

/** "fechaEmision" → "Fecha de emisión" (diccionario) o "Fecha emision" (separando mayúsculas). */
export function etiquetaCampo(campo: string): string {
  if (ETIQUETAS_CAMPO[campo]) return ETIQUETAS_CAMPO[campo];
  const texto = campo.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RE_FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function formatearValor(campo: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "number") {
    // Los identificadores (id, clubId, personaId…) no llevan separador de miles.
    return /(^id$|Id$)/.test(campo) ? String(v) : v.toLocaleString("es-CO");
  }
  if (typeof v === "string") {
    if (RE_FECHA.test(v)) {
      const [a, m, d] = v.split("-");
      return `${d}/${m}/${a}`;
    }
    if (RE_FECHA_HORA.test(v)) {
      const f = new Date(v);
      return Number.isNaN(f.getTime()) ? v : f.toLocaleString("es-CO");
    }
    return v;
  }
  return JSON.stringify(v);
}

export type TipoCambio = "modificado" | "agregado" | "quitado" | "igual";

export interface CambioCampo {
  campo: string;
  etiqueta: string;
  antes: unknown;
  despues: unknown;
  tipo: TipoCambio;
}

const iguales = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Compara los dos snapshots. En un UPDATE, `tipo: "modificado"` marca lo que de verdad cambió; el resto es "igual"
 * (contexto). En INSERT todos son "agregado"; en DELETE, "quitado".
 */
export function calcularCambios(r: Pick<RegistroAuditoria, "valoresAnteriores" | "nuevosValores">): CambioCampo[] {
  const antes = parsearSnapshot(r.valoresAnteriores) ?? {};
  const despues = parsearSnapshot(r.nuevosValores) ?? {};
  const campos = Array.from(new Set([...Object.keys(despues), ...Object.keys(antes)]));
  const tieneAntes = r.valoresAnteriores !== null;
  const tieneDespues = r.nuevosValores !== null;
  return campos
    .map<CambioCampo>((campo) => {
      const a = antes[campo];
      const d = despues[campo];
      let tipo: TipoCambio;
      if (tieneAntes && !tieneDespues) tipo = "quitado";
      else if (!tieneAntes && tieneDespues) tipo = "agregado";
      else tipo = iguales(a, d) ? "igual" : "modificado";
      return { campo, etiqueta: etiquetaCampo(campo), antes: a, despues: d, tipo };
    })
    .sort((x, y) => Number(y.tipo === "modificado") - Number(x.tipo === "modificado"));
}

/** Frase corta para la lista: qué cambió sin abrir el detalle. */
export function resumenCambio(r: RegistroAuditoria): string {
  const despues = parsearSnapshot(r.nuevosValores);
  const antes = parsearSnapshot(r.valoresAnteriores);
  switch (r.accion) {
    case "INSERT":
      return despues?.resumen ? String(despues.resumen) : "Registro nuevo";
    case "DELETE":
      return antes?.resumen ? String(antes.resumen) : "Registro eliminado";
    case "EXPORTE": {
      const filas = despues?.filas;
      const rango = despues?.desde ? ` · ${formatearValor("fecha", despues.desde)} a ${formatearValor("fecha", despues.hasta)}` : "";
      return `${despues?.recurso ?? "datos"}${typeof filas === "number" ? ` · ${filas} filas` : ""}${rango}`;
    }
    case "PERMISOS": {
      const mas = Array.isArray(despues?.permisosAgregados) ? despues.permisosAgregados.length : 0;
      const menos = Array.isArray(antes?.permisosQuitados) ? antes.permisosQuitados.length : 0;
      return `Rol ${despues?.rol ?? antes?.rol ?? ""}: +${mas} / −${menos} permisos`.replace("  ", " ");
    }
    default: {
      if (r.valoresAnteriores === null) return "Sin detalle del antes";
      const cambios = calcularCambios(r).filter((c) => c.tipo === "modificado");
      if (cambios.length === 0) return "Sin cambios en los campos propios";
      const nombres = cambios.slice(0, 3).map((c) => c.etiqueta).join(", ");
      return cambios.length > 3 ? `${nombres} +${cambios.length - 3}` : nombres;
    }
  }
}
